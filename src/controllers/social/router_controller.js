const router = require("express").Router();
const path = require("path");
const chat_controller = require("./chat_controller");

router.use("/chats/", chat_controller.router);
router.use("/chatGame", (req, res) =>{
    
    var index ="../../paginas/chat/index.html";
    res.sendFile(path.join(__dirname, index));
});

//users
const user = require("./user");
router.use("/users", user.router);

//wallets
const wallet = require("../game/currency_controllers");
router.use("/wallet", wallet.router);


module.exports = {
    router,
};