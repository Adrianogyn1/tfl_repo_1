const router = require("express").Router();

const controllers = require("../controllers/admin/index.js");
router.use(controllers.router);

module.exports = router;