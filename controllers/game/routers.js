const express = require("express");
const router = express.Router();
const repo = require("../../repository.js");
const { Op } = require("sequelize");

const { CheckLogin: CheckAuth } = require("../auth");
// Importando todos os controladores centralizados do index.js
const controllers = require("./index.js");

//importação por controllers
Object.values(controllers).forEach((controller) =>
{
  if (!controller) return;

  if (controller && controller.router)
  {
    router.use(controller.router);//
  } else if (controller && typeof controller === "function")
  {
    router.use(controller);
  }
});

router.use("/", (req, res) =>
{
  const result = {
    message: "rota não encontrada, ou você não tem permissão",
    error: true,
    success: false

  };
  if (result.id)
  {
    delete result.id;
  }
  res.json({ result });
});
module.exports = { router };

/*
//
//router.use(controllers.Object.router);

router.get("/game/t", (req, res) =>
  repo.User.findOne({
    where: {
      id: { [Op.gt]: 0 },
    },
    order: repo.sequelize.random(),
  })
    .then((player) => res.json(player))
    .catch((err) => res.status(500).json({ error: err.message })),
);

// Rotas de escrita e modificação (O próprio controller já valida se é o dono do avatar ou Staff)

// Ações para Materials (Materiais)

// Ações para Clothes (Roupas)
router.get("/game/clothes", CheckAuth, controllers.Cloth.getAll);
router.get("/game/clothes/:id", CheckAuth, controllers.Cloth.getById);
router.post("/game/clothes", CheckAuth, controllers.Cloth.create);
router.put("/game/clothes/:id", CheckAuth, controllers.Cloth.update);
router.delete("/game/clothes/:id", CheckAuth, controllers.Cloth.remove);

// Ações para Currency (Moedas)
router.get("/game/currencies", CheckAuth, controllers.Currency.getAll);
router.get("/game/currencies/:id", CheckAuth, controllers.Currency.getById);
router.post("/game/currencies", CheckAuth, controllers.Currency.create);
router.put("/game/currencies/:id", CheckAuth, controllers.Currency.update);
router.delete("/game/currencies/:id", CheckAuth, controllers.Currency.remove);

// Ações para CurrencyRegister (Histórico de Moedas)
router.get(
  "/game/currency-registers",
  CheckAuth,
  controllers.CurrencyRegister.getAll,
);

router.get(
  "/game/currency-registers/:id",
  CheckAuth,
  controllers.CurrencyRegister.getById,
);

router.post(
  "/game/currency-registers",
  CheckAuth,
  controllers.CurrencyRegister.create,
);
router.put(
  "/game/currency-registers/:id",
  CheckAuth,
  controllers.CurrencyRegister.update,
);
router.delete(
  "/game/currency-registers/:id",
  CheckAuth,
  controllers.CurrencyRegister.remove,
);

// Ações para Outfits (Visuais completos)
router.get("/game/outfits", CheckAuth, controllers.Outfit.getAll);
router.get("/game/outfits/:id", CheckAuth, controllers.Outfit.getById);
router.post("/game/outfits", CheckAuth, controllers.Outfit.create);
router.put("/game/outfits/:id", CheckAuth, controllers.Outfit.update);
router.delete("/game/outfits/:id", CheckAuth, controllers.Outfit.remove);

// Ações para OutfitItems (Componentes dos visuais)
router.get("/game/outfit-items", CheckAuth, controllers.OutfitItems.getAll);
router.get(
  "/game/outfit-items/:id",
  CheckAuth,
  controllers.OutfitItems.getById,
);
router.post("/game/outfit-items", CheckAuth, controllers.OutfitItems.create);
router.put("/game/outfit-items/:id", CheckAuth, controllers.OutfitItems.update);
router.delete(
  "/game/outfit-items/:id",
  CheckAuth,
  controllers.OutfitItems.remove,
);

*/


