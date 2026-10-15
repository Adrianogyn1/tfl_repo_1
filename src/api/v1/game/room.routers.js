const router = require("express").Router();
const repo = require("../../../repositories/repository.js");
const { Response, ResponseList } = require("../response");
const resolveAvatar = require("../../../middlewares/resolveAvatar");
const {
  enterRoomWithPassAndVisit,
  getRoomActiveServerInstances,
  allocateOrReplicateRoomServerInstance
} = require("../../../services/coinMarket.service.js");

// Aplica autenticação e resolução segura de avatar (anti-IDOR)
router.use(resolveAvatar);

/**
 * GET /api/v1/game/rooms
 * Lista salas públicas disponíveis com contagem de instâncias e jogadores.
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const rooms = await repo.Room.findAndCountAll({
      limit,
      offset,
      order: [
        ['boostExpiresAt', 'DESC NULLS LAST'],
        ['monthlyVisits', 'DESC'],
        ['id', 'ASC']
      ]
    });

    return res.status(200).json(new ResponseList(true, "Salas carregadas com sucesso", rooms.rows, rooms.count, offset, offset + limit < rooms.count ? Math.ceil((offset + limit) / limit) + 1 : 0));
  } catch (err) {
    return res.status(500).json(new Response(false, err.message, {}));
  }
});

/**
 * GET /api/v1/game/rooms/:id
 * Retorna detalhes da sala e objetos 3D posicionados.
 */
router.get('/:id', async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const room = await repo.Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json(new Response(false, "Sala não encontrada", {}));
    }

    const roomObjects = await repo.RoomObject ? await repo.RoomObject.findAll({ where: { roomId } }) : [];

    return res.status(200).json(new Response(true, "Dados da sala", {
      room: room.get ? room.get({ plain: true }) : room,
      objects: roomObjects
    }));
  } catch (err) {
    return res.status(500).json(new Response(false, err.message, {}));
  }
});

/**
 * POST /api/v1/game/rooms/:id/join (ou /enter)
 * Instancia/aloca servidor dedicado para a sala e responde a solicitação para o App/jogo conectar.
 */
router.post(['/:id/join', '/:id/enter'], async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const user = req.user || req.session?.user;
    const avatar = req.avatar;
    const password = String(req.body.password || '');

    const result = await enterRoomWithPassAndVisit({
      roomId,
      visitorAvatarId: avatar.id,
      visitorUserId: user.id,
      password,
      preferredServerId: req.body.serverId ? Number(req.body.serverId) : null,
      preferredServerUid: req.body.serverUid || null
    });

    if (!result.success) {
      return res.status(400).json(new Response(false, result.error || "Erro ao alocar servidor", {}));
    }

    return res.status(200).json(new Response(true, "Servidor instanciado e alocado com sucesso", {
      roomId,
      server: result.server || {
        host: process.env.GAME_SERVER_HOST || "127.0.0.1",
        port: result.port || 8990,
        protocol: process.env.NODE_ENV === "production" ? "wss" : "ws"
      },
      ticket: result.ticket || `tkt_${Date.now()}_${avatar.id}`,
      passCharged: Boolean(result.passCharged),
      entryFeePaid: result.entryFeePaid || 0
    }));
  } catch (err) {
    return res.status(500).json(new Response(false, err.message, {}));
  }
});

/**
 * POST /api/v1/game/rooms/:id/replicate
 * Replica ou provisiona nova instância de servidor dedicado quando a sala atinge lotação máxima.
 */
router.post('/:id/replicate', async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const allocation = await allocateOrReplicateRoomServerInstance({
      roomId,
      forceNewReplica: true,
      joinPlayer: false
    });

    return res.status(200).json(new Response(true, "Nova instância replicada com sucesso", allocation));
  } catch (err) {
    return res.status(500).json(new Response(false, err.message, {}));
  }
});

module.exports = router;