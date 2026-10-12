
const router = require("express").Router();

const auth = require("../auth");
const repo = require("../../../repositories/repository.js");
const { Response, ResponseList } = require("../response");
const {ErrorStatus, ApiError, UserError} = require("../errors.js");


router.use(auth);
//lista
router.get('/', (req, res) => 
{
    res.status(200).send(new Response(false, "não implementado", {}));
});
//busca 1
router.get('/:id', (req, res) => 
{
    res.status(200).send(new Response(false, "não implementado", {}));
});
//cria
router.post('/', (req, res) => 
{
    res.status(200).send(new Response(false, "não implementado", {}));
});
//atualiza
router.put('/:id', (req, res) => 
{
    res.status(200).send(new Response(false, "não implementado", {}));
});
//deleta
router.delete('/:id', (req, res) => 
{
    res.status(200).send(new Response(false, "não implementado", {}));
});





module.exports = router;