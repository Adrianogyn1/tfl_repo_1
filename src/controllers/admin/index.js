const router = require("express").Router();
const path = require("path");
const sequelizeErd = require("sequelize-erd");
const repo = require("../../repositories/repository.js");
const Op = repo.Sequelize ? repo.Sequelize.Op : require("sequelize").Op;
const fs = require("fs");
const auth = require("../auth.js").auth;

const sendPage = function(page, res){
    const caminho = path.resolve(__dirname, `../../views/admin/${page}.html`);
    if(!fs.existsSync(caminho)){
        return res.status(404).send("Pagina nao encontrada " + caminho);
    }
    res.sendFile(caminho);
}

router.get("/", auth, (req, res) =>
{
    sendPage("index", res);
    //res.sendFile(path.join(__dirname, "../../paginas/admin/index.html"));
});

router.get("/login", (req, res) =>
{
    sendPage("login", res);
    //res.sendFile(path.join(__dirname, "../../paginas/admin/login.html"));
});
router.get("/home", (req, res) =>
{
    sendPage("home", res);
   // res.sendFile(path.join(__dirname, "../../paginas/admin/home.html"));
});





const routers = require("./routers.js");
router.use(auth, routers.router);



module.exports = {
    router,
    auth,
    sendPage
};