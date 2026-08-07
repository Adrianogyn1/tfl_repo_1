const repo = require('../repository');
const { Op } = require('sequelize');
const { PostDto, CommentDto, LikeDto, PhotoDto } = require('../Models/dto/postDto');




async function loadFeed(req, res) {
    //fala comentario sobre comentarioss
    try {
        const userId = parseInt(req.userId, 10) || req.userId;
        const limit = parseInt(req.query?.qtd || req.body?.qtd, 10) || 10;
        const page = parseInt(req.query?.page || req.body?.page, 10) || 1;
        
        // Variáveis de limite por sub-item
        const maxComentsLoad = 10;
        const maxLikesLoad = 5;

        // Contagem global para paginação dos Posts do feed
        const totalPosts = await repo.Post.count();
        const globalPageCount = Math.ceil(totalPosts / limit) || 1;

        // 1. Busca apenas os posts da paginação atual
        const postsModels = await repo.Post.findAll({
            limit: limit,
            offset: (page - 1) * limit,
            order: [['createdAt', 'DESC']]
        });

        const posts = postsModels.map(p => p.get({ plain: true }));
        if (posts.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const postIds = posts.map(p => p.id);

        // 2. CONTAGEM DIRETO NO BANCO POR POST (Likes e Comentários)
        const [postLikesCount, postCommentsCount] = await Promise.all([
            repo.Like.findAll({
                attributes: ['postId', [repo.sequelize.fn('COUNT', repo.sequelize.col('id')), 'total']],
                where: { postId: { [Op.in]: postIds } },
                group: ['postId'],
                raw: true
            }),
            repo.Comment.findAll({
                attributes: ['postId', [repo.sequelize.fn('COUNT', repo.sequelize.col('id')), 'total']],
                where: { postId: { [Op.in]: postIds } },
                group: ['postId'],
                raw: true
            })
        ]);

        const totalLikesMap = new Map(postLikesCount.map(l => [String(l.postId), l.total]));
        const totalCommentsMap = new Map(postCommentsCount.map(c => [String(c.postId), c.total]));

        // 3. BUSCA LIMITADA DE COMENTÁRIOS POR POST
        const commentsPromises = postIds.map(postId => 
            repo.Comment.findAll({
                where: { postId },
                limit: maxComentsLoad,
                order: [['createdAt', 'ASC']],
                raw: true
            })
        );
        const commentsNested = await Promise.all(commentsPromises);
        const comments = commentsNested.flat();
        const commentIds = comments.map(c => c.id);

        // Contagem de likes dos comentários direto no banco
        const commentLikesCount = commentIds.length > 0 ? await repo.Like.findAll({
            attributes: ['commentId', [repo.sequelize.fn('COUNT', repo.sequelize.col('id')), 'total']],
            where: { commentId: { [Op.in]: commentIds } },
            group: ['commentId'],
            raw: true
        }) : [];
        const totalCommentLikesMap = new Map(commentLikesCount.map(l => [String(l.commentId), l.total]));

        // 4. BUSCA LIMITADA DE LIKES (Posts e Comentários)
        const likesPromises = [
            ...postIds.map(postId => repo.Like.findAll({ where: { postId }, limit: maxLikesLoad, raw: true })),
            ...commentIds.map(commentId => repo.Like.findAll({ where: { commentId }, limit: maxLikesLoad, raw: true }))
        ];
        const likesNested = await Promise.all(likesPromises);
        const likes = likesNested.flat();

        // Mapeamento de usuários e fotos de perfil
        const authorIds = posts.map(p => p.userId || p.userid);
        const commentAuthorIds = comments.map(c => c.userId || c.userid);
        const likeUserIds = likes.map(l => l.userId || l.userid);
        const allUserIds = [...new Set([...authorIds, ...commentAuthorIds, ...likeUserIds])];

        const [usersModels, photosModels] = await Promise.all([
            repo.User.findAll({ 
                where: { id: { [Op.in]: allUserIds } },
                attributes: ['id', 'userName', 'username', 'login'],
                raw: true
            }),
            repo.Photo.findAll({
                where: { userId: { [Op.in]: allUserIds }, isDefault: true },
                raw: true
            })
        ]);
        
        const userMap = new Map(usersModels.map(u => [String(u.id), u.userName || u.username || u.login]));
        const photoMap = new Map(photosModels.map(p => [String(p.userId), p.url]));

        // 5. MONTAGEM DO FEED COM PAGINAÇÃO INDIVIDUALIZADA
        const feed = posts.map(post => {
            const pId = post.id;
            const pUserId = post.userId || post.userid;
            
            const totalLikesPost = totalLikesMap.get(String(pId)) || 0;
            const totalCommentsPost = totalCommentsMap.get(String(pId)) || 0;

            // Curtidas do Post paginadas
            const postLikes = likes
                .filter(l => l.postId == pId)
                .map(l => {
                    const lUserId = l.userId || l.userid;
                    return LikeDto.fromObject({
                        ...l,
                        userId: lUserId,
                        userName: userMap.get(String(lUserId)) || " ",
                        thumbnail: photoMap.get(String(lUserId)) || '',
                        isMine: lUserId == userId,
                        liked: lUserId == userId
                    });
                });

            // Comentários do Post paginados
            const postComments = comments
                .filter(c => c.postId == pId)
                .map(c => {
                    const cId = c.id;
                    const cUserId = c.userId || c.userid;
                    const totalLikesComment = totalCommentLikesMap.get(String(cId)) || 0;

                    // Curtidas deste Comentário paginadas
                    const commentLikes = likes
                        .filter(l => l.commentId == cId)
                        .map(l => {
                            const lUserId = l.userId || l.userid;
                            return LikeDto.fromObject({
                                ...l,
                                userId: lUserId,
                                userName: userMap.get(String(lUserId)) || " ",
                                thumbnail: photoMap.get(String(lUserId)) || '',
                                isMine: lUserId == userId
                            });
                        });

                    return CommentDto.fromObject({
                        ...c,
                        userId: cUserId,
                        userName: userMap.get(String(cUserId)) || " ",
                        thumbnail: photoMap.get(String(cUserId)) || '',
                        isMine: cUserId == userId,
                        likesCount: totalLikesComment,
                        likes: commentLikes,
                        liked: userId && commentLikes.some(l => l.userId == userId)
                    });
                });

            const postPhotos = photosModels
                .filter(p => p.postId == pId || p.postid == pId)
                .map(p => {
                    const val = new PhotoDto();
                    val.url = p.url;
                    val.userId = p.userId;
                    val.userName = userMap.get(String(p.userId)) || " ";
                    val.thumbnail = photoMap.get(String(p.userId)) || '';
                    val.isMine = p.userId == userId;
                    val.createdAt = p.createdAt;
                    val.updatedAt = p.updatedAt;
                    val.liked = false;
                    val.isDefault = p.isDefault;
                    val.likesCount = 0;
                    val.likes = [];
                    return val;
                });
            
            

            // Post Principal com a paginação global do feed
            return PostDto.fromObject({
                ...post,
                userId: pUserId,
                userName: userMap.get(String(pUserId)) || " ",
                thumbnail: photoMap.get(String(pUserId)) || '',
                isMine: pUserId == userId,
                likesCount: totalLikesPost,
                likes: postLikes,
                liked: userId && postLikes.some(l => l.userId == userId),
                commentsCount: totalCommentsPost,
                comments: postComments,
                photos: postPhotos,
                itemsPerPage: limit,
                pageCount: globalPageCount
            });
        });

        return res.json({ success: true, data: feed });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: "Erro interno ao carregar o feed" });
    }
}










