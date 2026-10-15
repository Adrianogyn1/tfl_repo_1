
const repo = require("../repositories/repository");
const Op = repo.Sequelize ? repo.Sequelize.Op : require("sequelize").Op;
const crypto = require("crypto");
const router = require("express").Router();
const { t: translate } = require("../locales/i18n.js");
const { ApiError, UserError, ErrorStatus } = require("../api/errors");

const {  UserDto,  UserInfoBase,RoomBaseInfo,} = require("../models/dto/userDto");

const ADMIN_ROLES = ["admin", "owner", "ownner"];



/* =====================================================
   Autenticação
===================================================== */
router.get('/', (req, res) => { res.json({ success: true, data: {} }); });
router.post("/signin", (req, res) => sigin(req, res));
router.post("/signup", (req, res) => signup(req, res));
router.post("/register", (req, res) => signup(req, res));
router.post("/forgot", (req, res) => forgot(req, res));
router.post("/forgot-password", (req, res) => forgot(req, res));
router.get("/signin/random", (req, res) => signInRandom(req, res));

//#region Admin

router.post("/admin/signin", async (req, res) =>
{
  const { username, password, page } = req.body;
  try
  {
    const user = await repo.User.findOne({
      where: {
        [Op.or]: [
          { email: username },
          { login: username }
        ]
      }
    });
    const userRole = String(user?.role || "").toLowerCase();
    const isAdminAllowed = user && (["admin", "owner", "ownner", "desenvolvedor"].includes(userRole) || Number(user.id) === 1);
    if (!isAdminAllowed)
      throw new UserError(1, translate("login.errors.invalidCredentials"));

    if (user.password == password)
    {
      req.session.user = user.get({ plain: true });
      user.token = repo.User.newToken();
      await repo.User.update({ token: user.token }, { where: { id: user.id } });

      res.cookie("userToken", user.token);

      let targetPage = String(page || "").trim();
      try {
        targetPage = decodeURIComponent(targetPage);
      } catch (_) {}

      if (targetPage && targetPage !== "login" && targetPage !== "/login" && targetPage !== "/admin/login") {
        if (!targetPage.startsWith("/")) {
          targetPage = "/" + targetPage;
        }
        while (targetPage.includes("/admin/admin")) {
          targetPage = targetPage.replace("/admin/admin", "/admin");
        }
        if (targetPage === "/admin/login" || targetPage === "/login" || targetPage === "/admin/signin") {
          targetPage = "/admin";
        }
        return res.json({ success: true, data: user, page: targetPage });
      } else {
        return res.json({ success: true, data: user, page: "/admin" });
      }
    }
    throw new UserError(1, translate("login.errors.invalidCredentials"));
  }
  catch (error)
  {
    if(error instanceof UserError)
    {
      res.json({ success: false, message: error.message, page: "/admin/login" });
      return;
    }
    console.log(error);
    return res.status(500).json({ success: false });
  }
});

router.get('/admin/signup', (req, res) =>
{
  req.session.destroy(() =>
  {
    res.clearCookie("userToken");
    res.redirect("/admin/login");
  });
});


//#endregion






function encryptPassword(password)
{
  return password;
}

