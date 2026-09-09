
//npm install dockerode
//docker build -t seu-usuario/godot-server:latest .



const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const dgram = require('dgram');

// Proxy UDP para multiplexar a porta única da NAT
const proxyServer = dgram.createSocket('udp4');
const clientRoutes = new Map(); // "IP:PortaCliente" -> PortaInternaDoContainer
const activeContainers = new Map(); // PortaInterna -> Docker Container ID

const PUBLIC_PROXY_PORT = 7000; // Porta mapeada no painel da VPS
let nextInternalPort = 7001; // Porta inicial para os containers

// Inicia o Proxy UDP
proxyServer.on('message', (msg, rinfo) => {
  const clientKey = `${rinfo.address}:${rinfo.port}`;
  let targetPort = clientRoutes.get(clientKey);

  if (!targetPort) {
    // Pega a primeira porta ativa ou faz o match com a sala do jogador
    const ports = Array.from(activeContainers.keys());
    targetPort = ports[0] || 7001;
    clientRoutes.set(clientKey, targetPort);
  }

  proxyServer.send(msg, targetPort, '127.0.0.1', (err) => {
    if (err) console.error('Erro no proxy UDP:', err);
  });
});

proxyServer.bind(PUBLIC_PROXY_PORT, '0.0.0.0', () => {
  console.log(`🔀 Proxy UDP rodando na porta ${PUBLIC_PROXY_PORT}`);
});

// Modifique sua função createRoomInstance para subir um container Docker:
async function createRoomInstance(room) {
  const containerPort = nextInternalPort++;
  room.port = containerPort;
  
  const roomB64 = Buffer.from(JSON.stringify(room)).toString("base64");

  try {
    const container = await docker.createContainer({
      Image: 'seu-usuario/godot-server:latest', // Imagem Docker com seu jogo Godot configurado
      Cmd: ['--headless', '--audio-driver', 'Dummy', `--room-data=${roomB64}`],
      ExposedPorts: {
        [`${containerPort}/udp`]: {}
      },
      HostConfig: {
        PortBindings: {
          [`${containerPort}/udp`]: [{ HostPort: `${containerPort}` }]
        }
      }
    });

    await container.start();
    const data = await container.inspect();
    const pid = data.State.Pid;

    activeContainers.set(containerPort, container);
    instances[pid] = room;

    console.log(`🚀 Container da sala criado (ID: ${container.id.substring(0, 12)}, Porta: ${containerPort})`);

    // Monitora a parada do container
    container.wait().then(() => {
      console.log(`ℹ️ Container da porta ${containerPort} finalizado.`);
      activeContainers.delete(containerPort);
      delete instances[pid];
    });

  } catch (err) {
    console.error('❌ Erro ao criar container Docker:', err);
  }
}