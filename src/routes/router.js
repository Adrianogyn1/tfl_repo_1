const express = require("express");
const router = express.Router();
const path = require("path");
require("dotenv").config();
const { repo } = require("../repositories/repository.js");
const webSite = (process.env.SERVER_URL || "localhost:5000").endsWith("/") ? process.env.SERVER_URL : `${process.env.SERVER_URL}/`;
const t = require("../locales/i18n");
const adminRouter = require('./admin.router.js');
const apiRouters = require('./api.routers.js');
const userRouter = require('./user.router.js');


router.get("/", (req, res) => { 
 res.render('home', { title: 'Home', t: req.translate });
});
router.use("/register", (req, res) => {
    res.redirect("/profile/register");
});
router.use("/login", (req, res) => {
    res.redirect("/profile/login");
});
router.use("/forgot-password", (req, res) => {
    res.redirect("/profile/forgot");
});

//nova api
router.use(apiRouters);
router.use("/admin",adminRouter);
router.use(["/profile", '/home'],userRouter);



//slots
const slotsController = require('../controllers/game/cassino/slots/slots_controller.js'); // require("../../controllers/game/cassino/slots/slots_controller.js");
router.use("/slot", slotsController.router);
//webhook
const webhookController = require("../api/v1/old/api_webhock.js");
router.use("/webhook", webhookController.router);
//asas
const asasController = require("../api/v1/old/bank_controller.js");
router.use("/asaas",asasController.router);
//youtube
const youtubeRouter = require('../controllers/youtube.js'); //require("../../paginas/helps/youtube.js");
router.use(youtubeRouter);

//error 404
router.use((req,res)=>
{
  res.sendFile(path.join(__dirname, "../views/errors/404.html"));
});

//error 500
router.use((err, req, res, next) => {
  console.error(err.stack); // Bom para debug no console
  res.status(500).sendFile(path.join(__dirname, "../views/errors/500.html"));
});



module.exports = router;
