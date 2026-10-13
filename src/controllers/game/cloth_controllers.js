const repo = require("../../repositories/repository");
const {
  listShopCatalog,
  saveShopCatalogItem,
  deleteShopCatalogItem,
} = require("../../services/shop3d.service");

async function getAll(req, res) {
  try {
    const result = await listShopCatalog({
      slot: req.query?.slot || "",
      gender: req.query?.gender || "",
      currencyType: req.query?.currencyType || "",
      rarity: req.query?.rarity || "",
      search: req.query?.q || "",
      viewerAvatarId: Number(req.query?.avatarId || req.headers?.["x-profile-id"] || 0),
    });
    return res.json({
      success: true,
      data: result.items,
      rules: result.rules,
      count: result.items.length,
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: [], error: err.message });
  }
}

async function getById(req, res) {
  try {
    const item = await repo.ShopContainer.findByPk(req.params.id, {
      include: [{ model: repo.ShopItem, as: "items" }],
    });
    if (!item) {
      return res.status(404).json({ error: "Item 3D não encontrado", success: false });
    }
    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function create(req, res) {
  try {
    const created = await saveShopCatalogItem(req.body);
    return res.json({ success: true, data: created });
  } catch (err) {
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function update(req, res) {
  try {
    const updated = await saveShopCatalogItem({ ...req.body, id: req.params.id });
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function remove(req, res) {
  try {
    await deleteShopCatalogItem(req.params.id);
    return res.json({ success: true, message: "Item removido com sucesso" });
  } catch (err) {
    return res.status(500).json({ error: err.message, success: false });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
