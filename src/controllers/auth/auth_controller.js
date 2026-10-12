
const repo = require("../../repositories/repository");
const Op = repo.Sequelize ? repo.Sequelize.Op : require("sequelize").Op;
const crypto = require("crypto");
const { ApiError, UserError, ErrorStatus } = require('../../api/errors');
const { t: translate } = require("../../locales/i18n");
const {SendEmailRegister, SendEmailForgot} = require('../../services/email.service');

const ADMIN_ROLES = ["admin", "owner", "ownner"];

function encryptPassword(password)
{
  return password;
}
async function signInRandom()
{
  const avatars = await repo.Avatar.findOne(
    {
      order: repo.Sequelize.literal("RANDOM()"),
    }
  );
  const userID = avatars.userId;
  const user = await repo.User.findOne({
    order: repo.Sequelize.literal("RANDOM()"),
  });
  return sigin(user.login, user.password);
}

async function sigin(login, password)
{
  try
  {
    if (!login || !password)
      throw new UserError(1, translate("login.invalidCredentials"));

    const Op = repo.Sequelize ? repo.Sequelize.Op : require("sequelize").Op;
    const user = await repo.User.findOne({
      where: { login: login, password: encryptPassword(password) },
    });
    if (!user)
      throw new UserError(1, translate("login.invalidCredentials"));


    user.token = repo.User.newToken();
    user.online = true;
    await user.save();

    const userPlain = user.get({ plain: true });
    let data = await repo.Avatar.findAll({
      where: {
        userId: user.id,
      }
    });

    let profiles = [];
    if (data)
    {
      var crt = require('./game/avatar/avatar_controller');
      //profiles = await crt.getInfo(data.get({ plain: true }), true);
      for (let i = 0; i < data.length; i++)
      {
        const profile = data[i].get({ plain: true });
        var prof = await crt.getInfo(profile, true);
        var looby = prof?.rooms?.map(room =>
        {
          return { room: room.scene == "lobby" ? room : null }
        })[0] ?? null;

        profiles.push(prof);
      }


    }
    var dto = {
      ...userPlain,
      profiles: profiles
    };

    return {
      token: user.token,
      user: dto,
      data: {},
      message: translate("login.success"),
      success: true
    };

  } catch (err)
  {
    if (err instanceof UserError)
    {
      return {
        message: err.message,
        success: false
      };
    }

    console.error("--- ERRO DETALHADO DA QUERY BANCO DE DADOS ---");
    console.error("Mensagem:", err.message);
    console.error("--------------------------------------------");

    return false;
  }
}

async function signup(user)
{
  try
  {
    const { login, password, userName, email, birthDate } = user;
    if (!login || login.length < 3)
      throw new UserError(1, translate("register.errors.loginRequired"));
    if (!password || password.length < 5)
      throw new UserError(1, password.length < 5 ? translate("common.errors.passwordTooShort", { min: 5 }) : translate("common.passwordRequired"));
    if (!userName || userName.length < 3)
      throw new UserError(1, translate("common.errors.userNameRequired"));
    if (!email || email.length < 10 || !email.includes("@"))
      throw new UserError(1, translate("common.errors.emailRequired"));

    const age = birthDate ? new Date().getFullYear() - new Date(birthDate).getFullYear() : null;
    if (!age || age < 18)
      throw new UserError(1, translate("register.errors.ageRestriction"));

    const userExists = await repo.User.findOne({ where: { login: login, [Op.or]: [{ email: email }] }, });

    if (userExists)
      throw new UserError(1, translate("register.errors.registered"));

    const newUser = await repo.User.create({
      login: login,
      password: encryptPassword(password),
      userName: userName,
      token: repo.User.newToken(),
      age: age || 18,
      email: email,
      avatar: `https://ui-avatars.com/api/?name=${userName || login}&background=random&size=256`,
    });

    const result = await SendEmailRegister(user);

    return res.status(201).json({
      token: newUser.token,
      error: null,
      success: true,
      data: newUser,
      user: newUser,
    });
  }
  catch (error)
  {
    if (error instanceof UserError)
    {
      return {
        message: error.message,
        success: false
      };
    }
    console.log(error);
    return false;
  }
}

function forgot()
{
  throw new ApiError(500, "Not implemented");
}

async function logout(req)
{
  try
  {
    if (!req) throw new ApiError(500, "req invalid");
    if (!req.userId) throw new UserError(1, translate("common.errors.unauthorized"));

    const user = await repo.User.findByPk(req.userId);
    if (!user) throw new UserError(1, translate("common.errors.unauthorized"));

    user.token = null;
    user.online = false;
    await user.save();

    return {
      success: true,
      data: {},
      message: translate("logout.success")
    };
  }
  catch (err)
  {
    if (err instanceof UserError)
    {
      return {
        message: err.message,
        success: false
      };
    }

    console.log(err);
    return false;
  }
}



module.exports = { ADMIN_ROLES, CheckLogin, auth, signInRandom, router };
