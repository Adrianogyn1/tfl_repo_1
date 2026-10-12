const { where } = require("sequelize");
const repo = require("../../../repositories/repository.js");
require("dotenv").config();
const REGISTER_VALUE_BONUS = process.env.REGISTER_VALUE_BONUS || 100;

function checkData(avatarData)
{
  let error = "";
  try
  {
    if (!avatarData) throw new Error("Dados do avatar são obrigatórios.");

    if (!avatarData.name) throw new Error("O nome do avatar é obrigatório.");
  } catch (e)
  {
    error = e.message;
  }
  return error;
}

async function create(avatarData)
{
  try
  {
    var result = await AvatarCreateHandler(avatarData, req.userId);
    if (!result.success) throw new Error(result.error);

    return res.status(200).json(result);
  } catch (err)
  {
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function findByPk(req, res)
{
  try
  {
    const full = req.query?.full || req.body?.full || false;
    const avatarInstance = await repo.Avatar.findByPk(req.params.id);
    if (!avatarInstance)
    {
      return res.json({ error: "Avatar not found", success: false });
    }

    let avatar = avatarInstance.get({ plain: true });
    avatar = await getInfo(avatar, full);
    return res.json({
      success: true,
      data: avatar,
    });
  } catch (err)
  {
    return res.json({ error: err.message, success: false });
  }
}

async function get(req, res)
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
    return res.json({
      success: true,
      data: await getInfo(avatar, full),
    });
  } catch (err)
  {
    return res.json({ error: err.message, success: false });
  }
}

