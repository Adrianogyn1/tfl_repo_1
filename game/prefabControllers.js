const repo = require('../repository');
const router = require('express').Router(); 
const { Op } = require('sequelize');
const { CheckLogin: CheckAuth } = require('../controllers/auth');





// Ações para Prefabs
router.get('/game/prefabs', CheckAuth, getAll);
router.get('/game/prefabs/:id', CheckAuth,getById);
router.post('/game/prefabs', CheckAuth, create);
router.put('/game/prefabs/:id', CheckAuth, update);
router.post('/game/prefabs/save', CheckAuth, saveAll);
router.delete('/game/prefabs/:id', CheckAuth, remove);



function checkData(prefabData) {
    let error = "";
    try {
        if (!prefabData)
            throw new Error("Dados do prefab são obrigatórios.");

        if (!prefabData.name)
            throw new Error("O nome do prefab é obrigatório.");

        if (!prefabData.addressable)
            throw new Error("O addressable do prefab é obrigatório.");

    } catch (e) {
        error = e.message;
    }
    return error;
}

function validReturn(prefab){
    var retVal=prefab;
    if(retVal.description==null) retVal.description="";
    if(retVal.uid==null) retVal.uid="";
    if(retVal.name==null) retVal.name="";
    if(retVal.materialId == null || retVal.materialId == "") retVal.materialId = 0;
    if(retVal.thumbnail==null) retVal.thumbnail="";
    if(retVal.version==null) retVal.version="";
    return retVal;
}

async function getAll(req, res) {
    const limit = parseInt(req.query?.limit || req.body?.limit) || 10;
    const offset = parseInt(req.query?.offset || req.body?.take || req.body?.skip || req.body?.offset) || 0;
    const query = req.query?.q || req.body?.q || '';
    const whereCondition = repo.parseQueryStringToWhere(query);

    try {
        const prefabs = await repo.PrefabModel.findAndCountAll({
            where: whereCondition,
            limit: limit,
            offset: offset
        });
        var data = [];
        prefabs.rows.forEach(element => {
            data.push(validReturn(element));
        });

        return res.json({
            success: true,
            data: data,
            count: prefabs?.count || 0,
            skip: offset,
            limit: limit,
            nextPage: prefabs?.count <= 0 ? 0 : Math.ceil((offset + limit) / limit) + 1,
        });
    } catch (err) {
        return res.status(500).json({ success: false, data: [], error: err.message });
    }
}

async function getById(req, res) {
    try {
        const prefab = await repo.PrefabModel.findOne({ where: { uid: req.params.id } });
        if (!prefab) {
            return res.status(404).json({ error: "Prefab not found", success: false });
        }
       
        return res.json({ success: true, data: validReturn(prefab) });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function create(req, res) {
    try {
        const prefabData = req.body;        

        if(prefabData.id && prefabData.id > 0) {
            return update(req, res);            
        }
        //verifica a uid
        if(prefabData.uid) {
            var exist = await repo.PrefabModel.findOne({ where: { uid: prefabData.uid } });
            if(exist)
                return update(req, res);
        }
        
        console.log("Vamos criar", prefabData);
        delete prefabData.id;

        const error = checkData(prefabData);

        if (error) {
            return res.status(400).json({ error: error, success: false });
        }

        const prefab = await repo.PrefabModel.create(prefabData);
        return res.json({ success: true, data: prefab });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function update(req, res) {
    try {
        const error = checkData(req.body);

        console.log("Vamos atualizar", req.body);

        if (error) return res.status(400).json({ error, success: false });

        const id = req.body.id || req.params.id ||0;
        const uid = req.body.uid;
        console.log(`id: ${id} uid: ${uid}`);

        const prefabExists = await repo.PrefabModel.findOne({ 
            where: { [Op.or]: [{ id }, { uid: uid || "" }] } 
        });

        if (!prefabExists) return res.status(404).json({ error: "Prefab not found", success: false });

        await repo.PrefabModel.update(req.body, { where: { id: prefabExists.id } });
        const updatedPrefab = await repo.PrefabModel.findByPk(prefabExists.id);
        
        return res.json({ success: true, data: validReturn(updatedPrefab) });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function remove(req, res) {
    try {
        const prefab = await repo.PrefabModel.findByPk(req.params.id);
        if (!prefab) {
            return res.status(404).json({ error: "Prefab not found", success: false });
        }

        await repo.PrefabModel.destroy({ where: { id: req.params.id } });
        return res.json({ success: true, message: "Prefab deleted successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}



async function saveAll(req, res) {
    try {
        const prefabs = req.body;
        const results = [];

        if (!Array.isArray(prefabs)) {
            console.error("Prefabs must be an array");
            return res.status(400).json({ error: "Prefabs must be an array", success: false });
        }

         let updateList = [];
         let createList = [];
        for (const prefab of prefabs) 
        {
            const error = checkData(prefab);
            if (error) throw new Error(error);
           var exist = await repo.PrefabModel.findOne({ where: { uid: prefab.uid } });
            delete prefab.id;
            if(exist) {
                updateList.push(prefab);
            } else {
               
                createList.push(prefab);
            }
        }
        //vamos fazer via transacao
        const transaction = await repo.sequelize.transaction();
        try {
            for (const prefab of createList) {
                const newPrefab = await repo.PrefabModel.create(prefab, { transaction });
                results.push(newPrefab.id);
            }
            for (const prefab of updateList) {
                await repo.PrefabModel.update(prefab, { where: { uid: prefab.uid }, transaction });
            }
            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }

        const retVal = await repo.PrefabModel.findAll({
            where: { id: { [Op.in]: results } }
        });
        let data = [];
        retVal.forEach(element => {
            data.push(validReturn(element));
        });
        return res.json({ success: true, data: data });
    } catch (err) {
        console.log(err);
        return res.status(400).json({ error: err.message, success: false });
    }
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    saveAll,
    router
};