const router = require("express").Router();

const controller = require('../../../controllers/auth/auth_controller.js');
const { sigin, signup, forgot, signInRandom } = controller;

router.post("/signin", async (req, res) => 
{
    const { username, password } = req.body;
    const result = await sigin(username, password);
});

router.post("/signup", async (req, res) => {
    const { username, password } = req.body;
   const result = await signup(username, password);
});
router.post("/forgot", async (req, res) =>
{
    const result = await forgot(req, res);
    return res.status(200);
});
router.get("/signin/random", (req, res) => {
    const result = signInRandom(req, res);
    return res.status(200);
});

module.exports = router;