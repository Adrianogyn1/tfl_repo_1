const repo = require("../../repository");
const router = require("express").Router();
const CheckAuth = require("../auth").CheckLogin;
const { spawn } = require('child_process');
const { pid } = require("process");
const { Op } = require('sequelize');
require("dotenv").config();
const uuidv4 = require('uuid').v4;

const tempoAtualizacao = 10;
const serverIP = process.env.SERVER_IP || "127.0.0.1";
const useServerApp = process.env.USE_SERVER_APP === 'true';
const godotExecPath = process.env.GODOT_EXEC_PATH;
const projectPath = process.env.PROJECT_PATH;
const serverAppPath = process.env.SERVER_APP;
const DEVELOPER_MODE = process.env.DEVELOPER_MODE === 'true';



const portMap =
{
  [7001]: { port: 10018, uid: '', used: false },
  [7002]: { port: 10019, uid: '', used: false },
  [7003]: { port: 10020, uid: '', used: false },
  [7004]: { port: 10021, uid: '', used: false },
  [7005]: { port: 10022, uid: '', used: false },
}




// Ações para Servers (Servidores)
router.get("/servers", getAll);//, CheckAuth, getAll);
router.get("/server/:id", CheckAuth, getById);
router.post("/server/", CheckAuth, create);
router.put("/server/:id", CheckAuth, update);
router.delete("/server/:id", CheckAuth, remove);
router.get("/server_create", spawApp);



function checkData(serverData)
{
  let error = "";
  try
  {
    if (!serverData) throw new Error("Dados do servidor são obrigatórios.");

    if (!serverData.roomId) throw new Error("roomId is required");

    if (!serverData.roomId && !serverData.scene) throw new Error("scene is required");

    //if (!serverData.language) throw new Error("language is required");
  } catch (e)
  {
    error = e.message;
  }
  return error;
}
async function removeServersNotUpdate(){
  await repo.Server.destroy({where:{updatedAt: {[Op.lt]: new Date(Date.now() - (tempoAtualizacao * 1000))}}});
}
async function getAll(req, res)
{
  const limit = parseInt(req.query?.limit || req.body?.limit) || 50;
  const offset =
    parseInt(
      req.query?.offset || req.body?.take || req.body?.skip || req.body?.offset,
    ) || 0;

  try
  {
    await removeServersNotUpdate();
    const servers = await repo.Server.findAndCountAll({
      limit: limit,
      offset: offset,
    });

    return res.json({
      success: true,
      data: servers?.rows || [],
      count: servers?.count || 0,
      skip: offset,
      limit: limit,
      nextPage:
        servers?.count <= 0 ? 0 : Math.ceil((offset + limit) / limit) + 1,
    });
  } catch (err)
  {
    return res.json({ success: false, data: [], error: err.message });
  }
}

async function getById(req, res)
{
  try
  {
     await removeServersNotUpdate();
    const server = await repo.ServerModel.findByPk(req.params.id);
    if (!server)
    {
      return res.json({ error: "Server not found", success: false });
    }
    return res.json({ success: true, data: server });
  } catch (err)
  {
    return res.json({ error: err.message, success: false });
  }
}

async function create(req, res)
{
  try
  {
     await removeServersNotUpdate();
    const serverData = req.body || {};
    const error = checkData(serverData);

    if (error)
    {
      return res.json({ error: error, success: false });
    }
    //corrige a porta externa
    var portVal = Object.values(portMap).find(p => p.port == serverData.port);
    if (portVal)
    {
      serverData.publicPort = portVal.port;
    }
    if(DEVELOPER_MODE){
      serverData.publicPort = serverData.port;
    }


    //busca pelo process
    var serverVal = await repo.Server.findOne({
      where: {
        pid: serverData.pid
      },
    });
    if (serverVal)
    {
      return res.json({ success: true, data: serverVal });
    }

    const server = await repo.Server.create(serverData);
    return res.json({ success: true, data: server });
  } catch (err)
  {
    return res.json({ error: err.message, success: false });
  }
}

