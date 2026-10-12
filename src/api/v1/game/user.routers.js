
const router = require("express").Router();
const auth = require("../auth");
const {Response, ResponseList} = require("../response");



router.use(auth);
router.get('/', (req, res) => 
{
   returnres.status(200).send(new Response(false, "não implementado", {}));
});
router.get('/:id', (req, res) => 
{
   return res.status(200).send(new Response(false, "não implementado", {}));
});
router.post('/', (req, res) => 
{
   return res.status(200).send(new Response(false, "não implementado", {}));
});
router.put('/:id', (req, res) => 
{
   return res.status(200).send(new Response(false, "não implementado", {}));
});
router.delete('/:id', (req, res) => 
{
   return res.status(200).send(new Response(false, "não implementado", {}));
});

module.exports = router;