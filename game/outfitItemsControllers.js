const repo = require('../repository');

function checkData(itemData) {
    let error = "";
    try {
        if (!itemData)
            throw new Error("Dados do item do visual são obrigatórios.");

        if (!itemData.type)
            throw new Error("O tipo (type) do item é obrigatório.");

        if (!itemData.prefabId)
            throw new Error("O prefabId é obrigatório.");

        if (!itemData.outfitId)
            throw new Error("O outfitId é obrigatório.");
            
    } catch (e) {
        error = e.message;
    }
    return error;
}

async function getAll(req, res) {
    const outfitId = req.params?.outfitId || req.body?.outfitId || req.query?.outfitId || null;
    const limit = parseInt(req.query?.limit || req.body?.limit) || 50;
    const offset = parseInt(req.query?.offset || req.body?.take || req.body?.skip || req.body?.offset) || 0;

    try {
        const whereCondition = outfitId ? { outfitId: outfitId } : {};

        const items = await repo.OutfitItems.findAndCountAll({
            where: whereCondition,
            limit: limit,
            offset: offset
        });

        return res.json({
            success: true,
            data: items?.rows || [],
            count: items?.count || 0,
            skip: offset,
            limit: limit,
            nextPage: items?.count <= 0 ? 0 : Math.ceil((offset + limit) / limit) + 1,
        });
    } catch (err) {
        return res.status(500).json({ success: false, data: [], error: err.message });
    }
}

async function getById(req, res) {
    try {
        const item = await repo.OutfitItems.findByPk(req.params.id);
        if (!item) {
            return res.status(404).json({ error: "Outfit item not found", success: false });
        }
        return res.json({ success: true, data: item });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function create(req, res) {
    try {
        const itemData = req.body;
        const error = checkData(itemData);

        if (error) {
            return res.status(400).json({ error: error, success: false });
        }

        const item = await repo.OutfitItems.create(itemData);
        return res.json({ success: true, data: item });
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

        const itemExists = await repo.OutfitItems.findByPk(req.params.id);
        if (!itemExists) {
            return res.status(404).json({ error: "Outfit item not found", success: false });
        }

        await repo.OutfitItems.update(req.body, { where: { id: req.params.id } });
        const updatedItem = await repo.OutfitItems.findByPk(req.params.id);
        
        return res.json({ success: true, data: updatedItem });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function remove(req, res) {
    try {
        const item = await repo.OutfitItems.findByPk(req.params.id);
        if (!item) {
            return res.status(404).json({ error: "Outfit item not found", success: false });
        }

        await repo.OutfitItems.destroy({ where: { id: req.params.id } });
        return res.json({ success: true, message: "Outfit item deleted successfully" });
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