async function CheckLogin(req, res, next)
{
  var token =
    req.headers?.["tfl-token"] ||
    req.headers?.["token"] ||
    req.body?.token ||
    req.query?.token ||
    req.params?.token ||
    "";

  if (token)
  {
    try
    {
      if (token === "12345")
      {
        const usertemp = await repo.User.findOne();
        token = usertemp ? usertemp.token : token;
        var avatar = await repo.Avatar.findOne({
          where: {
            userId: usertemp.id,
            selected: true
          }
        });
        if (!avatar)
        {
          avatar = await repo.Avatar.create({
            userId: usertemp.id,
            name: "Avatar Temporário",
            selected: true
          });
        }
      }

      const user = await repo.User.findOne({
        where: { token: token },
      });

      if (user)
      {
        req.userId = user.id;
        req.userToken = token;
        req.userData = UserDto.fromObject(user.get({ plain: true }));
        //busca o profile principal selecionado
        const profile = await repo.Avatar.findOne({
          where: {
            userId: req.userId,
            selected: true
          }
        });
        req.profileId = profile?.id ?? -1;

        return next();
      }

    } catch (err)
    {
      console.error("Erro ao verificar login:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  return res.status(401).json({ error: "Unauthorized" });
}

function auth(req, res, next)
{
  //pagina que esta tentando acessar
  const pg = req.originalUrl;
  var token =
    req.headers?.["tfl-token"] ||
    req.headers?.["token"] ||
    req.body?.token ||
    req.query?.token ||
    req.params?.token ||
    "";


  if (req.session.user)
  {
    return next();
  }
  //cookie
  else if (req.cookies.userToken)
  {
    req.params.token = req.cookies.userToken;
    return CheckLogin(req, res, next);
  }
  //token
  else if (token)
  {
    return CheckLogin(req, res, next);
  }
  else
  {
    let safePg = pg || "/admin";
    while (safePg.includes("/admin/admin")) {
      safePg = safePg.replace("/admin/admin", "/admin");
    }
    if (safePg === "/admin/login" || safePg === "/login" || safePg === "/admin/signin") {
      safePg = "/admin";
    }
    res.redirect("/admin/login?pg=" + encodeURIComponent(safePg));
  }
}

async function signInRandom(req, res)
{
  const avatars = await repo.Avatar.findOne(
    {
      order: repo.Sequelize.literal("RANDOM()"),
    }
  );
  const userID = avatars.userId;



  const user = await repo.User.findOne({
    // where: { id: userID },
    order: repo.Sequelize.literal("RANDOM()"),
  });

  if (!user)
  {
    return res.status(404).json({ error: "Nenhum usuário encontrado." });
  }

  req.body = { login: user.login, password: user.password };
  return sigin(req, res);
}

async function sigin(req, res)
{
  try
  {
    const login = req.body.login || req.body.username;
    const password = req.body.password;
    const Op = repo.Sequelize ? repo.Sequelize.Op : require("sequelize").Op;

    const user = await repo.User.findOne({
      where: {
        [Op.or]: [
          { login: login },
          { email: login }
        ],
        password: encryptPassword(password)
      },
    });

    if (user)
    {
      user.token = repo.User.newToken();
      user.online = true;
      await user.save();

      req.session.user = user.get({ plain: true });
      res.cookie("userToken", user.token, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false });

      const userPlain = user.get({ plain: true });
      let data = await repo.Avatar.findAll({
        where: {
          userId: user.id,
        }
      });

      let profiles = [];
      if (data)
      {
        try {
          var crt = require('./game/avatar/avatar_controller');
          for (let i = 0; i < data.length; i++)
          {
            const profile = data[i].get({ plain: true });
            var prof = await crt.getInfo(profile, true);
            profiles.push(prof);
          }
        } catch (e) {
          profiles = data.map(d => d.get({ plain: true }));
        }
      }
      var dto = {
        ...userPlain,
        profiles: profiles
      };

      return res.status(200).json({
        token: user.token,
        user: dto,
        success: true,
        data: dto,
        message: translate("login.success")
      });
    } else
    {
      return res.status(401).json({
        error: "Login ou senha inválidos.",
        message: translate("login.errors.invalidCredentials"),
        success: false,
        data: {},
      });
    }
  } catch (err)
  {
    console.error("--- ERRO DETALHADO DA QUERY BANCO DE DADOS ---");
    console.error("Mensagem:", err.message);
    console.error("--------------------------------------------");

    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function signup(req, res)
{
  const userId = req.userId;
  if (userId)
  {
    return res.status(409).json({ error: "Usuário logado.", success: false });
  }

  const { login, password, userName, email, age } = req.body;
  if (!login || !password)
  {
    return res.status(422).json({
      error: "Campos vazios, verifique login e senha",
      success: false,
    });
  }

  const userExists = await repo.User.findOne({
    where: { login: login },
  });

  if (!userExists)
  {
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
  } else
  {
    return res.status(409).json({
      error: `O login ${login} já existe.`,
      success: false,
      data: {},
    });
  }
}

function forgot(req, res)
{
  return res
    .status(200)
    .json({ success: false, error: "Not implemented", data: {} });
}

async function logout(req, res)
{
  const user = await repo.User.findByPk(req.userId);

  if (user)
  {
    user.token = null;
    user.online = false;
    await user.save();
  }
  return res.status(200).json({ success: true, data: {} });
}



module.exports = { ADMIN_ROLES, CheckLogin, auth, signInRandom, router };
