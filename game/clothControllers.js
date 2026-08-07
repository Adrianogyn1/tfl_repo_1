const repo = require('../repository');

function checkData(clothData) {
    let error = "";
    try {
        if (!clothData)
            throw new Error("Dados da roupa são obrigatórios.");

        if (!clothData.name)
            throw new Error("O nome da roupa é obrigatório.");

        if (!clothData.objectId)
            throw new Error("O objectId da roupa é obrigatório.");

        if (!clothData.path)
            throw new Error("O path da roupa é obrigatório.");
            
    } catch (e) {
        error = e.message;
    }
    return error;
}

async function getAll(req, res) {
    const limit = parseInt(req.query?.limit || req.body?.limit) || 50;
    const offset = parseInt(req.query?.offset || req.body?.take || req.body?.skip || req.body?.offset) || 0;

    try {
        const clothes = await repo.Cloth.findAndCountAll({
            limit: limit,
            offset: offset
        });

        return res.json({
            success: true,
            data: clothes?.rows || [],
            count: clothes?.count || 0,
            skip: offset,
            limit: limit,
            nextPage: clothes?.count <= 0 ? 0 : Math.ceil((offset + limit) / limit) + 1,
        });
    } catch (err) {
        return res.status(500).json({ success: false, data: [], error: err.message });
    }
}

async function getById(req, res) {
    try {
        const cloth = await repo.Cloth.findByPk(req.params.id);
        if (!cloth) {
            return res.status(404).json({ error: "Cloth not found", success: false });
        }
        return res.json({ success: true, data: cloth });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function create(req, res) {
    try {
        const clothData = req.body;
        const error = checkData(clothData);

        if (error) {
            return res.status(400).json({ error: error, success: false });
        }
        
        delete clothData.uid;
        const cloth = await repo.Cloth.create(clothData);
        return res.json({ success: true, data: cloth });
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

        const clothExists = await repo.Cloth.findByPk(req.params.id);
        if (!clothExists) {
            return res.status(404).json({ error: "Cloth not found", success: false });
        }

        await repo.Cloth.update(req.body, { where: { id: req.params.id } });
        const updatedCloth = await repo.Cloth.findByPk(req.params.id);
        
        return res.json({ success: true, data: updatedCloth });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function remove(req, res) {
    try {
        const cloth = await repo.Cloth.findByPk(req.params.id);
        if (!cloth) {
            return res.status(404).json({ error: "Cloth not found", success: false });
        }

        await repo.Cloth.destroy({ where: { id: req.params.id } });
        return res.json({ success: true, message: "Cloth deleted successfully" });
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