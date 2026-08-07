/*
responsavel por gerenciar as fotos do servidor
loadGallery
    (req, res)    
    return as fotos do usuario
    *vamos usar o file.js para fazer o upload das fotos
addPhoto(req, res)
    (req, res)
    return se conseguiu adicionar a foto
addPhotoProfile(req, res)
    (req, res)
    return se conseguiu adicionar a foto

    //vamos deletar do servidor também, e se tiver na cdn vamos deletar de lá também
deletePhoto(req, res) 
    (req, res)
    return se conseguiu deletar a foto

post like
addLike(req, res)
    (req, res)
    return se conseguiu dar like

deleteLike(req, res)
    (req, res)
    return se conseguiu deletar o like

addComment(req, res)
    (req, res)
    return se conseguiu adicionar o comentario

deleteComment(req, res)
    (req, res)
    return se conseguiu deletar o comentario


*/

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const repo = require('../repository');
const cloudinary = require('cloudinary').v2;
const fileManager = require('./files');
const { Op } = require('sequelize');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

async function loadGallery(req, res) {
    if (!await global.CheckLogin(req, res)) return;
    delete global.req; global.req = req;
    
    const userId = req.userId; 

    const targetId = (req.query && req.query.targetid) || 
                     (req.body && (req.body.targetID || req.body.targetid)) || 
                     req.userId;

    const photos = await repo.Photo.findAll({
        where: { userId: targetId }
    });

    if (!photos || photos.length === 0) {
        console.log(`Usuário ${userId} não encontrou fotos de ${targetId}`);
        return res.json([{}]);
    }
   
    return res.json(photos);
}

async function addPhoto(req, res) {
    if (!await global.CheckLogin(req, res)) return;
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo de imagem enviado.' });

    try {
        const userId = req.userId;
        const { description, postId } = req.body;
        const hashInput = crypto.randomBytes(16).toString('hex');
        const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
        const folder = 'users/galeria';

        // Executa upload usando a engine do stream do Cloudinary configurada no file.js
        const result = await fileManager.streamToCloudinary(req.file.buffer, {
            folder: folder,
            resource_type: 'image'
        });

        // Garante a criação do FileInfo primeiro
        await repo.FileInfo.create({
            userId: userId,
            token: hashInput,
            type: 'image',
            folder: folder,
            status: 'success',
            size: result.bytes,
            url: result.secure_url,
            name: req.file.originalname || '',
            hash: fileHash,
            isCDN: true
        });

        const lastProfilePhoto = await repo.Photo.findOne({
            where: { userId: userId },
            order: [['createdAt', 'DESC']]
        });

        const photo = await repo.Photo.create({
            userId: userId,
            url: result.secure_url,
            postId: postId || null,
            description: description || '',
            isDefault: true
        });

        if (lastProfilePhoto) {
            lastProfilePhoto.isDefault = false;
            await lastProfilePhoto.save();
        }

        return res.json({ success: true, data: photo });
    } catch (error) {
        console.error('Erro ao adicionar foto:', error);
        return res.status(500).json({ error: 'Erro interno ao adicionar foto.' });
    }//
}

async function addPhotoProfile(req, res) {
   
    console.log('addPhotoProfile');
    if (!await global.CheckLogin(req, res)) return;
   
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo de imagem enviado.' });

    try {
        const userId = req.userId;
        const hashInput = crypto.randomBytes(16).toString('hex');
        const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
        const folder = 'users/galeria';

        const result = await fileManager.streamToCloudinary(req.file.buffer, {
            folder: folder,
            resource_type: 'image'
        });

        await repo.FileInfo.create({
            userId: userId,
            token: hashInput,
            type: 'image',
            folder: folder,
            status: 'success',
            size: result.bytes,
            url: result.secure_url,
            name: req.file.originalname || '',
            hash: fileHash,
            isCDN: true
        });

        const photo = await repo.Photo.create({
            userId: userId,
            url: result.secure_url,
            description: 'Foto de Perfil',
            isDefault: true,
            isCDN: true
        });

        return res.json({ success: true, data: photo });
    } catch (error) {
        console.error('Erro ao adicionar foto de perfil:', error);
        return res.status(500).json({ error: 'Erro interno ao adicionar foto de perfil.' });
    }
}

