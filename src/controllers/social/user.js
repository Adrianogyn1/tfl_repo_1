const { RAW } = require("sequelize/lib/query-types");
const repo = require('../../repositories/repository');// require("../../../repository");
const router = require("express").Router();
const auth = require("../auth");
const querySearch = require('../../repositories/repository').parseQueryStringToWhere;

router.use(auth.auth);
router.get("/", async (req, res) =>
{
  const qtd = req?.query?.qtd || req?.body?.qtd;
  const page = req?.query?.page || req?.body?.page;
  const q = req?.query?.q || req?.body?.q || "";
  const search = querySearch(q);

  const limit = parseInt(qtd, 10) || 25;
  const currentPage = parseInt(page, 10) || 1;//≃

  // O offset define quantos registros pular (antigo startIndex)
  const offset = (currentPage - 1) * limit;

  // Busca direto no banco aplicando o limite e paginação nativos
  const paginatedUsers = await repo.User.findAll({
    where: search,
    limit: limit,
    offset: offset,
    raw: true,
  });
  const allId = paginatedUsers.map((u) => u.id);
  const allPhotos = await repo.Photo.findAll({
    where: { userId: allId },
    raw: true,
  });

  const final = paginatedUsers.map((user) =>
  {
    const userPhotos = allPhotos.filter((p) => p.userId === user.id);
    return { ...user, photo: userPhotos[0]?.url || "" };
  });

  // Retorna 'final' em vez de 'paginatedUsers' para incluir as fotos
  return res.json({ success: true, data: final });
});

router.get("/:id",async (req, res)=>
{
  const userId = parseInt(req?.params?.id, 10);
const user = await getFullUser(userId);
  return res.json({ success: true, data: user });
}
);

async function getFullUser(userId) {
  const { getAvatarByUser: avatarInfo} = require("../game/avatar/avatar_controller");
  const user = await repo.User.findOne({
    where: { id: userId },
    plain: true
  });

  const avatars = await avatarInfo(userId)
  user.avatars = avatars??[];
  user.avatar = avatars[0]??{};
  user.avatarId = avatars[0]?.id??-1;
  return user;
}



router.put("/:id", async (req,res)=>{
  res.json({success: false});
});
router.delete("/:id", async (req,res)=>{
  res.json({success: false});
});
router.post("/", async (req,res)=>{
  res.json({success: false});
});








module.exports = {

  router,
};
