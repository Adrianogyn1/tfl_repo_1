const router = require("express").Router();
const Avatar = require("./avatar.routers");
const User = require("./user.routers");
const Room = require("./room.routers");
const RoomObject = require("./objectRoom.routers");


router.use("/avatar", Avatar);
router.use("/user", User);
router.use("/room", Room);
router.use("/objectRoom", RoomObject);

module.exports =  router;