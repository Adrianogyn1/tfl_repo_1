const { WebSocketServer } = require('ws');
const WorldContainer = require('./WorldContainer');

const ports = [3000, 3001, 3002, 3003, 3004, 3005]; // Pode expandir até 3020


ports.forEach(port => {
    const wss = new WebSocketServer({ port });
    const world = new WorldContainer(); // Cada porta tem seu próprio mundo/instância

    wss.on('connection', (ws) => {
        const client = world.addClient(ws);//passa ws
        ws.on('message', (data) => client.resolveMessage(data));
        ws.on('close', () => world.removeClient(ws));
    });

    // Loop de tick independente por servidor
    setInterval(() => {
        world.tick();
    }, 1000 / 500);

    console.log(`Servidor rodando na porta ${port}`);
});

