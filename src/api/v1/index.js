const router = require("express").Router();

const Social = require("./social/index.js");
const Game = require("./game/index.js");
const Bank = require("./bank/index.js");

router.use("/social", Social);
router.use("/game", Game);
router.use("/bank", Bank);

module.exports = {
  //  Social,
   // Game,
  //  Bank,
    router
}