const router = require("express").Router();
const path = require("path");
const chat_controller = require("./chat_controller");

router.use("/chats/", chat_controller.router);
router.use("/chatGame", (req, res) =>{
    
    var index ="../../paginas/chat/index.html";
    res.sendFile(path.join(__dirname, index));
});



module.exports = {
    router,
};