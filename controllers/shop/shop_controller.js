const router = require('express').Router();
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { Op } = require('sequelize');
const { createClient } = require('@supabase/supabase-js');
const repo = require('../../repository');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

const BUCKET_NAME = 'tfl-bucket'; // Nome do bucket criado no Supabase

// --- MULTER (EM MEMÓRIA) ---
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/shop', (req, res) => GetAll(req, res));
router.get('/shop/home', (req, res) => GetIndex(req, res));
router.post('/shop/container', upload.any(), (req, res) => SaveMaterial(req, res));

function GetIndex(req, res) {
    const filePath = path.join(__dirname, '../../paginas/shopUpload.html');
    res.sendFile(filePath);
}

async function GetAll(req, res) {
    try {
        const page = parseInt(req.query.pg) || 0;
        const limit = parseInt(req.query.limit) || 20;
        const query = (req.query.q || '').trim();
        const offset = page * limit;

        // Monta condição de busca ignorando Case Sensitivity
        const whereCondition = query ? {
            [Op.or]: [
                repo.sequelize.where(
                    repo.sequelize.fn('LOWER', repo.sequelize.col('shop_container.title')),
                    { [Op.like]: `%${query.toLowerCase()}%` }
                ),
                repo.sequelize.where(
                    repo.sequelize.fn('LOWER', repo.sequelize.col('shop_container.description')),
                    { [Op.like]: `%${query.toLowerCase()}%` }
                ),
                repo.sequelize.where(
                    repo.sequelize.fn('LOWER', repo.sequelize.col('items.model')),
                    { [Op.like]: `%${query.toLowerCase()}%` }
                )
            ]
        } : {};

        const { count, rows } = await repo.ShopContainer.findAndCountAll({
            where: whereCondition,
            include: [{ 
                model: repo.ItemResource, 
                as: 'items',
                required: false
            }],
            distinct: true,
            subQuery: false,
            limit: limit,
            offset: offset,
            order: [['id', 'DESC']]
        });

        const data = rows.map(row => {
            const container = row.toJSON();

            if (container.thumb) {
                container.thumb = container.thumb.startsWith('http') 
                    ? container.thumb 
                    : container.thumb.replace(/\\/g, '/');
            } else {
                container.thumb = '';
            }

            if (Array.isArray(container.items)) {
                container.items = container.items.map(resItem => {
                    if (typeof resItem.textures_paths === 'string') {
                        try {
                            resItem.textures_paths = JSON.parse(resItem.textures_paths);
                        } catch (e) {
                            resItem.textures_paths = {};
                        }
                    } else {
                        resItem.textures_paths = resItem.textures_paths || {};
                    }

                    for (const key in resItem.textures_paths) {
                        if (resItem.textures_paths[key]) {
                            resItem.textures_paths[key] = resItem.textures_paths[key].startsWith('http')
                                ? resItem.textures_paths[key]
                                : resItem.textures_paths[key].replace(/\\/g, '/');
                        }
                    }

                    const sanitizeDict = (obj) => {
                        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
                        const clean = {};
                        for (const key in obj) {
                            if (obj[key] !== null && obj[key] !== undefined && obj[key] !== "") {
                                clean[key] = obj[key];
                            }
                        }
                        return clean;
                    };

                    resItem.values = sanitizeDict(resItem.values);
                    resItem.colors = sanitizeDict(resItem.colors);
                    resItem.ints = sanitizeDict(resItem.ints);
                    resItem.bools = sanitizeDict(resItem.bools);
                    resItem.strings = sanitizeDict(resItem.strings);
                    resItem.vectors = sanitizeDict(resItem.vectors);

                    return resItem;
                });
            }

            return container;
        });

        res.status(200).json({
            success: true,
            error: '',
            data: data,
            count: data.length,
            total: typeof count === 'number' ? count : count.length,
            offset: offset,
            limit: limit
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
            data: null
        });
    }
}
async function SaveMaterial(req, res) {
    try {
        const payload = JSON.parse(req.body.payload || '{}');
        const files = req.files || [];

        // Função para subir o Buffer do arquivo para o Supabase Storage
        const uploadFileToSupabase = async (file, modelName) => {
            if (!file) return null;

            const modelFolder = modelName ? modelName.replace(/[^a-zA-Z0-9_-]/g, '') : 'default';
            const randomName = crypto.randomBytes(16).toString('hex');
            const ext = path.extname(file.originalname) || '.png';
            
            const filePath = `${modelFolder}/${randomName}${ext}`;

            // Upload via Buffer
            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (error) {
                throw new Error(`Erro no upload para Supabase: ${error.message}`);
            }

            // Pega a URL pública gerada
            const { data: publicUrlData } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(filePath);

            return publicUrlData.publicUrl;
        };

        // Upload da Thumbnail (mainImage)
        const mainImageFile = files.find(f => f.fieldname === 'mainImage');
        const firstItemModel = (payload.items && payload.items[0]) ? payload.items[0].model : 'default';
        const thumbUrl = await uploadFileToSupabase(mainImageFile, firstItemModel);

        // Mapeia os arquivos de textura pelo fieldname `texture_{index}_{key}`
        const textureFilesMap = {};
        files.filter(f => f.fieldname.startsWith('texture_')).forEach(f => {
            textureFilesMap[f.fieldname] = f;
        });

        const containerToCreate = {
            onnerId: payload.onnerId || 0,
            title: payload.title,
            price: payload.price,
            description: payload.description,
            thumb: thumbUrl || '',
            sales: 0
        };

        const createdContainer = await repo.ShopContainer.create(containerToCreate);

        if (Array.isArray(payload.items)) {
            const itemsToCreate = await Promise.all(payload.items.map(async (resItem, index) => {
                const mappedTexturesPaths = {};

                if (resItem.textures_paths) {
                    for (const key in resItem.textures_paths) {
                        const fieldKey = `texture_${index}_${key}`;
                        const fileObj = textureFilesMap[fieldKey];

                        if (fileObj) {
                            const savedUrl = await uploadFileToSupabase(fileObj, resItem.model);
                            mappedTexturesPaths[key] = savedUrl;
                        }
                    }
                }

                return {
                    containerId: createdContainer.id,
                    model: resItem.model,
                    slot: resItem.slot,
                    shader: resItem.shader,
                    values: resItem.values || {},
                    colors: resItem.colors || {},
                    ints: resItem.ints || {},
                    bools: resItem.bools || {},
                    strings: resItem.strings || {},
                    vectors: resItem.vectors || {},
                    textures_paths: mappedTexturesPaths
                };
            }));

            await repo.ItemResource.bulkCreate(itemsToCreate);
        }

        const fullCreated = await repo.ShopContainer.findByPk(createdContainer.id, {
            include: [{ model: repo.ItemResource, as: 'items' }]
        });

        res.status(201).json({
            success: true,
            error: '',
            data: fullCreated
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
            data: null
        });
    }
}

module.exports = {
    router,
    GetAll,
    SaveMaterial
};