async function likePost(req, res) {
    if (!global.CheckLogin(req, res)) return;
    delete global.req; global.req = req;

    const user = await repo.User.findByPk(req.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found', success: false });
    }

    const id = parseInt(req.body.id || req.body.postId) || 0;

    const post = await repo.Post.findByPk(id);
    if (!post)
        return res.status(404).json({ error: 'Post not found', success: false });

    const like = await repo.Like.create({
        postId: post.id,
        userId: user.id
    });

    return res.status(201).json({ success: true, toggle: "liked", data: like });
}

async function dislikePost(req, res) {
    if (!global.CheckLogin(req, res)) return;

    const user = await repo.User.findByPk(req.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found', success: false });
    }

    const id = parseInt(req.body.id || req.body.postId) || 0;

    const post = await repo.Post.findByPk(id);
    if (!post)
        return res.status(404).json({ error: 'Post not found', success: false });

    await repo.Like.destroy({ where: { postId: post.id, userId: user.id } });
    return res.status(201).json({ success: true, toggle: "liked", data: {} });
}

  const galeryController = require('./gallery');
async function createPost(req, res, broadcastCallback) {
    if (!global.CheckLogin(req, res)) return;

    const title = req.body.title || req.body.Title || "";
    const text = req.body.text || req.body.Text || "";
    const userId = parseInt(req.userId, 10) || req.userId;
  
 

    const newPost = await repo.Post.create({
        userId: userId,
        title: title,
        text: text
    });
    req.body.postId = newPost.id;
    req.body.data = newPost;
    var photo = await galeryController.addPhoto(req, res);

    if (typeof broadcastCallback === 'function') {
        broadcastCallback('post_created', newPost);
    }

    return res.status(201).json({ success: true, data: newPost });
}

async function deletePost(req, res) {
    if (!global.CheckLogin(req, res)) return;

    const id = parseInt(
        req.params?.id ||
        req.body?.id ||
        req.query?.id ||
        req.body?.postId ||
        req.query?.postId ||
        req.body?.PostId ||
        req.query?.PostId ||
        req.params?.PostId, 10
    ) || 0;

    const post = await repo.Post.findByPk(id);
    const user = await repo.User.findByPk(req.userId);

    if (!post) {
        return res.status(404).json({ error: "Postagem não encontrada.", success: false, data: {} });
    }

    if (!user || (post.userId || post.userid) != user.id) {
        console.log(`Usuário ${user?.id || req.userId} tentou apagar post de ${post?.userId || post?.userid}`);
        return res.status(401).json({ error: "Usuário não autorizado.", success: false, data: {} });
    }

    await repo.Comment.destroy({ where: { postId: post.id } });
    await repo.Photo.destroy({ where: { postId: post.id } });
    await post.destroy();

    console.log(`Usuário ${user?.id || req.userId} apagou post de ${post?.userId || post?.userid}`);

    return res.json({ success: true, id: post.id });
}

module.exports = {
    createPost,
    deletePost,
    loadFeed,
    likePost,
    dislikePost
};