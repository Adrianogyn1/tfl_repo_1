const { spawn } = require("child_process");
const path = require("path");
const WebSocket = require("ws");
const { settings } = require("cluster");
require("dotenv").config();
const proxyNode = require("./proxy.js");

const config = {
  TOKEN: "app_open",
  IP: process.env.SERVER_IP || "127.0.0.1",
  WS_URL: process.env.WS_URL || "ws://localhost",
  WSS_PORT: process.env.WSS_PORT || process.env.PORT || 5000,
  PORT: process.env.PORT || 5000,
  GODOT_EXEC_PATH: process.env.GODOT_EXEC_PATH || "/media/not/Godot_v4.7-stable_mono_linux_x86_64/Godot_v4.7-stable_mono_linux.x86_64",
  PROJECT_PATH: process.env.PROJECT_PATH || "/media/not/Win Docs/godot/tfl-1",
  SERVER_APP: process.env.SERVER_APP || "/media/not/Win Docs/godot/tfl-1/TFLServer.exe",
  USE_SERVER_APP: process.env.USE_SERVER_APP || false,
};

const webService = `${config.WS_URL}:${config.WSS_PORT}`;

const instances = {};
let wsClient = null;
let reconnectInterval = null;

function connectWebSocket()
{
  console.log(`🔄 Tentando conectar ao servidor de WebSocket... ${webService}`);
  wsClient = new WebSocket(`${webService}?token=${config.TOKEN}&host=${config.IP}`);

  wsClient.on("open", () =>
  {
    console.log(`✅ Conectado a ${webService}!`);

    if (reconnectInterval)
    {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }

    syncRunningRooms();
  });

  wsClient.on("close", () =>
  {
    console.log("❌ Conexão com o WebSocket caiu.");
    scheduleReconnect();
  });

  wsClient.on("error", (err) =>
  {
    console.error("⚠️ Erro na conexão do WebSocket:", err.message);
    wsClient.close();
  });

  wsClient.on("message", (message) =>
  {
    try
    {
      const data = JSON.parse(message.toString());
      if (data.Event === "OnCreateRoom")
      {
        console.log(`Criando sala...`);
        const jsonString = Buffer.from(data.Data, "base64").toString("utf-8");
        const roomData = JSON.parse(jsonString);

        createRoomInstance(roomData);
      }
    } catch (e)
    {
      console.error("Erro ao processar mensagem do WebSocket:", e);
    }
  });
}

function scheduleReconnect()
{
  if (!reconnectInterval)
  {
    reconnectInterval = setInterval(() =>
    {
      connectWebSocket();
    }, 5000);
  }
}

function syncRunningRooms()
{
  const activeRooms = Object.values(instances);
  if (
    activeRooms.length > 0 &&
    wsClient &&
    wsClient.readyState === WebSocket.OPEN
  )
  {
    wsClient.send(
      JSON.stringify({
        Event: "SyncRooms",
        Data: activeRooms,
      }),
    );
    console.log(
      `📡 Re-sincronizadas ${activeRooms.length} salas ativas com o master.`,
    );
  }
}

function createRoomInstance(room)
{

  room.host = config.IP;
  const roomB64 = Buffer.from(JSON.stringify(room)).toString("base64");

  let args = [
    "--path",
    config.PROJECT_PATH,
    "--headless",
    "--audio-driver",
    "Dummy",
    `--room-data=${roomB64}`,
  ];

  let childProcess = null;
  console.log(config);
  if (config.USE_SERVER_APP == true)
  {
    console.log(`🚀 Criando sala via ${config.SERVER_APP}`);
    args = ["--headless", "--audio-driver", "Dummy", `--room-data=${roomB64}`];
    childProcess = spawn(config.SERVER_APP, args, {
      detached: false,
      stdio: "inherit",
    });
  }
  else
  {
    childProcess = spawn(config.GODOT_EXEC_PATH, args, {
      detached: false,
      stdio: "inherit",
    });
  }

  const pid = childProcess.pid;

  if (!pid)
  {
    console.error(`❌ Falha ao criar o processo da sala`);
    return;
  }

  instances[pid] = room;

  childProcess.on("exit", (code) =>
  {
    console.log(
      `ℹ️ Processo da sala (PID: ${pid}) finalizado com código ${code}`,
    );
    delete instances[pid];
  });

  console.log(
    `🚀 Sala criada via Godot (PID: ${pid}, Porta: ${room.port || "Desconhecida"})`,
  );

  if (wsClient && wsClient.readyState === WebSocket.OPEN)
  {
    //var clienteIp = wsClient._socket.remoteAddress;
   // var clientePorta = wsClient._socket.remotePort;
    //var targetPort = room.port;
   // proxyNode.registerClientRouter(clienteIp, clientePorta, targetPort);
    wsClient.send(
      JSON.stringify({
        Event: "RoomCreated",
        Data: { uid: room.uid, host: room.host, port: room.port, pid: pid },
      }),
    );
  }
}

connectWebSocket();

function killAllRooms()
{
  console.log("🧹 Encerrando todas as salas abertas...");
  for (const pid of Object.keys(instances))
  {
    try
    {
      process.kill(Number(pid), "SIGKILL");
    } catch (e) { }
  }
}

process.on("SIGINT", () =>
{
  killAllRooms();
  process.exit(0);
});
process.on("SIGTERM", () =>
{
  killAllRooms();
  process.exit(0);
});
process.on("exit", () =>
{
  killAllRooms();
});