async function getAll(req, res)
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
      avatar = await getInfo(avatar, full);
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
      nextPage: nextPageNum,
    });
  } catch (err)
  {
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function getAvatarInfo(avatarId, full = false)
{

  let data = await repo.Avatar.findByPk(avatarId);
  if (!data) return null;
  if (!full) return data;

  return await getInfo(data.get({ plain: true }), full);
}
async function getAvatarByUser(userId)
{
  const avatarsIds = await repo.Avatar.findAll({
    where: {
      userId: userId
    },
    attributes: ['id']
  }, { raw: true });
  let avatars = [];
  for (const avatarId of avatarsIds)
  {
    avatars.push(await getAvatarInfo(avatarId.id, true));
  }
  return avatars;
}

async function getInfo(avatar, full = false)
{
  let data = avatar;
  if (data)
  {
    data.vip = data.vipExpiresAt >= new Date();
    data.currentRoom = null;
    data.rooms = [];
    //

    data.friends = {};
    data.ignored = {};
    data.friendRequestsSent = {};
    data.friendRequestsReceived = {};
    data.friendRequestsReceived = {};
    data.followersList = {};
    data.followingList = {};
    //counts
    data.followers = 0;
    data.friendCount = 0;
    data.followersCount = 0;
    data.followingCount = 0;

    if (full)
    {
      //pode trazer milhares de resultados
      const roomInfo = require("../rooms_controllers.js");
      data.rooms = await roomInfo.__getAllRoomFromProfile(avatar.id, true);
      data.wallet = await repo.Currency.findOne({ where: { ownerId: avatar.id }, });
      if (!data.wallet)
      {
        data.wallet = await repo.Currency.create({ ownerId: avatar.id, userId: avatar.userId });
      }
      data.wallet.registers = await repo.CurrencyRegister.findAll({ where: { ownerId: avatar.id }, limit: 250 }) ?? [];
     data.Posts = await repo.Post.findAll({ where: { ownerId: avatar.id }, limit: 250 }) ?? [];
      //friends
    //  data.friends = await repo.Friend.findAll({ where: { userId: avatar.id, status: "accepted" } });
     /* data.ignored = await repo.Friend.findAll({ where: { userId: avatar.id, status: "ignored" } });
      data.friendRequestsSent = await repo.Friend.findAll({ where: { userId: avatar.id, status: "sent" } });
      data.friendRequestsReceived = await repo.Friend.findAll({ where: { userId: avatar.id, status: "received" } });
      data.followersList = await repo.Follow.findAll({ where: { userId: avatar.id, status: "accepted" } });
      data.followingList = await repo.Follow.findAll({ where: { userId: avatar.id, status: "accepted" } });
      //counts
      data.followers = await repo.Follow.count({ where: { userId: avatar.id, status: "accepted" } });
      data.friendCount = await repo.Friend.count({ where: { userId: avatar.id, status: "accepted" } });
      data.followersCount = await repo.Follow.count({ where: { userId: avatar.id, status: "accepted" } });
      data.followingCount = await repo.Follow.count({ where: { userId: avatar.id, status: "accepted" } });
*/
    }
  } else
  {
    data = null;
  }
  return data;
}

async function update(req, res)
{
  try
  {
    const erro = checkData(req.body);
    if (erro)
    {
      return res.status(400).json({ error: erro, success: false });
    }

    const adminRoles = ["admin", "moderador", "desenvolvedor", "ownner"];
    const user = req.userData;
    const isAdmin = adminRoles.includes(user.role);
    const avatarValid = await repo.Avatar.findByPk(req.params.id);

    if (!avatarValid)
    {
      return res
        .status(404)
        .json({ error: "Avatar not found", success: false });
    }

    if (!isAdmin)
    {
      if (avatarValid.userId != req.userId)
      {
        return res.status(401).json({ error: "Unauthorized", success: false });
      }
    }

    await repo.Avatar.update(req.body, { where: { id: req.params.id } });

    const avatarInstance = await repo.Avatar.findByPk(req.params.id);
    const avatar = avatarInstance.get({ plain: true });

    return res.json({
      success: true,
      data: avatar,
    });
  } catch (err)
  {
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function remove(req, res)
{
  try
  {
    const avatar = await repo.Avatar.findByPk(req.params.id);
    if (!avatar)
      return res
        .status(404)
        .json({ error: "Avatar not found", success: false });

    const adminRoles = ["admin", "moderador", "desenvolvedor", "ownner"];
    const isAdmin = adminRoles.includes(req.userData.role);

    if (!isAdmin && avatar.userId != req.userId)
    {
      return res.status(401).json({ error: "Unauthorized", success: false });
    }

    const result = await AvatarDeleteHandle(req.params.id);
    if (!result.success) throw new Error(result.error);

    return res.json({ success: true, message: "Avatar deleted successfully" });
  } catch (err)
  {
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function AvatarCreateHandler(avatar, userID)
{
  try
  {
    const error = checkData(avatar);
    if (error) throw new Error(error);
    if (!userID) throw new Error("O userId é obrigatório.");

    const avatarData = avatar;
    avatarData.userId = userID;

    delete avatarData.uid;
    delete avatarData.id;
    avatar.vipExpires = new Date().setMonth(-1);

    const count = await repo.Avatar.count({ where: { userId: userID } });
    let newAvatar = null;
    await repo.sequelize.transaction(async (t) =>
    {
      //cria um avatar
      newAvatar = await repo.Avatar.create(avatarData, {
        transaction: t,
      });

      //cria um room para o avatar
      const room = await repo.Room.create(
        {
          ownnerId: newAvatar.id,
          name: newAvatar.name,
          scene: "lobby",
          ownnerID: newAvatar.userId,
          userId: newAvatar.userId,
        },
        { transaction: t },
      );
      //da uma moedas para ele
      if (count == 0)
      {
        const handleCoins = require("../currencyRegister_controller.js");
        const result = await handleCoins.CreateCurrencyRegister(
          {
            userId: newAvatar.userId,
            ownnerId: newAvatar.id,
            value: REGISTER_VALUE_BONUS,
            type: "Coins",
            transactionType: "Rewards",
          },
          newAvatar.userId,
          t,
        );

        if (!result.success) throw new Error(result.error);
      }
    });

    const avatarVal = await getAvatarInfo(newAvatar.id, true);
    return { success: true, profile: avatarVal, data: avatarVal, error: "" };
  } catch (e)
  {
    console.log(e);
    return { success: false, data: null, error: e.message };
  }
}

async function AvatarDeleteHandle(avatarID)
{
  try
  {
    const avatar = await repo.Avatar.findByPk(avatarID);
    if (!avatar) throw new Error("Avatar não encontrado.");

    const files = await repo.FileInfo.findAll({ where: { uid: avatar.uid } });

    await repo.sequelize.transaction(async (t) =>
    {
      await repo.Avatar.destroy({ where: { id: avatarID }, transaction: t });
      for (const [key, model] of Object.entries(repo.sequelize.models))
      {
        if (key !== "FileInfo" && model.rawAttributes.uid)
        {
          //  await model.destroy({ where: { uid: avatar.uid }, transaction: t });
          continue;
        }
        if (key === "CurrencyRegister" && model.rawAttributes.target_uid)
        {
          //  await model.destroy({ where: { target_uid: avatar.uid }, transaction: t });
          continue;
        }
      }
    });

    for (const file of files)
    {
      try
      {
        if (file.inCdn)
        {
          await cloudinary.uploader.destroy(file.publicId);
        } else
        {
          const fullPath = path.join(UPLOAD_DIR, file.url.split("/").pop());
          if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }
        await repo.FileInfo.destroy({ where: { target_uid: file.id } });
      } catch (e)
      {
        console.error("Erro ao deletar arquivo externo:", e.message);
      }
    }
    return { success: true, error: "" };
  } catch (e)
  {
    return { success: false, error: e.message };
  }
}



module.exports = {
  checkData,
  AvatarCreateHandler,
  AvatarDeleteHandle,
  getInfo,
  getAvatarInfo,
  getAvatarByUser
};
