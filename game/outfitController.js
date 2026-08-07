const repo = require('../repository');

function checkData(outfitData) {
    let error = "";
    try {
        if (!outfitData)
            throw new Error("Dados do visual são obrigatórios.");

        if (!outfitData.name)
            throw new Error("O nome do visual é obrigatório.");

    } catch (e) {
        error = e.message;
    }
    return error;
}

async function getAll(req, res) {
    const limit = parseInt(req.query?.limit || req.body?.limit) || 50;
    const offset = parseInt(req.query?.offset || req.body?.take || req.body?.skip || req.body?.offset) || 0;

    try {
        const outfits = await repo.Outfit.findAndCountAll({
            limit: limit,
            offset: offset
        });

        return res.json({
            success: true,
            data: outfits?.rows || [],
            count: outfits?.count || 0,
            skip: offset,
            limit: limit,
            nextPage: outfits?.count <= 0 ? 0 : Math.ceil((offset + limit) / limit) + 1,
        });
    } catch (err) {
        return res.status(500).json({ success: false, data: [], error: err.message });
    }
}

async function getById(req, res) {
    try {
        const outfitInstance = await repo.Outfit.findByPk(req.params.id);
        if (!outfitInstance) {
            return res.status(404).json({ error: "Outfit not found", success: false });
        }

        const outfit = outfitInstance.get({ plain: true });
        // Busca e vincula os itens pertencentes a este visual
        outfit.items = await repo.OutfitItems.findAll({ where: { outfitId: outfit.id } });

        return res.json({ success: true, data: outfit });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function create(req, res) {
    try {
        const outfitData = req.body;
        const error = checkData(outfitData);

        if (error) {
            return res.status(400).json({ error: error, success: false });
        }

        const outfit = await repo.Outfit.create(outfitData);
        return res.json({ success: true, data: outfit });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function update(req, res) {
    try {
        const error = checkData(req.body);
        if (error) {
            return res.status(400).json({ error: error, success: false });
        }

        const outfitExists = await repo.Outfit.findByPk(req.params.id);
        if (!outfitExists) {
            return res.status(404).json({ error: "Outfit not found", success: false });
        }

        await repo.Outfit.update(req.body, { where: { id: req.params.id } });
        
        const outfitInstance = await repo.Outfit.findByPk(req.params.id);
        const outfit = outfitInstance.get({ plain: true });
        outfit.items = await repo.OutfitItems.findAll({ where: { outfitId: outfit.id } });
        
        return res.json({ success: true, data: outfit });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function remove(req, res) {
    try {
        const outfit = await repo.Outfit.findByPk(req.params.id);
        if (!outfit) {
            return res.status(404).json({ error: "Outfit not found", success: false });
        }

        // Remove também os itens vinculados ao visual antes de deletá-lo
        await repo.OutfitItems.destroy({ where: { outfitId: req.params.id } });
        await repo.Outfit.destroy({ where: { id: req.params.id } });

        return res.json({ success: true, message: "Outfit and its items deleted successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};