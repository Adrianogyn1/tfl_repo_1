const { where } = require('../Models/ModelBase');
const repo = require('../repository');

// --- HELPERS DE REDE ---
function sendPacket(ws, eventName, data) {
    console.log(`📡 Enviando pacote: ${eventName}`);
    if (ws.readyState === ws.OPEN) {
        const packet = {
            Event: eventName,
            Data: typeof data === 'string' ? data : JSON.stringify(data)
        };
        ws.send(JSON.stringify(packet));
    }
}

// --- HANDLERS DO WEBSOCKET ---
const wsHandlers = {
    ping: (ws, data) => {
        sendPacket(ws, 'pong', data);
    },
    register_session: (ws, data) => {
        ws.userId = data.userId || data;
        console.log(`Canal real-time associado ao usuário: ${ws.userId}`);
    }
};

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
    '/api/chat/message': (req, res, clients) => {
        try {
            const { text, roomid, receiverid } = req.body;

            console.log("Body recebido:", req.body);

            if (!text) 
                throw new Error("O texto da mensagem é obrigatório.");

            // Busca o usuário que está enviando pelo token
            const user = repo.User.where(u => u.token === req.userToken)[0];

            if (!user) 
                throw new Error("Usuário desconhecido.");
            
            console.log("Usuário remetente encontrado:", user);

            // Busca o destinatário (se houver)
            const target = receiverid ? repo.User.where(u => u.id === receiverid)[0] : null;
            
            // CORREÇÃO: Alterado de repo.Message para repo.ChatMessage
            const newMessage = new repo.ChatMessage().fromJson({
                text: text,
                roomid: roomid || 'global',
                senderid: user.id,
                receiverid: target ? target.id : null,
                timestamp: new Date().toISOString()
            });
            
            // Salva no banco/memória via Active Record
            newMessage.save();

            // Envia os pacotes via WebSocket
            if (target) {
                clients.forEach(client => {
                    if (client.userId === target.id || client.userId === user.id) {
                        sendPacket(client, 'message', newMessage);
                    }
                });
            } else {
                clients.forEach(client => sendPacket(client, 'message', newMessage));
            }

            res.json({ success: true, message: newMessage });
        } catch (e) {
            console.log(e);
            res.status(400).json({ error: e.message, message: "Ocorreu um erro ao enviar a mensagem" });
        }
    },

    '/api/chat/history': (req, res) => {
        console.log(req.query);
        const { roomId, withUserId } = req.query;
        const messages = repo.ChatMessage.where(m => m.roomid === roomId);
        let history = [];
        
        // CORREÇÃO: Chaves alteradas para minúsculo para bater com o padrão atual do JSON
        if (withUserId) {
            history = messages.filter(m => 
                (m.senderid === req.userId && m.receiverid === withUserId) ||
                (m.senderid === withUserId && m.receiverid === req.userId)
            );
        } else {
            const targetRoom = roomId || "global";
            history = messages.filter(m => m.roomid === targetRoom);
        }
        
        res.json(history);
    },

    '/api/chat/typing': (req, res, clients) => {
        console.log(req.body);
        const { isTyping, roomId } = req.body;
        const user = repo.User.where(u => u.token === req.userToken)[0];
        const userId = user ? user.id : req.userId;

        clients.forEach(client => {
            if (client.roomId && client.roomId == roomId) {
                // CORREÇÃO: Corrigido o erro de digitação de "isTypingsTyping" para "isTyping"
                sendPacket(client, 'change_typing_status', { 
                    isTyping,
                    roomId,
                    userId
                });
            }
        });
        
        res.json({ success: true });
    }
};

function routeApi(req, res, clients) {
    // CORREÇÃO: Substituído o url.parse (obsoleto) pela API nativa URL do Node.js
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

module.exports = { route, routeApi };