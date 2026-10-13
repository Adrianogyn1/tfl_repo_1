const repo = require("../../repositories/repository");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "uploads");
const multer = require("multer");
const multerMiddleware = multer({ storage: multer.memoryStorage() });
const router = require("express").Router();
const { CheckLogin: CheckAuth, auth } = require("../auth");
const { Op, where } = require("sequelize");
const {
  enrichRoomsWithVisitStats,
  enterRoomWithPassAndVisit,
  getRoomVisitDetails,
} = require("../../services/coinMarket.service");

//#region api rotas
router.use(auth);

//#region [room]
router.get(["/rooms"], getAll);
router.get(["/rooms/search"], getAll);
router.get("/rooms/search/find", get); // Mudança crucial: antes do :id
router.post("/room", create);
router.put("/room/:id", update);
router.delete("/room/:id", remove);
router.post("/room/:id", update); //salva infos da room
router.post("/room/:id/objects", updatedObjects); //salva os objets
router.post("/room/:id/enter", enterRoomApi);
router.get("/room/:id/visits", getRoomVisitsApi);
//#endregion


router.get("/room/:id", findByPk);
router.get("/room/:id/like", like);
router.get("/room/:id/favorite", (req, res) => res.status(200).json({ success: true, error: "" }),);
router.get("/room/:id/objects", getObjects);
router.get("/room/:id/all", all);


//Terrain
const crtTerraind = require("./terrainController");
const { raw } = require("express");


//layouts

router.get("/game/room/:id/layout", getLayout);
router.post("/game/room/:id/layout", updateLayout);

router.get("/rooms/lobby", getLoobyFromProfile);
//#endregion

//#region Get

async function getLoobyFromProfile(req, res)
{

  if (!req.userId) res.error("Unauthorized")
  const profile = await repo.Avatar.findOne({
    where: {
      userId: req.userId,
    },
  });
  if (!profile) res.json({ success: false, data: null, message: "Profile not found" })

  var room = await repo.RoomModel.findOne({
    where: {
      avatarId: profile.id,
      scene: "lobby"
    },
  });



  if (!room)
  {
    room = await __createLobby(profile.id, `Lobby de ${profile.name}`);
  }

  room = await __allInfo(room.id);

  if (!room) res.json({ success: false, data: null, message: "Room not found" })

  return res.json({ success: true, data: room });
}

async function getLayout(req, res)
{
  try
  {
    const layoutId = req.params.id || req.body.id;
    const roomId = req.params.roomId || req.body.roomId;

    const hasRoom = await repo.RoomModel.findByPk(roomId);
    if (!hasRoom) throw new Error("Room not found");

    if (!layoutId) layoutId = hasRoom.layoutId;

    let layout = await repo.LayoutModel.findOne({
      where: { id: layoutId },
      raw: true,
    });
    if (!layout)
    {
      repo.transaction(async (t) =>
      {
        layout = await repo.LayoutModel.create(
          { roomId: roomId },
          { transaction: t },
        );
        await repo.RoomModel.update(
          { layoutId: layout.id },
          { where: { id: roomId }, transaction: t },
        );
      });
    }
    return res.json({ success: true, data: layout });
  } catch (e)
  {
    console.log(e);
    return res.status(500).json({ success: false, error: e.message });
  }
}

async function all(req, res)
{
  try
  {
    const id = req.params.id;

    const room = await __allInfo(id);
    if (!room) throw new Error("Room not found");

    return res.status(200).json({ success: true, data: room });
  } catch (err)
  {
    console.error("Erro no all:", err);
    return res
      .status(500)
      .json({ success: false, error: err.message, data: null });
  }
}

