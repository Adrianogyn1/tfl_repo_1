/*
responsavel por gerenciar os arquivos do servidor
ele retorna nas funcoes 
-uploadDirectToCDN
   recebe o buffer do arquivo, a pasta a ser salva e o id do usuario
   return se conseguiu retorna o id do arquivo no banco
-upload 
   recebe o buffer do arquivo, a pasta a ser salva e o id do usuario
   return se conseguiu retorna o id do arquivo no banco
   ele vai gerar o nome aleatorio seguindo o uid_(guid)_extensao

*/

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const repo = require('../repository');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'uploads');

const SERVER_URL = `${process.env.SERVER_URL || 'http://localhost'}:${process.env.PORT || 5000}`;

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

const multer = require('multer');
const multerMiddleware = multer({ storage: multer.memoryStorage() });

// Auxiliar para centralizar o upload em stream para o Cloudinary
function streamToCloudinary(buffer, options) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
        uploadStream.end(buffer);
    });
}

async function uploadDirectToCDN(req, res) {
    if (!await global.CheckLogin(req, res)) return;
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

    try {
        const userId = req.userId;
        const hashInput = crypto.randomBytes(16).toString('hex');
        const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

        // Define a pasta caso não venha explicitamente na requisição
        let folder = req.body.folder;
        if (!folder) {
            folder = 'tfl/files';
            if (req.file.mimetype.startsWith('image/')) folder = 'tfl/image';
            if (req.file.mimetype.startsWith('audio/')) folder = 'tfl/audio';
            if (req.file.mimetype.startsWith('video/')) folder = 'tfl/video';
        }

        const result = await streamToCloudinary(req.file.buffer, {
            folder: folder,
            resource_type: 'auto'
        });

        const fileInfo = await repo.FileInfo.create({
            userId: userId,
            token: hashInput,
            type: result.resource_type,
            folder: folder,
            status: 'success',
            size: result.bytes,
            url: result.secure_url,
            name: req.file.originalname || '',
            hash: fileHash,
            isCDN: true
        });

        return res.json({
            success: true,
            id: fileInfo.id,
            url: result.secure_url,
            token: hashInput
        });

    } catch (err) {
        console.error('Erro no uploadDirectToCDN:', err);
        return res.status(500).json({ error: 'Falha no processamento ou envio do arquivo para a CDN.' });
    }
}

async function uploadLocal(req, res) {
    if (!await global.CheckLogin(req, res)) return;
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

    try {
        const userId = req.userId;
        const guid = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(req.file.originalname) || '.dat';
        const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
        
        const filename = `uid_${guid}${ext}`;
        const fullPath = path.join(UPLOAD_DIR, filename);

        fs.writeFileSync(fullPath, req.file.buffer);

        const fileUrl = `${SERVER_URL}/files/${filename}`;
        
        let fileType = 'file';
        if (req.file.mimetype.startsWith('image/')) fileType = 'image';
        if (req.file.mimetype.startsWith('audio/')) fileType = 'audio';
        if (req.file.mimetype.startsWith('video/')) fileType = 'video';

        const fileInfo = await repo.FileInfo.create({
            userId: userId,
            token: guid,
            type: fileType,
            folder: req.body.folder || 'uploads',
            status: 'success',
            size: req.file.size,
            url: fileUrl,
            name: filename,
            hash: fileHash,
            isCDN: false
        });

        return res.json({
            success: true,
            id: fileInfo.id,
            url: fileUrl
        });

    } catch (err) {
        console.error('Erro no uploadLocal:', err);
        return res.status(500).json({ error: 'Erro interno ao salvar arquivo localmente.' });
    }
}

function uploadFile(req, res, broadcastCallback) {
    const { bytes, type } = req.body;
    if (!bytes) return res.status(400).json({ error: "Nenhum dado de arquivo enviado." });

    let ext = 'jpg';
    if (type === 'audio') ext = 'mp3';
    if (type === 'file') ext = 'dat';

    const filename = `file_${Date.now()}.${ext}`;
    const fullPath = path.join(UPLOAD_DIR, filename);

    try {
        fs.writeFileSync(fullPath, Buffer.from(bytes, 'base64'));

        const fileUrl = `${SERVER_URL}/files/${filename}`;
        const fileData = { FileId: "f_" + Date.now(), Url: fileUrl, Name: filename };

        if (type === 'image' || !type) {
            const newPhoto = { 
                Id: "ph_" + Date.now(), 
                Url: fileUrl, 
                Description: "Uploaded Photo" 
            };
            
            const photos = repo.getPhotos();
            photos.push(newPhoto);
            repo.savePhotos(photos);
            
            if (typeof broadcastCallback === 'function') {
                broadcastCallback('photo_uploaded', newPhoto);
            }
        }

        return res.json(fileData);
    } catch (err) {
        console.error('Erro ao salvar arquivo via HTTP:', err);
        return res.status(500).json({ error: 'Falha interna ao salvar arquivo.' });
    }
}

function sendFile(req, res, sendPacketToUserCallback, broadcastCallback) {
    const { FileId, ReceiverId, RoomId } = req.body;
    if (!FileId) return res.status(400).json({ error: "O identificador FileId é obrigatório." });

    const filePayload = {
        Id: "msg_file_" + Date.now(),
        SenderId: req.userId,
        ReceiverId: ReceiverId || null,
        RoomId: RoomId || "global",
        FileId: FileId,
        Timestamp: new Date().toISOString()
    };

    if (ReceiverId) {
        if (typeof sendPacketToUserCallback === 'function') {
            sendPacketToUserCallback(ReceiverId, 'file_received', filePayload);
            sendPacketToUserCallback(req.userId, 'file_received', filePayload);
        }
    } else {
        if (typeof broadcastCallback === 'function') {
            broadcastCallback('file_received', filePayload);
        }
    }

    return res.json({ success: true, message: filePayload });
}

module.exports = { 
    uploadFile, 
    sendFile, 
    uploadDirectToCDN, 
    upload: uploadLocal, 
    multer: multerMiddleware,
    streamToCloudinary // Exportado para reuso interno direto no photos.js
};