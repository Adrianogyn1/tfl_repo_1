const router = require('express').Router();
const repo = require('../../repositories/repository');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const { uploadMedia, streamMediaProxy } = require('../../services/storage.service');
const { generateAvatarName, generateRoomName } = require('../../services/nameGenerator.service');
const {
  createSellOrder,
  cancelSellOrder,
  buyCoins,
  getMarketStats,
  getEconomyRules,
  updateEconomyRules,
  requestWithdraw,
  cancelWithdraw,
  reviewPaymentTransaction,
  convertCurrency,
  enrichRoomsWithVisitStats,
  enterRoomWithPassAndVisit,
  getRoomVisitDetails,
  recordLedgerEntry,
  getWalletLedger,
  createNotification,
  getNotifications,
  markNotificationsRead,
  transferCoinsBetweenPlayers,
  getVipStatus,
  enrichAvatarsWithVip,
  purchaseVipSubscription,
  getPublicRoomsExplorer,
  boostRoom24h,
  playCasinoGame,
  getRoomActiveServerInstances,
  allocateOrReplicateRoomServerInstance,
} = require('../../services/coinMarket.service');
const { getPlatformStats, recordSiteVisit } = require('../../services/stats.service');
const {
  SHOP_3D_RULES,
  listShopCatalog,
  getAvatarWardrobe,
  buyShopItem,
  giftShopItem,
  toggleEquipItem,
  saveOutfitStyle,
  applyOutfitStyle,
  deleteOutfitStyle,
} = require('../../services/shop3d.service');
const {
  DIARY_MOODS,
  DIARY_CATEGORIES,
  DIARY_REACTIONS,
  getDiaryOverview,
  saveDiaryPage,
  toggleDiaryPageVisibility,
  deleteDiaryPage,
  reactToDiaryPage,
  commentOnDiaryPage,
  deleteDiaryComment,
  recordDiaryReadingProgress,
} = require('../../services/diary.service');
const i18n = require('../../locales/i18n');
const { chatWs } = require('../social/chat_controller');

/**
 * Carrega lista de amigos aceitos, solicitações pendentes (recebidas/enviadas) e sugestões de avatares
 */
async function loadAvatarFriendsData(activeAvatarId) {
  const Op = repo.Sequelize.Op;
  const pId = Number(activeAvatarId);
  const pStr = String(activeAvatarId);

  const allFriendRows = await repo.Friend.findAll({
    where: {
      [Op.or]: [
        { profileId: pId },
        { targetProfileId: pId },
        { userId: pStr },
        { targetId: pStr },
      ],
    },
    order: [["updatedAt", "DESC"]],
  });

  const relatedAvatarIds = new Set([pId]);
  const normalizedRows = allFriendRows.map((row) => {
    const plain = row.get({ plain: true });
    const fromId = Number(plain.profileId || plain.userId || 0);
    const toId = Number(plain.targetProfileId || plain.targetId || 0);
    if (fromId) relatedAvatarIds.add(fromId);
    if (toId) relatedAvatarIds.add(toId);
    return { ...plain, fromId, toId };
  });

  const avatarsList = await repo.Avatar.findAll({
    where: { id: { [Op.in]: Array.from(relatedAvatarIds) } },
    attributes: ["id", "name", "thumbnail", "coverUrl", "gender", "bio", "uid"],
  });
  const avatarMap = new Map(avatarsList.map((a) => [Number(a.id), a.get({ plain: true })]));

  const friendsList = [];
  const pendingReceived = [];
  const pendingSent = [];

  for (const row of normalizedRows) {
    const otherId = row.fromId === pId ? row.toId : row.fromId;
    const otherAvatar = avatarMap.get(otherId);
    if (!otherAvatar) continue;

    if (row.status === "accepted") {
      friendsList.push({
        friendshipId: row.id,
        since: row.updatedAt,
        avatar: otherAvatar,
      });
    } else if (row.status === "pending") {
      if (row.toId === pId) {
        pendingReceived.push({
          friendshipId: row.id,
          createdAt: row.createdAt,
          avatar: otherAvatar,
        });
      } else if (row.fromId === pId) {
        pendingSent.push({
          friendshipId: row.id,
          createdAt: row.createdAt,
          avatar: otherAvatar,
        });
      }
    }
  }

  // Sugestões de avatares que ainda não têm vínculo de amizade com este avatar (padrão 20 por página)
  const suggestedRaw = await repo.Avatar.findAll({
    where: {
      id: { [Op.notIn]: Array.from(relatedAvatarIds) },
    },
    attributes: ["id", "name", "thumbnail", "gender", "bio", "uid"],
    order: [["id", "DESC"]],
    limit: 20,
  });

  return {
    friendsList,
    pendingReceived,
    pendingSent,
    suggestedAvatars: suggestedRaw.map((a) => a.get({ plain: true })),
  };
}

// ================= ROTA DE PROXY DE IMAGENS (PROTEGENDO STORAGE/CDN) =================
router.get('/media/:id', async (req, res) => {
  try {
    const file = await repo.FileInfo.findByPk(req.params.id);
    if (!file || !file.url) return res.status(404).send("Imagem não encontrada");
    return await streamMediaProxy(file.url, res);
  } catch (err) {
    return res.status(500).send("Erro ao obter imagem");
  }
});

// ================= GERADORES DE NOMES ALEATÓRIOS (DADOS) =================
router.get('/random/avatar-name', (req, res) => {
  const gender = parseInt(req.query.gender, 10) || 1;
  const name = generateAvatarName(gender);
  return res.json({ success: true, name });
});

router.get('/random/room-name', (req, res) => {
  const name = generateRoomName();
  return res.json({ success: true, name });
});

// ================= TROCA DE IDIOMA (I18N) =================
router.post('/locale', (req, res) => {
  const lang = i18n.normalizeLocale(req.body?.lang || req.query?.lang || 'pt-BR');
  res.cookie('lang', lang, { maxAge: 365 * 24 * 60 * 60 * 1000, path: '/' });
  return res.json({ success: true, lang });
});

router.get('/locale/:lang', (req, res) => {
  const lang = i18n.normalizeLocale(req.params.lang || 'pt-BR');
  res.cookie('lang', lang, { maxAge: 365 * 24 * 60 * 60 * 1000, path: '/' });
  return res.redirect(req.get('Referer') || '/profile');
});

router.get('/login', (req, res) =>
{
    return  res.render('profile/login', { title: 'Login', t: req.translate });
});

router.get('/register', (req, res) =>
{
  return  res.render('profile/register', { title: 'Register', t: req.translate });
});

router.get('/forgot', (req, res) =>
{
  return  res.render('profile/forgot', { title: 'Esqueci a Senha', t: req.translate });
});

router.get('/logout', (req, res) =>
{
  req.session.destroy(() => {
    res.clearCookie('userToken');
    return res.redirect('/profile/login');
  });
});

// Middleware de proteção de rota do perfil e da API Godot
router.use(async (req, res, next) =>
{
  const authHeader = String(req.headers?.['authorization'] || '');
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';

  const token =
    bearerToken ||
    req.headers?.['tfl-token'] ||
    req.headers?.['token'] ||
    req.headers?.['x-api-token'] ||
    req.cookies?.userToken ||
    req.query?.token ||
    req.body?.token;

  if (req.session?.user && !bearerToken && !req.headers?.['tfl-token']) {
    req.user = req.session.user;
  } else if (token) {
    try {
      const user = await repo.User.findOne({ where: { token } });
      if (user) {
        req.user = user.get({ plain: true });
        if (req.session) req.session.user = req.user;
      }
    } catch (e) {
      console.error("Erro auth profile:", e);
    }
  }

  if (req.user) {
    // Se avatarId / x-profile-id não foi informado (ex: chamada direta do cliente Godot), resolve o avatar selecionado
    const hasExplicitAvatar = req.headers?.['x-profile-id'] || req.body?.avatarId || req.query?.avatarId;
    if (!hasExplicitAvatar) {
      try {
        const selectedAvatar = await repo.Avatar.findOne({
          where: { userId: req.user.id },
          order: [['selected', 'DESC'], ['id', 'ASC']],
        });
        if (selectedAvatar) {
          req.headers['x-profile-id'] = String(selectedAvatar.id);
          if (req.body && typeof req.body === 'object' && !req.body.avatarId) {
            req.body.avatarId = selectedAvatar.id;
          }
          if (req.query && typeof req.query === 'object' && !req.query.avatarId) {
            req.query.avatarId = String(selectedAvatar.id);
          }
        }
      } catch (_) {}
    }
    return next();
  }

  const wantsJson =
    req.xhr ||
    req.originalUrl.startsWith('/api') ||
    (req.headers?.accept && req.headers.accept.includes('application/json'));

  if (wantsJson) {
    return res.status(401).json({ success: false, error: "Não autorizado. Envie o header tfl-token ou Authorization: Bearer <token>." });
  }

  return res.redirect('/profile/login');
});

async function buildProfileViewPayload(user, req) {
  await ensureFriendsFkDropped();
  // 1. Busca todos os avatares da conta User
  const avatars = await repo.Avatar.findAll({
    where: { userId: user.id },
    order: [["id", "ASC"]]
  });

  // Avatar selecionado pelo usuário ou o primeiro da lista
  let activeAvatar = avatars.find(a => a.selected) || avatars[0] || null;

  // Se o usuário não tiver nenhum avatar, cria um avatar inicial automático
  if (!activeAvatar) {
    activeAvatar = await repo.Avatar.create({
      userId: user.id,
      name: user.userName || user.login || "Viajante",
      selected: true,
      gender: user.gender || 1
    });
    avatars.push(activeAvatar);
  }

  // 2. Busca salas do avatar ativo (padrão até 20 por página inicial)
  const rooms = await repo.RoomModel.findAll({
    where: {
      [repo.Sequelize.Op.or]: [
        { avatarId: activeAvatar.id },
        { userId: user.id }
      ]
    },
    order: [["id", "DESC"]],
    limit: 20
  });

  // 3. Busca a carteira (Currency) do avatar ativo
  let wallet = await repo.Currency.findOne({
    where: {
      [repo.Sequelize.Op.or]: [
        { avatarId: activeAvatar.id },
        { ownerId: activeAvatar.id }
      ]
    }
  });

  if (!wallet) {
    wallet = await repo.Currency.create({
      avatarId: activeAvatar.id,
      ownerId: activeAvatar.id,
      userId: user.id,
      cash: 0,
      coins: 0, // Inicia com 0 coins para proteger a bolsa de liquidez e saques
      chips: 50
    });
  }

  // 4. Busca ordens ativas do avatar, transações (Compras/Saques) e regras do mercado (paginação padrão de 20 itens)
  const myOrders = await repo.CoinOrder.findAll({
    where: { avatarId: activeAvatar.id },
    order: [["createdAt", "DESC"]],
    limit: 20
  });

  const myTransactions = await repo.PaymentBank.findAll({
    where: {
      [repo.Sequelize.Op.or]: [
        { avatar_id: activeAvatar.id },
        { user_id: user.id }
      ],
      type: { [repo.Sequelize.Op.in]: ['Buy', 'Withdraw'] }
    },
    order: [["createdAt", "DESC"]],
    limit: 20
  });

  const [
    marketStats,
    friendsData,
    shopData,
    wardrobeData,
    enrichedRooms,
    vipStatus,
    walletLedger,
    publicRooms,
    notificationsData,
    diaryData,
  ] = await Promise.all([
    getMarketStats(),
    loadAvatarFriendsData(activeAvatar.id),
    listShopCatalog({ viewerAvatarId: activeAvatar.id }).catch(() => ({ rules: SHOP_3D_RULES, items: [] })),
    getAvatarWardrobe(activeAvatar.id).catch(() => ({ avatarId: activeAvatar.id, inventory: [], equippedBySlot: {}, styles: [], rules: SHOP_3D_RULES })),
    enrichRoomsWithVisitStats(rooms, activeAvatar.id).catch(() => rooms.map(r => r.get({ plain: true }))),
    getVipStatus(activeAvatar.id, user.id).catch(() => ({ isVip: false, badge: null, usageToday: { dmOpens: 0, imagesSent: 0, audioSent: 0 }, limits: { maxChatOpensPerDay: 3, maxChatImagesPerDay: 2, maxChatAudioPerDay: 2, basicFriendsOnlyDm: true } })),
    getWalletLedger({ avatarId: activeAvatar.id, userId: user.id, limit: 20 }).catch(() => []),
    getPublicRoomsExplorer({ viewerAvatarId: activeAvatar.id, limit: 20 }).catch(() => []),
    getNotifications({ avatarId: activeAvatar.id, userId: user.id, limit: 20 }).catch(() => ({ notifications: [], unreadCount: 0 })),
    getDiaryOverview({ userId: user.id, avatarId: activeAvatar.id }).catch(() => ({
      moods: DIARY_MOODS,
      categories: DIARY_CATEGORIES,
      reactions: DIARY_REACTIONS,
      rewardRules: { minReadSeconds: 30, readerRewardPerPageCoins: 0.25, authorRewardPerReadCoins: 0.5, authorBonusPer10MinCoins: 5.0, readerDailyLimitPages: 20 },
      stats: { myTotalPages: 0, myPublicPages: 0, myPrivatePages: 0, myTotalReadsReceived: 0, myTotalMinutesReadReceived: 0, myTotalAuthorCoinsEarned: 0, myReaderRewardedToday: 0, myReaderRemainingToday: 20, myTotalReaderCoinsEarned: 0 },
      myPages: [],
      publicFeed: [],
    })),
  ]);

  const plainAvatars = await enrichAvatarsWithVip(avatars.map(a => a.get({ plain: true }))).catch(() => avatars.map(a => a.get({ plain: true })));
  const plainActiveAvatar = plainAvatars.find(a => Number(a.id) === Number(activeAvatar.id)) || {
    ...activeAvatar.get({ plain: true }),
    isVip: Boolean(vipStatus?.isVip),
    vipPlan: vipStatus?.plan || null,
    vipExpiresAt: vipStatus?.expiresAt || null,
  };

  return {
    title: 'Portal TFL',
    t: req.translate,
    currentLang: req.lang || 'pt-BR',
    user,
    avatars: plainAvatars,
    activeAvatar: plainActiveAvatar,
    rooms: enrichedRooms,
    publicRooms,
    wallet: wallet.get({ plain: true }),
    activeCurrency: wallet.get({ plain: true }),
    myOrders: myOrders.map(o => o.get({ plain: true })),
    myTransactions: myTransactions.map(tx => tx.get({ plain: true })),
    walletLedger,
    vipStatus,
    notificationsData,
    marketStats,
    friendsData,
    shopData,
    wardrobeData,
    diaryData,
  };
}

