
const router = require("express").Router();
const auth = require("../auth");
const {Response, ResponseList} = require("../response");



router.use(auth);
router.get('/', (req, res) => 
{
    res.status(200).send(new Response(false, "não implementado", {}));
});
router.get('/:id', (req, res) => 
{
    res.status(200).send(new Response(false, "não implementado", {}));
});
router.post('/', (req, res) => 
{
    res.status(200).send(new Response(false, "não implementado", {}));
});
router.put('/:id', (req, res) => 
{
    res.status(200).send(new Response(false, "não implementado", {}));
});
router.delete('/:id', (req, res) => 
{
    res.status(200).send(new Response(false, "não implementado", {}));
});





module.exports = router;