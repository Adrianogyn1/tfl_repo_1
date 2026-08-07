const repo = require('../repository');

function checkData(avatarData) {
    let error = "";
    try {
        if (!avatarData)
            throw new Error("Dados do avatar são obrigatórios.");

        if (!avatarData.name)
            throw new Error("O nome do avatar é obrigatório.");

    } catch (e) {
        error = e.message;
    }
    return error;
}

async function create(req, res) {
    try {
        const avatarData = req.body;
        var result = await AvatarCreateHandler(avatarData, req.userId);
        if (!result.success)
            throw new Error(result.error);

        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function findByPk(req, res) {
    try {
        const avatarInstance = await repo.Avatar.findByPk(req.params.id);
        if (!avatarInstance) {
            return res.status(404).json({ error: "Avatar not found", success: false });
        }

        const avatar = avatarInstance.get({ plain: true });
        return res.json({
            success: true,
            data: avatar
        });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}


async function get(req, res) {
    try {
        const queryStr = req.query?.q || req.body?.q || '';
        const whereCondition = repo.parseQueryStringToWhere(queryStr);
        const orderCondition = repo.parseOrderByString(queryStr);

        const avatarInstance = await repo.Avatar.findOne({
            where: whereCondition,
            order: orderCondition
        });

        if (!avatarInstance) {
            return res.json({ success: true, data: null });
        }

        const avatar = avatarInstance.get({ plain: true });
        return res.json({
            success: true,
            data: avatar
        });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function getAll(req, res) {
    try {
        const queryStr = req.query?.q || req.body?.q || '';
        const whereCondition = repo.parseQueryStringToWhere(queryStr);
        const orderCondition = repo.parseOrderByString(queryStr);

        const limit = parseInt(req.query?.limit || req.body?.limit) || 10;
        const offset = parseInt(req.query?.offset || req.body?.take || req.body?.skip || req.body?.offset) || 0;

        const avatars = await repo.Avatar.findAndCountAll({
            where: whereCondition,
            limit: limit,
            offset: offset,
            order: orderCondition
        });

        const preppedAvatars = [];
        for (const avatarInstance of (avatars.rows || [])) {
            const avatar = avatarInstance.get({ plain: true });
            preppedAvatars.push(avatar);
        }

        const hasNext = offset + limit < (avatars?.count || 0);
        const nextPageNum = hasNext ? Math.ceil((offset + limit) / limit) + 1 : 0;

        return res.json({
            success: true,
            data: preppedAvatars,
            count: avatars.count,
            skip: offset,
            limit: limit,
            nextPage: nextPageNum
        });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function update(req, res) {
    try {
        const erro = checkData(req.body);
        if (erro) {
            return res.status(400).json({ error: erro, success: false });
        }

        const adminRoles = ['admin', 'moderador', 'desenvolvedor', 'ownner'];
        const user = req.userData;
        const isAdmin = adminRoles.includes(user.role);
        const avatarValid = await repo.Avatar.findByPk(req.params.id);

        if (!avatarValid) {
            return res.status(404).json({ error: "Avatar not found", success: false });
        }

        if (!isAdmin) {
            if (avatarValid.userId != req.userId) {
                return res.status(401).json({ error: "Unauthorized", success: false });
            }
        }

        await repo.Avatar.update(req.body, { where: { id: req.params.id } });

        const avatarInstance = await repo.Avatar.findByPk(req.params.id);
        const avatar = avatarInstance.get({ plain: true });

        return res.json({
            success: true,
            data: avatar
        });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function remove(req, res) {
    try {
        const avatar = await repo.Avatar.findByPk(req.params.id);
        if (!avatar) return res.status(404).json({ error: "Avatar not found", success: false });

        const adminRoles = ['admin', 'moderador', 'desenvolvedor', 'ownner'];
        const isAdmin = adminRoles.includes(req.userData.role);

        if (!isAdmin && avatar.userId != req.userId) {
            return res.status(401).json({ error: "Unauthorized", success: false });
        }

        const result = await AvatarDeleteHandle(req.params.id);
        if (!result.success) throw new Error(result.error);

        return res.json({ success: true, message: "Avatar deleted successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function AvatarCreateHandler(avatar, userID) {
    try {

        const error = checkData(avatar);
        if (error) throw new Error(error);
        if (!userID) throw new Error("O userId é obrigatório.");

        const avatarData = avatar;
        avatarData.userId = userID;

        delete avatarData.uid;
        const count = await repo.Avatar.count({ where: { userId: userID } });
        return await repo.sequelize.transaction(async (t) => {
            //cria um avatar
            const newAvatar = await repo.Avatar.create(avatarData, { transaction: t });
            //cria um room para o avatar
            const room = await repo.Room.create({
                avatarId: newAvatar.id,
                name: newAvatar.name,
                scene: "Apartamento",
                ownnerID: newAvatar.userId
            }, { transaction: t });
            //da uma moedas para ele
            if (count == 0) {
                const handleCoins = require("./currencyRegisterController");
                const result = await handleCoins.CreateCurrencyRegister(
                    {
                        userId: newAvatar.userId,
                        value: 100,
                        type: "Coins",
                        transactionType: "Rewards",
                    }, newAvatar.userId, transaction = t);

                if (!result.success) throw new Error(result.error);
            }
            const wallet = await repo.CurrencyRegister.findAll({ where: { userId: newAvatar.userId }, transaction: t });
            const avatarVal = { avatar: newAvatar, room: room, wallet: wallet };
            return { success: true, data: avatarVal, error: "" };
        });
    } catch (e) {
        return { success: false, data: null, error: e.message };
    }
}

async function AvatarDeleteHandle(avatarID) {
    try {
        const avatar = await repo.Avatar.findByPk(avatarID);
        if (!avatar) throw new Error("Avatar não encontrado.");

        const files = await repo.FileInfo.findAll({ where: { uid: avatar.uid } });

        await repo.sequelize.transaction(async (t) => {
            await repo.Avatar.destroy({ where: { id: avatarID }, transaction: t });
            for (const [key, model] of Object.entries(repo.sequelize.models)) {
                if (key !== "FileInfo" && model.rawAttributes.uid) {
                    //  await model.destroy({ where: { uid: avatar.uid }, transaction: t });
                    continue;
                }
                if (key === "CurrencyRegister" && model.rawAttributes.target_uid) {
                    //  await model.destroy({ where: { target_uid: avatar.uid }, transaction: t });
                    continue;
                }
            }
        });

        for (const file of files) {
            try {
                if (file.inCdn) {
                    await cloudinary.uploader.destroy(file.publicId);
                } else {
                    const fullPath = path.join(UPLOAD_DIR, file.url.split('/').pop());
                    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
                }
                await repo.FileInfo.destroy({ where: { target_uid: file.id } });
            } catch (e) {
                console.error("Erro ao deletar arquivo externo:", e.message);
            }
        }
        return { success: true, error: "" };
    } catch (e) {
        return { success: false, error: e.message };
    }
}





module.exports = {
    create,
    findByPk,
    get,
    getAll,
    update,
    remove
};