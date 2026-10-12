const router = require("express").Router();

const authController = require('./../controllers/auth.js'); //require("../../controllers/auth");
const socialController = require("../controllers/social/router_controller.js");
const homeController = require("../controllers/home/home_controller.js");
const api = require("../api/index.js");


router.use("/api", api);


router.use("/api/home", homeController.router);
//Auth
router.use("/api/auth", authController.router);
//Social
router.use("/api", socialController.router);
const apiController = require("../api/v1/old/api_controller.js");
router.use("/api/", apiController.router);
const routeGameController = require("../controllers/game/routers.js");
router.use("/api/", routeGameController.router);
const manifestController = require("../api/v1/old/manifest_controller.js");
router.use("/api/manifest", manifestController.router);


module.exports = router;