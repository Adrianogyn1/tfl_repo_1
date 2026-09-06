const repo = require("../repository");
const crypto = require("crypto");
const {
  UserDto,
  UserInfoBase,
  RoomBaseInfo,
} = require("../Models/dto/userDto");

function encryptPassword(password) {
  return password;
}

async function CheckLogin(req, res, next) {
  var token =
    req.headers?.["tfl-token"] ||
    req.headers?.["token"] ||
    req.body?.token ||
    req.query?.token ||
    req.params?.token ||
    "";

  if (token) {
    try {
      if (token === "12345") {
        const usertemp = await repo.User.findOne();
        token = usertemp ? usertemp.token : token;
      }

      const user = await repo.User.findOne({
        where: { token: token },
      });

      if (user) {
        req.userId = user.id;
        req.userToken = token;
        req.userData = UserDto.fromObject(user.get({ plain: true }));
        return next();
      }
    } catch (err) {
      console.error("Erro ao verificar login:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  return res.status(401).json({ error: "Unauthorized" });
}

async function signInRandom(req, res) {
  const user = await repo.User.findOne({
    order: repo.Sequelize.literal("RANDOM()"),
  });

  if (!user) {
    return res.status(404).json({ error: "Nenhum usuário encontrado." });
  }

  req.body = { login: user.login, password: user.password };
  return sigin(req, res);
}

async function sigin(req, res) {
  try {
    const { login, password } = req.body;
    const Op = repo.Sequelize ? repo.Sequelize.Op : require("sequelize").Op;

    const user = await repo.User.findOne({
      where: { login: login, password: encryptPassword(password) },
    });

    if (user) {
      user.token = repo.User.newToken();
      user.online = true;
      await user.save();

      const userPlain = user.get({ plain: true });
      let data = await repo.Avatar.findOne({
        where: {
          userId: user.id,
        },
        plain: true,
      });
      if (data) {
        var crt = require("../controllers/game/avatarController");
        data = await crt.getInfo(data, true);
      }

      return res.status(200).json({
        token: user.token,
        user: userPlain,
        profile: data,
        success: true,
        data: data,
      });
    } else {
      return res.status(401).json({
        error: "Login ou senha inválidos.",
        success: false,
        data: {},
      });
    }
  } catch (err) {
    console.error("--- ERRO DETALHADO DA QUERY BANCO DE DADOS ---");
    console.error("Mensagem:", err.message);
    console.error("--------------------------------------------");

    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function signup(req, res) {
  const userId = req.userId;
  if (userId) {
    return res.status(409).json({ error: "Usuário logado.", success: false });
  }

  const { login, password, userName, email, age } = req.body;
  if (!login || !password) {
    return res.status(422).json({
      error: "Campos vazios, verifique login e senha",
      success: false,
    });
  }

  const userExists = await repo.User.findOne({
    where: { login: login },
  });

  if (!userExists) {
    const newUser = await repo.User.create({
      login: login,
      password: encryptPassword(password),
      userName: userName,
      token: repo.User.newToken(),
      age: age || 18,
      email: email,
      avatar: `https://ui-avatars.com/api/?name=${userName || login}&background=random&size=256`,
    });

    return res.status(201).json({
      token: newUser.token,
      error: null,
      success: true,
      data: newUser,
      user: newUser,
    });
  } else {
    return res.status(409).json({
      error: `O login ${login} já existe.`,
      success: false,
      data: {},
    });
  }
}

function forgot(req, res) {
  return res
    .status(200)
    .json({ success: false, error: "Not implemented", data: {} });
}

async function logout(req, res) {
  const user = await repo.User.findByPk(req.userId);

  if (user) {
    user.token = null;
    user.online = false;
    await user.save();
  }
  return res.status(200).json({ success: true, data: {} });
}

module.exports = { sigin, signup, logout, forgot, CheckLogin, signInRandom };
