
const router = require("express").Router();
const { where } = require("sequelize");
require("dotenv").config();


const auth = require("../auth");
const repo = require("../../../repositories/repository.js");
const { Response, ResponseList } = require("../response");
const { ErrorStatus, ApiError, UserError } = require("../../errors.js");

const REGISTER_VALUE_BONUS = process.env.REGISTER_VALUE_BONUS || 100;
const adminRoles = ["admin", "moderador", "desenvolvedor", "ownner"];
const avatar_controller = require('../../../controllers/game/avatar/avatar_controller.js')

router.use(auth);
router.get('/', async (req, res) => 
{
    try
    {
        const queryStr = req.query?.q || req.body?.q || "";
        const whereCondition = repo.parseQueryStringToWhere(queryStr);
        const orderCondition = repo.parseOrderByString(queryStr);

        const full = req.query?.full || req.body?.full;

        const limit = parseInt(req.query?.limit || req.body?.limit) || 10;
        const offset =
            parseInt(
                req.query?.offset ||
                req.body?.take ||
                req.body?.skip ||
                req.body?.offset,
            ) || 0;

        const avatars = await repo.Avatar.findAndCountAll({
            where: whereCondition,
            limit: limit,
            offset: offset,
            order: orderCondition,
        });

        const preppedAvatars = [];
        for (const avatarInstance of avatars.rows || [])
        {
            let avatar = avatarInstance.get({ plain: true });
            avatar = await avatar_controller.getInfo(avatar, full);
            preppedAvatars.push(avatar);
        }

        const hasNext = offset + limit < (avatars?.count || 0);
        const nextPageNum = hasNext ? Math.ceil((offset + limit) / limit) + 1 : 0;
        res.status(200).send(new ResponseList(true, "ok", avatars, avatars.count, 0, nextPageNum));
    } catch (err)
    {
        return res.status(500).json(new Response(false, err.message, {}));
    }

});


router.get('/:id', async (req, res) => 
{
    try
    {
        const queryStr = req.query?.q || req.body?.q || "";
        const full = req.query?.full || req.body?.full;
        const whereCondition = repo.parseQueryStringToWhere(queryStr);
        const orderCondition = repo.parseOrderByString(queryStr);

        const avatarInstance = await repo.Avatar.findOne({
            where: whereCondition,
            order: orderCondition,
        });

        if (!avatarInstance)
        {
            return res.json({ success: false, data: null });
        }

        const avatar = avatarInstance.get({ plain: true });
        res.status(200).send(new Response(true, "ok", await avatar_controller.getInfo(avatar, full)));
    } catch (err)
    {
        return res.json(new Response(false, err.message, {}));
    }
});


router.post('/', async (req, res) => 
{
    try
    {
        const avatarData = req.body;
        var result = await avatar_controller.AvatarCreateHandler(avatarData, req.userId);
        if (!result.success) throw new Error(result.error);

        return res.status(200).json(new Response(true, "ok", result));
    } catch (err)
    {
        return res.status(500).json(new Response(false, err.message, {}));
    }
});


router.put('/:id', async (req, res) => 
{
    try
    {
        const erro = avatar_controller.checkData(req.body);
        if (erro)
            throw new UserError(ErrorStatus.Error, erro);


        const user = req.userData;
        const isAdmin = adminRoles.includes(user.role);
        const avatarValid = await repo.Avatar.findByPk(req.params.id);

        if (!avatarValid)
            throw new UserError(1, "Avatar not found");

        if (!isAdmin)
            if (avatarValid.userId != req.userId)
                throw new UserError(1, "Unauthorized");


        await repo.Avatar.update(req.body, { where: { id: req.params.id } });
        const avatarInstance = await repo.Avatar.findByPk(req.params.id);
        const avatar = avatarInstance.get({ plain: true });
        res.status(200).send(new Response(true, "ok", avatar));
    }
    catch (err)
    {
        if (err instanceof UserError)
        {
            return res.status(401).json(new Response(false, err.message, {}));
        }
        console.error(err);
        return res.status(500).json(new Response(false, err.message, {}));
    }
});

router.delete('/:id', async (req, res) => 
{
    try
    {
        const avatar = await repo.Avatar.findByPk(req.params.id);
        if (!avatar)
            throw new UserError(1, "Avatar not found");

        const isAdmin = adminRoles.includes(req.userData.role);

        if (!isAdmin && avatar.userId != req.userId)
            throw new UserError(1, "Unauthorized");

        const result = await avatar_controller.AvatarDeleteHandle(req.params.id);

        if (!result.success)
            throw new UserError(1,result.error);

        return res.json(new Response(true, "ok", {}));

    } catch (err)
    {
        if(err instanceof UserError)
        {
            return res.status(401).json(new Response(false, err.message, {}));
        }
        console.error(err);
        return res.status(500).json(new Response(false, err.message, {}));
    }
});


module.exports = router;