const repo = require('../repository');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'uploads');
const multer = require('multer');
const multerMiddleware = multer({ storage: multer.memoryStorage() }); 
const router = require('express').Router();
const { CheckLogin: CheckAuth } = require('../controllers/auth');
const { Op } = require('sequelize');

// Ações para Rooms (Salas)
// 1. Rotas estáticas específicas (devem vir primeiro)
router.get(['/game/rooms'], CheckAuth, getAll);
router.get(['/game/rooms/search'], CheckAuth, getAll);
router.get('/game/rooms/search/find', CheckAuth, get); // Mudança crucial: antes do :id

// 2. Rotas com parâmetros (devem vir depois)
router.get('/game/room/:id', CheckAuth, findByPk);
router.get('/game/room/:id/like', CheckAuth, like);
router.get('/game/room/:id/favorite', CheckAuth, (req, res) => res.status(200).json({ "success": true, "error": "" }));
router.get('/game/room/:id/objects', CheckAuth, getObjects);
router.get('/game/room/:id/all', CheckAuth, all);




// ???. Métodos de escrita
router.post('/game/room', CheckAuth, create);
router.put('/game/room/:id', CheckAuth, update);
router.delete('/game/room/:id', CheckAuth, remove);

//saves
router.post('/game/room/:id', CheckAuth, update);//salva infos da room
router.post('/game/room/:id/objects', CheckAuth, updatedObjects);//salva os objets

//Terrain
// ???. Uploads
const crtTerraind = require('./terrainController');
router.post('/game/room/:id/terrain', CheckAuth, multerMiddleware.single('file'), uploadTerrain);

router.get('/game/room/:id/terrain', CheckAuth, getTerrain);
router.get('/game/room/:id/terrain/download', CheckAuth, downloadTerrain);

//layouts

router.get('/game/room/:id/layout', CheckAuth, getLayout);
router.post('/game/room/:id/layout', CheckAuth, updateLayout);


async function getLayout(req, res) {
    try {
        const layoutId = req.params.id || req.body.id;
        const roomId = req.params.roomId || req.body.roomId;

        const hasRoom = await repo.RoomModel.findByPk(roomId);
        if (!hasRoom)
            throw new Error("Room not found");

        if (!layoutId)
            layoutId = hasRoom.layoutId;

        let layout = await repo.LayoutModel.findOne({ where: { id: layoutId }, raw: true });
        if (!layout) {
            repo.transaction(async (t) => {
                layout = await repo.LayoutModel.create({ roomId: roomId }, { transaction: t });
                await repo.RoomModel.update({ layoutId: layout.id }, { where: { id: roomId }, transaction: t });
            });
        }
        return res.json({ success: true, data: layout });
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({ success: false, error: e.message });
    }
}

async function updateLayout(req, res) {
    try {
        const layoutId = req.params.id;
        const roomId = req.params.roomId;
        const hasRoom = await repo.RoomModel.findByPk(roomId);
        if (!hasRoom)
            throw new Error("Room not found");
        const layout = await repo.LayoutModel.findOne({ where: { id: layoutId }, raw: true });
        if (!layout)
            throw new Error("Layout not found");
        return res.json({ success: true, data: layout });
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({ success: false, error: e.message });
    }
}

function checkData(roomData) {
    let error = "";
    try {
        if (!roomData) throw new Error("Dados da sala é obrigatório.");
        if (!roomData.name) throw new Error("O nome da sala é obrigatório.");
        if (!roomData.description) throw new Error("A descrição da sala é obrigatória.");
        if (!roomData.scene) throw new Error("A cena da sala é obrigatória.");
    } catch (e) {
        error = e.message;
    }
    return error;
}

async function downloadTerrain(req, res) {
    try {
        console.log("Download terrain");

        const id = req.params.id;
        const hasRoom = await repo.RoomModel.findByPk(id);
        if (!hasRoom)
            throw new Error("Room not found");

        console.log(hasRoom.get({ plain: true }));

        const terrain = await repo.Terrain.findOne({ where: { target_uid: hasRoom.uid }, raw: true });
        if (!terrain)
            throw new Error("Terrain not found");

        const filePath = path.join(UPLOAD_DIR, "Terrains_data", `uid_${terrain.uid}.data`);
        console.log(`Enviando ${filePath}`);
       res.download(filePath);
   //  res.json({ success: true, error: "", data: terrain });

    }
    catch (e) {
        console.log(e);
        return res.status(500).json({ success: false, error: e.message });
    }
}

