const { RAW } = require('sequelize/lib/query-types');
const repo = require('../repository');

async function getUsers(req, res) {
    const qtd = req?.query?.qtd || req?.body?.qtd;
    const page = req?.query?.page || req?.body?.page;
    
    const limit = parseInt(qtd, 10) || 100;
    const currentPage = parseInt(page, 10) || 1;
    
    // O offset define quantos registros pular (antigo startIndex)
    const offset = (currentPage - 1) * limit;
    
    // Busca direto no banco aplicando o limite e paginação nativos
    const paginatedUsers = await repo.User.findAll({
        limit: limit,
        offset: offset,
        raw: true
    });
    const allId = paginatedUsers.map(u => u.id);
    const allPhotos = await repo.Photo.findAll({ where: { userId: allId }, raw: true });
    
    const final = paginatedUsers.map(user => {
        const userPhotos = allPhotos.filter(p => p.userId === user.id);
        return { ...user, photo: userPhotos[0]?.url || '' };
    });

    // Retorna 'final' em vez de 'paginatedUsers' para incluir as fotos
    return res.json({ success: true, data: final });
}

async function getUser(req, res) {
    const userId = parseInt(req?.params?.id, 10);
    
    // Busca pela chave primária (ID) de forma direta
    const user = await repo.User.findByPk(userId);
    
    return res.json({ success: true, data: user });
}

module.exports = {
    getUsers,
    getUser
};