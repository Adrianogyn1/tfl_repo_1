const { where } = require('../Models/ModelBase');
const repo = require('../repository');


function seachUsers(req, res) {
   const query = (req.query.q || '').toLowerCase();
       const result = repo.User.query(u => 
           u.Username.toLowerCase().includes(query) || u.login.toLowerCase().includes(query)
       );
       res.json(result);
}

function loadProfile(req, res) {

    let targetId = req.params.id || req.body.id || req.body.userid || req.body.UserID || req.body.UserID || '';
   // console.log(`Usuário ${req.userId} está pedindo o perfil de ${targetId}`);

    const userProfile = repo.User.where(u => u.id == targetId)[0];//não pode ser identico por causa dos tipos u.u
    
    if (userProfile) {
       // console.log(`Usuário ${req.userId} carregou o perfil de ${userProfile}`);
        return res.json(userProfile);
    } else {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }
}

function updateProfile(req, res) {
    
    const response = { success: false, error: 'Not implemented' };
    return res.json(response);
}

function addFriend(req, res, sendPacketToUserCallback) {
    const targetId = req.body.targetId || req.body.id;
    const userId = req.userId;
    const fr = repo.Friend.where(f => f.userid === userId && f.targetid === targetId)[0];
    if(fr) return res.json({ success: true, id: targetId });
    const friend = repo.Friend.build({
        userid: userId,
        targetid: targetId,
        status: "Pending"
    });
    friend.save();
    return res.json({ success: true, id: targetId, data: friend });
}

function acceptFriend(req, res) {
    const targetId = req.body.targetId || req.body.id;
    const userId = req.userId;
    const fr = repo.Friend.where(f => f.userid === userId && f.targetid === targetId)[0];
    if(!fr) return res.json({ success: true, id: targetId });
    fr.status = "Accepted";
    fr.save();
    return res.json({ success: true, id: targetId });
}

function removeFriend(req, res) {
       const targetId = req.body.targetId || req.body.id;
    const userId = req.userId;
    const fr = repo.Friend.where(f => f.userid === userId && f.targetid === targetId)[0];
    if(!fr) return res.json({ success: true, id: targetId });
    repo.Friend.destroy({ where: { userid: userId, targetid: targetId } });
    return res.json({ success: true, id: targetId });
}

function getFriends(req, res) {
    const targetId = req.body.targetId || req.body.id;
    const id = parseInt(targetId, 10) || req.userId;
    const friends = repo.Friend.where(f => f.userid === id || f.targetid === id && f.status === "Accepted");
    return res.json(friends);
}

function follow(req, res) {
    const targetUserId = req.body.targetId || req.body.id;
    const user = repo.User.where(u => u.id === req.userId)[0];
    const fl  = repo.Follow.where(f => f.userId === user.id && f.targetId === targetUserId)[0];

    if(!user) return res.status(404).json({ error: 'User not found', success: false });
    if(fl) return res.json({ success: true, id: targetUserId });

    const fallow = repo.Follow.build({
        userId: user.id,
        targetId: targetUserId
    });
    fallow.save();
    return res.json({ success: true, id: targetUserId, data: fallow });
    
}

function unfollow(req, res) {
    const targetUserId = req.body.targetId || req.body.id;
    const user = repo.User.where(u => u.id === req.userId)[0];
    const fl  = repo.Follow.where(f => f.userId === user.id && f.targetId === targetUserId)[0];
    if(!user) return res.status(404).json({ error: 'User not found', success: false });
    if(!fl) return res.json({ success: true, id: targetUserId });
    repo.Follow.destroy({ where: { userId: user.id, targetId: targetUserId } });
    return res.json({ success: true, id: targetUserId });
}



function ignore(req, res) {
    const targetUserId = req.body.targeId || req.body.targetuserid;
    const userId = req.userId;
    const ig = repo.Ignore.where(i => i.userId === userId && i.targetId === targetUserId)[0];
    if(ig) return res.json({ success: true, id: targetUserId });
    const ignore = repo.Ignore.build({
        userId: userId,
        targetId: targetUserId
    });
    ignore.save();  
    console.log(`Usuário ${req.userId} designorou o usuário ${targetUserId}`);

    return res.json({ success: true, id: targetUserId, data: ignore });
}

function unignore(req, res) {
    const targetUserId = req.body.targeId || req.body.targetuserid;
    const userId = req.userId;
    const ig = repo.Ignore.where(i => i.userId === userId && i.targetId === targetUserId)[0];
    if(!ig) return res.json({ success: true, id: targetUserId });
    repo.Ignore.destroy({ where: { userId: userId, targetId: targetUserId } });
    return res.json({ success: true, id: targetUserId });
}

//

module.exports = {
    seachUsers,
    loadProfile,
    updateProfile,
    addFriend,
    removeFriend,
    getFriends,
    follow,
    unfollow,
    ignore,
    unignore
};