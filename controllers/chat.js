const repo = require('../repository');

let webServices;
function setWss(ws) {
    webServices = ws;
}

// --- HELPERS DE REDE ---
function sendPacket(ws, eventName, data) {
    console.log(`📡 Enviando pacote: ${eventName}`);
    if (ws && ws.readyState === ws.OPEN) {
        const packet = {
            Event: eventName,
            Data: typeof data === 'string' ? data : JSON.stringify(data)
        };
        ws.send(JSON.stringify(packet));
    }
}

function broadcast(eventName, data, excludeClients = []) {
    if (!webServices || !webServices.clients) return;
    webServices.clients.forEach(client => {
        if (!excludeClients.includes(client)) {
            sendPacket(client, eventName, data);
        }
    });
}

function broadcastRoom(roomId, eventName, data, excludeClients = []) {
    if (!webServices || !webServices.clients) return;
    let targetClients = Array.from(webServices.clients);

    if (roomId) {
        targetClients = targetClients.filter(client => client.roomId === roomId);
    }
    targetClients.forEach(client => {
        if (!excludeClients.includes(client)) {
            sendPacket(client, eventName, data);
        }
    });
}

// --- SALVAR E NOTIFICAR MENSAGEM DO CHAT ---
async function SaveMessage(msg, wsSender) {
    try {
        // 1. Salva no banco via Sequelize
        const createdMessage = await repo.ChatMessage.create(msg);

        // 2. Busca a sala no banco
        const room = await repo.ChatRoom.findOne({ where: { uid: msg.chatId } });
        if(!room) {
            await repo.ChatRoom.create({
                uid: msg.chatId,
                users: JSON.stringify([wsSender.userId])
            });
        }
        
        if (room) {
            // Se houver lista de usuários cadastrada no JSON da sala
            let roomUsers = Array.isArray(room.users) ? room.users : JSON.parse(room.users || '[]');
            
            // Transmite para os clientes conectados pertencentes a essa sala
            webServices.clients.forEach(client => {
                if (roomUsers.includes(client.userId) || client.roomId === msg.chatId) {
                    sendPacket(client, 'OnChat', createdMessage);
                }
            });
        } else {
            // Se a sala não existir especificamente no ChatRoom, envia por ID de sala da conexão
            broadcastRoom(msg.chatId, 'OnChat', createdMessage);
        }
    } catch (err) {
        console.error("❌ Erro ao salvar/enviar mensagem:", err);
    }
}

// --- HANDLERS DO WEBSOCKET ---
const wsHandlers = {
    ping: (ws, data) => {
        sendPacket(ws, 'pong', data);
    },
    chat: async (ws, data) => {
        data.userId = ws.userId;
        data.uid = new Date().getTime().toString();
        const user = await repo.User.findByPk(ws.userId);
        if (user) data.sender = user.login;

        if (!data.chatId || data.chatId === 'global') {
            // Chat Global
            broadcast('OnChat', data);
        } else if(data.chatId.indexOf('local') === 0) {
            // Chat Local
            broadcastRoom(ws.roomId, 'OnChat', data);
        }
        else {
            // Chat Privado / Sala
            await SaveMessage(data, ws);
        }
    },
    register_session: (ws, data) => {
        ws.userId = data.userId || data;
        if (data.roomId) ws.roomId = data.roomId;
        console.log(`Canal real-time associado ao usuário: ${ws.userId}`);
    }
};

function getPrivateChatId(userId1, userId2) {
    const ids = [String(userId1), String(userId2)].sort();
    return `private_${ids[0]}_${ids[1]}`;
}

function route(ws, event, data) {
    const handler = wsHandlers[event];
    if (handler) {
        handler(ws, data);
    } else {
        console.log(`Rota não encontrada para o evento: ${event}`);
    }
}

// --- HANDLERS DA API HTTP ---
const apiHandlers = {
    '/api/chat/message': async (req, res, clients) => {
        try {
            const { text, chatId, receiverid } = req.body;

            if (!text) throw new Error("O texto da mensagem é obrigatório.");

            const user = await repo.User.findOne({ where: { token: req.userToken } });
            if (!user) throw new Error("Usuário desconhecido.");

            const newMessage = await repo.ChatMessage.create({
                text: text,
                chatId: chatId || 'global',
                userId: user.id,
                hasFile: false
            });

            // Notifica via WebSocket
            clients.forEach(client => {
                if (!receiverid || client.userId === receiverid || client.userId === user.id) {
                    sendPacket(client, 'message', newMessage);
                }
            });

            res.json({ success: true, message: newMessage });
        } catch (e) {
            console.error(e);
            res.status(400).json({ error: e.message, message: "Ocorreu um erro ao enviar a mensagem" });
        }
    },

    '/api/chat/history': async (req, res) => {
        try {
            const { chatId } = req.query;
            const targetChat = chatId || "global";

            const history = await repo.ChatMessage.findAll({
                where: { chatId: targetChat },
                order: [['createdAt', 'ASC']]
            });

            res.json(history);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    },

    '/api/chat/typing': async (req, res, clients) => {
        try {
            const { isTyping, chatId } = req.body;
            const user = await repo.User.findOne({ where: { token: req.userToken } });
            const userId = user ? user.id : req.userId;

            clients.forEach(client => {
                if (client.roomId && client.roomId == chatId) {
                    sendPacket(client, 'change_typing_status', { isTyping, chatId, userId });
                }
            });

            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
};

function routeApi(req, res, clients) {
    const baseUrl = `http://${req.headers.host}`;
    const parsedUrl = new URL(req.url, baseUrl);
    const handler = apiHandlers[parsedUrl.pathname];

    if (handler) {
        handler(req, res, clients);
    } else {
        console.log(`Rota não encontrada para a URL: ${req.url}`);
        res.status(404).json({ error: `Rota não encontrada para a URL: ${req.url}` });
    }
}

module.exports = { route, routeApi, setWss };