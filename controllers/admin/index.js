const router = require("express").Router();
const path = require("path");
const sequelizeErd = require("sequelize-erd");
const repo = require("../../repository");
const Op = repo.Sequelize ? repo.Sequelize.Op : require("sequelize").Op;

const auth = require("../auth").auth;


router.get("/", auth, (req, res) =>
{
    res.sendFile(path.join(__dirname, "../../paginas/admin/home.html"));
});

router.get("/login", (req, res) =>
{
    res.sendFile(path.join(__dirname, "../../paginas/admin/login.html"));
});





const routers = require("./routers.js");
router.use(auth, routers.router);



module.exports = {
    router,
    auth
};