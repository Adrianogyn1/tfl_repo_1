const repo = require("../../repositories/repository");
const { getAvatarWardrobe, saveOutfitStyle } = require("../../services/shop3d.service");

async function getAll(req, res) {
  const avatarId = Number(req.query?.avatarId || req.headers?.["x-profile-id"] || 0);
  try {
    if (avatarId) {
      const wardrobe = await getAvatarWardrobe(avatarId);
      return res.json({
        success: true,
        data: wardrobe.styles,
        equippedBySlot: wardrobe.equippedBySlot,
        count: wardrobe.styles.length,
      });
    }
    const styles = await repo.AvatarOutfitStyle.findAll({ limit: 50, order: [["id", "DESC"]] });
    return res.json({ success: true, data: styles, count: styles.length });
  } catch (err) {
    return res.status(500).json({ success: false, data: [], error: err.message });
  }
}

async function getById(req, res) {
  try {
    const style = await repo.AvatarOutfitStyle.findByPk(req.params.id);
    if (!style) {
      return res.status(404).json({ error: "Outfit style not found", success: false });
    }
    return res.json({ success: true, data: style });
  } catch (err) {
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function create(req, res) {
  try {
    const style = await saveOutfitStyle({
      userId: req.userId || req.user?.id,
      avatarId: req.body?.avatarId || req.headers?.["x-profile-id"],
      name: req.body?.name,
    });
    return res.json({ success: true, data: style });
  } catch (err) {
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function update(req, res) {
  try {
    const style = await repo.AvatarOutfitStyle.findByPk(req.params.id);
    if (!style) return res.status(404).json({ error: "Outfit style not found", success: false });
    await style.update({
      name: req.body?.name ?? style.name,
      items: req.body?.items ?? style.items,
    });
    return res.json({ success: true, data: style });
  } catch (err) {
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function remove(req, res) {
  try {
    await repo.AvatarOutfitStyle.destroy({ where: { id: req.params.id } });
    return res.json({ success: true, message: "Outfit style deleted" });
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