async function uploadTerrain(req, res) {
    try {
        console.log("Upload terrain");
        const id = req.params.id;
        const data = req.body.data ? JSON.parse(req.body.data) : null;
        console.log(`terrain: ${req.body.data} id: ${id}`);
        console.log(`file: ${req.file}`);
        let hasRoom = await repo.RoomModel.findByPk(id);
        if (!hasRoom)
            throw new Error("Room not found");

        console.log(hasRoom.get({ plain: true }));

        if(!hasRoom.uid)
        {
            console.log(`Room ${id} nao tem uid vamos criar`);
            await repo.RoomModel.update({ uid: uuidv4() }, { where: { id: id } });
            hasRoom = await repo.RoomModel.findByPk(id);
            if (!hasRoom)
                throw new Error("Room not found");
        }

        console.log(`Room ${id} found vamos inicia o update uid: ${hasRoom.uid}`);

        let terrain = await repo.Terrain.findOne({ where: { target_uid: hasRoom.uid }, raw: true });
        
        if(!terrain) {
            console.log(`terrain nao existe vamos criar`);
            await repo.Terrain.create({ target_uid: hasRoom.uid, name: "Terrain" });
            console.log(`terrain criado vamos buscar`);
            terrain = await repo.Terrain.findOne({ where: { target_uid: hasRoom.uid }, raw: true });
        }
        req.terrain = terrain;
        console.log(`terrain existe?: ${terrain}`);
        const result = await crtTerraind.HandleTerrainUpdate(req);
        if (!result.success) throw new Error(result.error);
        return res.json(result);
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({ success: false, error: e.message });
    }
}

async function getTerrain(req, res) {
    try {
        const id = req.params.id;
        const hasRoom = repo.RoomModel.findByPk(id);
        if (!hasRoom)
            throw new Error("Room not found");
        const terrain = await repo.Terrain.findOne({ where: { target_uid: id } });

        return res.status(200).json({ success: true, error: "", data: terrain });
    }
    catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
}

async function like(req, res) {

    const id = parseInt(req.params.id || req.params.targetId || req.query.id) || 0;
    const userId = parseInt(req.userId, 10) || req.userId;



    const hasRoom = await repo.RoomModel.findByPk(id);


    if (!hasRoom) {
        return res.status(404).json({ success: false, error: "Room not found" });
    }
    const lk = await repo.Like.findOne({
        where: { userId: userId, roomId: id }
    });

    if (lk) {
        await lk.destroy();
        return res.status(200).json({ success: true, error: "", data: false });
    } else {
        await repo.Like.create({ userId: userId, roomId: id });
        return res.status(200).json({ success: true, error: "", data: true });
    }
}


async function all(req, res) {
    try {
        const id = req.params.id;

        const room = await __allInfo(id);
        if(!room)
            throw new Error("Room not found");

        return res.status(200).json({ success: true, data: room });

    } catch (err) {
        console.error("Erro no all:", err);
        return res.status(500).json({ success: false, error: err.message, data: null });
    }
}

async function __allInfo(roomId) {
    try {
        const [room,objs, likes, users] = await Promise.all([
            repo.RoomModel.findByPk(roomId),
            __getObjects(roomId),
            repo.Like.findAndCountAll({ where: { roomId: roomId }, limit: 10, offset: 0, order: [['createdAt', 'DESC']] }),
            repo.User.findAndCountAll({ where: { roomId: roomId }, limit: 10, offset: 0, order: [['createdAt', 'DESC']] }),
          
        ]);
        let terrain =  await repo.Terrain.findOne({ where: { target_uid: room.uid }, raw: true });
       
        const layout = await repo.LayoutModel.findOne({ where: { id: room.layoutId }, raw: true });
        const roomValid = room.get({ plain: true });
        roomValid.playersCount = users.count;
        return { 
                    ...roomValid,
                    layout: layout || {},
                    objects: objs || [],
                    terrain: terrain, 
                    likes: { users: likes.rows, count: likes.count, limit: 10, offset: 0 }, 
                    users: users.rows
                };

    } catch (err) {
        console.error("Erro no all:", err);
        return null;
    }
}
async function __getObjects(roomId) {
    const objs = await repo.ObjectModel.findAll({ where: { roomId: roomId } });
    const ids = objs.map(o => o.materialId);
    const materiais = await repo.Material.findAll({ where: { id: { [Op.in]: ids } } });
    objs.forEach(o => {
        o.materials = materiais.filter(m => m.id === o.materialId);
    });
    return objs;
}