router.get('/', async (req, res) =>
{
  const user = req.user || req.session?.user;
  if (!user) {
    return res.redirect('/profile/login');
  }

  recordSiteVisit(req, { path: '/profile' });

  try {
    const payload = await buildProfileViewPayload(user, req);
    return res.render('profile/index', payload);
  } catch (err) {
    console.error("Erro ao carregar dados do perfil:", err);
    return res.render('profile/index', {
      title: 'Portal TFL',
      t: req.translate,
      currentLang: req.lang || 'pt-BR',
      user,
      avatars: [],
      activeAvatar: null,
      rooms: [],
      publicRooms: [],
      wallet: { cash: 0, coins: 0, chips: 0 },
      activeCurrency: { cash: 0, coins: 0, chips: 0 },
      myOrders: [],
      myTransactions: [],
      walletLedger: [],
      vipStatus: { isVip: false, badge: null, usageToday: { dmOpens: 0, imagesSent: 0, audioSent: 0 }, limits: { maxChatOpensPerDay: 3, maxChatImagesPerDay: 2, maxChatAudioPerDay: 2, basicFriendsOnlyDm: true } },
      notificationsData: { notifications: [], unreadCount: 0 },
      friendsData: { friendsList: [], pendingReceived: [], pendingSent: [], suggestedAvatars: [] },
      shopData: { rules: SHOP_3D_RULES, items: [] },
      wardrobeData: { avatarId: 0, inventory: [], equippedBySlot: {}, styles: [], rules: SHOP_3D_RULES },
      diaryData: {
        moods: DIARY_MOODS,
        categories: DIARY_CATEGORIES,
        reactions: DIARY_REACTIONS,
        rewardRules: { minReadSeconds: 30, readerRewardPerPageCoins: 0.25, authorRewardPerReadCoins: 0.5, authorBonusPer10MinCoins: 5.0, readerDailyLimitPages: 20 },
        stats: { myTotalPages: 0, myPublicPages: 0, myPrivatePages: 0, myTotalReadsReceived: 0, myTotalMinutesReadReceived: 0, myTotalAuthorCoinsEarned: 0, myReaderRewardedToday: 0, myReaderRemainingToday: 20, myTotalReaderCoinsEarned: 0 },
        myPages: [],
        publicFeed: [],
      },
      marketStats: {
        totalCoinsInPool: 0,
        totalActiveOrders: 0,
        rateCoinsPerCash: 250,
        sellSpreadPercent: 0.5,
        buySpreadPercent: 0.1,
        usdBrlRate: 5.0,
        minPurchaseBrl: 10.0,
        minWithdrawCash: 1.0,
        buyApprovalMode: 'AUTO',
        maxAutoBuyBrl: 500.0,
        withdrawApprovalMode: 'AUTO',
        maxAutoWithdrawCash: 20.0
      }
    });
  }
});

