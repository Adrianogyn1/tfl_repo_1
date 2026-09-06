const ServerModel = require("../Models/game/ServerModel");
const repo = require("../repository");
let port = 7001;
const serverIP = "127.0.0.1";

function getAvaliablePort() {
  return port++;
}

let wsAppInstance = null;

function setApp(wsApp) {
  wsAppInstance = wsApp; // Correção: Atribui a instância corretamente
}

async function StartRoom(roomID) {
  const id = roomID;
  const room = await repo.RoomModel.findOne({ where: { id: id } });
  if (!room) {
    console.log(`Room ${id} not found`);
    return;
  }
  let serverInfo = {};
  serverInfo.uid = new Date().getTime();
  serverInfo.roomId = room.id;
  serverInfo.name = room.name;
  serverInfo.maxPlayers = room.maxPlayers;
  serverInfo.ip = serverIP;
  serverInfo.port = getAvaliablePort();
  serverInfo.scene = room.scene;
  serverInfo.token = "12345";

  serverInfo = (await repo.Server.create(serverInfo)).get({ plain: true });
  const sid = serverInfo.id;

  const b64 = Buffer.from(JSON.stringify(serverInfo)).toString("base64");
  const payload = {
    Event: "OnCreateRoom",
    Data: b64,
  };
  console.log(payload);
  // Correção: ws.send aceita apenas 1 argumento de texto/buffer
  if (wsAppInstance && wsAppInstance.readyState === 1) {
    // 1 = OPEN
    wsAppInstance.send(JSON.stringify(payload));
  }
  return serverInfo;
}

async function route(wss, eventName, data) {
  if (eventName === "start_room") {
    const id = data;
    const room = await repo.RoomModel.findOne({ where: { id: id } });
    if (!room) {
      console.log(`Room ${id} not found`);
      return;
    }

    const op = repo.Sequelize ? repo.Sequelize.Op : require("sequelize").Op;

    let server = await repo.Server.findOne({
      where: {
        roomId: id,
        playersCount: {
          [op.lt]: room.maxPlayers,
        },
      },
    });

    if (!server) {
      server = await StartRoom(data);
    }
    //retorn
    const payload = {
      Event: "OnRoomStarted",
      Data: server,
    };
    wss.send(JSON.stringify(payload));
  }
}

module.exports = {
  route,
  setApp,
};
