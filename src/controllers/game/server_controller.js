const repo = require("../../repositories/repository");
const router = require("express").Router();
const CheckAuth = require("../auth").CheckLogin;
const fs = require("fs");
const { spawn } = require("child_process");
const { Op } = require("sequelize");
require("dotenv").config();
const uuidv4 = require("uuid").v4;
const {
  formatServerInstance,
  getRoomActiveServerInstances,
  allocateOrReplicateRoomServerInstance,
} = require("../../services/coinMarket.service");

const tempoAtualizacao = Number(process.env.SERVER_TTL_SECONDS || 30);
const replicaTtlSeconds = Number(process.env.REPLICA_TTL_SECONDS || 7200);
const serverIP = process.env.SERVER_IP || "127.0.0.1";
const useServerApp = process.env.USE_SERVER_APP === "true";
const godotExecPath = process.env.GODOT_EXEC_PATH;
const projectPath = process.env.PROJECT_PATH;
const serverAppPath = process.env.SERVER_APP;
const DEVELOPER_MODE = process.env.DEVELOPER_MODE === "true";

const portMap = {
  [7001]: { port: 10018, uid: "", used: false },
  [7002]: { port: 10019, uid: "", used: false },
  [7003]: { port: 10020, uid: "", used: false },
  [7004]: { port: 10021, uid: "", used: false },
  [7005]: { port: 10022, uid: "", used: false },
  [7006]: { port: 10023, uid: "", used: false },
  [7007]: { port: 10024, uid: "", used: false },
  [7008]: { port: 10025, uid: "", used: false },
  [7009]: { port: 10026, uid: "", used: false },
  [7010]: { port: 10027, uid: "", used: false },
};

// Ações para Servers (Servidores e Instâncias Replicadas de Salas)
router.get("/servers", getAll);
router.get("/servers/room/:roomId", getByRoomId);
router.post("/servers/room/:roomId/replicate", replicateRoomInstance);
router.get("/server/:id", CheckAuth, getById);
router.post("/server/", CheckAuth, create);
router.put("/server/:id", CheckAuth, update);
router.delete("/server/:id", CheckAuth, remove);
router.get("/server_create", spawApp);
router.post("/server_create", spawApp);

function checkData(serverData) {
  let error = "";
  try {
    if (!serverData) throw new Error("Dados do servidor são obrigatórios.");
    if (!serverData.roomId) throw new Error("roomId is required");
    if (!serverData.roomId && !serverData.scene) throw new Error("scene is required");
  } catch (e) {
    error = e.message;
  }
  return error;
}

async function removeServersNotUpdate() {
  try {
    const processCutoff = new Date(Date.now() - tempoAtualizacao * 1000);
    const replicaCutoff = new Date(Date.now() - replicaTtlSeconds * 1000);
    await repo.Server.destroy({
      where: {
        [Op.or]: [
          {
            pid: { [Op.notLike]: "replica-%" },
            updatedAt: { [Op.lt]: processCutoff },
          },
          {
            pid: { [Op.like]: "replica-%" },
            updatedAt: { [Op.lt]: replicaCutoff },
          },
        ],
      },
    });
  } catch (_) {}
}

async function getAll(req, res) {
  const limit = parseInt(req.query?.limit || req.body?.limit) || 50;
  const offset =
    parseInt(req.query?.offset || req.body?.take || req.body?.skip || req.body?.offset) || 0;
  const roomIdFilter = Number(req.query?.roomId || req.body?.roomId || 0);

  try {
    await removeServersNotUpdate();
    const whereClause = roomIdFilter > 0 ? { roomId: roomIdFilter } : {};
    const servers = await repo.Server.findAndCountAll({
      where: whereClause,
      include: repo.RoomModel ? [{ model: repo.RoomModel, as: "room" }] : [],
      order: [["roomId", "ASC"], ["id", "ASC"]],
      limit,
      offset,
    });

    // Numera as instâncias por sala
    const roomCounters = new Map();
    const formattedRows = (servers?.rows || []).map((srv) => {
      const rId = Number(srv.roomId || 0);
      const idx = roomCounters.get(rId) || 0;
      roomCounters.set(rId, idx + 1);
      return formatServerInstance(srv, idx, srv.room || null);
    });

    return res.json({
      success: true,
      data: formattedRows,
      count: servers?.count || 0,
      skip: offset,
      limit,
      nextPage: servers?.count <= 0 ? 0 : Math.ceil((offset + limit) / limit) + 1,
    });
  } catch (err) {
    return res.json({ success: false, data: [], error: err.message });
  }
}

