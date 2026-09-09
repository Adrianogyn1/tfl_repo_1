const dgram = require('dgram');

const proxyServer = dgram.createSocket('udp4');
const backendSocket = dgram.createSocket('udp4');

const PUBLIC_PORT = 7000;
const pendingClients = new Map(); // IPDoCliente -> PortaInternaDoGodot
const activeRoutes = new Map();   // "IP:PortaUDP" -> PortaInternaDoGodot
const reverseRoutes = new Map(); // PortaInternaDoGodot -> "IP:PortaUDP"

proxyServer.on('message', (msg, rinfo) => {
  const clientKey = `${rinfo.address}:${rinfo.port}`;
  let targetPort = activeRoutes.get(clientKey);

  if (!targetPort) {
    targetPort = pendingClients.get(rinfo.address);
    if (targetPort) {
      activeRoutes.set(clientKey, targetPort);
      reverseRoutes.set(targetPort, clientKey);
      pendingClients.delete(rinfo.address);
    } else {
      return; 
    }
  }

  proxyServer.send(msg, targetPort, '127.0.0.1', (err) => {
    if (err) console.error('Erro ao enviar para o Godot:', err);
  });
});

backendSocket.on('message', (msg, rinfo) => {
  const clientKey = reverseRoutes.get(rinfo.port);
  if (!clientKey) return;

  const [ip, port] = clientKey.split(':');
  proxyServer.send(msg, Number(port), ip, (err) => {
    if (err) console.error('Erro ao devolver para o cliente:', err);
  });
});

function registerClientRoute(clientIp, godotInternalPort) {
  pendingClients.set(clientIp, godotInternalPort);
}

proxyServer.bind(PUBLIC_PORT, '0.0.0.0', () => {
  console.log(`Proxy UDP escutando na porta ${PUBLIC_PORT}`);
});

backendSocket.bind(0);

module.exports = { registerClientRoute };