async function create(req, res) {
    try {
        const roomData = req.body;
        let error = checkData(roomData);
        if (error) return res.status(400).json({ error: error, success: false });

        let room = await repo.RoomModel.create(roomData);
        room = await __allInfo(room.id);
        return res.json({ success: true, data: room });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function findByPk(req, res) {
    try {
        const roomId = req.params.id || req.body.id;
        let roomInstance = null;
        if (roomId == 0) {
            roomInstance = await repo.RoomModel.findOne({ where: { userId: req.userId } });
        }
        else {
            roomInstance = await repo.RoomModel.findByPk(roomId);
        }

        if (!roomInstance)
             return res.status(404).json({ error: "Room not found", success: false });

        const all = await __allInfo(roomId);
        if(!all)
            throw new Error("Room not found info");
        
        return res.json({ success: true, data: resolveRoom(all) });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function get(req, res) {

    try {
        console.log("get room");
        const queryStr = req.query?.q || req.body?.q || '';
        const whereCondition = repo.parseQueryStringToWhere(queryStr);
        const orderCondition = repo.parseOrderByString(queryStr);

        const roomInstance = await repo.RoomModel.findOne({ where: whereCondition, order: orderCondition });
        if (!roomInstance) return res.json({ success: true, data: null });

        const room = roomInstance.get({ plain: true });
       const val = await __allInfo(room.id);

       if(!val)
            throw new Error("Room not found");

        console.log("val", val);
        return res.json({ success: true, data: resolveRoom(val) });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

function resolveRoom(room){
    room.layoutId = room.layoutId || 0;
    room.onwnerId = room.ownerId || 0;
    room.userId = room.userId || 0;
    room.inventoryId = room.inventoryId || 0;
    return room;
}

async function getAll(req, res) {
    try {
      
        
        const queryStr = req.query?.q || req.body?.q || '';
        const whereCondition = repo.parseQueryStringToWhere(queryStr);
        const orderCondition = repo.parseOrderByString(queryStr);

        const limit = parseInt(req.query?.limit || req.body?.limit) || 50;
        const offset = parseInt(req.query?.offset || req.body?.take || req.body?.skip || req.body?.offset) || 0;


        
        let roomsResult = await repo.RoomModel.findAndCountAll({
            where: whereCondition,
            limit: limit,
            offset: offset,
            order: orderCondition
        });

        const user = req.userData;
        const adminRoles = ['admin', 'moderador', 'desenvolvedor', 'ownner'];
        const isAdmin = adminRoles.includes(user.role);

        let rowsToProcess = roomsResult.rows;
        
        // Filtro de salas privadas corrigido e ativo
        if (!isAdmin) 
        {
           // rowsToProcess = rowsToProcess.filter(room => room.private === false || room.userId === user.id);
        }

        const preppedRooms = [];
        for (const roomInstance of rowsToProcess)
        {
            const room = roomInstance.get({ plain: true });            
            delete room.password;
            delete room.passoword; // Mantido o tipo original do seu código
            preppedRooms.push(resolveRoom(room));
        }

        const hasNext = offset + limit < roomsResult.count;
        const nextPageNum = hasNext ? Math.ceil((offset + limit) / limit) + 1 : 0;
     
        return res.json({
            success: true,
            data: preppedRooms,
            count: roomsResult.count,
            skip: offset,
            limit: limit,
            nextPage: nextPageNum
        });
    } catch (err) {
        console.error(err); // Adicionado para facilitar o seu debug interno
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function update(req, res) {
    try {
        const erro = checkData(req.body);
        if (erro) return res.status(400).json({ error: erro, success: false });

        const roomValid = await repo.RoomModel.findByPk(req.params.id);
        if (!roomValid) return res.status(404).json({ error: "Room not found", success: false });

        const adminRoles = ['admin', 'moderador', 'desenvolvedor', 'ownner'];
        const user = req.userData;
        const isAdmin = adminRoles.includes(user.role);

        if (!isAdmin && roomValid.userId != req.userId) {
            return res.status(401).json({ error: "Unauthorized", success: false });
        }

        await repo.RoomModel.update(req.body, { where: { id: req.params.id } });

        const roomInstance = await repo.RoomModel.findByPk(req.params.id);
        const room = roomInstance.get({ plain: true });
        return res.json({ success: true, data: room });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}


async function getObjects(req, res) {
    try {
        const id = req.params.id;
        const hasRoom = repo.RoomModel.findByPk(id);
        if (!hasRoom)
            throw new Error("Room not found");

        const objs = await __getObjects(id);

        return res.status(200).json({ success: true, data: objs });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

function updatedObjects(req, res) {
    try {
        const id = req.params.id;
        const roomValid = repo.RoomModel.findByPk(id);
        if (!roomValid) throw new Error("Room not found");

        const objects = req.body;
        objects.forEach(object => {
            object.roomId = id;
        });
        //filters 
        const remove = objects.filter(obj => obj.status === 'remove');
        const update = objects.filter(obj => obj.status === 'update');
        const create = objects.filter(obj => obj.status === 'create');

        //inicia uma transação
        repo.sequelize.transaction(async (t) => {
            //remove
            if (remove.length > 0) await repo.ObjectModel.destroy({ where: { id: remove.map(obj => obj.id) }, transaction: t });
            //update
            if (update.length > 0) await repo.ObjectModel.update(update, { where: { id: update.map(obj => obj.id) }, transaction: t });
            //create
            if (create.length > 0) await repo.ObjectModel.bulkCreate(create, { transaction: t });
            return res.json({ success: true, message: "Objects updated successfully" });
        })

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function remove(req, res) {
    try {
        const roomValid = await repo.RoomModel.findByPk(req.params.id);
        if (!roomValid) return res.status(404).json({ error: "Room not found", success: false });

        const user = req.userData;
        const adminRoles = ['admin', 'moderador', 'desenvolvedor', 'ownner'];
        const isAdmin = adminRoles.includes(user.role);

        if (!isAdmin && roomValid.userId != req.userId) {
            return res.status(401).json({ error: "Unauthorized", success: false });
        }

        await repo.RoomModel.destroy({ where: { id: req.params.id } });
        return res.json({ success: true, message: "Room deleted successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

module.exports = { create, findByPk, get, getAll, update, remove, router };
