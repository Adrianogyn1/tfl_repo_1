const repo = require("../../../repository");
const router = require("express").Router();
const CheckAuth = require("../../auth").CheckLogin;

router.get("/inventory/cloth", CheckAuth, getAll);
router.get("/inventory/cloth/find", CheckAuth, get);
router.get("/inventory/cloth/:id", CheckAuth, findByPk);
router.post("/inventory/cloth", CheckAuth, create);
router.put("/inventory/cloth/:id", CheckAuth, update);
router.delete("/inventory/cloth/:id", CheckAuth, remove);

function getAll(req, res) {
    res.json({
        
    });
}

function get(req, res) {
    res.json({});
}

function findByPk(req, res) {
    res.json({});
}

function create(req, res) {
    res.json({});
}

function update(req, res) {
    res.json({});
}

function remove(req, res) {
    res.json({});
}



module.exports = {router};