const clients = new Map();

function addClient(ws) {
    if (ws.userId) {
        clients.set(ws.userId, ws);
    }
}

function removeClient(ws) {
    if (ws.userId) {
        clients.delete(ws.userId);
    }
}

function getClient(ws) {
    return ws.userId ? clients.get(ws.userId) : null;
}

module.exports = {
    clients,
    addClient,
    removeClient,
    getClient
};