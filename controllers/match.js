const repo = require('../repository');

async function loadCandidates(req, res) {
    // Retorna a lista de candidatos disponíveis direto do banco
    const all = await repo.MatchProfile.findAll();
    return res.json(all);
}

async function like(req, res, sendPacketToUserCallback) {
    const { TargetUserId } = req.body;
    
    // Busca os dados completos do usuário que recebeu o like no banco de dados
    const targetUser = await repo.User.findByPk(TargetUserId);
    
    if (targetUser) {
        // Cria o registro no banco de dados usando o Sequelize
        const newMatch = await repo.MatchProfile.create({
            // Se o seu modelo MatchProfile usar campos com snake_case ou camelCase, ajuste aqui:
            userId: req.userId,
            targetUserId: TargetUserId,
            status: 'liked'
        });
        
        // Notifica o usuário em tempo real via WebSocket que houve um novo match
        if (typeof sendPacketToUserCallback === 'function') {
            sendPacketToUserCallback(req.userId, 'new_match', {
                MatchId: newMatch.id,
                User: targetUser
            });
        }
    }
    
    return res.json({ success: true });
}

function pass(req, res) {
    const { TargetUserId } = req.body;
    console.log(`Usuário ${req.userId} passou o candidato ${TargetUserId}`);
    return res.json({ success: true });
}

async function createMatch(userA, userB) {
    // Método auxiliar interno adaptado para persistência direta via Sequelize
    const newMatch = await repo.MatchProfile.create({
        userId: userA,
        targetUserId: userB,
        status: 'matched'
    });
    
    return newMatch;
}

async function loadMatches(req, res) {
    // Retorna a lista de matches consolidados do usuário ativo do banco de dados
    const matches = await repo.MatchProfile.findAll({
        where: {
            userId: req.userId,
            status: 'matched'
        }
    });
    return res.json(matches);
}

module.exports = {
    loadCandidates,
    like,
    pass,
    createMatch,
    loadMatches
};