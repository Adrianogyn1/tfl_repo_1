const express = require('express');
const router = express.Router();
const repo = require('../repository.js'); 
const { Op } = require('sequelize');

const { CheckLogin: CheckAuth } = require('../controllers/auth');
// Importando todos os controladores centralizados do index.js
const controllers = require('./index.js'); 

//importação por controllers
Object.values(controllers).forEach(controller => {
   if (controller && controller.router) {
       router.use(controller.router);
   } else if (controller && typeof controller === 'function') {
       // Caso o export seja o próprio router (função de middleware)
       router.use(controller);
   }
});

//
//router.use(controllers.Object.router);




router.get('/game/t', (req, res) => 
    repo.User.findOne({
        where: {
            id: { [Op.gt]: 0 }
        },
        order: repo.sequelize.random() 
    })
    .then(player => res.json(player))
    .catch(err => res.status(500).json({ error: err.message }))
);

router.get('/game/avatars',CheckAuth, controllers.Avatar.getAll);
router.get('/game/avatars/find',CheckAuth, controllers.Avatar.get);
router.get('/game/avatars/:id',CheckAuth, controllers.Avatar.findByPk);

// Rotas de escrita e modificação (O próprio controller já valida se é o dono do avatar ou Staff)
router.post('/game/avatars',CheckAuth, controllers.Avatar.create);
router.put('/game/avatars/:id',CheckAuth, controllers.Avatar.update);
router.delete('/game/avatars/:id',CheckAuth, controllers.Avatar.remove);





// Ações para Materials (Materiais)


// Ações para Clothes (Roupas)
router.get('/game/clothes', CheckAuth, controllers.Cloth.getAll);
router.get('/game/clothes/:id', CheckAuth, controllers.Cloth.getById);
router.post('/game/clothes', CheckAuth, controllers.Cloth.create);
router.put('/game/clothes/:id', CheckAuth, controllers.Cloth.update);
router.delete('/game/clothes/:id', CheckAuth, controllers.Cloth.remove);

// Ações para Currency (Moedas)
router.get('/game/currencies', CheckAuth, controllers.Currency.getAll);
router.get('/game/currencies/:id', CheckAuth, controllers.Currency.getById);
router.post('/game/currencies', CheckAuth, controllers.Currency.create);
router.put('/game/currencies/:id', CheckAuth, controllers.Currency.update);
router.delete('/game/currencies/:id', CheckAuth, controllers.Currency.remove);

// Ações para CurrencyRegister (Histórico de Moedas)
router.get('/game/currency-registers', CheckAuth, controllers.CurrencyRegister.getAll);
router.get('/game/currency-registers/:id', CheckAuth, controllers.CurrencyRegister.getById);
router.post('/game/currency-registers', CheckAuth, controllers.CurrencyRegister.create);
router.put('/game/currency-registers/:id', CheckAuth, controllers.CurrencyRegister.update);
router.delete('/game/currency-registers/:id', CheckAuth, controllers.CurrencyRegister.remove);

// Ações para Outfits (Visuais completos)
router.get('/game/outfits', CheckAuth, controllers.Outfit.getAll);
router.get('/game/outfits/:id', CheckAuth, controllers.Outfit.getById);
router.post('/game/outfits', CheckAuth, controllers.Outfit.create);
router.put('/game/outfits/:id', CheckAuth, controllers.Outfit.update);
router.delete('/game/outfits/:id', CheckAuth, controllers.Outfit.remove);

// Ações para OutfitItems (Componentes dos visuais)
router.get('/game/outfit-items', CheckAuth, controllers.OutfitItems.getAll);
router.get('/game/outfit-items/:id', CheckAuth, controllers.OutfitItems.getById);
router.post('/game/outfit-items', CheckAuth, controllers.OutfitItems.create);
router.put('/game/outfit-items/:id', CheckAuth, controllers.OutfitItems.update);
router.delete('/game/outfit-items/:id', CheckAuth, controllers.OutfitItems.remove);



// Ações para Servers (Servidores)
router.get('/game/servers', CheckAuth, controllers.Server.getAll);
router.get('/game/servers/:id', CheckAuth, controllers.Server.getById);
router.post('/game/servers', CheckAuth, controllers.Server.create);
router.put('/game/servers/:id', CheckAuth, controllers.Server.update);
router.delete('/game/servers/:id', CheckAuth, controllers.Server.remove);


module.exports = router;
