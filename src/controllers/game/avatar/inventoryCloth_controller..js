const repo = require("../../../repositories/repository");
const router = require("express").Router();
const CheckAuth = require("../../auth").CheckLogin;
const { getAvatarWardrobe, toggleEquipItem } = require("../../../services/shop3d.service");

router.get("/inventory/cloth", CheckAuth, getAll);
router.get("/inventory/cloth/find", CheckAuth, get);
router.get("/inventory/cloth/:id", CheckAuth, findByPk);
router.post("/inventory/cloth", CheckAuth, create);
router.put("/inventory/cloth/:id", CheckAuth, update);
router.delete("/inventory/cloth/:id", CheckAuth, remove);

async function getAll(req, res) {
  try {
    const avatarId = Number(req.query?.avatarId || req.headers?.["x-profile-id"] || 0);
    const wardrobe = await getAvatarWardrobe(avatarId);
    return res.json({ success: true, ...wardrobe });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function get(req, res) {
  return getAll(req, res);
}

async function findByPk(req, res) {
  try {
    const item = await repo.Inventory.findByPk(req.params.id, {
      include: [{ model: repo.ShopContainer, as: "shopItem" }],
    });
    if (!item) return res.status(404).json({ success: false, error: "Item não encontrado no inventário" });
    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function create(req, res) {
  try {
    const created = await repo.Inventory.create(req.body);
    return res.json({ success: true, data: created });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function update(req, res) {
  try {
    const result = await toggleEquipItem({
      userId: req.userId || req.user?.id,
      avatarId: req.body?.avatarId || req.headers?.["x-profile-id"],
      inventoryId: req.params.id,
      forceEquip: req.body?.isEquipped,
      customColors: req.body?.customColors,
    });
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function remove(req, res) {
  try {
    await repo.Inventory.destroy({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { router };