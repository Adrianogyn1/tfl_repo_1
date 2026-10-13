const router = require("express").Router();
const profileController = require("../../../controllers/profile/profile_controller");
const chatController = require("../../../controllers/social/chat_controller");

/**
 * Roteador /api/v1/social (Unificado Web + Godot Engine)
 * Mapeia todas as rotas sociais, de amigos e de chat global/DM para os controladores centrais:
 * - GET  /api/v1/social/overview
 * - GET  /api/v1/social/feed
 * - POST /api/v1/social/posts
 * - POST /api/v1/social/posts/:id/share
 * - POST /api/v1/social/posts/:id/delete
 * - POST /api/v1/social/react
 * - POST /api/v1/social/comment
 * - POST /api/v1/social/comments/:id/delete
 * - GET  /api/v1/social/gallery
 * - POST /api/v1/social/gallery
 * - GET  /api/v1/social/photos/:photoId
 * - POST /api/v1/social/photos/:photoId/delete
 * - GET  /api/v1/social/reels
 * - POST /api/v1/social/reels
 * - POST /api/v1/social/reels/:id/delete
 * - POST /api/v1/social/follow
 * - POST /api/v1/social/match
 * - GET  /api/v1/social/avatar/:targetId
 * - GET  /api/v1/social/friends/list
 * - GET  /api/v1/social/friends/search
 * - POST /api/v1/social/friends/request
 * - POST /api/v1/social/friends/accept
 * - POST /api/v1/social/friends/remove
 * - GET  /api/v1/social/chats (Chat Global, DMs e Grupos)
 * - POST /api/v1/social/chats/:uid/messages
 */
router.use("/chats", chatController.router);

const DIRECT_PREFIXES = [
  "/social/",
  "/friends/",
  "/upload/",
  "/media/",
  "/overview",
  "/wallet",
  "/stats",
  "/rooms",
  "/switch-avatar",
];

router.use((req, res, next) => {
  const isDirect = DIRECT_PREFIXES.some((prefix) => req.url.startsWith(prefix));
  if (!isDirect) {
    req.url = "/social" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  return profileController(req, res, next);
});

module.exports = router;