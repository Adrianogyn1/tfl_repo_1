const repo = require('../repository');

async function getComments(req, res) {
    const queryOrBody = req.query || req.body || {};

    const page = parseInt(queryOrBody.page || queryOrBody.p, 10) || 1;
    const limit = parseInt(queryOrBody.qtd || queryOrBody.Qtd, 10) || 10;
    const postId = queryOrBody.postId || queryOrBody.PostId || 1;

    const [all, allUsers] = await Promise.all([
        repo.Comment.findAll({ 
            where: { postId: postId }, 
            limit: limit, 
            offset: (page - 1) * limit 
        }),
        repo.User.findAll()
    ]);

    const populated = all.map(comment => {
        // Converte a instância do Sequelize em um objeto JS puro
        const commentPlain = comment.get({ plain: true });
        const commentUserId = commentPlain.userId || commentPlain.userid;
        const user = allUsers.find(u => u.id == commentUserId);

        return {
            ...commentPlain,
            userName: user ? user.userName || user.username : "Usuário Anônimo"
        };
    });

    const result = populated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ success: true, data: result });
}

async function deleteComment(req, res) {
    if (!global.CheckLogin(req, res)) return;

    const id = parseInt(
        req.params?.id ||
        req.body?.commentId ||
        req.body?.id ||
        req.query?.commentId ||
        req.body?.CommentId ||
        req.body?.commentid ||
        req.params?.CommentId, 10
    ) || 0;

    // Busca o comentário de forma assíncrona pelo ID primário
    const comment = await repo.Comment.findByPk(id);

    if (!comment) {
        return res.json({ success: false, message: "not found " + id, data: {} });
    }

    if ((comment.userId || comment.userid) != req.userId) {
        console.log(`Usuário ${req.userId} tentou apagar comentário de ${comment.userId || comment.userid}`);
        return res.status(403).json({ error: "Usuário não autorizado para apagar esse comentário." });
    }

    // Executa o destroy na instância encontrada
    await comment.destroy();

    return res.json({ success: true, id: comment.id, data: comment });
}

async function addComment(req, res, broadcastCallback) {
    if (!global.CheckLogin(req, res)) return;

    const postId = req.body.postId || req.body.PostId;
    const text = req.body.text || req.body.Text;
    const photoId = req.body.photoId || req.body.PhotoId;

    if (!text) {
        return res.status(400).json({ error: "O texto do comentário é obrigatório.", success: false, data: {} });
    }

    // Valida se a postagem realmente existe no banco de dados
    const post = await repo.Post.findByPk(postId);

    if (post) {
        // Cria e persiste o comentário de forma atômica
        const commentData = await repo.Comment.create({
            postId: post.id,
            userId: parseInt(req.userId, 10) || req.userId,
            text: text,
            photoId: photoId
        });

        return res.status(201).json({ success: true, data: commentData });
    }

    return res.status(404).json({ error: "Postagem não encontrada.", success: false, data: {} });
}

async function likeComment(req, res) {
    if (!global.CheckLogin(req, res)) return;
    const id = parseInt(req.body.id || req.body.commentId) || 0;
    
    const comment = await repo.Comment.findByPk(id);

    if (!comment) {
        return res.status(404).json({ error: "Comentário nao encontrado.", success: false, data: {} });
    }

    // Persiste o Like direto no banco
    await repo.Like.create({
        commentId: comment.id,
        userId: req.userId
    });

    return res.status(201).json({ success: true });
}

async function dislikeComment(req, res) {
    if (!global.CheckLogin(req, res)) return;
    const id = parseInt(req.body.id || req.body.commentId) || 0;
    
    const comment = await repo.Comment.findByPk(id);

    if (!comment) {
        return res.status(404).json({ error: "Comentário nao encontrado.", success: false, data: {} });
    }

    // Remove o vínculo de curtida usando a cláusula de busca condicional
    await repo.Like.destroy({ where: { commentId: comment.id, userId: req.userId } });    
    return res.status(201).json({ success: true });
}

module.exports = {
    getComments,
    deleteComment,
    addComment,
    likeComment,
    dislikeComment
};