async function deletePhoto(req, res, broadcastCallback) {
    if (!await global.CheckLogin(req, res)) return;
    const id = req.params.id;
    
    try {
        const photo = await repo.Photo.findByPk(id);
        if (!photo) return res.status(404).json({ error: 'Foto não encontrada.' });

        if (photo.userId !== req.userId) {
            return res.status(403).json({ error: 'Não autorizado a deletar esta foto.' });
        }

        if (photo.url) {
            const armazenadoNaCDN = photo.isCDN || photo.url.includes('.cloudinary.com');

            if (armazenadoNaCDN) {
                const urlParts = photo.url.split('/');
                const uploadIndex = urlParts.indexOf('upload');
                if (uploadIndex !== -1) {
                    const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
                    const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.')) || publicIdWithExt;
                    
                    console.log(`Deletando da CDN Cloudinary public_id: ${publicId}`);
                    await cloudinary.uploader.destroy(publicId);
                }
            } else {
                const filename = photo.url.split('/').pop();
                const fullPath = path.join(UPLOAD_DIR, filename);
                
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            }
        }

        await photo.destroy();

        if (typeof broadcastCallback === 'function') {
            broadcastCallback('photo_deleted', { id });
        }

        return res.json({ success: true, id });
    } catch (error) {
        console.error('Erro ao deletar foto:', error);
        return res.status(500).json({ error: 'Erro interno ao deletar foto.' });
    }
}

async function addLike(req, res) {
    if (!await global.CheckLogin(req, res)) return;
    try {
        const { postId, photoId } = req.body;

        const like = await repo.Like.create({
            userId: req.userId,
            photoId: photoId || null,
            postId: postId || null
        });

        return res.json({ success: true, data: like });
    } catch (error) {
        console.error('Erro ao adicionar like:', error);
        return res.status(500).json({ error: 'Erro interno ao processar like.' });
    }
}

async function deleteLike(req, res) {
    if (!await global.CheckLogin(req, res)) return;
    try {
        const { photoId, postId } = req.body;
        
        const whereClause = { userId: req.userId };
        if (photoId) whereClause.photoId = photoId;
        if (postId) whereClause.postId = postId;

        const deleted = await repo.Like.destroy({ where: whereClause });
        return res.json({ success: deleted > 0 });
    } catch (error) {
        console.error('Erro ao remover like:', error);
        return res.status(500).json({ error: 'Erro interno ao remover like.' });
    }
}

async function addComment(req, res) {
    if (!await global.CheckLogin(req, res)) return;
    try {
        const { photoId, postId, text } = req.body;
        if (!text) return res.status(400).json({ error: 'Texto do comentário é obrigatório.' });

        const comment = await repo.Comment.create({
            userId: req.userId,
            photoId: photoId || null,
            postId: postId || null,
            text: text
        });

        return res.json({ success: true, data: comment });
    } catch (error) {
        console.error('Erro ao adicionar comentário:', error);
        return res.status(500).json({ error: 'Erro interno ao adicionar comentário.' });
    }
}

async function deleteComment(req, res) {
    if (!await global.CheckLogin(req, res)) return;
    try {
        const { id } = req.params;
        const comment = await repo.Comment.findByPk(id);
        
        if (!comment) return res.status(404).json({ error: 'Comentário não encontrado.' });
        if (comment.userId !== req.userId) return res.status(403).json({ error: 'Não autorizado.' });

        await comment.destroy();
        return res.json({ success: true, id });
    } catch (error) {
        console.error('Erro ao deletar comentário:', error);
        return res.status(500).json({ error: 'Erro interno ao deletar comentário.' });
    }
}

module.exports = { 
    loadGallery, 
    addPhoto,
    addPhotoProfile,
    deletePhoto,
    addLike,
    deleteLike,
    addComment,
    deleteComment
};