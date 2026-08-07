const repo = require('../repository');

function checkData(currencyData) {
    let error = "";
    try {
        if (!currencyData)
            throw new Error("Dados da moeda são obrigatórios.");

        if (currencyData.value === undefined || currencyData.value === null)
            throw new Error("O valor da moeda é obrigatório.");

        if (!currencyData.userId)
            throw new Error("O userId é obrigatório.");
            
    } catch (e) {
        error = e.message;
    }
    return error;
}

async function getAll(req, res) {
    const limit = parseInt(req.query?.limit || req.body?.limit) || 50;
    const offset = parseInt(req.query?.offset || req.body?.take || req.body?.skip || req.body?.offset) || 0;

    try {
        const currencies = await repo.Currency.findAndCountAll({
            limit: limit,
            offset: offset
        });

        return res.json({
            success: true,
            data: currencies?.rows || [],
            count: currencies?.count || 0,
            skip: offset,
            limit: limit,
            nextPage: currencies?.count <= 0 ? 0 : Math.ceil((offset + limit) / limit) + 1,
        });
    } catch (err) {
        return res.status(500).json({ success: false, data: [], error: err.message });
    }
}

async function getById(req, res) {
    try {
        const currency = await repo.Currency.findByPk(req.params.id);
        if (!currency) {
            return res.status(404).json({ error: "Currency not found", success: false });
        }
        return res.json({ success: true, data: currency });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function create(req, res) {
    try {

        const currencyData = req.body;
        const error = checkData(currencyData);
        const role = req.userData.role;
        

        if (error) {
            return res.status(400).json({ error: error, success: false });
        }

        delete currencyData.uid;
        const currency = await repo.Currency.create(currencyData);
        return res.json({ success: true, data: currency });
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

        const currencyExists = await repo.Currency.findByPk(req.params.id);
        if (!currencyExists) {
            return res.status(404).json({ error: "Currency not found", success: false });
        }

        await repo.Currency.update(req.body, { where: { id: req.params.id } });
        const updatedCurrency = await repo.Currency.findByPk(req.params.id);
        
        return res.json({ success: true, data: updatedCurrency });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function remove(req, res) {
    try {
        const currency = await repo.Currency.findByPk(req.params.id);
        if (!currency) {
            return res.status(404).json({ error: "Currency not found", success: false });
        }

        await repo.Currency.destroy({ where: { id: req.params.id } });
        return res.json({ success: true, message: "Currency deleted successfully" });
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