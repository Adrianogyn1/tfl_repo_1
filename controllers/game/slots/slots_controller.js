const router = require("express").Router();

const golden_tiger = require("./golden_tiger.js");
router.use("/golden_tiger", golden_tiger.router);
router.use("/", (req, res) => {
    res.json({"status": "ok"});
});


module.exports = {
    router,
};