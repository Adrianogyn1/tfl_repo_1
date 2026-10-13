const { Server } = require('socket.io');
const { WebSocketServer } = require('ws');
const repo = require('../repositories/repository');
const admin = require('../controllers/admin/files_controller.js');
const cassino = require('../controllers/game/cassino/tables/master.js');
const { chatWs } = require('../controllers/social/chat_controller.js');

const IO_KEY = Symbol('io');

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);

function parseCookies(header = '') {
    const out = {};
    for (const part of header.split(';')) {
        const i = part.indexOf('=');
        if (i < 0) continue;
        try { out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); } catch { }
    }
    return out;
}

function extractToken(socket) {
    const h = socket.handshake;
    return h.auth?.token
        || parseCookies(h.headers.cookie).userToken
        || h.headers['tfl-token']
        || null;
}

async function findUser(token) {
    if (!token || typeof token !== 'string') return null;
    return repo.User.findOne({ where: { token } });
}

// Exige usuário válido
const requireAuth = async (socket, next) => {
    try {
        const user = await findUser(extractToken(socket));
        if (!user) return next(new Error('Não autorizado'));
        socket.data.user = user;
        next();
    } catch (err) {
        console.error('[io] auth:', err.message);
        next(new Error('Erro de autenticação'));
    }
};

// Aceita visitante; se houver token válido, anexa o usuário
const optionalAuth = async (socket, next) => {
    try {
        socket.data.user = (await findUser(extractToken(socket))) || null;
    } catch {
        socket.data.user = null;
    }
    next();
};

// Isola erros de handlers para não derrubar o processo
function safeConnection(name, handler, nsp) {
    return (socket) => {
        try {
            handler(socket, nsp);
        } catch (err) {
            console.error(`[io:${name}] onConnection:`, err);
            socket.disconnect(true);
        }
        socket.on('error', (err) => console.error(`[io:${name}] socket error:`, err.message));
    };
}

// Fallback caso o admin não exporte onConnection
function defaultAdminConnection(socket) {
    socket.emit('admin:ready', { user: socket.data.user?.id ?? null });
}

function attachSocketIO(httpServer) {
    if (httpServer[IO_KEY]) return httpServer[IO_KEY];

    const io = new Server(httpServer, {
        cors: {
            origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : false,
            credentials: true
        },
        destroyUpgrade: false,       // não destrói upgrades de outros paths (ex.: /ws/chat, /terminal)
        maxHttpBufferSize: 1e6,
        pingTimeout: 20000
    });
    httpServer[IO_KEY] = io;

    // WebSocket nativo para o Chat em tempo real (/ws/chat e /ws)
    if (chatWs && typeof chatWs.handleConnection === 'function') {
        const chatWss = new WebSocketServer({ noServer: true });
        chatWss.on('connection', chatWs.handleConnection);

        httpServer.on('upgrade', (req, socket, head) => {
            try {
                const pathname = new URL(req.url, 'http://localhost').pathname;
                if (pathname === '/ws/chat' || pathname === '/ws') {
                    chatWss.handleUpgrade(req, socket, head, (ws) => {
                        chatWss.emit('connection', ws, req);
                    });
                }
            } catch (err) {
                console.error('[ws:chat] upgrade error:', err.message);
            }
        });
    }

    // /admin: token obrigatório e validado no banco
    const adminNsp = io.of('/admin');
    adminNsp.use(requireAuth);
    adminNsp.on('connection', safeConnection(
        'admin',
        typeof admin.onConnection === 'function' ? admin.onConnection : defaultAdminConnection,
        adminNsp
    ));

    // /cassino: visitante pode assistir; apostar exige usuário (checado no master)
    const cassinoNsp = io.of('/cassino');
    cassinoNsp.use(optionalAuth);
    cassinoNsp.on('connection', safeConnection('cassino', cassino.onConnection, cassinoNsp));
    
    return io;
}

module.exports = { attachSocketIO };