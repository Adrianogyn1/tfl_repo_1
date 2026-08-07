const repo = require('../repository');

async function getProfile(req, res) {
    if (!global.CheckLogin(req, res)) return;
    const id = parseInt(req.params.id || req.params.targetId) || 0;
    const userId = parseInt(req.userId, 10) || req.userId;
    
    const lk = await repo.Like.findOne({ 
        where: { userId: userId, targetId: id } 
    });

    if (lk) {
        return res.status(201).json({ success: true });
    }

    const like = repo.Like.build({
        userId: userId,
        targetId: id
    });
    
    await like.save();
    return res.status(201).json({ success: true });
}

async function likeProfile(req, res) {
    if (!global.CheckLogin(req, res)) return;
    
    const id = parseInt(req.body.id || req.body.targetId || req.body.profileId, 10) || 0;
    const userId = parseInt(req.userId, 10) || req.userId;

    if (id === 0) {
        return res.status(400).json({ error: "ID não enviado no corpo da requisição", success: false });
    }
    
    const lk = await repo.Like.findOne({ 
        where: { userId: userId, targetId: id } 
    });
    
    if (lk) {
        await repo.Like.destroy({ where: { userId: userId, targetId: id } });
        return res.status(200).json({ success: true, action: "unliked" });
    } else {
        const like = repo.Like.build({
            userId: userId,
            targetId: id
        });
        
        global.req = req;
        try {
            await like.save();
        } finally {
            delete global.req;
        }
        return res.status(201).json({ success: true, action: "liked" });
    }
}

async function dislikeProfile(req, res) {
    if (!global.CheckLogin(req, res)) return;
    const id = parseInt(req.params.id) || 0;
    
    const profile = await repo.Profile.findOne({ 
        where: { id: id } 
    });
    
    return res.status(201).json({ success: true, data: profile });
}

module.exports = {
    getProfile,
    likeProfile,
    dislikeProfile
};