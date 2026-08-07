const repo = require('../repository');
const router = require('express').Router();
const { CheckLogin: CheckAuth } = require('../controllers/auth');

// Ações para Objects (Objetos)
// 1. Rotas estáticas específicas (prefixo longo ou sem :id) primeiro
router.get('/game/objects', getAll);
router.post('/game/objects/bucket', CheckAuth, createAll);
router.post('/game/objects', CheckAuth, create);

// 2. Rotas dinâmicas (com :id) por último
router.get('/game/object/:id', CheckAuth, getById);
router.put('/game/objects/:id', CheckAuth, update);
router.delete('/game/objects/:id', CheckAuth, remove);




function checkData(objectData) {
    let error = "";
    try {
        if (!objectData)
            throw new Error("Dados do objeto são obrigatórios.");

        if (!objectData.data)
            throw new Error("O campo data é obrigatório.");

        if (!objectData.ownnerId)
            throw new Error("O ownnerId é obrigatório.");

        if (!objectData.roomId)
            throw new Error("O roomId é obrigatório.");
            
    } catch (e) {
        error = e.message;
    }
    return error;
}

async function getAll(req, res) {
    const roomId = req.params?.id || req.body?.id || req.query?.roomId || null;
    const limit = parseInt(req.query?.limit || req.body?.limit) || 50;
    const offset = parseInt(req.query?.offset || req.body?.take || req.body?.skip || req.body?.offset) || 0;

    try {
        const whereCondition = roomId ? { roomId: roomId } : {};

        const objects = await repo.ObjectModel.findAndCountAll({
            where: whereCondition,
            limit: limit,
            offset: offset
        });

        // CORREÇÃO: Calcula se realmente existe uma próxima página válida com base no total
        const hasNext = offset + limit < (objects?.count || 0);
        const nextPageNum = hasNext ? Math.ceil((offset + limit) / limit) + 1 : 0;

        return res.json({
            success: true,
            data: objects?.rows || [],
            count: objects?.count || 0,
            skip: offset,
            limit: limit,
            nextPage: nextPageNum,
        });
    } catch (err) {
        return res.status(500).json({ success: false, data: [], error: err.message });
    }
}

async function getById(req, res) {
    try {
        const object = await repo.ObjectModel.findByPk(req.params.id);
        if (!object) {
            return res.status(404).json({ error: "Object not found", success: false });
        }
        return res.json({ success: true, data: object });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function create(req, res) {
   // Garante que o body vire uma array apenas se já não for uma
   req.body = Array.isArray(req.body) ? req.body : [req.body];
   createAll(req, res);
}

async function createAll(req, res) {
    const list = req.body;
    try {
        if (!Array.isArray(list) || list.length === 0) {
            return res.status(400).json({ error: "Invalid or empty array list", success: false });
        }

        let pos = 0;
        const roomId = list[0].roomId;
        const validRoom = await repo.RoomModel.findByPk(roomId);

        if (!validRoom) {
            return res.status(404).json({ error: "Room not found", success: false });
        }

        if(validRoom.userId != req.userId){
            //return res.status(401).json({ error: "Unauthorized", success: false });
            console.log("ver permisoes");
        }
        
        for (const element of list) {
            let error = checkData(element);
            if (error) {
                return res.status(400).json({ 
                    success: false, 
                    error: `Object invalid at position: ${pos}. Error: ${error}` 
                });
            }
            if(element.roomId != roomId){
                return res.status(400).json({ 
                    success: false, 
                    //precisa ser item da mesma sala
                    error: `Object invalid at position: ${pos}. RoomId must be the same.`
                });
            }
            pos++;
        }

        // Limpa e formata os dados criando uma nova lista limpa para o banco
        const sanitizedList = list.map(o => {
            const newObj = { ...o };
            newObj.roomId = roomId;
            delete newObj.uid; // Impede que mandem IDs únicos forçados do cliente
            return newObj;
        });

        // CORREÇÃO: Utiliza a lista devidamente tratada no bulkCreate
        const createdList = await repo.ObjectModel.bulkCreate(sanitizedList);
        return res.json({ success: true, message: "Objects created successfully", data: createdList });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}


async function update(req, res) {
    try {
        const error = checkData(req.body);
        if (error) {
            return res.status(400).json({ error: error, success: false });
        }

        const objectExists = await repo.ObjectModel.findByPk(req.params.id);
        if (!objectExists) {
            return res.status(404).json({ error: "Object not found", success: false });
        }
        
        // CORREÇÃO: Trata como objeto único em vez de usar .map() em req.body
        const updateData = { ...req.body };
        updateData.uid = objectExists.uid; // nunca altera o uid original

        await repo.ObjectModel.update(updateData, { where: { id: req.params.id } });
        const updatedObject = await repo.ObjectModel.findByPk(req.params.id);
        
        return res.json({ success: true, data: updatedObject });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function remove(req, res) {
    try {
        const object = await repo.ObjectModel.findByPk(req.params.id);
        if (!object) {
            return res.status(404).json({ error: "Object not found", success: false });
        }
        const user = req.userData;//no auth ja expos o req.userData
        const adminRoles = ['admin', 'moderador', 'desenvolvedor', 'ownner'];
        const isAdmin = adminRoles.includes(user.role);
     
        if (!isAdmin) {
            if (object.ownnerId != req.userId) {
                return res.status(401).json({ error: "Unauthorized", success: false });
            }
        }

        await repo.ObjectModel.destroy({ where: { id: req.params.id } });
        return res.json({ success: true, message: "Object deleted successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

module.exports = {
    getAll,
    getById,
    create,
    createAll,
    update,
    remove,
    router
};