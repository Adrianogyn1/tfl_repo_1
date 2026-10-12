const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const auth = require("../middlewares/auth");
const controller = require("../controllers/profile/profile_controller");

function sendPage(page, res) {
    const pg = path.join(__dirname, `../views/profile/${page}.html`);
    if(!fs.existsSync(pg)){
        return res.status(404).send("Pagina nao encontrada ");
    }
    res.sendFile(pg);
}

router.use(controller);

module.exports = router;