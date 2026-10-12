const dgram = require('dgram');
const server = dgram.createSocket('udp4');

const PORT = 41234;
const INSTANCE_ID = process.env.INSTANCE_ID || '1';

server.on('error', (err) => {
  console.log(`Erro no servidor: \n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  console.log(`[Instância ${INSTANCE_ID}] Mensagem recebida de ${rinfo.address}:${rinfo.port}: ${msg}`);
  
  // Responde de volta para o cliente através do proxy
  server.send(`Eco da instância ${INSTANCE_ID}: ${msg}`, rinfo.port, rinfo.address);
});

server.on('listening', () => {
  const address = server.address();
  console.log(`Servidor rodando na porta ${address.address}:${address.port} (Instância ${INSTANCE_ID})`);
});

server.bind(PORT);