async function update(req, res)
{
  try
  {
    const rawIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
    const ip = rawIp?.replace(/^.*:/, '');

    const serverData = req.body || {};
    serverData.ip = ip;
    const error = checkData(serverData);

    if (error)
    {
      return res.json({ error: error, success: false });
    }
    let serverID = req.params.id;
    if (serverID <= 0)
    {
      var serverVal = await repo.Server.findOne({
        where: {
          pid: serverData.pid
        },
      });

      if (serverVal)
      {
        serverID = serverVal.id
      }
    }
    serverData.id = serverID;
    const serverExists = await repo.Server.findByPk(serverID);
    if (!serverExists)
    {
      return res.json({ error: "Server not found?", success: false });
    }

    await repo.Server.update(serverData, { where: { id: serverID } });
    const updatedServer = await repo.Server.findByPk(serverID);

    return res.json({ success: true, data: updatedServer });
  } catch (err)
  {
    return res.json({ error: err.message, success: false });
  }
}

async function remove(req, res)
{
  try
  {
     await removeServersNotUpdate();
    const server = await repo.Server.findByPk(req.params.id);
    if (!server)
    {
      return res.json({ error: "Server not found", success: false });
    }

    await repo.Server.destroy({ where: { id: req.params.id } });
    return res.json({ success: true, message: "Server deleted successfully" });
  } catch (err)
  {
    return res.json({ error: err.message, success: false });
  }
}


async function spawApp(req, res)
{

  var roomID = req.query.roomId || req?.body.roomId || req?.params.roomId || req?.body.id;
  if (!roomID)
  {
    return res.status(200).json({ error: "Room not found", success: false });
  }

  let room = await repo.RoomModel.findByPk(roomID);

  if (!room)
  {
    return res.status(200).json({ error: "Room not found", success: false });
  }
  room = room.get({ plain: true });

  //corrige as portas
  var all = await repo.Server.findAll();
  all.forEach((server) =>
  {
    if (!portMap[server.port])
    {
      portMap[server.port].used = false;
    }
  });
  //checa se tem portas livres
  var port = Object.keys(portMap).find(key => !portMap[key].used);
  if (!port)
  {
    console.log("Todas as portas estao em uso");
    return res.status(200).json({ error: "All ports are in use", success: false });
  }
  //remove os servidores desatualizado
   await removeServersNotUpdate();
  let server = await repo.Server.findOne({
    where: {
      roomId: roomID,
      playersCount: {
        [Op.lt]: room.maxPlayers,
      },
    },
    order: [
      ['id', 'DESC']
    ]
  });

  if (!server)
  {
    server = await createNewServerInstance(room);
  } else
  {
    server = server.get({ plain: true });
  }



  return res.status(200).json({ success: true, data: { ...server, room } });

}

async function createNewServerInstance(roomInfo)
{
  var port = Object.keys(portMap).find(key => !portMap[key].used);
  //inicia o app
  roomInfo.port = port;
  let command, args;

  if (useServerApp)
  {
    command = serverAppPath;
    args = [`--maxPlayers=${roomInfo.maxPlayers}`, `--port=${roomInfo.port}`, `--master`, `--room=${roomInfo.id}`, `--uid=${roomInfo.uid}`];
  } else
  {
    command = godotExecPath;
    args = [`--maxPlayers=${roomInfo.maxPlayers}`, '--path', projectPath, '--master', '--headless', `--port=${roomInfo.port}`, `--room=${roomInfo.id}`, `--uid=${roomInfo.uid}`];
  }

  const proc = spawn(command, args, { stdio: 'inherit' });
  console.log(`Processo da porta ${roomInfo.port} iniciado.`);
  port.used = true;
  roomInfo.uid = uuidv4();


  proc.on('close', async () =>
  {
    console.log(`Processo da porta ${roomInfo.port} encerrado.`);
    portMap[port].used = false;
    var pid = proc.pid;
    if (!pid || pid == undefined || isNaN(pid)) return;
    // await repo.Server.destroy({ where: { pid: proc.pid } });
  });

  portMap[port].used = true;

  const server = await repo.Server.create({
    pid: proc.pid,
    ip: serverIP,
    publicPort: DEVELOPER_MODE ? port : portMap[port].port,
    roomId: roomInfo.id,
    scene: roomInfo.scene,
    language: roomInfo.language,
    maxPlayers: roomInfo.maxPlayers,
    playersCount: 0,
    port: port
  });
  return { ...server.get({ plain: true }) };
}


module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  router,
};
