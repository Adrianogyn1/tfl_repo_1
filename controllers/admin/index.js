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

router.get("/logout", (req, res) =>
{
    req.session.destroy(() =>
    {
        res.clearCookie("user");
        res.redirect("/admin/login");
    });
});

router.post("/login", async (req, res) =>
{
    try
    {
        const { username, password, page } = req.body;
        //userName ou login
        const user = await repo.User.findOne({
            where: {
                [Op.or]: [
                    { email: username },
                    { login: username }
                ],
                [Op.and]: [
                    { role: "admin" }
                ]                
            }
        });
        if(!user)
            throw new Error("Usuário ou senha inválidos");

       

        if (user.password == password)
        {
            req.session.user = user;
            user.token = repo.User.newToken();
            await repo.User.update({ token: user.token }, { where: { id: user.id } });

            res.cookie("userToken", user.token);

            if (page && page.length > 3 && page != "login")
                res.redirect(page);
            else
                res.redirect("/admin");
        }
        throw new Error("Usuário ou senha inválidos");
    }
    catch (error)
    {
        res.redirect("/admin/login?pg=" + page);
    }
});



const routers = require("./routers.js");
router.use(auth, routers.router);



module.exports = {
    router,
    auth
};