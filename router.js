const express = require('express');
const router = express.Router();
const path = require('path');

const {repo} = require('./repository.js');

const authController = require('./controllers/auth');
const postsController = require('./controllers/posts');
const galleryController = require('./controllers/gallery');
const matchController = require('./controllers/match');
const socialController = require('./controllers/social');
const filesController = require('./controllers/files');
const chatController = require('./controllers/chat.js');
const cdnController = require('./controllers/cdn');
const userController = require('./controllers/user');
const comentsController = require('./controllers/coments');
const profileController = require('./controllers/profile');


//
/* =====================================================
   Páginas Base e CDN
===================================================== */
router.get('/', (req, res) => res.sendFile(path.join(__dirname, './paginas/index.html')));
router.get('/api/place', (req, res) => placeholdersController.seedDatabase);

router.get('/api', (req, res) => res.json({ hello: 'world' }));
router.get('/api/cdn', (req, res) => res.sendFile(path.join(__dirname, './paginas/cdn/index.html')));

/* =====================================================
   Autenticação
===================================================== */
router.post('/api/auth/signin', (req, res) => authController.sigin(req, res));
router.post('/api/auth/signup', (req, res) => authController.signup(req, res));
router.post('/api/auth/forgot', (req, res) => authController.forgot(req, res));

/* =====================================================
   Usuários e Perfis
===================================================== */
router.get('/api/users', (req, res) => userController.getUsers(req, res));
router.get('/api/user/:id', (req, res) => userController.getUser(req, res));
router.get('/api/users/search', (req, res) => socialController.searchUsers(req, res));
router.get('/api/profile/:id', (req, res) => socialController.loadProfile(req, res));
router.put('/api/profile', (req, res) => socialController.updateProfile(req, res));

/* =====================================================
   Social, Feed e Follow
===================================================== */
router.get('/api/feed', (req, res) => postsController.loadFeed(req, res));
router.post(['/api/feed', "/api/gallery/upload"], filesController.multer.single('file'), (req, res) => postsController.createPost(req, res));
router.delete('/api/feed', (req, res) => postsController.deletePost(req, res));

router.get('/api/social/', (req, res) => socialController.loadProfile(req, res));

router.post('/api/social/follow', (req, res) => socialController.follow(req, res));
router.delete('/api/social/follow', (req, res) => socialController.unfollow(req, res));
router.post('/api/social/unfollow', (req, res) => socialController.unfollow(req, res));

/* =====================================================
   Amigos (Friends)
===================================================== */
router.post('/api/friend/add', (req, res) => socialController.addFriend(req, res));
router.post('/api/friend/remove', (req, res) => socialController.removeFriend(req, res));
router.post('/api/friend/accept', (req, res) => socialController.acceptFriend(req, res));
router.get('/api/friend/friends', (req, res) => socialController.getFriends(req, res));
router.post('/api/friend/ignore', (req, res) => socialController.ignore(req, res));
router.delete('/api/friend/unignore', (req, res) => socialController.unignore(req, res));

/* =====================================================
   Comentários
===================================================== */
router.post('/api/comment/feed', (req, res) => comentsController.addComment(req, res));
router.get('/api/comment/feed', (req, res) => comentsController.getComments(req, res));
router.delete('/api/comment/feed', (req, res) => comentsController.deleteComment(req, res));

router.post('/api/gallery/comment', (req, res) => galleryController.addComment(req, res));
router.delete('/api/gallery/comment', (req, res) => galleryController.deleteComment(req, res));

/* =====================================================
   Galeria
===================================================== */
router.get('/api/gallery', (req, res) => galleryController.loadGallery(req, res));
router.delete('/api/gallery/:id', (req, res) => galleryController.deletePhoto);
router.post('/api/gallery', filesController.multer.single('file'), (req, res) => galleryController.addPhotoProfile(req, res));

router.post(['/api/gallery/profile', '/api/profile/upload', '/api/cdn/upload'], filesController.multer.single('file'), (req, res) => {
    return galleryController.addPhotoProfile(req, res);
});

/* =====================================================
   Likes (Feed, Comentários, Galeria, Perfil)
===================================================== */
router.post('/api/feed/like', (req, res) => postsController.likePost(req, res));
router.delete('/api/feed/like', (req, res) => postsController.dislikePost(req, res));

router.post('/api/comment/like', (req, res) => comentsController.likeComment(req, res));
router.delete('/api/comment/like', (req, res) => comentsController.dislikeComment(req, res));

router.post('/api/gallery/comment/like', (req, res) => galleryController.likeComment(req, res));
router.delete('/api/gallery/comment/like', (req, res) => galleryController.dislikeComment(req, res));
router.delete('/api/gallery/like', (req, res) => galleryController.deleteLike(req, res));
router.post('/api/gallery/like', filesController.multer.single('file'), (req, res) => galleryController.addPhoto(req, res));

router.post('/api/profile/like', (req, res) => profileController.likeProfile);
router.delete('/api/profile/like', (req, res) => profileController.dislikeProfile);

/* =====================================================
   Matchmaking
===================================================== */
router.get('/api/match/candidates', (req, res) => matchController.loadCandidates(req, res));
router.get('/api/match/matches', (req, res) => matchController.loadMatches(req, res));
router.post('/api/match/', (req, res) => matchController.createMatch(req, res));
router.post('/api/match/pass', (req, res) => socialController.pass(req, res));

router.post('/api/match/like', (req, res) => matchController.like(req, res, req.app.get('sendPacketToUser')()));
router.post('/api/match/like', (req, res) => socialController.like(req, res));

/* =====================================================
   Chat
===================================================== */
router.post('/api/chat/message', (req, res) => chatController.routeApi(req, res, req.app.get('clients')()));
router.get('/api/chat/history', (req, res) => chatController.routeApi(req, res, req.app.get('clients')()));
router.post('/api/chat/typing', (req, res) => chatController.routeApi(req, res, req.app.get('clients')()));

/* =====================================================
   Arquivos e Mídia
===================================================== */
router.get('/api/download', (req, res) => filesController.sendFile(req, res));
router.post('/api/upload', (req, res) => filesController.uploadFile(req, res, req.app.get('broadcast')()));



module.exports = router;