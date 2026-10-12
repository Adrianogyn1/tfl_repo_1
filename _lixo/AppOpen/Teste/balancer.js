const dgram = require('dgram');
const server = dgram.createSocket('udp4');

const backends = [
    { host: 'app_1', port: 41234 },
    { host: 'app_2', port: 41234 },
    { host: 'app_3', port: 41234 }
];

let index = 0;
const client = dgram.createSocket('udp4');

// Mapeia qual cliente mandou qual requisição para saber para quem devolver a resposta
const clientsMap = new Map();

server.on('message', (msg, rinfo) => {
    const target = backends[index];
    index = (index + 1) % backends.length;

    // Salva o endereço do cliente original usando a porta de origem do backend como chave
    clientsMap.set(target.port, rinfo);

    client.send(msg, target.port, target.host, (err) => {
        if (err) console.error('Erro ao enviar para o backend:', err);
    });
});

client.on('message', (msg, rinfo) => {
    // Quando o backend responde, pega o cliente original correspondente e devolve a resposta
    const clientInfo = clientsMap.get(rinfo.port);
    if (clientInfo) {
        server.send(msg, clientInfo.port, clientInfo.address, (err) => {
            if (err) console.error('Erro ao responder o cliente:', err);
        });
    }
});

server.bind(7000, '0.0.0.0', () => {
    console.log('Balanceador UDP bidirecional rodando na porta 7000');
});