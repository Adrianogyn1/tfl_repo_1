const repo = require('../repository');
const router = require('express').Router();
const auth = require('../controllers/auth');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { hash } = require('crypto');

const multerMiddleware = multer({ storage: multer.memoryStorage() });

router.get('/material',(req, res) => {
    
    return res.sendFile(path.join(__dirname, '../paginas/materialUpload.html'));   
});



router.get('/game/materials', auth.CheckLogin, getAll);
router.get('/game/materials/:id', auth.CheckLogin, getById);
router.post(
    '/game/materials/create', 
    multerMiddleware.fields([
        { name: 'preview[]', maxCount: 1000 },
        { name: 'texturas[]', maxCount: 1000 }
    ]), 
    auth.CheckLogin, 
    createByForm
);
router.post('/game/materials', auth.CheckLogin, create);
router.put('/game/materials/:id', auth.CheckLogin, update);
router.delete('/game/materials/:id', auth.CheckLogin, remove);




// CRUD de repo.Material

async function getAll(req, res) {
    const limit = parseInt(req.query?.limit || req.body?.limit) || 50;
    const offset = parseInt(req.query?.offset || req.body?.take || req.body?.skip || req.body?.offset) || 0;

    try {
        const materials = await repo.Material.findAndCountAll({
            limit: limit,
            offset: offset
        });

        return res.json({
            success: true,
            data: materials?.rows || [],
            count: materials?.count || 0,
            skip: offset,
            limit: limit,
            nextPage: materials?.count <= 0 ? 0 : Math.ceil((offset + limit) / limit) + 1,
        });
    } catch (err) {
        return res.status(500).json({ success: false, data: [], error: err.message });
    }
}

async function getById(req, res) {
    try {
        const material = await repo.Material.findByPk(req.params.id);
        if (!material) {
            return res.status(404).json({ error: "Material not found", success: false });
        }
        return res.json({ success: true, data: material });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}



async function createByForm(req, res) {
    try {
        const userId = req.userId;
        const { name, obj, channel } = req.body;
        const objModel = await repo.Prefab.findOne({ where: { uid: obj }});

        if(!objModel) {
            return res.status(200).json({ error: "Prefab not found", success: false });
        }
        
        // Caminho físico onde os arquivos serão salvos no servidor
        const pathUpload = path.join('../uploads/material', objModel.name);
        const uploadPath = path.join(__dirname, pathUpload);

        console.log(uploadPath);
        
        // Garante que o diretório existe (obrigatório já que o memoryStorage não cria)
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        let previewPath = '';
        let texturasPaths = [];

        // 1. Processa o arquivo de Preview
        if (req.files && req.files['preview[]'] && req.files['preview[]'].length > 0) {
            const previewFile = req.files['preview[]'][0];
            const previewName = `preview-${Date.now()}-${previewFile.originalname}`;            
            // Grava o buffer do memoryStorage no disco
            const finalName = path.join(uploadPath, previewName);
            fs.writeFileSync(finalName, previewFile.buffer);
            previewPath = finalName.replace(__dirname, '');
        }

        // 2. Processa as Texturas
        if (req.files && req.files['texturas[]']) {
            const texturasArray = req.files['texturas[]'];

            for (const file of texturasArray) {
                
                const hash = require('crypto').createHash('sha256');
                const fileHash = hash.update(file.buffer).digest('hex');
                const texturaName = `${fileHash}_${channel}_${path.extname(file.originalname)}`;
                const old = await repo.Texture.findOne({ where: { hash: fileHash } });
                const finalName = path.join(uploadPath, texturaName);
                let texture = old;
                if (!old) {
                    texture = await repo.Texture.create({
                        name: texturaName,
                        path: pathUpload.replace('../', ''),
                        userId: userId,
                        size: file.size,
                        hash: fileHash,
                        extension: path.extname(file.originalname)
                    });
                }
                //precisa verificar se a textura é do mesmo usuario
                console.log(`textura ${file.originalname} hash: ${fileHash} ${texture.userId} ${userId} por favor verificar`);

                // Grava o buffer do memoryStorage no disco
                fs.writeFileSync(finalName, file.buffer);
                
                
                await repo.Material.create({
                    name: name || file.originalname,
                    channel: channel,
                   // objectId: obj,
                    obj_uid: obj,
                    // Convertido para String para evitar o erro de violação do Sequelize
                    textures: JSON.stringify({ "difusse": texture.uid }), 
                    userId: userId
                });
                
                texturasPaths.push(`/uploads/material/${texturaName}`);
            }
        }

        return res.json({
            success: true,
            data: {
                name,
                obj,
                preview: previewPath,
                texturas: texturasPaths
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function create(req, res) {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "Data body is required", success: false });
        }

        delete req.body.uid;
        const material = await repo.Material.create(req.body);
        return res.json({ success: true, data: material });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function update(req, res) {
    try {
        const materialExists = await repo.Material.findByPk(req.params.id);
        if (!materialExists) {
            return res.status(404).json({ error: "Material not found", success: false });
        }

        await repo.Material.update(req.body, { where: { id: req.params.id } });
        const updatedMaterial = await repo.Material.findByPk(req.params.id);
        
        return res.json({ success: true, data: updatedMaterial });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function remove(req, res) {
    try {
        const material = await repo.Material.findByPk(req.params.id);
        if (!material) {
            return res.status(404).json({ error: "Material not found", success: false });
        }

        await repo.Material.destroy({ where: { id: req.params.id } });
        return res.json({ success: true, message: "Material deleted successfully" });
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