async function getByRoomId(req, res) {
  try {
    await removeServersNotUpdate();
    const roomId = Number(req.params.roomId || req.query?.roomId || 0);
    if (!roomId) return res.status(400).json({ success: false, error: "roomId inválido" });
    const info = await getRoomActiveServerInstances(roomId);
    return res.json({ success: true, data: info, ...info });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function replicateRoomInstance(req, res) {
  try {
    await removeServersNotUpdate();
    const roomId = Number(req.params.roomId || req.body?.roomId || 0);
    if (!roomId) return res.status(400).json({ success: false, error: "roomId inválido" });

    const fillCurrentToTest = Boolean(req.body?.fillCurrentToTest);
    const forceNewReplica = req.body?.forceNewReplica !== undefined ? Boolean(req.body.forceNewReplica) : true;
    const joinPlayer = Boolean(req.body?.joinPlayer);

    const allocation = await allocateOrReplicateRoomServerInstance({
      roomId,
      forceNewReplica,
      fillCurrentToTest,
      joinPlayer,
    });
    return res.json({ success: true, data: allocation, ...allocation });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

async function getById(req, res) {
  try {
    await removeServersNotUpdate();
    const server = await repo.Server.findByPk(req.params.id);
    if (!server) {
      return res.json({ error: "Server not found", success: false });
    }
    return res.json({ success: true, data: formatServerInstance(server, 0) });
  } catch (err) {
    return res.json({ error: err.message, success: false });
  }
}

async function create(req, res) {
  try {
    await removeServersNotUpdate();
    const serverData = req.body || {};
    const error = checkData(serverData);

    if (error) {
      return res.json({ error: error, success: false });
    }
    const portVal = Object.values(portMap).find((p) => String(p.port) === String(serverData.port));
    if (portVal) {
      serverData.publicPort = String(portVal.port);
    }
    if (DEVELOPER_MODE) {
      serverData.publicPort = String(serverData.port);
    }

    if (serverData.pid) {
      const serverVal = await repo.Server.findOne({
        where: { pid: String(serverData.pid) },
      });
      if (serverVal) {
        return res.json({ success: true, data: serverVal });
      }
    }

    const server = await repo.Server.create(serverData);
    return res.json({ success: true, data: server });
  } catch (err) {
    return res.json({ error: err.message, success: false });
  }
}

async function update(req, res) {
  try {
    const rawIp = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress;
    const ip = rawIp?.replace(/^.*:/, "");

    const serverData = req.body || {};
    if (ip) serverData.ip = ip;
    const error = checkData(serverData);

    if (error) {
      return res.json({ error: error, success: false });
    }
    let serverID = req.params.id;
    if (serverID <= 0 && serverData.pid) {
      const serverVal = await repo.Server.findOne({
        where: { pid: String(serverData.pid) },
      });
      if (serverVal) {
        serverID = serverVal.id;
      }
    }
    serverData.id = serverID;
    const serverExists = await repo.Server.findByPk(serverID);
    if (!serverExists) {
      return res.json({ error: "Server not found?", success: false });
    }

    await repo.Server.update(serverData, { where: { id: serverID } });
    const updatedServer = await repo.Server.findByPk(serverID);

    return res.json({ success: true, data: updatedServer });
  } catch (err) {
    return res.json({ error: err.message, success: false });
  }
}

async function remove(req, res) {
  try {
    await removeServersNotUpdate();
    const server = await repo.Server.findByPk(req.params.id);
    if (!server) {
      return res.json({ error: "Server not found", success: false });
    }

    await repo.Server.destroy({ where: { id: req.params.id } });
    return res.json({ success: true, message: "Server deleted successfully" });
  } catch (err) {
    return res.json({ error: err.message, success: false });
  }
}

async function spawApp(req, res) {
  try {
    const roomID = Number(req.query?.roomId || req.body?.roomId || req.params?.roomId || req.body?.id || 0);
    if (!roomID) {
      return res.status(200).json({ error: "Room not found", success: false });
    }

    let room = await repo.RoomModel.findByPk(roomID);
    if (!room) {
      return res.status(200).json({ error: "Room not found", success: false });
    }
    room = room.get({ plain: true });

    await removeServersNotUpdate();

    // Sincroniza portas em uso
    Object.keys(portMap).forEach((k) => {
      portMap[k].used = false;
    });
    const all = await repo.Server.findAll();
    all.forEach((srv) => {
      if (srv.port && portMap[srv.port]) {
        portMap[srv.port].used = true;
      }
    });

    const preferredServerId = Number(req.query?.serverId || req.body?.serverId || 0) || null;
    const preferredServerUid = req.query?.serverUid || req.body?.serverUid || null;
    const forceNewReplica = Boolean(req.query?.forceNewReplica === "true" || req.body?.forceNewReplica);

    // Procura uma instância com vagas (< maxPlayers); se todas estiverem cheias, cria outra réplica!
    let server = null;
    if (!forceNewReplica) {
      const candidateWhere = {
        roomId: roomID,
        playersCount: {
          [Op.lt]: Math.max(1, Number(room.maxPlayers || 30)),
        },
      };
      if (preferredServerId) candidateWhere.id = preferredServerId;
      if (preferredServerUid) candidateWhere.uid = String(preferredServerUid);

      server = await repo.Server.findOne({
        where: candidateWhere,
        order: [["id", "ASC"]],
      });

      // Se a instância preferida estava cheia, tenta qualquer outra instância com vaga dessa sala
      if (!server && (preferredServerId || preferredServerUid)) {
        server = await repo.Server.findOne({
          where: {
            roomId: roomID,
            playersCount: {
              [Op.lt]: Math.max(1, Number(room.maxPlayers || 30)),
            },
          },
          order: [["id", "ASC"]],
        });
      }
    }

    let replicatedNewInstance = false;
    if (!server) {
      server = await createNewServerInstance(room);
      replicatedNewInstance = true;
    } else {
      server = server.get({ plain: true });
    }

    const instancesInfo = await getRoomActiveServerInstances(roomID);
    const formatted =
      instancesInfo.instances.find((i) => Number(i.id) === Number(server.id)) ||
      formatServerInstance(server, Math.max(0, instancesInfo.instances.length - 1), room);

    return res.status(200).json({
      success: true,
      replicatedNewInstance,
      instancesCount: instancesInfo.instancesCount,
      totalPlayersOnline: instancesInfo.totalPlayersOnline,
      instances: instancesInfo.instances,
      data: { ...server, ...formatted, room },
    });
  } catch (err) {
    return res.status(200).json({ success: false, error: err.message });
  }
}

async function createNewServerInstance(roomInfo) {
  let port = Object.keys(portMap).find((key) => !portMap[key].used);
  let publicPort;

  if (port) {
    portMap[port].used = true;
    publicPort = DEVELOPER_MODE ? port : portMap[port].port;
  } else {
    // Caso todas as portas do portMap base estejam ocupadas, aloca porta dinâmica para suportar inúmeras réplicas
    const count = await repo.Server.count();
    port = String(7011 + count);
    publicPort = DEVELOPER_MODE ? port : String(10028 + count);
  }

  roomInfo.port = port;
  roomInfo.uid = roomInfo.uid || uuidv4();

  const command = useServerApp ? serverAppPath : godotExecPath;
  let spawnedPid = `replica-r${roomInfo.id}-${Date.now()}`;

  if (command && fs.existsSync(command)) {
    try {
      const args = useServerApp
        ? [
            `--maxPlayers=${roomInfo.maxPlayers}`,
            `--port=${roomInfo.port}`,
            `--master`,
            `--room=${roomInfo.id}`,
            `--uid=${roomInfo.uid}`,
          ]
        : [
            `--maxPlayers=${roomInfo.maxPlayers}`,
            "--path",
            projectPath,
            "--master",
            "--headless",
            `--port=${roomInfo.port}`,
            `--room=${roomInfo.id}`,
            `--uid=${roomInfo.uid}`,
          ];

      const proc = spawn(command, args, { stdio: "inherit" });
      proc.on("error", (err) => {
        console.warn(`[server_controller] Falha ao iniciar binário na porta ${port}:`, err.message);
      });
      proc.on("close", async () => {
        if (portMap[port]) portMap[port].used = false;
      });
      if (proc.pid) spawnedPid = String(proc.pid);
    } catch (spawnErr) {
      console.warn("[server_controller:spawn]", spawnErr.message);
    }
  }

  const server = await repo.Server.create({
    pid: spawnedPid,
    ip: serverIP,
    publicPort: String(publicPort),
    roomId: roomInfo.id,
    scene: roomInfo.scene || "lobby",
    language: roomInfo.language || "pt-BR",
    maxPlayers: Math.max(1, Number(roomInfo.maxPlayers || 30)),
    playersCount: 0,
    port: String(port),
    uid: uuidv4(),
  });
  return { ...server.get({ plain: true }) };
}

module.exports = {
  getAll,
  getByRoomId,
  replicateRoomInstance,
  getById,
  create,
  update,
  remove,
  spawApp,
  router,
};
