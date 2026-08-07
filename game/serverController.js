const repo = require('../repository');

function checkData(serverData) {
    let error = "";
    try {
        if (!serverData)
            throw new Error("Dados do servidor são obrigatórios.");

        if (!serverData.roomId)
            throw new Error("roomId is required");

        if (!serverData.scene)
            throw new Error("scene is required");

        if (!serverData.language)
            throw new Error("language is required");

    } catch (e) {
        error = e.message;
    }
    return error;
}

async function getAll(req, res) {
    const limit = parseInt(req.query?.limit || req.body?.limit) || 50;
    const offset = parseInt(req.query?.offset || req.body?.take || req.body?.skip || req.body?.offset) || 0;

    try {
        const servers = await repo.Server.findAndCountAll({
            limit: limit,
            offset: offset
        });

        return res.json({
            success: true,
            data: servers?.rows || [],
            count: servers?.count || 0,
            skip: offset,
            limit: limit,
            nextPage: servers?.count <= 0 ? 0 : Math.ceil((offset + limit) / limit) + 1,
        });
    } catch (err) {
        return res.status(500).json({ success: false, data: [], error: err.message });
    }
}

async function getById(req, res) {
    try {
        const server = await repo.ServerModel.findByPk(req.params.id);
        if (!server) {
            return res.status(404).json({ error: "Server not found", success: false });
        }
        return res.json({ success: true, data: server });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function create(req, res) {
    try {
        const serverData = req.body;
        const error = checkData(serverData);

        if (error) {
            return res.status(400).json({ error: error, success: false });
        }

        const server = await repo.Server.create(serverData);
        return res.json({ success: true, data: server });
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

        const serverExists = await repo.Server.findByPk(req.params.id);
        if (!serverExists) {
            return res.status(404).json({ error: "Server not found", success: false });
        }

        await repo.Server.update(req.body, { where: { id: req.params.id } });
        const updatedServer = await repo.Server.findByPk(req.params.id);
        
        return res.json({ success: true, data: updatedServer });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function remove(req, res) {
    try {
        const server = await repo.Server.findByPk(req.params.id);
        if (!server) {
            return res.status(404).json({ error: "Server not found", success: false });
        }

        await repo.Server.destroy({ where: { id: req.params.id } });
        return res.json({ success: true, message: "Server deleted successfully" });
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