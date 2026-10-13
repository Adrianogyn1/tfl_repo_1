const router = require("express").Router();
const Avatar = require("./avatar.routers");
const User = require("./user.routers");
const Room = require("./room.routers");
const RoomObject = require("./objectRoom.routers");
const profileController = require("../../../controllers/profile/profile_controller");

// Rotas unificadas de Avatares & Salas 3D sincronizadas com o Portal Web (/avatar/create, /room/create, /switch-avatar, etc.)
router.use(profileController);

router.use("/avatar", Avatar);
router.use("/user", User);
router.use("/room", Room);
router.use("/objectRoom", RoomObject);

module.exports = router;