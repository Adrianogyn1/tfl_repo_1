const repo = require('../repository');
const router = require('express').Router();
const auth = require('../controllers/auth');
const path = require('path');
const fs = require('fs');


// Ações para Textures (Texturas)
/*router.get('/game/textures', auth.CheckAuth, getAll);
router.get('/game/textures/:id', auth.CheckAuth, getById);
router.post('/game/textures', auth.CheckAuth, create);
router.put('/game/textures/:id', auth.CheckAuth, update);
router.delete('/game/textures/:id', auth.CheckAuth, remove);
/* */
router.get('/texture/:uid', getTexture);
router.get('/preview/:uid', getPreview);

async function getTexture(req,res) {
    const uid = req.params.uid;
    const texture = await repo.Texture.findOne({where:{uid:uid}});
    var pathFile = texture.path;
    if(pathFile[0]=='.')
        pathFile = pathFile.substring(2);

    var file = path.join(__dirname,"../", pathFile, texture.name);
    if(!fs.existsSync(file)) {
        return res.status(404).json({ error: "Texture not found", success: false });
    }
    return res.sendFile(file);
    //return res.json(texture);
}

async function getPreview(req,res) {
    const uid = req.params.uid;
    const mat = await repo.Material.findOne({where:{uid:uid}});
    const textures = JSON.parse(mat.textures) || mat.textures;
    const uidTexture = textures["difusse"] || textures["diffuse"];
    const texture = await repo.Texture.findOne({where:{uid:uidTexture}});
    if(!texture) {
        return res.status(404).json({ error: "Texture not found", success: false });
    }
    var pathFile = texture.path;
    if(pathFile[0]=='.')
        pathFile = pathFile.substring(2);

    var file = path.join(__dirname,"../", pathFile, texture.name);
    if(!fs.existsSync(file)) {
        return res.status(404).json({ error: "Texture not found", success: false });
    }
    return res.sendFile(file);
    //return res.json(texture);
}




function checkData(textureData) {
    let error = "";
    try {
        if (!textureData)
            throw new Error("Dados da textura são obrigatórios.");

        if (!textureData.name)
            throw new Error("O nome da textura é obrigatório.");

        if (!textureData.path)
            throw new Error("O path da textura é obrigatório.");

    } catch (e) {
        error = e.message;
    }
    return error;
}

async function getAll(req, res) {
    const limit = parseInt(req.query?.limit || req.body?.limit) || 50;
    const offset = parseInt(req.query?.offset || req.body?.take || req.body?.skip || req.body?.offset) || 0;

    try {
        // Corrigido de TextureModel para Texture
        const textures = await repo.Texture.findAndCountAll({
            limit: limit,
            offset: offset
        });

        return res.json({
            success: true,
            data: textures?.rows || [],
            count: textures?.count || 0,
            skip: offset,
            limit: limit,
            nextPage: textures?.count <= 0 ? 0 : Math.ceil((offset + limit) / limit) + 1,
        });
    } catch (err) {
        return res.status(500).json({ success: false, data: [], error: err.message });
    }
}

async function getById(req, res) {
    try {
        // Corrigido de TextureModel para Texture
        const texture = await repo.Texture.findByPk(req.params.id);
        if (!texture) {
            return res.status(404).json({ error: "Texture not found", success: false });
        }
        return res.json({ success: true, data: texture });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function create(req, res) {
    try {
        const textureData = req.body;
        const error = checkData(textureData);

        if (error) {
            return res.status(400).json({ error: error, success: false });
        }

        // Corrigido de TextureModel para Texture
        const texture = await repo.Texture.create(textureData);
        return res.json({ success: true, data: texture });
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

        // Corrigido de TextureModel para Texture
        const textureExists = await repo.Texture.findByPk(req.params.id);
        if (!textureExists) {
            return res.status(404).json({ error: "Texture not found", success: false });
        }

        await repo.Texture.update(req.body, { where: { id: req.params.id } });
        const updatedTexture = await repo.Texture.findByPk(req.params.id);
        
        return res.json({ success: true, data: updatedTexture });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function remove(req, res) {
    try {
        // Corrigido de TextureModel para Texture
        const texture = await repo.Texture.findByPk(req.params.id);
        if (!texture) {
            return res.status(404).json({ error: "Texture not found", success: false });
        }

        await repo.Texture.destroy({ where: { id: req.params.id } });
        return res.json({ success: true, message: "Texture deleted successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    router
};