async function findByPk(req, res)
{
  try
  {
    const roomId = req.params.id || req.body.id;
    const viewerAvatarId = Number(req.query?.avatarId || req.headers?.["x-profile-id"] || 0);
    const all = await __allInfo(roomId);
    if (!all) throw new Error("Room not found info");

    const [enriched] = await enrichRoomsWithVisitStats([resolveRoom(all)], viewerAvatarId);
    return res.json({ success: true, data: enriched || resolveRoom(all) });
  } catch (err)
  {
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function enterRoomApi(req, res)
{
  try
  {
    const roomId = Number(req.params.id || req.body?.roomId || 0);
    let visitorAvatarId = Number(req.body?.avatarId || req.headers?.["x-profile-id"] || 0);
    if (!visitorAvatarId && req.userId)
    {
      const av = await repo.Avatar.findOne({
        where: { userId: req.userId },
        order: [["selected", "DESC"], ["id", "ASC"]],
      });
      if (av) visitorAvatarId = Number(av.id);
    }

    const result = await enterRoomWithPassAndVisit({
      roomId,
      visitorAvatarId,
      visitorUserId: req.userId || null,
      password: req.body?.password || "",
    });
    return res.json({ success: true, data: result, ...result });
  } catch (err)
  {
    return res.status(400).json({ success: false, error: err.message });
  }
}

async function getRoomVisitsApi(req, res)
{
  try
  {
    const roomId = Number(req.params.id || 0);
    const viewerAvatarId = Number(req.query?.avatarId || req.headers?.["x-profile-id"] || 0);
    const details = await getRoomVisitDetails(roomId, viewerAvatarId);
    if (!details) return res.status(404).json({ success: false, error: "Room not found" });
    return res.json({ success: true, data: details });
  } catch (err)
  {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function get(req, res)
{
  try
  {
    console.log("get room");
    const queryStr = req.query?.q || req.body?.q || "";
    const whereCondition = repo.parseQueryStringToWhere(queryStr);
    const orderCondition = repo.parseOrderByString(queryStr);

    const roomInstance = await repo.RoomModel.findOne({
      where: whereCondition,
      order: orderCondition,
    });
    if (!roomInstance) return res.json({ success: true, data: null });

    const room = roomInstance.get({ plain: true });
    const val = await __allInfo(room.id);

    if (!val) throw new Error("Room not found");

    console.log("val", val);
    return res.json({ success: true, data: resolveRoom(val) });
  } catch (err)
  {
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function getAll(req, res)
{
  try
  {
    const queryStr = req.query?.q || req.body?.q || "";
    const whereCondition = repo.parseQueryStringToWhere(queryStr);
    const orderCondition = repo.parseOrderByString(queryStr);

    const limit = parseInt(req.query?.limit || req.body?.limit) || 50;
    const offset =
      parseInt(
        req.query?.offset ||
        req.body?.take ||
        req.body?.skip ||
        req.body?.offset,
      ) || 0;

    let roomsResult = await repo.RoomModel.findAndCountAll({
      where:{
       // isPublic: true,
        ...whereCondition
      },
      limit: limit,
      offset: offset,
      order: orderCondition,
    });

    const viewerAvatarId = Number(req.query?.avatarId || req.headers?.["x-profile-id"] || 0);
    let rowsToProcess = roomsResult.rows;

    const preppedRooms = [];
    for (const roomInstance of rowsToProcess)
    {
      const room = await __allInfo(roomInstance.id);
      delete room.password;
      delete room.passoword;

      preppedRooms.push(resolveRoom(room));
    }

    const enrichedRooms = await enrichRoomsWithVisitStats(preppedRooms, viewerAvatarId);

    const hasNext = offset + limit < roomsResult.count;
    const nextPageNum = hasNext ? Math.ceil((offset + limit) / limit) + 1 : 0;

    return res.json({
      success: true,
      data: enrichedRooms,
      count: roomsResult.count,
      skip: offset,
      limit: limit,
      nextPage: nextPageNum,
    });
  } catch (err)
  {
    console.error(err);
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function update(req, res)
{
  try
  {
    const erro = checkData(req.body);
    if (erro) return res.status(400).json({ error: erro, success: false });

    const roomValid = await repo.RoomModel.findByPk(req.params.id);
    if (!roomValid)
      return res.status(404).json({ error: "Room not found", success: false });

    const adminRoles = ["admin", "moderador", "desenvolvedor", "ownner"];
    const user = req.userData;
    const isAdmin = adminRoles.includes(user.role);

    if (!isAdmin && roomValid.userId != req.userId)
    {
      return res.status(401).json({ error: "Unauthorized", success: false });
    }

    await repo.RoomModel.update(req.body, { where: { id: req.params.id } });

    const roomInstance = await repo.RoomModel.findByPk(req.params.id);
    const room = roomInstance.get({ plain: true });
    return res.json({ success: true, data: room });
  } catch (err)
  {
    return res.status(500).json({ error: err.message, success: false });
  }
}


//#endregion

//#region Create [Create, Update, Remove]

async function create(req, res)
{
  try
  {
    const roomData = req.body;
    let error = checkData(roomData);
    if (error) return res.status(400).json({ error: error, success: false });
    let room = await repo.RoomModel.create(roomData);
    room = await __allInfo(room.id);
    return res.json({ success: true, data: room });
  } catch (err)
  {
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function updatedObjects(req, res)
{
  const id = req.params.id;
  const objects = req.body;
  var result = await updatedObjectsFromRoom(id, objects);

  if (!result)
    return res.json({ error: "Room not found", success: false });

  return res.json({ success: true, message: "Objects updated successfully" });
}

async function remove(req, res)
{
  try
  {
    const roomValid = await repo.RoomModel.findByPk(req.params.id);
    if (!roomValid)
      return res.status(404).json({ error: "Room not found", success: false });

    const user = req.userData;
    const adminRoles = ["admin", "moderador", "desenvolvedor", "ownner"];
    const isAdmin = adminRoles.includes(user.role);

    if (!isAdmin && roomValid.userId != req.userId)
    {
      return res.status(401).json({ error: "Unauthorized", success: false });
    }

    await repo.RoomModel.destroy({ where: { id: req.params.id } });
    return res.json({ success: true, message: "Room deleted successfully" });
  } catch (err)
  {
    return res.status(500).json({ error: err.message, success: false });
  }
}


//#endregion

//#region Terrain

router.post("/game/room/:id/terrain", CheckAuth, multerMiddleware.single("file"), uploadTerrain,);
router.get("/game/room/:id/terrain", CheckAuth, getTerrain);
router.get("/game/room/:id/terrain/download", CheckAuth, downloadTerrain);


async function downloadTerrain(req, res)
{
  try
  {
    console.log("Download terrain");

    const id = req.params.id;
    const hasRoom = await repo.RoomModel.findByPk(id);
    if (!hasRoom) throw new Error("Room not found");

    console.log(hasRoom.get({ plain: true }));

    const terrain = await repo.Terrain.findOne({
      where: { target_uid: hasRoom.uid },
      raw: true,
    });
    if (!terrain) throw new Error("Terrain not found");

    const filePath = path.join(
      UPLOAD_DIR,
      "Terrains_data",
      `uid_${terrain.uid}.data`,
    );
    console.log(`Enviando ${filePath}`);
    res.download(filePath);
    //  res.json({ success: true, error: "", data: terrain });
  } catch (e)
  {
    console.log(e);
    return res.status(500).json({ success: false, error: e.message });
  }
}

async function uploadTerrain(req, res)
{
  try
  {
    console.log("Upload terrain");
    const id = req.params.id;
    const data = req.body.data ? JSON.parse(req.body.data) : null;
    console.log(`terrain: ${req.body.data} id: ${id}`);
    console.log(`file: ${req.file}`);
    let hasRoom = await repo.RoomModel.findByPk(id);
    if (!hasRoom) throw new Error("Room not found");

    console.log(hasRoom.get({ plain: true }));

    if (!hasRoom.uid)
    {
      console.log(`Room ${id} nao tem uid vamos criar`);
      await repo.RoomModel.update({ uid: uuidv4() }, { where: { id: id } });
      hasRoom = await repo.RoomModel.findByPk(id);
      if (!hasRoom) throw new Error("Room not found");
    }

    console.log(`Room ${id} found vamos inicia o update uid: ${hasRoom.uid}`);

    let terrain = await repo.Terrain.findOne({
      where: { target_uid: hasRoom.uid },
      raw: true,
    });

    if (!terrain)
    {
      console.log(`terrain nao existe vamos criar`);
      await repo.Terrain.create({ target_uid: hasRoom.uid, name: "Terrain" });
      console.log(`terrain criado vamos buscar`);
      terrain = await repo.Terrain.findOne({
        where: { target_uid: hasRoom.uid },
        raw: true,
      });
    }
    req.terrain = terrain;
    console.log(`terrain existe?: ${terrain}`);
    const result = await crtTerraind.HandleTerrainUpdate(req);
    if (!result.success) throw new Error(result.error);
    return res.json(result);
  } catch (e)
  {
    console.log(e);
    return res.status(500).json({ success: false, error: e.message });
  }
}

async function getTerrain(req, res)
{
  try
  {
    const id = req.params.id;
    const hasRoom = repo.RoomModel.findByPk(id);
    if (!hasRoom) throw new Error("Room not found");
    const terrain = await repo.Terrain.findOne({ where: { target_uid: id } });

    return res.status(200).json({ success: true, error: "", data: terrain });
  } catch (e)
  {
    return res.status(500).json({ success: false, error: e.message });
  }
}

//#endregion

//#region Objetos

async function getObjects(req, res)
{
  try
  {
    const id = req.params.id;
    const hasRoom = repo.RoomModel.findByPk(id);
    if (!hasRoom) throw new Error("Room not found");

    const objs = await __getObjects(id);

    return res.status(200).json({ success: true, data: objs });
  } catch (err)
  {
    return res.status(500).json({ error: err.message, success: false });
  }
}


//#endregion

//#region Layout

async function updateLayout(req, res)
{
  try
  {
    const layoutId = req.params.id;
    const roomId = req.params.roomId;
    const hasRoom = await repo.RoomModel.findByPk(roomId);
    if (!hasRoom) throw new Error("Room not found");
    const layout = await repo.LayoutModel.findOne({
      where: { id: layoutId },
      raw: true,
    });
    if (!layout) throw new Error("Layout not found");
    return res.json({ success: true, data: layout });
  } catch (e)
  {
    console.log(e);
    return res.status(500).json({ success: false, error: e.message });
  }
}

//#endregion


function checkData(roomData)
{
  let error = "";
  try
  {
    if (!roomData) throw new Error("Dados da sala é obrigatório.");
    if (!roomData.avatarId || roomData.avatarId == 0) throw new Error("O profile da sala é obrigatório.");
    if (!roomData.name) throw new Error("O nome da sala é obrigatório.");
    if (!roomData.description) throw new Error("A descrição da sala é obrigatória.");
    if (!roomData.scene) throw new Error("A cena da sala é obrigatória.");
  } catch (e)
  {
    error = e.message;
  }
  return error;
}



async function like(req, res)
{
  const id =
    parseInt(req.params.id || req.params.targetId || req.query.id) || 0;
  const userId = parseInt(req.userId, 10) || req.userId;

  const hasRoom = await repo.RoomModel.findByPk(id);

  if (!hasRoom)
  {
    return res.status(404).json({ success: false, error: "Room not found" });
  }
  const lk = await repo.Like.findOne({
    where: { userId: userId, roomId: id },
  });

  if (lk)
  {
    await lk.destroy();
    return res.status(200).json({ success: true, error: "", data: false });
  } else
  {
    await repo.Like.create({ userId: userId, roomId: id });
    return res.status(200).json({ success: true, error: "", data: true });
  }
}


function resolveRoom(room)
{
  room.layoutId = room.layoutId || 0;
  room.onwnerId = room.ownerId || 0;
  room.userId = room.userId || 0;
  room.inventoryId = room.inventoryId || 0;
  return room;
}




//#region privates, exports

async function __getAllRoomFromProfile(profileId, full = false)
{
  const rooms = await repo.RoomModel.findAll({
    where: { avatarId: profileId }
  }, { raw: true });

  const map = rooms;

  if (full)
  {
    let values = [];
    for (let i = 0; i < map.length; i++)
    {
      var val = await __allInfo(map[i].id);
      values.push(val);
    }
    return values;
  }
  return map;
}

async function __allInfo(roomId, full = true)
{
  try
  {
    let room = null;
    if (full)
    {
      room = await repo.RoomModel.findOne({
        where: { id: roomId },
        include: [
          { model: repo.ObjectModel, as: "objects" },
          { model: repo.Terrain, as: "terrain" }
        ]
      });
    } else
    {
      room = await repo.RoomModel.findOne({
        where: { id: roomId }
      });
    }

    return room ? room.get({ plain: true }) : null;
  } catch (err)
  {
    console.error("Erro no all:", err);
    return null;
  }
}
async function __createLobby(avatarId, roomName)
{
  const room = await createRoomForProfile(avatarId, roomName, "lobby", roomName, "", true);
  return room;
}

async function __getObjects(roomId)
{
  const objs = await repo.ObjectModel.findAll({ where: { roomId: roomId } });

  return objs;
}

async function createRoomForProfile(avatarId, name, scene, description, password, privateRoom)
{
  try
  {
    var roomData = {
      avatarId: avatarId,
      scene: scene,
      name: name,
      description: description,
      password: password,
      private: privateRoom,
    };

    let error = checkData(roomData);
    if (error) throw new Error(error);

    let room = await repo.RoomModel.create(roomData, { raw: true });
    room = await __allInfo(room.id);
    return room;
  } catch (err)
  {
    return null;
  }
}

async function updatedObjectsFromRoom(roomId, _objects)
{
  try
  {
    const roomValid = await repo.RoomModel.findByPk(roomId);
    if (!roomValid) throw new Error("Room not found");
    if (!_objects || _objects.length == 0) throw new Error("Objects not found");

    let objects = [];
    _objects.forEach((obj) =>
    {
      obj.roomId = parseInt(roomId) || roomId;
      objects.push(obj);
    });

    await repo.sequelize.transaction(async (t) =>
    {
      await repo.ObjectModel.destroy({
        where: { roomId: roomValid.id },
        transaction: t,
      });

      await repo.ObjectModel.bulkCreate(objects, { transaction: t });
    });

    return true;
  }
  catch (err)
  {
    console.log(err);
    return false;
  }
}


//#endregion








module.exports = {
  //lixo
  //create, findByPk, get, getAll, update, remove,

  //rotas  
  router,

  //Metodos
  __getAllRoomFromProfile,
  __allInfo,
  createRoomForProfile,
  updatedObjectsFromRoom,
};
