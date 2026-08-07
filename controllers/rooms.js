const rooms = new Map();

function createRoom(roomId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
    }
}

function joinRoom(req, res) {
    createRoom(roomId);
    rooms.get(roomId).add(ws);
}

function leaveRoom(req, res) {
    if (rooms.has(roomId)) {
        rooms.get(roomId).delete(ws);
        if (rooms.get(roomId).size === 0) {
            rooms.delete(roomId);
        }
    }
}

function broadcastRoom(roomId, event, data) {
    if (rooms.has(roomId)) {
        rooms.get(roomId).forEach(client => {
            if (client.readyState === client.OPEN) {
                const packet = {
                    Event: event,
                    Data: typeof data === 'string' ? data : JSON.stringify(data)
                };
                client.send(JSON.stringify(packet));
            }
        });
    }
}

module.exports = {
    rooms,
    createRoom,
    joinRoom,
    leaveRoom,
    broadcastRoom
};