// ================= ESTATÍSTICAS & TELEMETRIA EM TEMPO REAL (RESTRITO A ADMIN) =================
router.get('/stats', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!isMarketAdmin(user)) {
    return res.status(403).json({ success: false, error: 'Estatísticas restritas ao painel /admin.' });
  }
  try {
    const stats = await getPlatformStats();
    return res.json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= OVERVIEW COMPLETO EM JSON (PARA SINCRONIZAR CLIENTE GODOT) =================
router.get('/overview', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const payload = await buildProfileViewPayload(user, req);
    const { t, title, ...jsonData } = payload;
    return res.json({ success: true, ...jsonData });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= SALDO, ORDENS E ESTATÍSTICAS DA CARTEIRA/BOLSA EM JSON (GODOT) =================
router.get('/wallet', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const payload = await buildProfileViewPayload(user, req);
    return res.json({
      success: true,
      activeAvatarId: payload.activeAvatar?.id || 0,
      wallet: payload.wallet,
      vipStatus: payload.vipStatus,
      marketStats: payload.marketStats,
      myOrders: payload.myOrders,
      myTransactions: payload.myTransactions,
      walletLedger: payload.walletLedger,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= PAGINAÇÃO UNIVERSAL DA CARTEIRA (EXTRATO, ORDENS E PIX — PADRÃO 20 ITENS/PÁGINA) =================
router.get('/wallet/paginated', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  const avatarId = Number(req.query.avatarId || req.headers['x-profile-id'] || 0);
  const type = String(req.query.type || 'ledger').toLowerCase();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const offset = (page - 1) * limit;
  const currency = String(req.query.currency || 'ALL').trim();

  try {
    if (type === 'orders') {
      const { count, rows } = await repo.CoinOrder.findAndCountAll({
        where: { avatarId },
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });
      const totalPages = Math.max(1, Math.ceil(count / limit));
      return res.json({
        success: true,
        type,
        page,
        limit,
        total: count,
        totalPages,
        hasMore: page < totalPages,
        items: rows.map(r => r.get({ plain: true })),
      });
    }

    if (type === 'transactions' || type === 'pix') {
      const { count, rows } = await repo.PaymentBank.findAndCountAll({
        where: {
          [repo.Sequelize.Op.or]: [
            { avatar_id: avatarId },
            { user_id: user.id }
          ],
          type: { [repo.Sequelize.Op.in]: ['Buy', 'Withdraw'] }
        },
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });
      const totalPages = Math.max(1, Math.ceil(count / limit));
      return res.json({
        success: true,
        type,
        page,
        limit,
        total: count,
        totalPages,
        hasMore: page < totalPages,
        items: rows.map(r => r.get({ plain: true })),
      });
    }

    // Default: wallet_ledger
    const currencyFilter = currency && currency !== 'ALL' ? `AND UPPER(wl."currencyType") = UPPER(:currency)` : '';
    const [countRes, items] = await Promise.all([
      repo.sequelize.query(
        `SELECT COUNT(*)::int AS "total"
         FROM "wallet_ledger" wl
         WHERE wl."avatarId" = :avatarId ${currencyFilter}`,
        {
          replacements: { avatarId, currency },
          type: repo.Sequelize.QueryTypes.SELECT,
        }
      ),
      getWalletLedger({ avatarId, userId: user.id, page, limit, currency }),
    ]);
    const total = Number(countRes[0]?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return res.json({
      success: true,
      type: 'ledger',
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
      items,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/market/stats', async (req, res) => {
  try {
    const marketStats = await getMarketStats();
    return res.json({ success: true, marketStats });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/rooms', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.query.avatarId || req.headers['x-profile-id'] || 0);
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const whereClause = avatarId
      ? { [repo.Sequelize.Op.or]: [{ avatarId }, { userId: user.id }] }
      : { userId: user.id };
    const rooms = await repo.RoomModel.findAll({
      where: whereClause,
      order: [['id', 'DESC']],
    });
    const enriched = await enrichRoomsWithVisitStats(rooms, avatarId);
    return res.json({ success: true, rooms: enriched });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= ROTA DE ATUALIZAÇÃO DINÂMICA DE PARTIALS HTML =================
router.get('/partial/:section', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).send('Não autorizado');

  const allowedPartials = new Set([
    'sidebar',
    'header-profile',
    'view-social',
    'view-user-profile',
    'view-avatar',
    'view-shop',
    'view-salas',
    'view-account',
    'view-market',
    'view-vip',
    'view-cassino',
    'view-diary',
    'view-friends',
    'view-chat',
    'modals'
  ]);

  const section = String(req.params.section || '').trim();
  if (!allowedPartials.has(section)) {
    return res.status(404).send('Partial inválido');
  }

  try {
    const payload = await buildProfileViewPayload(user, req);
    return res.render(`profile/partials/${section}`, payload);
  } catch (err) {
    console.error(`Erro ao renderizar partial ${section}:`, err);
    return res.status(500).send('Erro ao carregar seção');
  }
});


// ================= ROTAS DO MERCADO DE COINS (BOLSA & LIQUIDAÇÃO) =================
router.post('/market/sell', async (req, res) => {
  const user = req.user || req.session?.user;
  const { avatarId, coins } = req.body;
  if (!user || !avatarId) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const order = await createSellOrder(avatarId, coins, user.id);
    return res.json({ success: true, order });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/market/cancel', async (req, res) => {
  const user = req.user || req.session?.user;
  const { orderId, avatarId } = req.body;
  if (!user || !orderId || !avatarId) return res.status(400).json({ success: false, error: "Parâmetros inválidos" });

  try {
    const result = await cancelSellOrder(orderId, avatarId);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/market/buy', async (req, res) => {
  const user = req.user || req.session?.user;
  const { avatarId, coins } = req.body;
  if (!user || !avatarId) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const result = await buyCoins(avatarId, coins, user.id);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ================= GERAÇÃO DE PIX / COMPRA DE CASH (MÍNIMO R$ 10,00 ASAAS) =================
router.post('/market/pix/create', async (req, res) => {
  const user = req.user || req.session?.user;
  const { avatarId, cashAmount } = req.body;
  if (!user || !avatarId) return res.status(401).json({ success: false, error: "Não autorizado" });

  const amount = Number(cashAmount);
  if (!amount || amount <= 0 || isNaN(amount)) {
    return res.status(400).json({ success: false, error: "Informe uma quantidade válida de Cash." });
  }

  try {
    const rules = await getEconomyRules();
    const USD_RATE = Number(rules.usdBrlRate) || 5.0; // 1 Cash ($1 USD) = R$ 5,00
    const minBrl = Number(rules.minPurchaseBrl) || 10.0; // Mínimo exigido pelo Asaas para Pix dinâmico
    const brlValue = Number((amount * USD_RATE).toFixed(2));

    if (brlValue < minBrl) {
      const minCashRequired = (minBrl / USD_RATE).toFixed(2);
      return res.status(400).json({
        success: false,
        error: `O valor mínimo para compra via Pix é R$ ${minBrl.toFixed(2)} (equivalente a ${minCashRequired} Cash), conforme exigido pelo Asaas para processar Pix dinâmico.`
      });
    }

    const txId = `TFL${Date.now()}`;
    let payload = '';
    let qrCodeBase64 = '';

    // Gera o Pix com qrcode-pix
    try {
      const { QrCodePix } = require('qrcode-pix');
      const pixObj = QrCodePix({
        version: '01',
        key: process.env.PIX_KEY || 'pix@tflgame.com',
        name: 'The Fantasy Life',
        city: 'SAO PAULO',
        transactionId: txId.substring(0, 25),
        message: `Compra ${amount} Cash TFL`,
        value: brlValue,
      });
      payload = pixObj.payload();
      qrCodeBase64 = await pixObj.base64();
    } catch (ePix) {
      console.warn("Erro ao gerar qrcode-pix local:", ePix.message);
      payload = `00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540${brlValue.toFixed(2)}5802BR5917The Fantasy Life6009SAO PAULO62070503***6304`;
      qrCodeBase64 = '';
    }

    const isAutoMode = rules.buyApprovalMode === 'AUTO' && brlValue <= Number(rules.maxAutoBuyBrl);

    // Salva no histórico de pagamentos
    const paymentRecord = await repo.PaymentBank.create({
      user_id: user.id,
      avatar_id: parseInt(avatarId, 10),
      description: `Compra de $${amount.toFixed(2)} Cash (R$ ${brlValue.toFixed(2)}) via Pix`,
      reference_id: txId,
      status: 'PENDING',
      value: brlValue,
      cash_amount: amount,
      approval_mode: isAutoMode ? 'AUTO' : 'MANUAL',
      provedor: 'Asaas',
      type: 'Buy',
    });

    return res.json({
      success: true,
      paymentId: paymentRecord.id,
      amountCash: amount,
      brlValue: brlValue,
      rate: USD_RATE,
      approvalMode: isAutoMode ? 'AUTO' : 'MANUAL',
      copyPasteCode: payload,
      qrCodeImage: qrCodeBase64
    });
  } catch (err) {
    console.error("Erro ao gerar Pix de Cash:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint de simulação / confirmação de pagamento Pix
router.post('/market/pix/simulate-confirm', async (req, res) => {
  const user = req.user || req.session?.user;
  const { paymentId, avatarId } = req.body;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const payment = await repo.PaymentBank.findOne({ where: { id: paymentId, user_id: user.id } });
    if (!payment) return res.status(404).json({ success: false, error: "Pagamento não encontrado" });
    if (['CONFIRMED', 'RECEIVED', 'APPROVED_ADMIN'].includes(payment.status)) {
      return res.status(400).json({ success: false, error: "Pagamento já confirmado anteriormente." });
    }

    const rules = await getEconomyRules();
    const USD_RATE = Number(rules.usdBrlRate) || 5.0;
    const cashToAdd = Number(payment.cash_amount) || Number((Number(payment.value) / USD_RATE).toFixed(2));
    const isAutoApproved = rules.buyApprovalMode === 'AUTO' && Number(payment.value) <= Number(rules.maxAutoBuyBrl);

    if (!isAutoApproved) {
      await payment.update({ status: 'WAITING_APPROVAL', approval_mode: 'MANUAL' });
      return res.json({
        success: true,
        requiresManualApproval: true,
        addedCash: 0,
        message: `Pagamento Pix identificado! Como a regra de compra está em modo Manual (ou acima do teto automático de R$ ${Number(rules.maxAutoBuyBrl).toFixed(2)}), o pedido aguarda aprovação no painel Admin.`
      });
    }

    await payment.update({ status: 'CONFIRMED', approval_mode: 'AUTO' });

    // Credita na carteira do avatar automaticamente
    const targetAvatarId = avatarId || payment.avatar_id;
    const wallet = await repo.Currency.findOne({
      where: {
        [repo.Sequelize.Op.or]: [
          ...(targetAvatarId ? [{ avatarId: targetAvatarId }, { ownerId: targetAvatarId }] : []),
          { userId: user.id }
        ]
      }
    });

    if (wallet) {
      wallet.cash = Number((Number(wallet.cash) + cashToAdd).toFixed(4));
      await wallet.save();
    }

    await recordLedgerEntry({
      userId: user.id,
      avatarId: Number(targetAvatarId || 0),
      currencyType: 'Cash',
      category: 'PIX_BUY',
      amount: cashToAdd,
      feeAmount: 0,
      balanceAfter: Number(wallet?.cash || cashToAdd),
      description: `Compra de $${cashToAdd.toFixed(2)} Cash via Pix confirmada`,
      referenceId: payment.reference_id,
    });

    await createNotification({
      userId: user.id,
      avatarId: Number(targetAvatarId || 0),
      type: 'PIX_CONFIRMED',
      title: 'Pagamento Pix Confirmado!',
      message: `Sua recarga de $${cashToAdd.toFixed(2)} Cash foi creditada na sua carteira.`,
    });

    return res.json({
      success: true,
      requiresManualApproval: false,
      addedCash: cashToAdd,
      newBalance: wallet?.cash || cashToAdd
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= SOLICITAÇÃO E CANCELAMENTO DE SAQUE (MÍNIMO 1 CASH) =================
router.post('/market/withdraw', async (req, res) => {
  const user = req.user || req.session?.user;
  const { avatarId, cashAmount, pixKey, pixKeyType } = req.body;
  if (!user || !avatarId) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const result = await requestWithdraw({
      userId: user.id,
      avatarId,
      cashAmount,
      pixKey,
      pixKeyType
    });
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/market/withdraw/cancel', async (req, res) => {
  const user = req.user || req.session?.user;
  const { paymentId, avatarId } = req.body;
  if (!user || !paymentId) return res.status(400).json({ success: false, error: "Parâmetros inválidos" });

  try {
    const result = await cancelWithdraw(paymentId, user.id, avatarId);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ================= TABELA DE REGRAS E APROVAÇÃO (ADMIN / CONFIG) =================
function isMarketAdmin(user) {
  if (!user) return false;
  const role = String(user.role || '').toLowerCase();
  return ['admin', 'ownner', 'owner', 'desenvolvedor'].includes(role) || Number(user.id) === 1;
}

router.post('/market/rules/update', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });
  if (!isMarketAdmin(user)) {
    return res.status(403).json({ success: false, error: "Acesso restrito a administradores da economia." });
  }

  try {
    const updated = await updateEconomyRules(req.body);
    return res.json({ success: true, rules: updated });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/market/payment/review', async (req, res) => {
  const user = req.user || req.session?.user;
  const { paymentId, action } = req.body;
  if (!user || !paymentId) return res.status(400).json({ success: false, error: "Parâmetros inválidos" });
  if (!isMarketAdmin(user)) {
    return res.status(403).json({ success: false, error: "Acesso restrito a administradores financeiros." });
  }

  try {
    const result = await reviewPaymentTransaction(paymentId, action);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ================= CONVERSOR RÁPIDO DE MOEDAS (CASH->COINS, COINS->CHIPS, CHIPS->COINS, COINS->CASH 30%) =================
router.post('/market/convert', async (req, res) => {
  const user = req.user || req.session?.user;
  const { avatarId, direction, amount } = req.body;
  if (!user || !avatarId || !direction || !amount) {
    return res.status(400).json({ success: false, error: "Parâmetros de conversão inválidos." });
  }

  try {
    const result = await convertCurrency(avatarId, direction, amount, user.id);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ================= EXTRATO COMPLETO DA CARTEIRA (WALLET LEDGER) =================
router.get('/market/ledger', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.query.avatarId || req.headers['x-profile-id'] || 0);
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const ledger = await getWalletLedger({
      avatarId,
      userId: user.id,
      limit: Math.min(Math.max(Number(req.query.limit || 60), 10), 200),
      currencyType: req.query.currencyType || null,
    });
    return res.json({ success: true, ledger });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= TRANSFERÊNCIA DE MOEDA DO JOGO (COINS APENAS) ENTRE JOGADORES =================
router.post('/market/transfer-coins', async (req, res) => {
  const user = req.user || req.session?.user;
  const senderAvatarId = Number(req.body.avatarId || req.headers['x-profile-id'] || 0);
  const { recipient, amountCoins, note } = req.body;
  if (!user || !senderAvatarId) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const result = await transferCoinsBetweenPlayers({
      senderUserId: user.id,
      senderAvatarId,
      recipientAvatarInput: recipient || req.body.recipientAvatarId,
      amountCoins,
      note,
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ================= SISTEMA VIP (1 SEMANA, 1 MÊS, 3 MESES) =================
router.get('/vip/status', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.query.avatarId || req.headers['x-profile-id'] || 0);
  if (!user || !avatarId) return res.status(400).json({ success: false, error: "Avatar inválido" });

  try {
    const vipStatus = await getVipStatus(avatarId, user.id);
    return res.json({ success: true, vipStatus });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/vip/subscribe', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id'] || 0);
  const { planKey, paymentCurrency } = req.body;
  if (!user || !avatarId) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const result = await purchaseVipSubscription({
      userId: user.id,
      avatarId,
      planKey: planKey || '1_MONTH',
      paymentCurrency: paymentCurrency || 'Cash',
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ================= CENTRAL DE NOTIFICAÇÕES (SINO 🔔) =================
router.get('/notifications', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.query.avatarId || req.headers['x-profile-id'] || 0);
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const data = await getNotifications({
      avatarId,
      userId: user.id,
      limit: Number(req.query.limit || 30),
    });
    return res.json({ success: true, ...data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/notifications/read', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id'] || 0);
  const notificationId = Number(req.body.notificationId || 0);
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const result = await markNotificationsRead({
      avatarId,
      userId: user.id,
      notificationId,
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ================= MÓDULO DE CASSINO (SLOTS, ROLETA, DADOS EM CHIPS) =================
router.get('/casino/status', async (req, res) => {
  try {
    const avatarId = Number(req.headers['x-profile-id'] || req.query.avatarId || 0);
    const rules = await getEconomyRules();
    let chips = 0;
    if (avatarId) {
      const wallet = await repo.Currency.findOne({
        where: { [repo.Sequelize.Op.or]: [{ avatarId }, { ownerId: avatarId }] }
      });
      chips = Number(wallet?.chips || 0);
    }
    return res.json({
      success: true,
      chips,
      games: ["slots", "roulette", "dice"],
      minBet: 1,
      maxBet: 50000,
      houseEdgePercent: Number(rules.casinoHouseEdgePercent ?? 5.0)
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/casino/play', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id'] || 0);
  const { gameType, betChips, choice } = req.body;
  if (!user || !avatarId) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const result = await playCasinoGame({
      userId: user.id,
      avatarId,
      gameType,
      betChips,
      choice,
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});


// Endpoint para alternar avatar ativo da conta
router.post('/switch-avatar', async (req, res) => {
  const user = req.user || req.session?.user;
  const { avatarId } = req.body;
  if (!user || !avatarId) return res.status(400).json({ success: false });

  try {
    await repo.Avatar.update({ selected: false }, { where: { userId: user.id } });
    await repo.Avatar.update({ selected: true }, { where: { id: avatarId, userId: user.id } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= ROTA DE UPLOAD DE FOTO (COM FAILOVER & PROXY URL) =================
router.post('/upload/avatar-image', upload.single('photo'), async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });
  if (!req.file) return res.status(400).json({ success: false, error: "Nenhum arquivo enviado" });

  try {
    const uploadResult = await uploadMedia(req.file, "avatars");

    // Salva referência do arquivo no banco (FileInfo)
    const fileRecord = await repo.FileInfo.create({
      userId: String(user.id),
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      inCdn: true,
      status: "uploaded"
    });

    // Retorna URL interna protegida que passa pelo proxy sem expor CDN/Supabase
    const protectedUrl = `/profile/media/${fileRecord.id}`;
    return res.json({ success: true, url: protectedUrl, fileId: fileRecord.id });
  } catch (err) {
    console.error("Erro no upload de foto:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= ROTAS DE AVATAR (CRIAR E EDITAR) =================
router.post('/avatar/create', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    await ensureFriendsFkDropped();
    const {
      name, bio, gender, thumbnail, coverUrl,
      privacyPosts, privacyPhotos, privacyRooms, privacyFriends, privacyFollowers
    } = req.body;
    const validPriv = (v) => (['public', 'friends', 'private'].includes(v) ? v : 'public');
    const newAvatar = await repo.Avatar.create({
      userId: user.id,
      name: name || "Novo Avatar",
      bio: bio || "",
      gender: parseInt(gender, 10) || 1,
      thumbnail: thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Avatar')}&background=0284c7&color=fff`,
      coverUrl: coverUrl || "",
      privacyPosts: validPriv(privacyPosts),
      privacyPhotos: validPriv(privacyPhotos),
      privacyRooms: validPriv(privacyRooms),
      privacyFriends: validPriv(privacyFriends),
      privacyFollowers: validPriv(privacyFollowers),
      selected: false
    });

    // Cria a carteira vinculada a este novo avatar
    await repo.Currency.create({
      avatarId: newAvatar.id,
      ownerId: newAvatar.id,
      userId: user.id,
      cash: 0,
      coins: 0,
      chips: 50
    });

    return res.json({ success: true, avatar: newAvatar });
  } catch (err) {
    console.error("Erro ao criar avatar:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/avatar/update', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    await ensureFriendsFkDropped();
    const {
      avatarId, name, bio, gender, thumbnail, coverUrl,
      privacyPosts, privacyPhotos, privacyRooms, privacyFriends, privacyFollowers
    } = req.body;
    const avatar = await repo.Avatar.findOne({ where: { id: avatarId, userId: user.id } });
    if (!avatar) return res.status(404).json({ success: false, error: "Avatar não encontrado" });

    avatar.name = name || avatar.name;
    avatar.bio = bio !== undefined ? bio : avatar.bio;
    avatar.gender = gender !== undefined ? parseInt(gender, 10) : avatar.gender;
    if (thumbnail) avatar.thumbnail = thumbnail;
    if (coverUrl !== undefined) avatar.coverUrl = coverUrl;
    if (privacyPosts && ['public', 'friends', 'private'].includes(privacyPosts)) avatar.privacyPosts = privacyPosts;
    if (privacyPhotos && ['public', 'friends', 'private'].includes(privacyPhotos)) avatar.privacyPhotos = privacyPhotos;
    if (privacyRooms && ['public', 'friends', 'private'].includes(privacyRooms)) avatar.privacyRooms = privacyRooms;
    if (privacyFriends && ['public', 'friends', 'private'].includes(privacyFriends)) avatar.privacyFriends = privacyFriends;
    if (privacyFollowers && ['public', 'friends', 'private'].includes(privacyFollowers)) avatar.privacyFollowers = privacyFollowers;
    await avatar.save();

    return res.json({ success: true, avatar });
  } catch (err) {
    console.error("Erro ao atualizar avatar:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Rota rápida para atualizar Capa / Fundo ou qualquer Privacidade específica da seção (Publicações, Fotos, Salas, Amigos, Seguidores)
router.post('/avatar/customize', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    await ensureFriendsFkDropped();
    const {
      avatarId, coverUrl,
      privacyPosts, privacyPhotos, privacyRooms, privacyFriends, privacyFollowers
    } = req.body;
    const avatar = await repo.Avatar.findOne({ where: { id: avatarId, userId: user.id } });
    if (!avatar) return res.status(404).json({ success: false, error: "Avatar não encontrado" });

    if (coverUrl !== undefined) avatar.coverUrl = String(coverUrl);
    if (privacyPosts && ['public', 'friends', 'private'].includes(privacyPosts)) avatar.privacyPosts = privacyPosts;
    if (privacyPhotos && ['public', 'friends', 'private'].includes(privacyPhotos)) avatar.privacyPhotos = privacyPhotos;
    if (privacyRooms && ['public', 'friends', 'private'].includes(privacyRooms)) avatar.privacyRooms = privacyRooms;
    if (privacyFriends && ['public', 'friends', 'private'].includes(privacyFriends)) avatar.privacyFriends = privacyFriends;
    if (privacyFollowers && ['public', 'friends', 'private'].includes(privacyFollowers)) avatar.privacyFollowers = privacyFollowers;
    await avatar.save();

    return res.json({ success: true, avatar });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= ROTAS DA LOJA DE ROUPAS 3D (SHOP) & GUARDA-ROUPA (INVENTORY / OUTFITS) =================
router.get('/shop/catalog', async (req, res) => {
  try {
    const viewerAvatarId = Number(req.query.avatarId || req.headers['x-profile-id'] || 0);
    const data = await listShopCatalog({
      slot: req.query.slot || '',
      gender: req.query.gender || '',
      currencyType: req.query.currencyType || '',
      rarity: req.query.rarity || '',
      search: req.query.q || '',
      viewerAvatarId,
    });
    return res.json({ success: true, ...data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/shop/wardrobe', async (req, res) => {
  try {
    const avatarId = Number(req.query.avatarId || req.headers['x-profile-id'] || 0);
    const data = await getAvatarWardrobe(avatarId);
    return res.json({ success: true, ...data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/shop/buy', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const avatarId = Number(req.body.avatarId || req.headers['x-profile-id'] || 0);
    const containerId = Number(req.body.containerId || req.body.itemId || 0);
    const autoEquip = req.body.autoEquip !== false && req.body.autoEquip !== 'false';

    const result = await buyShopItem({
      userId: user.id,
      avatarId,
      containerId,
      autoEquip,
    });
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/shop/equip', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const avatarId = Number(req.body.avatarId || req.headers['x-profile-id'] || 0);
    const inventoryId = Number(req.body.inventoryId || 0);
    const forceEquip = req.body.forceEquip !== undefined ? req.body.forceEquip : null;
    const customColors = req.body.customColors || null;

    const result = await toggleEquipItem({
      userId: user.id,
      avatarId,
      inventoryId,
      forceEquip,
      customColors,
    });
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/shop/style/save', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const avatarId = Number(req.body.avatarId || req.headers['x-profile-id'] || 0);
    const style = await saveOutfitStyle({
      userId: user.id,
      avatarId,
      name: req.body.name,
    });
    return res.json({ success: true, style });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/shop/style/apply', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const avatarId = Number(req.body.avatarId || req.headers['x-profile-id'] || 0);
    const result = await applyOutfitStyle({
      userId: user.id,
      avatarId,
      styleId: req.body.styleId,
    });
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/shop/style/delete', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const avatarId = Number(req.body.avatarId || req.headers['x-profile-id'] || 0);
    await deleteOutfitStyle({
      userId: user.id,
      avatarId,
      styleId: req.body.styleId,
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ================= ROTAS DO MÓDULO LOJA (SHOP APP COMPLETO: VITRINE, CARRINHO, CRIAR ITEM UGC, TEXTURAS, INVENTÁRIO & REVIEWS) =================
router.get('/shop/app-data', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const Op = repo.Sequelize.Op;
    const avatarId = Number(req.query.avatarId || req.headers['x-profile-id'] || 0);

    const [catalogData, wardrobe, createdRows, prefabsRows, texturesRows, walletRow] = await Promise.all([
      listShopCatalog({
        slot: req.query.slot || '',
        gender: req.query.gender || '',
        search: req.query.q || '',
        viewerAvatarId: avatarId,
      }),
      getAvatarWardrobe(avatarId),
      avatarId > 0
        ? repo.ShopContainer.findAll({
            where: { [Op.or]: [{ onnerId: avatarId }, { avatarId: avatarId }] },
            include: [{ model: repo.ShopItem, as: 'items', required: false }],
            order: [['id', 'DESC']],
          })
        : [],
      repo.PrefabModel
        ? repo.PrefabModel.findAll({
            where: { active: true },
            order: [['id', 'ASC']],
            limit: 500,
          })
        : [],
      repo.Texture
        ? repo.Texture.findAll({
            where: { userId: Number(user.id) },
            order: [['id', 'DESC']],
            limit: 100,
          })
        : [],
      avatarId > 0
        ? repo.Currency.findOne({
            where: { [Op.or]: [{ avatarId }, { ownerId: avatarId }] },
          })
        : null,
    ]);

    const ownedIds = new Set((wardrobe.inventory || []).map((i) => Number(i.shopItemId || i.itemId)));
    const purchasedItems = (catalogData.items || []).filter((it) => ownedIds.has(Number(it.id)));

    const starterTextures = [
      { id: -1, name: "Malha Carbono Tech", url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=300&q=80", status: "done" },
      { id: -2, name: "Couro Sintético Neon", url: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=300&q=80", status: "done" },
      { id: -3, name: "Seda Holográfica", url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=300&q=80", status: "done" },
      { id: -4, name: "Denim Jeans Escuro", url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=300&q=80", status: "done" },
    ];

    const userTextures = texturesRows.map((t) => t.get({ plain: true }));

    return res.json({
      success: true,
      items: catalogData.items || [],
      purchasedItems,
      createdItems: createdRows.map((r) => r.get({ plain: true })),
      wardrobe,
      prefabs: prefabsRows.map((p) => p.get({ plain: true })),
      textures: [...userTextures, ...starterTextures],
      wallet: walletRow ? walletRow.get({ plain: true }) : { cash: 0, coins: 0, chips: 0 },
    });
  } catch (err) {
    console.error("[/profile/shop/app-data]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/shop/checkout', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const avatarId = Number(req.body.avatarId || req.headers['x-profile-id'] || 0);
    const rawIds = Array.isArray(req.body.itemIds)
      ? req.body.itemIds
      : typeof req.body.itemIds === 'string'
      ? JSON.parse(req.body.itemIds || '[]')
      : req.body.containerId
      ? [req.body.containerId]
      : [];

    if (!avatarId || rawIds.length === 0) {
      return res.status(400).json({ success: false, error: "Seu carrinho está vazio." });
    }

    const results = [];
    for (const id of rawIds) {
      const bought = await buyShopItem({
        userId: user.id,
        avatarId,
        containerId: Number(id),
        autoEquip: Boolean(req.body.autoEquip),
      });
      results.push(bought);
    }

    const lastWallet = results[results.length - 1]?.wallet || null;
    return res.json({
      success: true,
      purchasedCount: results.length,
      results,
      wallet: lastWallet,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/shop/create-item', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const Op = repo.Sequelize.Op;
    const payload = req.body || {};
    const avatarId = Number(payload.avatarId || payload.onnerId || req.headers['x-profile-id'] || 0);
    if (!avatarId) return res.status(400).json({ success: false, error: "Avatar criador não identificado." });

    let itemsArr = payload.items;
    if (typeof itemsArr === 'string') {
      try { itemsArr = JSON.parse(itemsArr); } catch { itemsArr = []; }
    }
    if (!Array.isArray(itemsArr) || itemsArr.length === 0) {
      return res.status(400).json({ success: false, error: "Adicione pelo menos 1 modelo 3D (mesh) ao item." });
    }

    const slotMap = {
      0: 'top', upperbody: 'top', top: 'top',
      1: 'bottom', lowerbody: 'bottom', bottom: 'bottom',
      2: 'fullbody', fullbody: 'fullbody',
      3: 'hair', hair: 'hair',
      4: 'shoes', shoes: 'shoes',
      5: 'eyes', eyes: 'eyes',
      6: 'eyes', eyebrow: 'eyes',
      7: 'eyes', eyelash: 'eyes',
      8: 'skin', skin: 'skin',
      head: 'head', accessory: 'accessory',
    };
    const genderMap = {
      0: 'Female', female: 'Female', feminino: 'Female',
      1: 'Male', male: 'Male', masculino: 'Male',
      2: 'Universal', universal: 'Universal',
    };

    const firstRes = itemsArr[0] || {};
    const resolvedSlot = slotMap[String(firstRes.slot ?? payload.slot ?? 'top').toLowerCase()] || 'top';
    const resolvedGender = genderMap[String(payload.gender ?? 'Universal').toLowerCase()] || 'Universal';
    const resolvedPrice = Math.max(0, Number(payload.price || 0));
    const resolvedThumb =
      String(payload.thumb || payload.thumbnail || '').trim() ||
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80';

    const editId = payload.id ? Number(payload.id) : 0;
    let container;

    if (editId > 0) {
      container = await repo.ShopContainer.findByPk(editId);
      if (!container) return res.status(404).json({ success: false, error: "Item não encontrado para edição." });
      if (Number(container.onnerId) !== avatarId && Number(container.avatarId) !== avatarId && !isMarketAdmin(user)) {
        return res.status(403).json({ success: false, error: "Você só pode editar itens criados pelo seu avatar." });
      }
      await container.update({
        title: String(payload.title || container.title).trim(),
        description: String(payload.description ?? container.description).trim(),
        price: String(resolvedPrice),
        currencyType: payload.currencyType || container.currencyType || 'Coins',
        gender: resolvedGender,
        slot: resolvedSlot,
        thumb: resolvedThumb,
        model: firstRes.model || container.model,
        prefabPath: firstRes.model || container.prefabPath,
      });
      await repo.ShopItem.destroy({ where: { containerId: container.id } });
    } else {
      // Taxa de valor fixo para publicar/criar item 3D na loja (shopCreationFixedFeeCoins na tabela economy_rules)
      const rules = await getEconomyRules();
      const CREATION_FEE = Math.max(0, Number(rules.shopCreationFixedFeeCoins ?? 5.0));
      const wallet = await repo.Currency.findOne({
        where: { [Op.or]: [{ avatarId }, { ownerId: avatarId }] },
      });
      if (CREATION_FEE > 0 && wallet) {
        if (Number(wallet.coins || 0) >= CREATION_FEE) {
          wallet.coins = Number((Number(wallet.coins) - CREATION_FEE).toFixed(4));
          await wallet.save();
          rules.collectedFeesCoins = Number((Number(rules.collectedFeesCoins || 0) + CREATION_FEE).toFixed(4));
          await rules.save();
          if (repo.CurrencyRegister) {
            await repo.CurrencyRegister.create({
              userId: user.id,
              ownerId: avatarId,
              type: 'Coins',
              transactionType: 'Buy',
              value: -CREATION_FEE,
              description: `Taxa fixa de criação de item na Loja 3D (${payload.title || 'Novo Item'})`,
            });
          }
          await recordLedgerEntry({
            userId: user.id,
            avatarId,
            currencyType: 'Coins',
            category: 'SHOP_CREATE_FEE',
            amount: -CREATION_FEE,
            feeAmount: CREATION_FEE,
            balanceAfter: wallet.coins,
            description: `Taxa fixa de criação de item na Loja 3D (${payload.title || 'Novo Item'})`,
          });
        }
      }

      container = await repo.ShopContainer.create({
        onnerId: avatarId,
        avatarId,
        title: String(payload.title || 'Novo Item 3D').trim(),
        description: String(payload.description || '').trim(),
        price: String(resolvedPrice),
        currencyType: payload.currencyType || 'Coins',
        gender: resolvedGender,
        slot: resolvedSlot,
        category: 'clothing',
        rarity: payload.rarity || 'rare',
        thumb: resolvedThumb,
        model: firstRes.model || `mesh_${resolvedSlot}_${Date.now()}`,
        prefabPath: firstRes.model || '',
        sales: 0,
        stock: -1,
        active: true,
      });

      // Também adiciona automaticamente ao Guarda-Roupa do próprio criador
      await repo.Inventory.findOrCreate({
        where: { avatarId, itemId: container.id },
        defaults: {
          avatarId,
          itemId: container.id,
          name: container.title,
          slot: resolvedSlot,
          categoria: 'clothing',
          isEquipped: false,
          customColors: { primary: '#3b82f6', secondary: '#ffffff' },
          data: {
            model: container.model,
            prefabPath: container.prefabPath,
            thumb: container.thumb,
            rarity: container.rarity,
          },
        },
      });
    }

    const toCreate = itemsArr.map((resItem) => ({
      containerId: container.id,
      model: String(resItem.model || container.prefabPath || ''),
      slot: slotMap[String(resItem.slot ?? resolvedSlot).toLowerCase()] || resolvedSlot,
      shader: String(resItem.shader || 'standard_pbr_3d'),
      values: typeof resItem.values === 'object' && resItem.values ? resItem.values : {},
      colors: typeof resItem.colors === 'object' && resItem.colors ? resItem.colors : {},
      ints: typeof resItem.ints === 'object' && resItem.ints ? resItem.ints : {},
      bools: typeof resItem.bools === 'object' && resItem.bools ? resItem.bools : {},
      strings: typeof resItem.strings === 'object' && resItem.strings ? resItem.strings : {},
      vectors: typeof resItem.vectors === 'object' && resItem.vectors ? resItem.vectors : {},
      textures_paths: typeof resItem.textures_paths === 'object' && resItem.textures_paths ? resItem.textures_paths : {},
    }));
    await repo.ShopItem.bulkCreate(toCreate);

    const fullItem = await repo.ShopContainer.findByPk(container.id, {
      include: [{ model: repo.ShopItem, as: 'items' }],
    });

    return res.json({
      success: true,
      item: fullItem ? fullItem.get({ plain: true }) : container.get({ plain: true }),
    });
  } catch (err) {
    console.error("[/profile/shop/create-item]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/shop/texture/upload', upload.single('texture'), async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });
  if (!req.file) return res.status(400).json({ success: false, error: "Selecione uma imagem PNG/JPG para enviar." });

  try {
    const Op = repo.Sequelize.Op;
    const avatarId = Number(req.body.avatarId || req.headers['x-profile-id'] || 0);
    const texName = String(req.body.name || req.file.originalname || 'Textura').trim().slice(0, 80);

    // Taxa de valor fixo para upload de imagem/textura no Shop (shopTextureUploadFixedFeeCoins na tabela economy_rules)
    const rules = await getEconomyRules();
    const UPLOAD_FEE = Math.max(0, Number(rules.shopTextureUploadFixedFeeCoins ?? 1.0));
    let chargedFee = 0;

    if (avatarId > 0 && UPLOAD_FEE > 0) {
      const wallet = await repo.Currency.findOne({
        where: { [Op.or]: [{ avatarId }, { ownerId: avatarId }] },
      });
      if (!wallet || Number(wallet.coins || 0) < UPLOAD_FEE) {
        return res.status(400).json({
          success: false,
          error: `O upload de imagem/textura na Loja possui taxa fixa de ${UPLOAD_FEE.toFixed(2)} Coins. Seu saldo atual é ${Number(wallet?.coins || 0).toFixed(2)} Coins.`,
        });
      }
      wallet.coins = Number((Number(wallet.coins) - UPLOAD_FEE).toFixed(4));
      await wallet.save();
      chargedFee = UPLOAD_FEE;

      rules.collectedFeesCoins = Number((Number(rules.collectedFeesCoins || 0) + UPLOAD_FEE).toFixed(4));
      await rules.save();

      if (repo.CurrencyRegister) {
        await repo.CurrencyRegister.create({
          userId: user.id,
          ownerId: avatarId,
          type: 'Coins',
          transactionType: 'Buy',
          value: -UPLOAD_FEE,
          description: `Taxa fixa de upload de imagem/textura no Shop: "${texName}"`,
        });
      }
      await recordLedgerEntry({
        userId: user.id,
        avatarId,
        currencyType: 'Coins',
        category: 'SHOP_TEXTURE_FEE',
        amount: -UPLOAD_FEE,
        feeAmount: UPLOAD_FEE,
        balanceAfter: wallet.coins,
        description: `Taxa fixa de upload de imagem/textura no Shop: "${texName}"`,
      });
    }

    const uploadResult = await uploadMedia(req.file, "textures");
    const fileRecord = await repo.FileInfo.create({
      userId: String(user.id),
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      inCdn: true,
      status: "uploaded",
    });

    const protectedUrl = `/profile/media/${fileRecord.id}`;
    const hash = require('crypto').createHash('sha256').update(req.file.buffer).digest('hex');

    let texRow = null;
    if (repo.Texture) {
      texRow = await repo.Texture.create({
        name: texName,
        path: protectedUrl,
        url: protectedUrl,
        hash,
        extension: '.png',
        size: req.file.size,
        userId: Number(user.id),
        status: 'done',
      });
    }

    return res.json({
      success: true,
      chargedFeeCoins: chargedFee,
      texture: texRow
        ? texRow.get({ plain: true })
        : { id: fileRecord.id, name: texName, url: protectedUrl, hash, status: 'done' },
    });
  } catch (err) {
    console.error("[/profile/shop/texture/upload]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/shop/gift', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const buyerAvatarId = Number(req.body.avatarId || req.headers['x-profile-id'] || 0);
    const containerId = Number(req.body.containerId || req.body.itemId || 0);
    const recipient = req.body.recipient || req.body.recipientAvatarId || '';

    const result = await giftShopItem({
      buyerUserId: user.id,
      buyerAvatarId,
      recipientAvatarInput: recipient,
      containerId,
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/shop/item/:id/stats', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await repo.ShopContainer.findByPk(id);
    if (!item) return res.status(404).json({ success: false, error: "Item não encontrado." });

    const sales = Number(item.sales || 0);
    return res.json({
      success: true,
      stats: {
        id: item.id,
        title: item.title,
        sales,
        likes: sales * 3 + (item.id % 7) + 2,
        favorites: sales * 2 + (item.id % 5) + 1,
        shares: Math.max(1, Math.floor(sales / 2) + (item.id % 3)),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= ROTAS DE ROOMS (CRIAR, EDITAR, PASSE 24H, VISITAS ÚNICAS E OBJETOS) =================
router.post('/room/create', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const { avatarId, name, description, maxPlayers, isPrivate, password, entryValue } = req.body;
    const parsedEntry = Math.max(0, Number(entryValue || 0));
    const newRoom = await repo.RoomModel.create({
      userId: user.id,
      avatarId: avatarId ? parseInt(avatarId, 10) : null,
      name: name || "Minha Nova Sala",
      description: description || "Espaço privativo do jogador",
      maxPlayers: parseInt(maxPlayers, 10) || 30,
      isPrivate: isPrivate === 'true' || isPrivate === true,
      password: password || "",
      entryValue: Number.isFinite(parsedEntry) ? parsedEntry : 0,
      visits: 0,
      scene: "house"
    });

    const [enriched] = await enrichRoomsWithVisitStats([newRoom], Number(avatarId || 0));
    return res.json({ success: true, room: enriched || newRoom });
  } catch (err) {
    console.error("Erro ao criar sala:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/room/update', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const { roomId, name, description, maxPlayers, isPrivate, password, entryValue } = req.body;
    const room = await repo.RoomModel.findOne({ where: { id: roomId, userId: user.id } });
    if (!room) return res.status(404).json({ success: false, error: "Sala não encontrada" });

    room.name = name || room.name;
    room.description = description !== undefined ? description : room.description;
    room.maxPlayers = maxPlayers ? parseInt(maxPlayers, 10) : room.maxPlayers;
    room.isPrivate = isPrivate === 'true' || isPrivate === true;
    if (password !== undefined) room.password = password;
    if (entryValue !== undefined) {
      const parsedEntry = Math.max(0, Number(entryValue || 0));
      room.entryValue = Number.isFinite(parsedEntry) ? parsedEntry : 0;
    }
    await room.save();

    const [enriched] = await enrichRoomsWithVisitStats([room], Number(room.avatarId || 0));
    return res.json({ success: true, room: enriched || room });
  } catch (err) {
    console.error("Erro ao atualizar sala:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Entrar / Visitar Sala 3D (cobra passe de 24h se a sala tiver entryValue > 0, retém taxa, repassa líquido ao dono, contabiliza visita única mensal, paga bônus por cada 1k visitas e aloca/replica instância na tabela `servers`)
router.post(['/room/:id/enter', '/room/enter'], async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const roomId = Number(req.params.id || req.body.roomId || 0);
    const visitorAvatarId = Number(req.body.avatarId || req.headers['x-profile-id'] || 0);
    const password = String(req.body.password || '');
    const preferredServerId = Number(req.body.serverId || req.body.preferredServerId || 0) || null;
    const preferredServerUid = String(req.body.serverUid || req.body.preferredServerUid || '').trim() || null;

    const result = await enterRoomWithPassAndVisit({
      roomId,
      visitorAvatarId,
      visitorUserId: user.id,
      password,
      preferredServerId,
      preferredServerUid,
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// Listar todas as instâncias ativas (`servers`) de uma Sala 3D
router.get('/room/:id/servers', async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const data = await getRoomActiveServerInstances(roomId);
    return res.json({ success: true, ...data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Replicar ou alocar instância da Sala 3D na tabela `servers` (cria nova sala replicada quando lota ou sob demanda)
router.post('/room/:id/replicate', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const roomId = Number(req.params.id || req.body.roomId || 0);
    const forceNewReplica = req.body.forceNewReplica !== false && req.body.forceNewReplica !== 'false';
    const fillCurrentToTest = Boolean(req.body.fillCurrentToTest);
    const preferredServerId = Number(req.body.serverId || 0) || null;

    const allocation = await allocateOrReplicateRoomServerInstance({
      roomId,
      preferredServerId,
      forceNewReplica,
      fillCurrentToTest,
      joinPlayer: Boolean(req.body.joinPlayer),
    });

    return res.json({
      success: true,
      ...allocation,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// Detalhes, Estatísticas de Visitas Únicas Mensais, Passes 24h e Objetos da Sala
router.get('/room/:id/details', async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const viewerAvatarId = Number(req.query.avatarId || req.headers['x-profile-id'] || 0);
    const roomDetails = await getRoomVisitDetails(roomId, viewerAvatarId);
    if (!roomDetails) return res.status(404).json({ success: false, error: "Sala não encontrada" });

    return res.json({ success: true, room: roomDetails });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Explorador de Salas Públicas + Ranking de Visitas Únicas do Mês
router.get('/rooms/explore', async (req, res) => {
  try {
    const viewerAvatarId = Number(req.query.avatarId || req.headers['x-profile-id'] || 0);
    const publicRooms = await getPublicRoomsExplorer({
      viewerAvatarId,
      limit: Math.min(Math.max(Number(req.query.limit || 24), 4), 60),
    });
    return res.json({ success: true, publicRooms });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Impulsionar Sala 3D no topo do Explorador por 24 horas (roomBoost24hFeeCoins)
router.post(['/room/:id/boost', '/room/boost'], async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: "Não autorizado" });

  try {
    const roomId = Number(req.params.id || req.body.roomId || 0);
    const avatarId = Number(req.body.avatarId || req.headers['x-profile-id'] || 0);
    const result = await boostRoom24h({
      userId: user.id,
      avatarId,
      roomId,
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ================= ROTAS DE AMIGOS DO AVATAR (LISTAR, BUSCAR, SOLICITAR, ACEITAR E REMOVER) =================
router.get('/friends/list', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.query.avatarId || req.headers['x-profile-id']);
  if (!user || !avatarId) return res.status(400).json({ success: false, error: "Avatar inválido" });

  try {
    const data = await loadAvatarFriendsData(avatarId);
    return res.json({ success: true, ...data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/friends/search', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.query.avatarId || req.headers['x-profile-id']);
  const q = String(req.query.q || "").trim();
  if (!user || !avatarId) return res.status(400).json({ success: false, error: "Avatar inválido" });

  try {
    const Op = repo.Sequelize.Op;
    const cleanNum = Number(q.replace(/^#/, ""));
    const whereClause = {
      id: { [Op.ne]: avatarId },
    };

    if (q) {
      const orConds = [{ name: { [Op.iLike]: `%${q}%` } }];
      if (Number.isFinite(cleanNum) && cleanNum > 0) {
        orConds.push({ id: cleanNum });
      }
      whereClause[Op.or] = orConds;
    }

    const avatars = await repo.Avatar.findAll({
      where: whereClause,
      attributes: ["id", "name", "thumbnail", "gender", "bio", "uid"],
      order: [["id", "DESC"]],
      limit: 20,
    });

    const relations = await repo.Friend.findAll({
      where: {
        [Op.or]: [
          { profileId: avatarId },
          { targetProfileId: avatarId },
          { userId: String(avatarId) },
          { targetId: String(avatarId) },
        ],
      },
    });

    const results = avatars.map((av) => {
      const plain = av.get({ plain: true });
      const rel = relations.find((r) => {
        const fId = Number(r.profileId || r.userId || 0);
        const tId = Number(r.targetProfileId || r.targetId || 0);
        return (fId === avatarId && tId === plain.id) || (fId === plain.id && tId === avatarId);
      });

      let relationStatus = "none";
      let friendshipId = null;
      if (rel) {
        friendshipId = rel.id;
        if (rel.status === "accepted") {
          relationStatus = "friends";
        } else if (rel.status === "pending") {
          const fromId = Number(rel.profileId || rel.userId || 0);
          relationStatus = fromId === avatarId ? "pending_sent" : "pending_received";
        }
      }

      return { ...plain, relationStatus, friendshipId };
    });

    return res.json({ success: true, results });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

let _friendsFkChecked = false;
async function ensureFriendsFkDropped() {
  if (_friendsFkChecked) return;
  try {
    await repo.sequelize.query(`
      ALTER TABLE IF EXISTS "avatars" ADD COLUMN IF NOT EXISTS "coverUrl" VARCHAR(255) DEFAULT '';
      ALTER TABLE IF EXISTS "avatars" ADD COLUMN IF NOT EXISTS "privacyPosts" VARCHAR(50) DEFAULT 'public';
      ALTER TABLE IF EXISTS "avatars" ADD COLUMN IF NOT EXISTS "privacyPhotos" VARCHAR(50) DEFAULT 'public';
      ALTER TABLE IF EXISTS "avatars" ADD COLUMN IF NOT EXISTS "privacyRooms" VARCHAR(50) DEFAULT 'public';
      ALTER TABLE IF EXISTS "avatars" ADD COLUMN IF NOT EXISTS "privacyFriends" VARCHAR(50) DEFAULT 'public';
      ALTER TABLE IF EXISTS "avatars" ADD COLUMN IF NOT EXISTS "privacyFollowers" VARCHAR(50) DEFAULT 'public';

      ALTER TABLE IF EXISTS "posts" ADD COLUMN IF NOT EXISTS "roomId" INTEGER;
      ALTER TABLE IF EXISTS "posts" ADD COLUMN IF NOT EXISTS "sharedPostId" INTEGER;

      CREATE TABLE IF NOT EXISTS "mini_reels" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER,
        "profileId" INTEGER,
        "type" VARCHAR(50) DEFAULT 'photo',
        "imageUrl" VARCHAR(255) DEFAULT '',
        "text" TEXT DEFAULT '',
        "feelingEmoji" VARCHAR(50) DEFAULT '',
        "feelingLabel" VARCHAR(100) DEFAULT '',
        "bgStyle" VARCHAR(255) DEFAULT 'from-blue-700 via-indigo-800 to-purple-900',
        "feelingExpiresAt" TIMESTAMPTZ,
        "expiresAt" TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE IF EXISTS "likes" ADD COLUMN IF NOT EXISTS "photoId" INTEGER;
      ALTER TABLE IF EXISTS "likes" ADD COLUMN IF NOT EXISTS "commentId" INTEGER;
      ALTER TABLE IF EXISTS "likes" ADD COLUMN IF NOT EXISTS "targetProfileId" INTEGER;
      ALTER TABLE IF EXISTS "likes" ADD COLUMN IF NOT EXISTS "roomId" INTEGER;
      ALTER TABLE IF EXISTS "likes" ADD COLUMN IF NOT EXISTS "reelId" INTEGER;

      ALTER TABLE IF EXISTS "comments" ADD COLUMN IF NOT EXISTS "reelId" INTEGER;

      ALTER TABLE IF EXISTS "photos" ADD COLUMN IF NOT EXISTS "profileId" INTEGER;
      ALTER TABLE IF EXISTS "photos" ADD COLUMN IF NOT EXISTS "commentId" INTEGER;

      ALTER TABLE IF EXISTS "match_profiles" ADD COLUMN IF NOT EXISTS "profileId" INTEGER;
      ALTER TABLE IF EXISTS "match_profiles" ADD COLUMN IF NOT EXISTS "targetProfileId" INTEGER;
      ALTER TABLE IF EXISTS "match_profiles" ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) DEFAULT 'liked';

      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (
          SELECT tc.table_name, tc.constraint_name
          FROM information_schema.table_constraints tc
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            AND tc.table_name IN ('friends', 'posts', 'likes', 'comments', 'photos', 'follows', 'match_profiles', 'mini_reels')
        ) LOOP
          EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
        END LOOP;
      END $$;
    `);
    _friendsFkChecked = true;
  } catch (e) {
    console.warn("Aviso ensureFriendsFkDropped:", e.message);
  }
}

router.post('/friends/request', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.body.avatarId);
  const targetProfileId = Number(req.body.targetProfileId);

  if (!user || !avatarId || !targetProfileId || avatarId === targetProfileId) {
    return res.status(400).json({ success: false, error: "Parâmetros inválidos para solicitação de amizade." });
  }

  try {
    await ensureFriendsFkDropped();
    const Op = repo.Sequelize.Op;
    const myAvatar = await repo.Avatar.findByPk(avatarId);
    if (!myAvatar) return res.status(404).json({ success: false, error: "Seu avatar ativo não foi encontrado." });
    const targetAvatar = await repo.Avatar.findByPk(targetProfileId);
    if (!targetAvatar) return res.status(404).json({ success: false, error: "Avatar destinatário não encontrado." });

    const existing = await repo.Friend.findOne({
      where: {
        [Op.or]: [
          { profileId: avatarId, targetProfileId: targetProfileId },
          { profileId: targetProfileId, targetProfileId: avatarId },
          { userId: String(avatarId), targetId: String(targetProfileId) },
          { userId: String(targetProfileId), targetId: String(avatarId) },
        ],
      },
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({ success: false, error: "Vocês já são amigos!" });
      }
      const fromId = Number(existing.profileId || existing.userId || 0);
      if (fromId === targetProfileId && existing.status === "pending") {
        // O outro avatar já havia enviado solicitação -> aceita automaticamente!
        existing.status = "accepted";
        existing.profileId = targetProfileId;
        existing.targetProfileId = avatarId;
        await existing.save();

        // Garante sala de DM privada criada
        const directKey = `${Math.min(avatarId, targetProfileId)}_${Math.max(avatarId, targetProfileId)}`;
        let dmRoom = await repo.ChatRoom.findOne({ where: { directKey } });
        if (!dmRoom) {
          dmRoom = await repo.ChatRoom.create({ type: "private", directKey });
          await repo.ChatParticipant.bulkCreate([
            { chatId: dmRoom.id, profileId: avatarId, role: "member" },
            { chatId: dmRoom.id, profileId: targetProfileId, role: "member" },
          ]);
        }

        if (chatWs?.broadcastToProfile) {
          chatWs.broadcastToProfile(targetProfileId, "friend:accepted", { friendshipId: existing.id, byProfileId: avatarId });
        }

        return res.json({ success: true, autoAccepted: true, friendship: existing });
      }
      return res.status(400).json({ success: false, error: "Já existe uma solicitação de amizade pendente." });
    }

    const created = await repo.Friend.create({
      profileId: avatarId,
      targetProfileId: targetProfileId,
      userId: String(avatarId),
      targetId: String(targetProfileId),
      status: "pending",
    });

    if (chatWs?.broadcastToProfile) {
      chatWs.broadcastToProfile(targetProfileId, "friend:request", {
        friendshipId: created.id,
        fromProfileId: avatarId,
      });
    }

    return res.json({ success: true, friendship: created });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/friends/accept', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.body.avatarId);
  const friendshipId = Number(req.body.friendshipId);

  if (!user || !avatarId || !friendshipId) {
    return res.status(400).json({ success: false, error: "Parâmetros inválidos." });
  }

  try {
    await ensureFriendsFkDropped();
    const friendRecord = await repo.Friend.findByPk(friendshipId);
    if (!friendRecord) return res.status(404).json({ success: false, error: "Solicitação não encontrada." });

    const toId = Number(friendRecord.targetProfileId || friendRecord.targetId || 0);
    const fromId = Number(friendRecord.profileId || friendRecord.userId || 0);
    if (toId !== avatarId) {
      return res.status(403).json({ success: false, error: "Apenas o avatar destinatário pode aceitar esta solicitação." });
    }

    friendRecord.status = "accepted";
    friendRecord.profileId = fromId;
    friendRecord.targetProfileId = toId;
    await friendRecord.save();

    // Cria/garante sala de DM privada entre os dois amigos para conversar no Chat
    const directKey = `${Math.min(fromId, toId)}_${Math.max(fromId, toId)}`;
    let dmRoom = await repo.ChatRoom.findOne({ where: { directKey } });
    if (!dmRoom) {
      dmRoom = await repo.ChatRoom.create({ type: "private", directKey });
      await repo.ChatParticipant.bulkCreate([
        { chatId: dmRoom.id, profileId: fromId, role: "member" },
        { chatId: dmRoom.id, profileId: toId, role: "member" },
      ]);
    }

    if (chatWs?.broadcastToProfile) {
      chatWs.broadcastToProfile(fromId, "friend:accepted", {
        friendshipId: friendRecord.id,
        byProfileId: avatarId,
        chatUid: dmRoom.uid,
      });
    }

    return res.json({ success: true, friendship: friendRecord, chatUid: dmRoom.uid });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/friends/remove', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.body.avatarId);
  const friendshipId = Number(req.body.friendshipId);

  if (!user || !avatarId || !friendshipId) {
    return res.status(400).json({ success: false, error: "Parâmetros inválidos." });
  }

  try {
    const friendRecord = await repo.Friend.findByPk(friendshipId);
    if (!friendRecord) return res.status(404).json({ success: false, error: "Registro de amizade não encontrado." });

    const fromId = Number(friendRecord.profileId || friendRecord.userId || 0);
    const toId = Number(friendRecord.targetProfileId || friendRecord.targetId || 0);
    if (fromId !== avatarId && toId !== avatarId) {
      return res.status(403).json({ success: false, error: "Sem permissão para remover esta amizade." });
    }

    await friendRecord.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= REDE SOCIAL, MINI PROFILE, REAÇÕES, COMENTÁRIOS RECURSIVOS, MATCH & PERFIL PÚBLICO =================

const VALID_REACTIONS = ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'];

function summarizeLikes(likesArray, viewerAvatarId) {
  const vId = Number(viewerAvatarId || 0);
  const list = Array.isArray(likesArray) ? likesArray : [];
  const reactionsSummary = {};
  let myReaction = null;

  for (const l of list) {
    const rType = VALID_REACTIONS.includes(l.type) ? l.type : 'like';
    reactionsSummary[rType] = (reactionsSummary[rType] || 0) + 1;
    if (vId > 0 && Number(l.profileId || l.avatarId) === vId) {
      myReaction = rType;
    }
  }

  return {
    likesCount: list.length,
    likedByMe: !!myReaction,
    myReaction,
    reactionsSummary,
  };
}

function buildCommentsTree(flatComments, viewerAvatarId) {
  const list = Array.isArray(flatComments) ? flatComments : [];
  const sorted = [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const map = new Map();
  const roots = [];

  for (const raw of sorted) {
    const plain = typeof raw.get === 'function' ? raw.get({ plain: true }) : raw;
    const likeStats = summarizeLikes(plain.likes, viewerAvatarId);
    const node = {
      ...plain,
      ...likeStats,
      replies: [],
    };
    map.set(Number(node.id), node);
  }

  for (const node of map.values()) {
    const parentId = Number(node.commentId || 0);
    if (parentId && map.has(parentId) && parentId !== Number(node.id)) {
      map.get(parentId).replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return {
    tree: roots,
    totalCount: sorted.length,
  };
}

const POST_INCLUDES = () => [
  { model: repo.Avatar, as: 'profile', attributes: ['id', 'name', 'thumbnail', 'coverUrl', 'gender', 'bio', 'privacyPosts'] },
  {
    model: repo.Photo,
    as: 'photos',
    include: [
      { model: repo.Like, as: 'likes' },
      { model: repo.Comment, as: 'comments' },
    ],
  },
  { model: repo.Like, as: 'likes' },
  {
    model: repo.Comment,
    as: 'comments',
    include: [
      { model: repo.Avatar, as: 'profile', attributes: ['id', 'name', 'thumbnail'] },
      { model: repo.Like, as: 'likes' },
    ],
  },
  { model: repo.RoomModel, as: 'room' },
  {
    model: repo.Post,
    as: 'sharedPost',
    include: [
      { model: repo.Avatar, as: 'profile', attributes: ['id', 'name', 'thumbnail'] },
      { model: repo.Photo, as: 'photos' },
      { model: repo.RoomModel, as: 'room' },
    ],
  },
];

async function formatPostsForViewer(posts, viewerAvatarId) {
  const vId = Number(viewerAvatarId || 0);
  const results = [];

  for (const post of posts) {
    const plain = typeof post.get === "function" ? post.get({ plain: true }) : post;
    const postLikes = (Array.isArray(plain.likes) ? plain.likes : []).filter(
      (l) => !l.commentId && !l.photoId && !l.roomId && !l.targetProfileId
    );
    const likeStats = summarizeLikes(postLikes, vId);

    const photos = Array.isArray(plain.photos) ? plain.photos : [];
    let mainPhoto = photos[0] || null;

    // Se o post antigo tiver imageUrl mas não tiver registro em Photo, garante registro para permitir curtir/comentar a foto
    if (!mainPhoto && plain.imageUrl) {
      try {
        const createdPhoto = await repo.Photo.create({
          userId: plain.userId || null,
          profileId: plain.profileId || null,
          postId: plain.id,
          url: plain.imageUrl,
          description: plain.title || (plain.text ? plain.text.slice(0, 120) : ''),
        });
        mainPhoto = { ...createdPhoto.get({ plain: true }), likes: [], comments: [] };
      } catch (_) {}
    }

    let formattedPhoto = null;
    if (mainPhoto) {
      const pLikes = summarizeLikes(mainPhoto.likes || [], vId);
      const pComments = Array.isArray(mainPhoto.comments) ? mainPhoto.comments : [];
      formattedPhoto = {
        id: mainPhoto.id,
        url: mainPhoto.url,
        description: mainPhoto.description || '',
        ...pLikes,
        commentsCount: pComments.length,
      };
    }

    const mainImage = plain.imageUrl || (formattedPhoto ? formattedPhoto.url : "");

    // Filtra comentários pertencentes ao post (e suas respostas recursivas)
    const rawPostComments = (Array.isArray(plain.comments) ? plain.comments : []).filter(
      (c) => !c.photoId
    );
    const { tree: commentsTree, totalCount: commentsCount } = buildCommentsTree(rawPostComments, vId);

    // Se o post tiver uma Sala 3D vinculada, carrega curtidas da sala
    let formattedRoom = null;
    if (plain.room) {
      const roomLikesRaw = await repo.Like.findAll({ where: { roomId: plain.room.id } });
      const roomLikeStats = summarizeLikes(roomLikesRaw, vId);
      formattedRoom = {
        ...plain.room,
        ...roomLikeStats,
      };
    }

    results.push({
      ...plain,
      mainImage,
      mainPhoto: formattedPhoto,
      room: formattedRoom,
      ...likeStats,
      commentsCount,
      comments: commentsTree,
    });
  }

  return results;
}

// GET /profile/social/feed?avatarId=1&filter=all|friends|mine&beforeId=&afterId=&limit=20 (Sistema de Pool de Posts)
router.get('/social/feed', async (req, res) => {
  const viewerId = Number(req.query.avatarId || req.headers['x-profile-id'] || 0);
  const filter = String(req.query.filter || 'all');
  const poolLimit = Math.min(40, Math.max(1, Number(req.query.limit || 20)));
  const beforeId = Number(req.query.beforeId || 0);
  const afterId = Number(req.query.afterId || 0);

  try {
    await ensureFriendsFkDropped();
    const Op = repo.Sequelize.Op;
    const whereClause = {};

    if (beforeId > 0) {
      whereClause.id = { ...(whereClause.id || {}), [Op.lt]: beforeId };
    }
    if (afterId > 0) {
      whereClause.id = { ...(whereClause.id || {}), [Op.gt]: afterId };
    }

    const friendRows = viewerId
      ? await repo.Friend.findAll({
          where: {
            status: 'accepted',
            [Op.or]: [
              { profileId: viewerId },
              { targetProfileId: viewerId },
              { userId: String(viewerId) },
              { targetId: String(viewerId) },
            ],
          },
        })
      : [];
    const friendIdsSet = new Set([viewerId]);
    friendRows.forEach((r) => {
      const fId = Number(r.profileId || r.userId || 0);
      const tId = Number(r.targetProfileId || r.targetId || 0);
      if (fId) friendIdsSet.add(fId);
      if (tId) friendIdsSet.add(tId);
    });

    if (filter === 'mine' && viewerId) {
      whereClause.profileId = viewerId;
    } else if (filter === 'friends' && viewerId) {
      const followRows = await repo.Follow.findAll({
        where: {
          [Op.or]: [{ profileId: viewerId }, { userid: String(viewerId) }],
        },
      });

      const allowedIds = new Set(friendIdsSet);
      followRows.forEach((f) => {
        const tId = Number(f.targetProfileId || f.targetid || 0);
        if (tId) allowedIds.add(tId);
      });

      whereClause.profileId = { [Op.in]: Array.from(allowedIds) };
    }

    // Busca com margem extra para compensar filtro de privacidade e manter o pool de 20 itens
    const postsRaw = await repo.Post.findAll({
      where: whereClause,
      include: POST_INCLUDES(),
      order: [['id', 'DESC']],
      limit: poolLimit + 15,
    });

    // Filtra publicações respeitando a privacidade de Publicações (privacyPosts) do autor
    const visiblePostsAll = postsRaw.filter((p) => {
      const authorId = Number(p.profileId || 0);
      if (authorId === viewerId) return true;
      const priv = p.profile?.privacyPosts || 'public';
      if (priv === 'private') return false;
      if (priv === 'friends') return friendIdsSet.has(authorId);
      return true;
    });

    const hasMore = visiblePostsAll.length > poolLimit;
    const visiblePosts = visiblePostsAll.slice(0, poolLimit);

    const formatted = await formatPostsForViewer(visiblePosts, viewerId);
    const nextCursorId = formatted.length > 0 ? formatted[formatted.length - 1].id : null;
    const latestPostId = formatted.length > 0 ? formatted[0].id : null;

    return res.json({
      success: true,
      posts: formatted,
      poolMeta: {
        limit: poolLimit,
        count: formatted.length,
        nextCursorId,
        latestPostId,
        hasMore,
      },
    });
  } catch (err) {
    console.error("Erro ao carregar feed social:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /profile/social/posts -> Publicar novo post no mural do Avatar (suporta texto, foto e sala 3D)
router.post('/social/posts', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id']);
  const title = String(req.body.title || '').trim();
  const text = String(req.body.text || '').trim();
  const imageUrl = String(req.body.imageUrl || '').trim();
  const roomId = req.body.roomId ? Number(req.body.roomId) : null;
  const sharedPostId = req.body.sharedPostId ? Number(req.body.sharedPostId) : null;

  if (!user || !avatarId) return res.status(400).json({ success: false, error: "Avatar inválido." });
  if (!text && !imageUrl && !roomId && !sharedPostId) {
    return res.status(400).json({ success: false, error: "Escreva uma mensagem, anexe uma foto ou compartilhe uma sala para publicar." });
  }

  try {
    await ensureFriendsFkDropped();
    const post = await repo.Post.create({
      userId: user.id,
      profileId: avatarId,
      title: title || '',
      text: text || '',
      imageUrl: imageUrl || '',
      roomId: roomId || null,
      sharedPostId: sharedPostId || null,
    });

    if (imageUrl) {
      await repo.Photo.create({
        userId: user.id,
        profileId: avatarId,
        postId: post.id,
        url: imageUrl,
        description: title || text.slice(0, 120),
      });
    }

    const fullPost = await repo.Post.findByPk(post.id, {
      include: POST_INCLUDES(),
    });

    const [formatted] = await formatPostsForViewer([fullPost], avatarId);
    return res.json({ success: true, post: formatted });
  } catch (err) {
    console.error("Erro ao criar publicação:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /profile/social/posts/:id/share -> Compartilhar / Repostar publicação no seu mural
router.post('/social/posts/:id/share', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id']);
  const originalPostId = Number(req.params.id);
  const text = String(req.body.text || '').trim();

  if (!user || !avatarId || !originalPostId) {
    return res.status(400).json({ success: false, error: "Dados inválidos para compartilhamento." });
  }

  try {
    await ensureFriendsFkDropped();
    const original = await repo.Post.findByPk(originalPostId);
    if (!original) return res.status(404).json({ success: false, error: "Publicação original não encontrada." });

    const rootSharedId = original.sharedPostId || original.id;
    const post = await repo.Post.create({
      userId: user.id,
      profileId: avatarId,
      title: '',
      text: text || '',
      sharedPostId: rootSharedId,
    });

    const fullPost = await repo.Post.findByPk(post.id, { include: POST_INCLUDES() });
    const [formatted] = await formatPostsForViewer([fullPost], avatarId);
    return res.json({ success: true, post: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /profile/social/posts/:id/delete -> Excluir post do próprio avatar
router.post('/social/posts/:id/delete', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id']);
  const postId = Number(req.params.id);

  try {
    const post = await repo.Post.findByPk(postId);
    if (!post) return res.status(404).json({ success: false, error: "Publicação não encontrada." });
    if (Number(post.profileId) !== avatarId && Number(post.userId) !== Number(user?.id)) {
      return res.status(403).json({ success: false, error: "Você só pode excluir suas próprias publicações." });
    }
    await post.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /profile/social/react -> Curtir / Reagir universal (post, photo, comment, profile, room, reel)
router.post('/social/react', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id']);
  const targetType = String(req.body.targetType || 'post');
  const targetId = Number(req.body.targetId);
  const reactionType = VALID_REACTIONS.includes(req.body.reactionType) ? req.body.reactionType : 'like';
  const forceReaction = req.body.forceReaction === true || req.body.forceReaction === 'true';

  if (!user || !avatarId || !targetId) {
    return res.status(400).json({ success: false, error: "Dados inválidos para curtida/reação." });
  }

  const targetFieldMap = {
    post: 'postId',
    photo: 'photoId',
    comment: 'commentId',
    profile: 'targetProfileId',
    room: 'roomId',
    reel: 'reelId',
  };
  const targetField = targetFieldMap[targetType];
  if (!targetField) {
    return res.status(400).json({ success: false, error: "Tipo de alvo inválido." });
  }

  try {
    await ensureFriendsFkDropped();
    const Op = repo.Sequelize.Op;

    const whereTarget = { [targetField]: targetId };
    if (targetType === 'post') {
      whereTarget.commentId = null;
      whereTarget.photoId = null;
      whereTarget.reelId = null;
    }

    const existing = await repo.Like.findOne({
      where: {
        ...whereTarget,
        [Op.or]: [{ profileId: avatarId }, { avatarId: avatarId }],
      },
    });

    if (existing) {
      if (forceReaction && existing.type !== reactionType) {
        existing.type = reactionType;
        await existing.save();
      } else {
        await existing.destroy();
      }
    } else {
      await repo.Like.create({
        [targetField]: targetId,
        userId: user.id,
        avatarId,
        profileId: avatarId,
        type: reactionType,
      });
    }

    const allLikes = await repo.Like.findAll({ where: whereTarget });
    const stats = summarizeLikes(allLikes, avatarId);

    return res.json({
      success: true,
      targetType,
      targetId,
      liked: stats.likedByMe,
      myReaction: stats.myReaction,
      likesCount: stats.likesCount,
      reactionsSummary: stats.reactionsSummary,
    });
  } catch (err) {
    console.error("Erro ao reagir:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /profile/social/posts/:id/like -> Compatibilidade direta para curtir post
router.post('/social/posts/:id/like', async (req, res) => {
  req.body.targetType = 'post';
  req.body.targetId = req.params.id;
  req.body.reactionType = req.body.reactionType || 'like';
  const user = req.user || req.session?.user;
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id']);
  const postId = Number(req.params.id);

  if (!user || !avatarId || !postId) return res.status(400).json({ success: false, error: "Dados inválidos." });

  try {
    await ensureFriendsFkDropped();
    const Op = repo.Sequelize.Op;
    const whereTarget = { postId, commentId: null, photoId: null, reelId: null };
    const existing = await repo.Like.findOne({
      where: {
        ...whereTarget,
        [Op.or]: [{ profileId: avatarId }, { avatarId: avatarId }],
      },
    });

    const reactionType = VALID_REACTIONS.includes(req.body.reactionType) ? req.body.reactionType : 'like';
    if (existing) {
      if (req.body.forceReaction && existing.type !== reactionType) {
        existing.type = reactionType;
        await existing.save();
      } else {
        await existing.destroy();
      }
    } else {
      await repo.Like.create({
        postId,
        userId: user.id,
        avatarId,
        profileId: avatarId,
        type: reactionType,
      });
    }

    const allLikes = await repo.Like.findAll({ where: whereTarget });
    const stats = summarizeLikes(allLikes, avatarId);
    return res.json({ success: true, liked: stats.likedByMe, myReaction: stats.myReaction, likesCount: stats.likesCount, reactionsSummary: stats.reactionsSummary });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /profile/social/comment -> Comentar em Post, Foto, Mini Reel ou Responder Comentário (Recursivo!)
async function handleCreateComment(req, res) {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id']);
  let postId = req.body.postId ? Number(req.body.postId) : (req.params.id ? Number(req.params.id) : null);
  let photoId = req.body.photoId ? Number(req.body.photoId) : null;
  let reelId = req.body.reelId ? Number(req.body.reelId) : null;
  const commentId = req.body.commentId ? Number(req.body.commentId) : null;
  const text = String(req.body.text || '').trim();

  if (!user || !avatarId || !text) {
    return res.status(400).json({ success: false, error: "Escreva um comentário válido." });
  }

  try {
    await ensureFriendsFkDropped();

    // Se for resposta a outro comentário (recursivo), herda o postId, photoId ou reelId do comentário pai
    if (commentId) {
      const parentComment = await repo.Comment.findByPk(commentId);
      if (!parentComment) {
        return res.status(404).json({ success: false, error: "Comentário pai não encontrado." });
      }
      if (!postId && parentComment.postId) postId = parentComment.postId;
      if (!photoId && parentComment.photoId) photoId = parentComment.photoId;
      if (!reelId && parentComment.reelId) reelId = parentComment.reelId;
    }

    if (!postId && !photoId && !reelId && !commentId) {
      return res.status(400).json({ success: false, error: "Alvo do comentário não informado." });
    }

    const created = await repo.Comment.create({
      userId: user.id,
      profileId: avatarId,
      postId: postId || null,
      photoId: photoId || null,
      reelId: reelId || null,
      commentId: commentId || null,
      text,
    });

    const fullComment = await repo.Comment.findByPk(created.id, {
      include: [
        { model: repo.Avatar, as: 'profile', attributes: ['id', 'name', 'thumbnail'] },
        { model: repo.Like, as: 'likes' },
      ],
    });

    const plain = fullComment.get({ plain: true });
    return res.json({
      success: true,
      comment: {
        ...plain,
        likesCount: 0,
        likedByMe: false,
        myReaction: null,
        reactionsSummary: {},
        replies: [],
      },
    });
  } catch (err) {
    console.error("Erro ao criar comentário:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

router.post('/social/comment', handleCreateComment);
router.post('/social/posts/:id/comment', handleCreateComment);

// POST /profile/social/comments/:id/delete -> Excluir próprio comentário (e respostas filhas)
router.post('/social/comments/:id/delete', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id']);
  const commentId = Number(req.params.id);

  try {
    const comment = await repo.Comment.findByPk(commentId);
    if (!comment) return res.status(404).json({ success: false, error: "Comentário não encontrado." });
    if (Number(comment.profileId) !== avatarId && Number(comment.userId) !== Number(user?.id)) {
      return res.status(403).json({ success: false, error: "Sem permissão para excluir este comentário." });
    }
    await repo.Comment.destroy({ where: { commentId: comment.id } });
    await comment.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= GALERIA DE FOTOS (COMUNIDADE, AMIGOS E MINHAS FOTOS) =================

// GET /profile/social/gallery?avatarId=1&filter=all|friends|mine&page=1&limit=20
router.get('/social/gallery', async (req, res) => {
  const viewerId = Number(req.query.avatarId || req.headers['x-profile-id'] || 0);
  const filter = String(req.query.filter || 'all');
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));

  try {
    await ensureFriendsFkDropped();
    const Op = repo.Sequelize.Op;
    const whereClause = {};

    const friendRows = viewerId
      ? await repo.Friend.findAll({
          where: {
            status: 'accepted',
            [Op.or]: [
              { profileId: viewerId },
              { targetProfileId: viewerId },
              { userId: String(viewerId) },
              { targetId: String(viewerId) },
            ],
          },
        })
      : [];
    const friendIdsSet = new Set([viewerId]);
    friendRows.forEach((r) => {
      const fId = Number(r.profileId || r.userId || 0);
      const tId = Number(r.targetProfileId || r.targetId || 0);
      if (fId) friendIdsSet.add(fId);
      if (tId) friendIdsSet.add(tId);
    });

    if (filter === 'mine' && viewerId) {
      whereClause.profileId = viewerId;
    } else if (filter === 'friends' && viewerId) {
      const followRows = await repo.Follow.findAll({
        where: { [Op.or]: [{ profileId: viewerId }, { userid: String(viewerId) }] },
      });
      const allowedIds = new Set(friendIdsSet);
      followRows.forEach((f) => {
        const tId = Number(f.targetProfileId || f.targetid || 0);
        if (tId) allowedIds.add(tId);
      });
      whereClause.profileId = { [Op.in]: Array.from(allowedIds) };
    }

    const photosRaw = await repo.Photo.findAll({
      where: whereClause,
      include: [
        { model: repo.Avatar, as: 'profile', attributes: ['id', 'name', 'thumbnail', 'gender', 'bio', 'privacyPhotos'] },
        { model: repo.Like, as: 'likes' },
        { model: repo.Comment, as: 'comments' },
      ],
      order: [['createdAt', 'DESC']],
      limit: 200,
    });

    // Filtra fotos respeitando a privacidade de Fotos (privacyPhotos) do autor
    const visiblePhotos = photosRaw.filter((ph) => {
      const authorId = Number(ph.profileId || 0);
      if (authorId === viewerId) return true;
      const priv = ph.profile?.privacyPhotos || 'public';
      if (priv === 'private') return false;
      if (priv === 'friends') return friendIdsSet.has(authorId);
      return true;
    });

    const total = visiblePhotos.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const pagedPhotos = visiblePhotos.slice(offset, offset + limit);

    const photos = pagedPhotos.map((ph) => {
      const pPlain = ph.get({ plain: true });
      const lStats = summarizeLikes(pPlain.likes || [], viewerId);
      return {
        id: pPlain.id,
        profileId: pPlain.profileId,
        postId: pPlain.postId,
        url: pPlain.url,
        description: pPlain.description || '',
        createdAt: pPlain.createdAt,
        profile: pPlain.profile || null,
        ...lStats,
        commentsCount: Array.isArray(pPlain.comments) ? pPlain.comments.length : 0,
      };
    });

    return res.json({
      success: true,
      photos,
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    });
  } catch (err) {
    console.error("Erro ao carregar galeria de fotos:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /profile/social/gallery -> Adicionar foto diretamente na Galeria de Fotos (sem vídeo)
router.post('/social/gallery', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id']);
  const imageUrl = String(req.body.imageUrl || '').trim();
  const description = String(req.body.description || '').trim();
  const shareOnFeed = req.body.shareOnFeed === true || req.body.shareOnFeed === 'true';

  if (!user || !avatarId || !imageUrl) {
    return res.status(400).json({ success: false, error: "Selecione uma foto válida para adicionar à galeria." });
  }
  if (/\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(imageUrl)) {
    return res.status(400).json({ success: false, error: "Apenas fotos são permitidas na galeria (vídeos não são suportados)." });
  }

  try {
    await ensureFriendsFkDropped();
    let linkedPostId = null;

    if (shareOnFeed) {
      const createdPost = await repo.Post.create({
        userId: user.id,
        profileId: avatarId,
        title: '',
        text: description || 'Adicionou uma nova foto na galeria 📸',
        imageUrl,
      });
      linkedPostId = createdPost.id;
    }

    const photo = await repo.Photo.create({
      userId: user.id,
      profileId: avatarId,
      postId: linkedPostId,
      url: imageUrl,
      description,
    });

    const fullPhoto = await repo.Photo.findByPk(photo.id, {
      include: [
        { model: repo.Avatar, as: 'profile', attributes: ['id', 'name', 'thumbnail', 'gender', 'bio'] },
      ],
    });

    return res.json({
      success: true,
      photo: {
        ...fullPhoto.get({ plain: true }),
        likesCount: 0,
        likedByMe: false,
        myReaction: null,
        reactionsSummary: {},
        commentsCount: 0,
      },
    });
  } catch (err) {
    console.error("Erro ao adicionar foto na galeria:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /profile/social/photos/:photoId/delete -> Excluir foto da galeria
router.post('/social/photos/:photoId/delete', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id']);
  const photoId = Number(req.params.photoId);

  try {
    const photo = await repo.Photo.findByPk(photoId);
    if (!photo) return res.status(404).json({ success: false, error: "Foto não encontrada." });
    if (Number(photo.profileId) !== avatarId && Number(photo.userId) !== Number(user?.id)) {
      return res.status(403).json({ success: false, error: "Você só pode excluir suas próprias fotos." });
    }
    await photo.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /profile/social/photos/:photoId -> Detalhes da Foto (curtidas da foto + árvore recursiva de comentários da foto)
router.get('/social/photos/:photoId', async (req, res) => {
  const photoId = Number(req.params.photoId);
  const viewerId = Number(req.query.viewerId || req.headers['x-profile-id'] || 0);

  if (!photoId) return res.status(400).json({ success: false, error: "Foto inválida." });

  try {
    await ensureFriendsFkDropped();
    const photo = await repo.Photo.findByPk(photoId, {
      include: [
        { model: repo.Avatar, as: 'profile', attributes: ['id', 'name', 'thumbnail', 'gender', 'bio'] },
        { model: repo.Like, as: 'likes' },
        {
          model: repo.Comment,
          as: 'comments',
          include: [
            { model: repo.Avatar, as: 'profile', attributes: ['id', 'name', 'thumbnail'] },
            { model: repo.Like, as: 'likes' },
          ],
        },
      ],
    });

    if (!photo) return res.status(404).json({ success: false, error: "Foto não encontrada." });

    const plain = photo.get({ plain: true });
    const likeStats = summarizeLikes(plain.likes || [], viewerId);
    const { tree: commentsTree, totalCount: commentsCount } = buildCommentsTree(plain.comments || [], viewerId);

    return res.json({
      success: true,
      photo: {
        ...plain,
        ...likeStats,
        commentsCount,
        comments: commentsTree,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= MINI REELS (FOTOS & TEXTO 24H | SENTIMENTO DO MOMENTO 6H | SEM VÍDEOS) =================

function formatMiniReelForViewer(reel, viewerAvatarId, now = new Date()) {
  const plain = typeof reel.get === 'function' ? reel.get({ plain: true }) : reel;
  const likeStats = summarizeLikes(plain.likes || [], viewerAvatarId);
  const { tree: commentsTree, totalCount: commentsCount } = buildCommentsTree(plain.comments || [], viewerAvatarId);

  const expiresMs = new Date(plain.expiresAt).getTime() - now.getTime();
  const feelingExpiresMs = plain.feelingExpiresAt ? new Date(plain.feelingExpiresAt).getTime() - now.getTime() : 0;
  const isFeelingActive = feelingExpiresMs > 0 && !!(plain.feelingEmoji || plain.feelingLabel);

  return {
    id: plain.id,
    userId: plain.userId,
    profileId: plain.profileId,
    type: plain.type || 'photo',
    imageUrl: plain.imageUrl || '',
    text: plain.text || '',
    feelingEmoji: isFeelingActive ? plain.feelingEmoji : '',
    feelingLabel: isFeelingActive ? plain.feelingLabel : '',
    bgStyle: plain.bgStyle || 'from-blue-700 via-indigo-800 to-purple-900',
    createdAt: plain.createdAt,
    expiresAt: plain.expiresAt,
    feelingExpiresAt: plain.feelingExpiresAt,
    remainingHours: Math.max(0, Math.ceil(expiresMs / (60 * 60 * 1000))),
    remainingMinutes: Math.max(1, Math.ceil(expiresMs / (60 * 1000))),
    feelingRemainingHours: isFeelingActive ? Math.max(0, Math.ceil(feelingExpiresMs / (60 * 60 * 1000))) : 0,
    feelingRemainingMinutes: isFeelingActive ? Math.max(1, Math.ceil(feelingExpiresMs / (60 * 1000))) : 0,
    profile: plain.profile || null,
    ...likeStats,
    commentsCount,
    comments: commentsTree,
  };
}

// GET /profile/social/reels?avatarId=1 -> Lista todos os Mini Reels e Sentimentos ativos (não expirados)
router.get('/social/reels', async (req, res) => {
  const viewerId = Number(req.query.avatarId || req.headers['x-profile-id'] || 0);

  try {
    await ensureFriendsFkDropped();
    const Op = repo.Sequelize.Op;
    const now = new Date();

    // Remove do banco os Mini Reels que já venceram (6h para sentimento puro, 24h para foto/texto)
    await repo.MiniReel.destroy({
      where: {
        expiresAt: { [Op.lte]: now },
      },
    }).catch(() => {});

    const reelsRaw = await repo.MiniReel.findAll({
      where: {
        expiresAt: { [Op.gt]: now },
      },
      include: [
        { model: repo.Avatar, as: 'profile', attributes: ['id', 'name', 'thumbnail', 'gender', 'bio'] },
        { model: repo.Like, as: 'likes' },
        {
          model: repo.Comment,
          as: 'comments',
          include: [
            { model: repo.Avatar, as: 'profile', attributes: ['id', 'name', 'thumbnail'] },
            { model: repo.Like, as: 'likes' },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 60,
    });

    const formatted = reelsRaw
      .map((r) => formatMiniReelForViewer(r, viewerId, now))
      // Se era um card apenas de sentimento e o sentimento de 6h expirou, ignora
      .filter((r) => !(r.type === 'feeling' && !r.feelingEmoji && !r.feelingLabel));

    const myActiveFeeling = formatted.find(
      (r) => Number(r.profileId) === viewerId && (r.feelingEmoji || r.feelingLabel)
    ) || null;

    return res.json({
      success: true,
      reels: formatted,
      myActiveFeeling: myActiveFeeling
        ? {
            id: myActiveFeeling.id,
            feelingEmoji: myActiveFeeling.feelingEmoji,
            feelingLabel: myActiveFeeling.feelingLabel,
            text: myActiveFeeling.text,
            feelingExpiresAt: myActiveFeeling.feelingExpiresAt,
            feelingRemainingHours: myActiveFeeling.feelingRemainingHours,
            feelingRemainingMinutes: myActiveFeeling.feelingRemainingMinutes,
          }
        : null,
    });
  } catch (err) {
    console.error("Erro ao carregar Mini Reels:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /profile/social/reels -> Publicar Mini Reel (Sentimento = 6h | Foto ou Texto = 24h | Sem vídeos)
router.post('/social/reels', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id']);
  const requestedType = String(req.body.type || '').trim();
  const imageUrl = String(req.body.imageUrl || '').trim();
  const text = String(req.body.text || '').trim();
  const feelingEmoji = String(req.body.feelingEmoji || '').trim();
  const feelingLabel = String(req.body.feelingLabel || '').trim();
  const bgStyle = String(req.body.bgStyle || 'from-blue-700 via-indigo-800 to-purple-900').trim();
  const saveToGallery = req.body.saveToGallery === true || req.body.saveToGallery === 'true';

  if (!user || !avatarId) {
    return res.status(400).json({ success: false, error: "Avatar inválido." });
  }
  if (imageUrl && /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(imageUrl)) {
    return res.status(400).json({ success: false, error: "Mini Reels não permite vídeos! Use apenas fotos, texto e sentimentos." });
  }

  // Determina o tipo:
  // - 'feeling': apenas sentimento (com ou sem frase curta) -> dura 6 HORAS
  // - 'photo': tem foto (com ou sem texto/sentimento) -> foto/texto dura 24 HORAS (e sentimento anexado dura 6 HORAS)
  // - 'text': card de texto estilizado -> dura 24 HORAS (e sentimento anexado dura 6 HORAS)
  let reelType = requestedType;
  if (!['feeling', 'photo', 'text'].includes(reelType)) {
    if (imageUrl) reelType = 'photo';
    else if (feelingEmoji || feelingLabel) reelType = 'feeling';
    else reelType = 'text';
  }

  if (reelType === 'photo' && !imageUrl) {
    return res.status(400).json({ success: false, error: "Anexe uma foto para criar um Mini Reel de imagem." });
  }
  if (reelType === 'text' && !text) {
    return res.status(400).json({ success: false, error: "Digite um texto para o seu Mini Reel." });
  }
  if (reelType === 'feeling' && !feelingEmoji && !feelingLabel) {
    return res.status(400).json({ success: false, error: "Escolha como você está se sentindo no momento." });
  }

  try {
    await ensureFriendsFkDropped();
    const now = new Date();
    const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const hasFeeling = !!(feelingEmoji || feelingLabel);
    const expiresAt = reelType === 'feeling' ? sixHoursLater : twentyFourHoursLater;
    const feelingExpiresAt = hasFeeling ? sixHoursLater : null;

    // Se o usuário está atualizando apenas o Sentimento ('feeling'), substitui o sentimento anterior puro para não duplicar
    if (reelType === 'feeling') {
      await repo.MiniReel.destroy({
        where: { profileId: avatarId, type: 'feeling' },
      }).catch(() => {});
    }

    const created = await repo.MiniReel.create({
      userId: user.id,
      profileId: avatarId,
      type: reelType,
      imageUrl: reelType === 'photo' ? imageUrl : '',
      text,
      feelingEmoji,
      feelingLabel,
      bgStyle,
      feelingExpiresAt,
      expiresAt,
    });

    // Opcionalmente salva a foto na Galeria de Fotos permanente do avatar
    if (reelType === 'photo' && imageUrl && saveToGallery) {
      await repo.Photo.create({
        userId: user.id,
        profileId: avatarId,
        url: imageUrl,
        description: text || (feelingLabel ? `Sentindo-se ${feelingEmoji} ${feelingLabel}` : 'Mini Reel'),
      }).catch(() => {});
    }

    const fullReel = await repo.MiniReel.findByPk(created.id, {
      include: [
        { model: repo.Avatar, as: 'profile', attributes: ['id', 'name', 'thumbnail', 'gender', 'bio'] },
        { model: repo.Like, as: 'likes' },
        { model: repo.Comment, as: 'comments' },
      ],
    });

    return res.json({
      success: true,
      reel: formatMiniReelForViewer(fullReel, avatarId, now),
    });
  } catch (err) {
    console.error("Erro ao criar Mini Reel:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /profile/social/reels/:id/delete -> Excluir Mini Reel ou Sentimento
router.post('/social/reels/:id/delete', async (req, res) => {
  const user = req.user || req.session?.user;
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id']);
  const reelId = Number(req.params.id);

  try {
    const reel = await repo.MiniReel.findByPk(reelId);
    if (!reel) return res.status(404).json({ success: false, error: "Mini Reel não encontrado." });
    if (Number(reel.profileId) !== avatarId && Number(reel.userId) !== Number(user?.id)) {
      return res.status(403).json({ success: false, error: "Você só pode excluir seus próprios Mini Reels." });
    }
    await reel.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /profile/social/follow -> Seguir / Deixar de seguir Avatar
router.post('/social/follow', async (req, res) => {
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id']);
  const targetProfileId = Number(req.body.targetProfileId);

  if (!avatarId || !targetProfileId || avatarId === targetProfileId) {
    return res.status(400).json({ success: false, error: "Parâmetros inválidos." });
  }

  try {
    await ensureFriendsFkDropped();
    const Op = repo.Sequelize.Op;
    const existing = await repo.Follow.findOne({
      where: {
        [Op.or]: [
          { profileId: avatarId, targetProfileId },
          { userid: String(avatarId), targetid: String(targetProfileId) },
        ],
      },
    });

    let following = false;
    if (existing) {
      await existing.destroy();
      following = false;
    } else {
      await repo.Follow.create({
        profileId: avatarId,
        targetProfileId,
        userid: String(avatarId),
        targetid: String(targetProfileId),
      });
      following = true;
    }

    const followersCount = await repo.Follow.count({
      where: {
        [Op.or]: [{ targetProfileId }, { targetid: String(targetProfileId) }],
      },
    });

    return res.json({ success: true, following, followersCount });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /profile/social/match -> Dar Match / Crush em outro Avatar
router.post('/social/match', async (req, res) => {
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id']);
  const targetProfileId = Number(req.body.targetProfileId);

  if (!avatarId || !targetProfileId || avatarId === targetProfileId) {
    return res.status(400).json({ success: false, error: "Parâmetros inválidos para Match." });
  }

  try {
    await ensureFriendsFkDropped();
    const myAvatar = await repo.Avatar.findByPk(avatarId);
    const targetAvatar = await repo.Avatar.findByPk(targetProfileId);
    if (!myAvatar || !targetAvatar) {
      return res.status(404).json({ success: false, error: "Avatar não encontrado." });
    }

    const myRecord = await repo.MatchProfile.findOne({
      where: { profileId: avatarId, targetProfileId },
    });
    const theirRecord = await repo.MatchProfile.findOne({
      where: { profileId: targetProfileId, targetProfileId: avatarId },
    });

    let matchStatus = 'none';
    let isMutual = false;
    let chatUid = null;

    if (myRecord) {
      // Remove meu crush/match
      await myRecord.destroy();
      if (theirRecord && theirRecord.status === 'matched') {
        theirRecord.status = 'liked';
        await theirRecord.save();
      }
      matchStatus = theirRecord ? 'crush_received' : 'none';
    } else {
      if (theirRecord) {
        // MATCH MÚTUO!
        isMutual = true;
        matchStatus = 'matched';
        theirRecord.status = 'matched';
        await theirRecord.save();

        await repo.MatchProfile.create({
          profileId: avatarId,
          targetProfileId,
          userid: String(avatarId),
          name: myAvatar.name || '',
          avatar: myAvatar.thumbnail || '',
          status: 'matched',
        });

        // Garante sala de DM privada para o casal de Match conversar!
        const directKey = `${Math.min(avatarId, targetProfileId)}_${Math.max(avatarId, targetProfileId)}`;
        let dmRoom = await repo.ChatRoom.findOne({ where: { directKey } });
        if (!dmRoom) {
          dmRoom = await repo.ChatRoom.create({ type: "private", directKey });
          await repo.ChatParticipant.bulkCreate([
            { chatId: dmRoom.id, profileId: avatarId, role: "member" },
            { chatId: dmRoom.id, profileId: targetProfileId, role: "member" },
          ]);
        }
        chatUid = dmRoom.uid;

        if (chatWs?.broadcastToProfile) {
          chatWs.broadcastToProfile(targetProfileId, "match:mutual", {
            withProfileId: avatarId,
            withName: myAvatar.name,
            chatUid: dmRoom.uid,
          });
        }
      } else {
        // Crush enviado (aguardando reciprocidade)
        matchStatus = 'crush_sent';
        await repo.MatchProfile.create({
          profileId: avatarId,
          targetProfileId,
          userid: String(avatarId),
          name: myAvatar.name || '',
          avatar: myAvatar.thumbnail || '',
          status: 'liked',
        });
      }
    }

    const matchesCount = await repo.MatchProfile.count({
      where: { profileId: targetProfileId, status: 'matched' },
    });

    return res.json({
      success: true,
      matchStatus,
      isMutual,
      matchesCount,
      chatUid,
    });
  } catch (err) {
    console.error("Erro no sistema de Match:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /profile/social/avatar/:targetId -> Mini Profile + Perfil Completo do Avatar (com Privacidade, Capa, Match, Fotos, Seguidores e Salas)
router.get('/social/avatar/:targetId', async (req, res) => {
  const targetId = Number(req.params.targetId);
  const viewerId = Number(req.query.viewerId || req.headers['x-profile-id'] || 0);

  if (!targetId) return res.status(400).json({ success: false, error: "Avatar inválido." });

  try {
    await ensureFriendsFkDropped();
    const Op = repo.Sequelize.Op;
    const avatar = await repo.Avatar.findByPk(targetId, {
      attributes: [
        'id', 'name', 'bio', 'gender', 'thumbnail', 'coverUrl',
        'privacyPosts', 'privacyPhotos', 'privacyRooms', 'privacyFriends', 'privacyFollowers',
        'online', 'createdAt', 'uid'
      ],
    });
    if (!avatar) return res.status(404).json({ success: false, error: "Avatar não encontrado." });

    const plainAvatar = avatar.get({ plain: true });
    const isSelf = viewerId === targetId;

    // Amigos desse avatar
    const friendData = await loadAvatarFriendsData(targetId);

    // Status de amizade, follow e match com quem está visualizando (viewerId)
    let friendStatus = 'none';
    let friendshipId = null;
    let isFollowing = false;
    let matchStatus = 'none';

    if (viewerId && !isSelf) {
      const rel = await repo.Friend.findOne({
        where: {
          [Op.or]: [
            { profileId: viewerId, targetProfileId: targetId },
            { profileId: targetId, targetProfileId: viewerId },
            { userId: String(viewerId), targetId: String(targetId) },
            { userId: String(targetId), targetId: String(viewerId) },
          ],
        },
      });
      if (rel) {
        friendshipId = rel.id;
        if (rel.status === 'accepted') {
          friendStatus = 'friends';
        } else if (rel.status === 'pending') {
          const fromId = Number(rel.profileId || rel.userId || 0);
          friendStatus = fromId === viewerId ? 'pending_sent' : 'pending_received';
        }
      }

      const followRel = await repo.Follow.findOne({
        where: {
          [Op.or]: [
            { profileId: viewerId, targetProfileId: targetId },
            { userid: String(viewerId), targetid: String(targetId) },
          ],
        },
      });
      isFollowing = !!followRel;

      const myMatch = await repo.MatchProfile.findOne({
        where: { profileId: viewerId, targetProfileId: targetId },
      });
      const theirMatch = await repo.MatchProfile.findOne({
        where: { profileId: targetId, targetProfileId: viewerId },
      });
      if (myMatch && theirMatch) {
        matchStatus = 'matched';
      } else if (myMatch) {
        matchStatus = 'crush_sent';
      } else if (theirMatch) {
        matchStatus = 'crush_received';
      }
    }

    // Seguidores desse avatar
    const followRows = await repo.Follow.findAll({
      where: {
        [Op.or]: [{ targetProfileId: targetId }, { targetid: String(targetId) }],
      },
      order: [['createdAt', 'DESC']],
    });
    const followerIds = Array.from(
      new Set(
        followRows
          .map((f) => Number(f.profileId || f.userid || 0))
          .filter((id) => id > 0)
      )
    );
    const followerAvatars = followerIds.length > 0
      ? await repo.Avatar.findAll({
          where: { id: { [Op.in]: followerIds } },
          attributes: ['id', 'name', 'thumbnail', 'coverUrl', 'gender', 'bio', 'uid'],
        })
      : [];

    // Regras de privacidade por seção (Publicações, Fotos, Salas, Lista de Amigos e Seguidores)
    const privacyPosts = plainAvatar.privacyPosts || 'public';
    const privacyPhotos = plainAvatar.privacyPhotos || 'public';
    const privacyRooms = plainAvatar.privacyRooms || 'public';
    const privacyFriends = plainAvatar.privacyFriends || 'public';
    const privacyFollowers = plainAvatar.privacyFollowers || 'public';
    const isFriendWithTarget = friendStatus === 'friends';

    const canViewPosts =
      isSelf ||
      privacyPosts === 'public' ||
      (privacyPosts === 'friends' && isFriendWithTarget);

    const canViewPhotos =
      isSelf ||
      privacyPhotos === 'public' ||
      (privacyPhotos === 'friends' && isFriendWithTarget);

    const canViewRooms =
      isSelf ||
      privacyRooms === 'public' ||
      (privacyRooms === 'friends' && isFriendWithTarget);

    const canViewFriends =
      isSelf ||
      privacyFriends === 'public' ||
      (privacyFriends === 'friends' && isFriendWithTarget);

    const canViewFollowers =
      isSelf ||
      privacyFollowers === 'public' ||
      (privacyFollowers === 'friends' && isFriendWithTarget);

    // Curtidas / Reações que este Perfil recebeu
    const profileLikesRaw = await repo.Like.findAll({
      where: { targetProfileId: targetId },
    });
    const profileLikeStats = summarizeLikes(profileLikesRaw, viewerId);

    // Matches desse avatar
    const matchRows = await repo.MatchProfile.findAll({
      where: {
        [Op.or]: [
          { profileId: targetId },
          { targetProfileId: targetId },
        ],
      },
      order: [['updatedAt', 'DESC']],
    });

    const mutualMatchIds = new Set();
    const crushesReceivedIds = new Set();
    const crushesSentIds = new Set();

    for (const m of matchRows) {
      const pId = Number(m.profileId || 0);
      const tId = Number(m.targetProfileId || 0);
      if (m.status === 'matched') {
        const otherId = pId === targetId ? tId : pId;
        if (otherId) mutualMatchIds.add(otherId);
      } else if (tId === targetId && pId) {
        crushesReceivedIds.add(pId);
      } else if (pId === targetId && tId) {
        crushesSentIds.add(tId);
      }
    }

    const allMatchRelatedIds = Array.from(new Set([...mutualMatchIds, ...crushesReceivedIds, ...crushesSentIds]));
    const matchAvatarsList = allMatchRelatedIds.length > 0
      ? await repo.Avatar.findAll({
          where: { id: { [Op.in]: allMatchRelatedIds } },
          attributes: ['id', 'name', 'thumbnail', 'gender', 'bio'],
        })
      : [];
    const matchAvatarMap = new Map(matchAvatarsList.map((a) => [Number(a.id), a.get({ plain: true })]));

    const mutualMatchesList = Array.from(mutualMatchIds).map((id) => matchAvatarMap.get(id)).filter(Boolean);
    const crushesReceivedList = isSelf
      ? Array.from(crushesReceivedIds).map((id) => matchAvatarMap.get(id)).filter(Boolean)
      : [];

    // Publicações do avatar
    const postsRaw = await repo.Post.findAll({
      where: { profileId: targetId },
      include: POST_INCLUDES(),
      order: [['createdAt', 'DESC']],
      limit: 30,
    });
    const posts = await formatPostsForViewer(postsRaw, viewerId);

    // Galeria de Fotos do avatar
    const photosRaw = await repo.Photo.findAll({
      where: { profileId: targetId },
      include: [
        { model: repo.Like, as: 'likes' },
        { model: repo.Comment, as: 'comments' },
      ],
      order: [['createdAt', 'DESC']],
      limit: 40,
    });
    const photos = photosRaw.map((ph) => {
      const pPlain = ph.get({ plain: true });
      const lStats = summarizeLikes(pPlain.likes || [], viewerId);
      return {
        id: pPlain.id,
        postId: pPlain.postId,
        url: pPlain.url,
        description: pPlain.description || '',
        createdAt: pPlain.createdAt,
        ...lStats,
        commentsCount: Array.isArray(pPlain.comments) ? pPlain.comments.length : 0,
      };
    });

    // Salas 3D do avatar (com curtidas de cada sala)
    const roomsRaw = await repo.RoomModel.findAll({
      where: { avatarId: targetId },
      order: [['id', 'DESC']],
      limit: 20,
    });
    const roomIds = roomsRaw.map((r) => r.id);
    const roomLikesAll = roomIds.length > 0
      ? await repo.Like.findAll({ where: { roomId: { [Op.in]: roomIds } } })
      : [];

    const roomsWithLikes = roomsRaw.map((r) => {
      const rPlain = r.get({ plain: true });
      const rLikes = roomLikesAll.filter((l) => Number(l.roomId) === Number(rPlain.id));
      const rStats = summarizeLikes(rLikes, viewerId);
      return {
        ...rPlain,
        ...rStats,
      };
    });
    const rooms = await enrichRoomsWithVisitStats(roomsWithLikes, viewerId);

    // Mini Reels e Sentimento ativo desse avatar
    const now = new Date();
    const reelsRaw = await repo.MiniReel.findAll({
      where: {
        profileId: targetId,
        expiresAt: { [Op.gt]: now },
      },
      include: [
        { model: repo.Avatar, as: 'profile', attributes: ['id', 'name', 'thumbnail', 'gender', 'bio'] },
        { model: repo.Like, as: 'likes' },
        {
          model: repo.Comment,
          as: 'comments',
          include: [
            { model: repo.Avatar, as: 'profile', attributes: ['id', 'name', 'thumbnail'] },
            { model: repo.Like, as: 'likes' },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    const miniReels = reelsRaw
      .map((r) => formatMiniReelForViewer(r, viewerId, now))
      .filter((r) => !(r.type === 'feeling' && !r.feelingEmoji && !r.feelingLabel));
    const currentFeelingReel = miniReels.find((r) => r.feelingEmoji || r.feelingLabel) || null;
    const currentFeeling = currentFeelingReel
      ? {
          id: currentFeelingReel.id,
          feelingEmoji: currentFeelingReel.feelingEmoji,
          feelingLabel: currentFeelingReel.feelingLabel,
          text: currentFeelingReel.text,
          feelingRemainingHours: currentFeelingReel.feelingRemainingHours,
          feelingRemainingMinutes: currentFeelingReel.feelingRemainingMinutes,
        }
      : null;

    return res.json({
      success: true,
      avatar: plainAvatar,
      currentFeeling,
      miniReels,
      stats: {
        postsCount: posts.length,
        photosCount: photos.length,
        friendsCount: friendData.friendsList.length,
        roomsCount: rooms.length,
        followersCount: followerIds.length,
        profileLikesCount: profileLikeStats.likesCount,
        matchesCount: mutualMatchesList.length,
        reelsCount: miniReels.length,
      },
      relation: {
        isSelf,
        friendStatus,
        friendshipId,
        isFollowing,
        matchStatus,
        profileLikedByMe: profileLikeStats.likedByMe,
        myProfileReaction: profileLikeStats.myReaction,
        profileReactionsSummary: profileLikeStats.reactionsSummary,
      },
      privacy: {
        privacyPosts,
        privacyPhotos,
        privacyRooms,
        privacyFriends,
        privacyFollowers,
        canViewPosts,
        canViewPhotos,
        canViewRooms,
        canViewFriends,
        canViewFollowers,
      },
      posts: canViewPosts ? posts : [],
      photos: canViewPhotos ? photos : [],
      rooms: canViewRooms ? rooms : [],
      friends: canViewFriends ? friendData.friendsList.map((f) => f.avatar) : [],
      followers: canViewFollowers ? followerAvatars.map((a) => a.get({ plain: true })) : [],
      matches: mutualMatchesList,
      crushesReceived: crushesReceivedList,
    });
  } catch (err) {
    console.error("Erro ao carregar perfil social do avatar:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= DIÁRIO SECRETO & CANTINHO DE DESABAFO ANÔNIMO =================
router.get('/diary/overview', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: 'Não autorizado.' });
  const avatarId = Number(req.query.avatarId || req.headers['x-profile-id'] || 0);

  try {
    const overview = await getDiaryOverview({
      userId: user.id,
      avatarId,
      mood: req.query.mood || 'ALL',
      category: req.query.category || 'ALL',
      sort: req.query.sort || 'recent',
    });
    return res.json({ success: true, ...overview });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/diary/page/save', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: 'Não autorizado.' });
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id'] || 0);

  try {
    const result = await saveDiaryPage({
      userId: user.id,
      avatarId,
      pageId: req.body.pageId || null,
      title: req.body.title,
      content: req.body.content,
      moodKey: req.body.moodKey,
      category: req.body.category,
      isPublicAnonymous: req.body.isPublicAnonymous,
      allowComments: req.body.allowComments !== false && req.body.allowComments !== 'false',
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/diary/page/:id/visibility', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: 'Não autorizado.' });

  try {
    const result = await toggleDiaryPageVisibility({
      userId: user.id,
      pageId: req.params.id,
      isPublicAnonymous: req.body.isPublicAnonymous,
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/diary/page/:id/delete', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: 'Não autorizado.' });

  try {
    const result = await deleteDiaryPage({
      userId: user.id,
      pageId: req.params.id,
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/diary/page/:id/react', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: 'Não autorizado.' });
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id'] || 0);

  try {
    const result = await reactToDiaryPage({
      userId: user.id,
      avatarId,
      pageId: req.params.id,
      reactionType: req.body.reactionType || 'hug',
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/diary/page/:id/comment', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: 'Não autorizado.' });
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id'] || 0);

  try {
    const result = await commentOnDiaryPage({
      userId: user.id,
      avatarId,
      pageId: req.params.id,
      content: req.body.content,
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/diary/comment/:id/delete', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: 'Não autorizado.' });

  try {
    const result = await deleteDiaryComment({
      userId: user.id,
      commentId: req.params.id,
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/diary/page/:id/read-reward', async (req, res) => {
  const user = req.user || req.session?.user;
  if (!user) return res.status(401).json({ success: false, error: 'Não autorizado.' });
  const avatarId = Number(req.body.avatarId || req.headers['x-profile-id'] || 0);

  try {
    const result = await recordDiaryReadingProgress({
      userId: user.id,
      avatarId,
      pageId: req.params.id,
      secondsReadDelta: Number(req.body.secondsReadDelta || 15),
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;