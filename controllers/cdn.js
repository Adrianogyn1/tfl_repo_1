const crypto = require('crypto');
const repo = require('../repository');
const { post } = require('../router');
const cloudinary = require('cloudinary').v2;


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

// Adicionado o async aqui para poder usar await no CheckLogin e no Banco
async function getSignature(req, res) {
    if (!await global.CheckLogin(req, res)) return;

    const userId = req.userId;
    const type = req.body.type;
    const hash = req.body.hash;

    let folder = 'tfl';
    switch (type) {
        case 'image':
            folder += '/image';
            break;
        case 'audio':
            folder += '/audio';
            break;
        case 'video':
            folder += '/video';
            break;
    }

    if (!userId) {
        console.log('Usuário nao logado');
    }
    console.log(`Usuário ${userId} pedindo a assinatura de upload`);

    const { cloud_name, api_key, api_secret } = cloudinary.config();

    const timestamp = Math.round(new Date().getTime() / 1000);
    const expireAt = timestamp + (60 * 2);  

    const uploadToken = hash || crypto.randomBytes(16).toString('hex');

    const paramsToSign = {
        folder: folder,
        timestamp: timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        api_secret
    );

    global.activeUploadTokens = global.activeUploadTokens || {};
    global.activeUploadTokens[uploadToken] = { used: false, expires: expireAt * 1000 };

    const allParams = {
        ...paramsToSign,
        api_key: api_key,
        signature: signature
    };

    const queryString = Object.keys(allParams)
        .sort()
        .map(key => `${key}=${encodeURIComponent(allParams[key])}`)
        .join('&');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload?${queryString}`;

    console.log(`Assinatura gerada: ${uploadUrl}`);
    
    try {
        // Corrigido com await para criar o registro de forma segura antes de enviar a resposta
        var file = await repo.FileInfo.create({
            userId: userId,
            token: uploadToken,
            type: type,
            hash: hash,
            folder: folder,
            status: 'pending'
        });

        return res.json({
            success: true,
            url: uploadUrl,
            token: uploadToken, 
            data: file.get({ plain: true })
        });
    } catch (error) {
        console.error("Erro ao criar FileInfo:", error);
        return res.status(500).json({ error: 'Erro ao registrar informações do arquivo.' });
    }
}

async function setResult(req, res) {
    return confirmPhoto(req, res);
}

async function confirmPhoto(req, res) {
    if (!await global.CheckLogin(req, res)) return; 
    
    try {
        const { description, postId, data } = req.body;
        const hash = data.hash || req.body.hash;
        const url = data.url || req.body.url || data.secure_url;

        const file = await repo.FileInfo.findOne({ token: hash });

        if (!file) {
            return res.status(400).json({ error: 'Arquivo nao encontrado.' });
        }
        
        console.log(data);
        file.size = data.bytes;
        file.status = "success";
       
        switch (data.resource_type) {
            case 'image':
                // Adicionado await para garantir que a foto salve antes da resposta terminar
                await repo.Photo.create({
                    userId: file.userId,
                    url: url,
                    postId: description,
                    description: 'foto uploadada pelo cdn'
                });
                break;
        }
        
        // Adicionado await para garantir que a alteração do status persista
        await file.save();
        return res.json({ success: true });

    } catch (error) {
        console.error("Erro em confirmPhoto:", error);
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
}

// Mantidas as outras funções intactas conforme seu código original

function getPrivateUrl(req, res) {
    const { token, acao, w, h } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'O token/publicId é obrigatório.' });
    }

    const publicIdCompleto = `avatars_usuarios/${token}`;

    const options = {
        sign_url: true,
        type: 'authenticated',
        secure: true,
        expires_at: Math.round(Date.now() / 1000) + 1200
    };

    let reglasTransformacao = {
        fetch_format: 'auto', 
        quality: 'auto'       
    };

    switch (acao) {
        case 'avatar_perfil':
            regrasTransformacao.width = w ? parseInt(w) : 300;
            regrasTransformacao.height = h ? parseInt(h) : 300;
            regrasTransformacao.crop = 'thumb';
            regrasTransformacao.gravity = 'face';
            break;

        case 'redimensionar':
            if (w) reglasTransformacao.width = parseInt(w);
            if (h) reglasTransformacao.height = parseInt(h);
            regrasTransformacao.crop = 'fill';
            break;

        case 'preto_e_branco':
            if (w) reglasTransformacao.width = parseInt(w);
            regrasTransformacao.crop = 'scale';
            regrasTransformacao.effect = 'grayscale';
            break;

        case 'arredondar':
            regrasTransformacao.width = w ? parseInt(w) : 150;
            regrasTransformacao.height = h ? parseInt(h) : 150;
            regrasTransformacao.crop = 'fill';
            regrasTransformacao.gravity = 'face';
            regrasTransformacao.radius = 'max';
            break;

        default:
            regrasTransformacao.crop = 'scale';
            if (w) reglasTransformacao.width = parseInt(w);
    }

    options.transformation = [regrasTransformacao];

    const secureUrl = cloudinary.url(publicIdCompleto, options);

    res.json({
        success: true,
        url: secureUrl
    });
}

function handleCloudinaryWebhook(req, res) {
    const { token } = req.query;

    if (!token || !global.activeUploadTokens || !global.activeUploadTokens[token]) {
        return res.status(400).json({ error: 'Token inválido.' });
    }

    const tokenData = global.activeUploadTokens[token];

    if (Date.now() > tokenData.expires) {
        delete global.activeUploadTokens[token];
        return res.status(403).json({ error: 'A URL de upload expirou.' });
    }

    if (tokenData.used) {
        return res.status(403).json({ error: 'URL já foi utilizada.' });
    }

    tokenData.used = true;
    delete global.activeUploadTokens[token];

    res.status(200).send('OK');
}

module.exports = {
    getSignature,
    handleCloudinaryWebhook,
    getPrivateUrl,
    setResult
};