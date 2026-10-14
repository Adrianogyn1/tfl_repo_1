const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const repo = require("../../repositories/repository.js");
const { getPlatformStats, clearVisitTelemetry } = require("../../services/stats.service");
const {
  getEconomyRules,
  updateEconomyRules,
  reviewPaymentTransaction,
  recordLedger,
  createNotification,
  allocateOrReplicateRoomServerInstance,
  cancelCoinSaleOrder,
} = require("../../services/coinMarket.service");
const {
  SHOP_3D_RULES,
  listShopCatalog,
  saveShopCatalogItem,
  deleteShopCatalogItem,
} = require("../../services/shop3d.service");

const ALLOWED_ADMIN_ROLES = ["admin", "owner", "ownner", "desenvolvedor"];

function isUserAdmin(user) {
  if (!user) return false;
  const role = String(user.role || "").toLowerCase();
  return ALLOWED_ADMIN_ROLES.includes(role) || Number(user.id) === 1;
}

// Middleware de proteção estrita das rotas /admin
async function requireAdminAuth(req, res, next) {
  try {
    let user = req.session?.user || req.user || null;

    const token =
      req.cookies?.userToken ||
      req.headers?.["tfl-token"] ||
      req.headers?.["token"] ||
      (req.headers?.authorization
        ? req.headers.authorization.replace(/^Bearer\s+/i, "").trim()
        : "");

    if (!user && token && repo.User) {
      const dbUser = await repo.User.findOne({ where: { token } });
      if (dbUser) {
        user = dbUser.get({ plain: true });
        if (req.session) req.session.user = user;
      }
    } else if (user?.id && repo.User) {
      const fresh = await repo.User.findByPk(user.id);
      if (fresh) {
        user = fresh.get({ plain: true });
        if (req.session) req.session.user = user;
      }
    }

    const isApiCall =
      req.path.startsWith("/api/") ||
      req.xhr ||
      (req.headers.accept && req.headers.accept.includes("application/json"));

    if (!user) {
      if (isApiCall) {
        return res.status(401).json({ success: false, error: "Não autenticado no painel Admin." });
      }
      return res.redirect("/admin/login?pg=" + encodeURIComponent(req.originalUrl));
    }

    if (!isUserAdmin(user)) {
      if (isApiCall) {
        return res.status(403).json({ success: false, error: "Acesso restrito a administradores." });
      }
      return res.redirect("/admin/login?error=forbidden");
    }

    req.user = user;
    req.userId = user.id;
    return next();
  } catch (err) {
    console.error("[admin:requireAdminAuth]", err);
    return res.redirect("/admin/login");
  }
}

const sendPage = function (page, res) {
  const caminho = path.resolve(__dirname, `../../views/admin/${page}.html`);
  if (!fs.existsSync(caminho)) {
    return res.status(404).send("Página não encontrada: " + caminho);
  }
  return res.sendFile(caminho);
};

// Página de Login Admin (Pública)
router.get("/login", (req, res) => {
  sendPage("login", res);
});

// ================= 1. DASHBOARD STATS & TELEMETRIA =================
router.get("/api/stats", requireAdminAuth, async (req, res) => {
  try {
    const [stats, economyRules, pendingPayments] = await Promise.all([
      getPlatformStats(),
      getEconomyRules().catch(() => ({})),
      repo.PaymentBank
        ? repo.PaymentBank.findAll({
            where: {
              type: { [repo.Sequelize.Op.in]: ["Buy", "Withdraw"] },
            },
            order: [["createdAt", "DESC"]],
            limit: 30,
          }).catch(() => [])
        : [],
    ]);

    return res.json({
      success: true,
      adminUser: {
        id: req.user.id,
        userName: req.user.userName || req.user.login,
        role: req.user.role,
      },
      stats,
      economyRules,
      payments: pendingPayments.map((p) => (typeof p.get === "function" ? p.get({ plain: true }) : p)),
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= 2. GESTÃO COMPLETA DE USUÁRIOS, AVATARES, VIP & CARTEIRAS =================
router.get("/api/users", requireAdminAuth, async (req, res) => {
  try {
    const Op = repo.Sequelize.Op;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = String(req.query.search || "").trim();
    const roleFilter = String(req.query.role || "").trim();
    const vipFilter = String(req.query.vip || "").trim();

    const where = {};
    if (search) {
      where[Op.or] = [
        { userName: { [Op.iLike]: `%${search}%` } },
        { login: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
      if (!isNaN(Number(search))) {
        where[Op.or].push({ id: Number(search) });
      }
    }
    if (roleFilter && roleFilter !== "ALL") {
      where.role = roleFilter;
    }

    const { rows: users, count: total } = await repo.User.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    const userIds = users.map((u) => u.id);
    const [avatars, wallets] = await Promise.all([
      userIds.length && repo.Avatar
        ? repo.Avatar.findAll({ where: { userId: { [Op.in]: userIds } }, order: [["selected", "DESC"], ["id", "ASC"]] })
        : [],
      userIds.length && repo.Currency
        ? repo.Currency.findAll({ where: { userId: { [Op.in]: userIds } } })
        : [],
    ]);

    const avatarsByUser = new Map();
    avatars.forEach((a) => {
      const plain = a.get({ plain: true });
      const list = avatarsByUser.get(plain.userId) || [];
      list.push(plain);
      avatarsByUser.set(plain.userId, list);
    });

    const walletByUser = new Map();
    wallets.forEach((w) => {
      const plain = w.get({ plain: true });
      walletByUser.set(plain.userId, plain);
    });

    let items = users.map((u) => {
      const plain = u.get({ plain: true });
      delete plain.password;
      const uAvatars = avatarsByUser.get(plain.id) || [];
      const activeAvatar = uAvatars.find((a) => a.selected) || uAvatars[0] || null;
      const wallet = walletByUser.get(plain.id) || { cash: 0, coins: 0, chips: 0 };
      const isVip = Boolean(
        activeAvatar?.vip &&
          (!activeAvatar.vipExpiresAt || new Date(activeAvatar.vipExpiresAt) > new Date())
      );
      return {
        ...plain,
        avatars: uAvatars,
        activeAvatar,
        isVip,
        vipExpiresAt: activeAvatar?.vipExpiresAt || null,
        wallet: {
          id: wallet.id || null,
          cash: Number(wallet.cash || 0),
          coins: Number(wallet.coins || 0),
          chips: Number(wallet.chips || 0),
        },
      };
    });

    if (vipFilter === "VIP") {
      items = items.filter((i) => i.isVip);
    } else if (vipFilter === "BASIC") {
      items = items.filter((i) => !i.isVip);
    }

    return res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      users: items,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /admin/api/users/create -> Criar novo Usuário + Avatar + Carteira pelo Admin
router.post("/api/users/create", requireAdminAuth, async (req, res) => {
  try {
    const {
      userName,
      login,
      email,
      password,
      role = "player",
      avatarName,
      gender = 1,
      initialCash = 0,
      initialCoins = 100,
      initialChips = 50,
      vipDays = 0,
    } = req.body || {};

    if (!userName || !login || !password) {
      return res.status(400).json({ success: false, error: "Informe Nome, Login e Senha para criar a conta." });
    }

    const exists = await repo.User.findOne({ where: { login: String(login).trim() } });
    if (exists) {
      return res.status(400).json({ success: false, error: "Já existe um usuário com este login." });
    }

    const plainPassword = String(password).trim();
    const newUser = await repo.User.create({
      userName: String(userName).trim(),
      login: String(login).trim(),
      email: email ? String(email).trim() : `${String(login).trim()}@tfl.local`,
      password: plainPassword,
      role: String(role || "player"),
      gender: Number(gender) || 1,
      online: false,
    });

    const vipExp = Number(vipDays) > 0 ? new Date(Date.now() + Number(vipDays) * 86400000) : null;
    const newAvatar = await repo.Avatar.create({
      userId: newUser.id,
      name: String(avatarName || userName).trim(),
      gender: Number(gender) || 1,
      selected: true,
      online: false,
      vip: Boolean(vipExp),
      vipExpiresAt: vipExp,
      bio: "Criado pela Administração TFL.",
    });

    const newWallet = await repo.Currency.create({
      userId: newUser.id,
      avatarId: newAvatar.id,
      cash: Math.max(0, Number(initialCash) || 0),
      coins: Math.max(0, Math.floor(Number(initialCoins) || 0)),
      chips: Math.max(0, Math.floor(Number(initialChips) || 0)),
    });

    await newUser.update({ avatarId: newAvatar.id, currencyId: newWallet.id }).catch(() => {});

    return res.json({
      success: true,
      message: `Conta #${newUser.id} (${newUser.userName}) e Avatar "${newAvatar.name}" criados com sucesso!`,
      user: newUser,
      avatar: newAvatar,
      wallet: newWallet,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /admin/api/users/update -> Editar Conta User e Avatar
router.post("/api/users/update", requireAdminAuth, async (req, res) => {
  try {
    const {
      userId,
      userName,
      login,
      email,
      role,
      newPassword,
      cpf,
      phone,
      avatarId,
      avatarName,
      avatarBio,
      avatarGender,
    } = req.body || {};

    const user = await repo.User.findByPk(Number(userId));
    if (!user) {
      return res.status(404).json({ success: false, error: "Usuário não encontrado." });
    }

    const userUpdates = {};
    if (userName !== undefined && String(userName).trim()) userUpdates.userName = String(userName).trim();
    if (login !== undefined && String(login).trim()) userUpdates.login = String(login).trim();
    if (email !== undefined) userUpdates.email = String(email).trim();
    if (role !== undefined && String(role).trim()) userUpdates.role = String(role).trim();
    if (cpf !== undefined) userUpdates.cpf = String(cpf).trim();
    if (phone !== undefined) userUpdates.phone = String(phone).trim();
    if (newPassword && String(newPassword).trim().length >= 3) {
      userUpdates.password = String(newPassword).trim();
    }

    await user.update(userUpdates);

    let avatar = null;
    if (avatarId) {
      avatar = await repo.Avatar.findByPk(Number(avatarId));
    } else {
      avatar = await repo.Avatar.findOne({ where: { userId: user.id }, order: [["selected", "DESC"], ["id", "ASC"]] });
    }

    if (avatar) {
      const avUpdates = {};
      if (avatarName !== undefined && String(avatarName).trim()) avUpdates.name = String(avatarName).trim();
      if (avatarBio !== undefined) avUpdates.bio = String(avatarBio);
      if (avatarGender !== undefined) avUpdates.gender = Number(avatarGender);
      if (Object.keys(avUpdates).length > 0) {
        await avatar.update(avUpdates);
      }
    }

    return res.json({
      success: true,
      message: `Dados da conta #${user.id} (${user.userName}) atualizados com sucesso!`,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /admin/api/users/vip -> Conceder ou Revogar VIP de qualquer Usuário/Avatar
router.post("/api/users/vip", requireAdminAuth, async (req, res) => {
  try {
    const { userId, avatarId, days } = req.body || {};
    const numDays = Number(days || 0);

    const avatars = await repo.Avatar.findAll({
      where: avatarId ? { id: Number(avatarId) } : { userId: Number(userId) },
    });
    if (!avatars.length) {
      return res.status(404).json({ success: false, error: "Avatar não encontrado para este usuário." });
    }

    const targetUserId = Number(userId || avatars[0].userId);

    if (numDays <= 0) {
      for (const av of avatars) {
        await av.update({ vip: false, vipExpiresAt: null });
      }
      await repo.sequelize
        .query(`UPDATE public.vip_subscriptions SET status = 'REVOKED' WHERE "userId" = :uid AND status = 'ACTIVE'`, {
          replacements: { uid: targetUserId },
        })
        .catch(() => {});

      return res.json({
        success: true,
        message: `Assinatura VIP revogada para o usuário #${targetUserId}.`,
      });
    }

    const baseDate =
      avatars[0].vip && avatars[0].vipExpiresAt && new Date(avatars[0].vipExpiresAt) > new Date()
        ? new Date(avatars[0].vipExpiresAt)
        : new Date();
    const expiresAt = new Date(baseDate.getTime() + numDays * 86400000);

    for (const av of avatars) {
      await av.update({ vip: true, vipExpiresAt: expiresAt });
    }

    await repo.sequelize
      .query(
        `INSERT INTO public.vip_subscriptions ("userId", "avatarId", "planKey", "priceCash", "startsAt", "expiresAt", "status", "createdAt")
         VALUES (:userId, :avatarId, :planKey, 0, NOW(), :expiresAt, 'ACTIVE', NOW())`,
        {
          replacements: {
            userId: targetUserId,
            avatarId: avatars[0].id,
            planKey: `ADMIN_${numDays}D`,
            expiresAt,
          },
        }
      )
      .catch(() => {});

    await createNotification({
      userId: targetUserId,
      avatarId: avatars[0].id,
      type: "VIP_GRANTED",
      title: "👑 Você recebeu Clube VIP da Administração!",
      message: `Sua conta recebeu +${numDays} dia(s) de Clube VIP (válido até ${expiresAt.toLocaleDateString("pt-BR")}). Aproveite o Selo VIP e Chat Ilimitado!`,
    }).catch(() => {});

    return res.json({
      success: true,
      message: `Clube VIP concedido por +${numDays} dias (até ${expiresAt.toLocaleDateString("pt-BR")})!`,
      expiresAt,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /admin/api/wallets/adjust -> Creditar, Debitar ou Definir Saldo de Cash, Coins ou Chips
router.post("/api/wallets/adjust", requireAdminAuth, async (req, res) => {
  try {
    const {
      userId,
      avatarId,
      currency = "Coins", // 'Cash' | 'Coins' | 'Chips'
      operation = "ADD", // 'ADD' | 'SUB' | 'SET'
      amount = 0,
      reason = "Ajuste administrativo via Painel Admin",
    } = req.body || {};

    const numAmount = Number(amount);
    if (!userId || isNaN(numAmount) || numAmount < 0) {
      return res.status(400).json({ success: false, error: "Informe um userId e um valor válido." });
    }

    let wallet = await repo.Currency.findOne({ where: { userId: Number(userId) } });
    if (!wallet) {
      wallet = await repo.Currency.create({
        userId: Number(userId),
        avatarId: avatarId ? Number(avatarId) : null,
        cash: 0,
        coins: 0,
        chips: 0,
      });
    }

    const fieldMap = { Cash: "cash", Coins: "coins", Chips: "chips" };
    const col = fieldMap[currency] || "coins";
    const beforeVal = Number(wallet[col] || 0);
    let afterVal = beforeVal;

    if (operation === "ADD") {
      afterVal = beforeVal + numAmount;
    } else if (operation === "SUB") {
      afterVal = Math.max(0, beforeVal - numAmount);
    } else if (operation === "SET") {
      afterVal = Math.max(0, numAmount);
    }

    if (col !== "cash") {
      afterVal = Math.floor(afterVal);
    } else {
      afterVal = Number(afterVal.toFixed(2));
    }

    const delta = Number((afterVal - beforeVal).toFixed(2));
    await wallet.update({ [col]: afterVal });

    await recordLedger({
      userId: Number(userId),
      avatarId: Number(avatarId || wallet.avatarId || 0) || null,
      txType: "ADMIN_ADJUST",
      currency: col.toUpperCase(),
      amountDelta: delta,
      feeAmount: 0,
      balanceAfter: afterVal,
      description: `[Admin #${req.user.id}] ${reason} (${operation} ${numAmount} ${currency})`,
    }).catch(() => {});

    await createNotification({
      userId: Number(userId),
      avatarId: Number(avatarId || wallet.avatarId || 0) || null,
      type: "WALLET_ADMIN_ADJUST",
      title: `💰 Ajuste na sua Carteira (${currency})`,
      message: `${reason}. Seu novo saldo de ${currency} é ${col === "cash" ? "$" + afterVal.toFixed(2) : afterVal.toLocaleString("pt-BR")}.`,
    }).catch(() => {});

    return res.json({
      success: true,
      message: `Carteira do usuário #${userId} atualizada: ${currency} ${beforeVal} → ${afterVal}`,
      wallet: {
        cash: Number(wallet.cash || 0),
        coins: Number(wallet.coins || 0),
        chips: Number(wallet.chips || 0),
      },
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /admin/api/users/delete -> Excluir Usuário e seus Avatares
router.post("/api/users/delete", requireAdminAuth, async (req, res) => {
  try {
    const targetId = Number(req.body?.userId);
    if (!targetId) {
      return res.status(400).json({ success: false, error: "Informe o userId." });
    }
    if (targetId === Number(req.user.id) || targetId === 1) {
      return res.status(400).json({ success: false, error: "Não é permitido excluir a conta proprietária ou sua própria conta Admin." });
    }

    const user = await repo.User.findByPk(targetId);
    if (!user) {
      return res.status(404).json({ success: false, error: "Usuário não encontrado." });
    }

    if (repo.Avatar) await repo.Avatar.destroy({ where: { userId: targetId } }).catch(() => {});
    if (repo.Currency) await repo.Currency.destroy({ where: { userId: targetId } }).catch(() => {});
    await user.destroy();

    return res.json({
      success: true,
      message: `Usuário #${targetId} (${user.userName}) removido com sucesso.`,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ================= 3. ECONOMIA, REGRAS, AUDITORIA DO LIVRO-RAZÃO & BOLSA P2P =================
router.post("/api/economy/rules", requireAdminAuth, async (req, res) => {
  try {
    const updated = await updateEconomyRules(req.body);
    return res.json({ success: true, rules: updated });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/api/economy/review", requireAdminAuth, async (req, res) => {
  const { paymentId, action } = req.body;
  if (!paymentId || !action) {
    return res.status(400).json({ success: false, error: "Informe paymentId e action (APPROVE ou REJECT)." });
  }
  try {
    const result = await reviewPaymentTransaction(paymentId, action);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// GET /admin/api/economy/audit -> Ordens Ativas na Bolsa P2P + Livro-Razão Global (wallet_ledger)
router.get("/api/economy/audit", requireAdminAuth, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 20;
    const offset = (page - 1) * limit;

    const [activeOrders, ledgerRows, ledgerCountRows] = await Promise.all([
      repo.CoinOrder
        ? repo.CoinOrder.findAll({
            where: { status: { [repo.Sequelize.Op.in]: ["OPEN", "PARTIAL"] } },
            order: [["createdAt", "ASC"]],
            limit: 50,
          }).catch(() => [])
        : [],
      repo.sequelize
        .query(
          `SELECT l.*, u."userName", a."name" AS "avatarName"
           FROM public.wallet_ledger l
           LEFT JOIN public.users u ON u.id = l."userId"
           LEFT JOIN public.avatars a ON a.id = l."avatarId"
           ORDER BY l."createdAt" DESC
           LIMIT :limit OFFSET :offset`,
          { replacements: { limit, offset }, type: repo.Sequelize.QueryTypes.SELECT }
        )
        .catch(() => []),
      repo.sequelize
        .query(`SELECT COUNT(*)::int AS cnt FROM public.wallet_ledger`, {
          type: repo.Sequelize.QueryTypes.SELECT,
        })
        .catch(() => [{ cnt: 0 }]),
    ]);

    const totalLedger = Number(ledgerCountRows?.[0]?.cnt || 0);

    return res.json({
      success: true,
      activeOrders: activeOrders.map((o) => (typeof o.get === "function" ? o.get({ plain: true }) : o)),
      ledger: {
        items: ledgerRows || [],
        page,
        limit,
        total: totalLedger,
        totalPages: Math.max(1, Math.ceil(totalLedger / limit)),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /admin/api/economy/order-cancel -> Cancelar Ordem P2P e reembolsar vendedor
router.post("/api/economy/order-cancel", requireAdminAuth, async (req, res) => {
  try {
    const orderId = Number(req.body?.orderId);
    const order = await repo.CoinOrder.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Ordem não encontrada." });
    }
    const result = await cancelCoinSaleOrder({
      userId: order.sellerUserId,
      orderId: order.id,
    });
    return res.json({
      success: true,
      message: `Ordem #${orderId} cancelada pelo Admin e saldo reembolsado ao vendedor.`,
      ...result,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ================= 4. SALAS 3D & CLUSTER DE SERVIDORES MULTI-INSTÂNCIA =================
router.get("/api/rooms-servers", requireAdminAuth, async (req, res) => {
  try {
    const Op = repo.Sequelize.Op;
    const search = String(req.query.search || "").trim();
    const whereRoom = search ? { name: { [Op.iLike]: `%${search}%` } } : {};

    const [rooms, servers, visitCounts] = await Promise.all([
      repo.RoomModel
        ? repo.RoomModel.findAll({
            where: whereRoom,
            order: [["id", "DESC"]],
            limit: 40,
          }).catch(() => [])
        : [],
      repo.Server
        ? repo.Server.findAll({
            order: [["roomId", "ASC"], ["id", "ASC"]],
            limit: 100,
          }).catch(() => [])
        : [],
      repo.sequelize
        .query(
          `SELECT "roomId", COUNT(*)::int AS "uniqueMonthVisits"
           FROM public.room_unique_visits
           WHERE "monthKey" = TO_CHAR(NOW(), 'YYYY-MM')
           GROUP BY "roomId"`,
          { type: repo.Sequelize.QueryTypes.SELECT }
        )
        .catch(() => []),
    ]);

    const visitsMap = new Map();
    (visitCounts || []).forEach((v) => visitsMap.set(Number(v.roomId), Number(v.uniqueMonthVisits || 0)));

    const serversPlain = servers.map((s) => (typeof s.get === "function" ? s.get({ plain: true }) : s));
    const serversByRoom = new Map();
    serversPlain.forEach((s) => {
      const list = serversByRoom.get(Number(s.roomId)) || [];
      list.push(s);
      serversByRoom.set(Number(s.roomId), list);
    });

    const roomsList = rooms.map((r) => {
      const plain = typeof r.get === "function" ? r.get({ plain: true }) : r;
      const roomServers = serversByRoom.get(Number(plain.id)) || [];
      const activeReplicas = roomServers.filter((s) => !s.isClosed);
      return {
        ...plain,
        uniqueMonthVisits: visitsMap.get(Number(plain.id)) || 0,
        replicasCount: activeReplicas.length,
        servers: roomServers,
      };
    });

    return res.json({
      success: true,
      rooms: roomsList,
      servers: serversPlain,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /admin/api/rooms/update -> Editar Sala 3D (Nome, Capacidade, Entrada 24h, Privacidade, Boost)
router.post("/api/rooms/update", requireAdminAuth, async (req, res) => {
  try {
    const { roomId, name, description, maxPlayers, entryFeeCoins, isPrivate, boost24h } = req.body || {};
    const room = await repo.RoomModel.findByPk(Number(roomId));
    if (!room) {
      return res.status(404).json({ success: false, error: "Sala não encontrada." });
    }

    const updates = {};
    if (name !== undefined && String(name).trim()) updates.name = String(name).trim();
    if (description !== undefined) updates.description = String(description);
    if (maxPlayers !== undefined) updates.maxPlayers = Math.max(2, Math.min(200, Number(maxPlayers) || 20));
    if (entryFeeCoins !== undefined) updates.entryFeeCoins = Math.max(0, Number(entryFeeCoins) || 0);
    if (isPrivate !== undefined) updates.isPrivate = Boolean(isPrivate);
    if (boost24h) {
      updates.featuredUntil = new Date(Date.now() + 24 * 3600 * 1000);
    }

    await room.update(updates);
    return res.json({
      success: true,
      message: `Sala #${room.id} ("${room.name}") atualizada pelo Admin!`,
      room,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /admin/api/rooms/delete -> Excluir Sala 3D
router.post("/api/rooms/delete", requireAdminAuth, async (req, res) => {
  try {
    const roomId = Number(req.body?.roomId);
    const room = await repo.RoomModel.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: "Sala não encontrada." });
    }
    if (repo.Server) await repo.Server.destroy({ where: { roomId } }).catch(() => {});
    await room.destroy();
    return res.json({
      success: true,
      message: `Sala #${roomId} e suas instâncias de servidor foram removidas.`,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /admin/api/servers/action -> Gerenciar Instâncias na Tabela servers (Replicar, Lotar, Fechar, Excluir)
router.post("/api/servers/action", requireAdminAuth, async (req, res) => {
  try {
    const { action, roomId, serverId } = req.body || {};

    if (action === "REPLICATE") {
      const alloc = await allocateOrReplicateRoomServerInstance({
        roomId: Number(roomId),
        forceNewReplica: true,
      });
      return res.json({
        success: true,
        message: `Nova instância replicada criada para a Sala #${roomId} (${alloc.activeInstance?.ip || "127.0.0.1"}:${alloc.activeInstance?.publicPort || alloc.activeInstance?.port})!`,
        allocation: alloc,
      });
    }

    if (action === "SIMULATE_FULL") {
      const alloc = await allocateOrReplicateRoomServerInstance({
        roomId: Number(roomId),
        fillCurrentToTest: true,
        joinPlayer: true,
      });
      return res.json({
        success: true,
        message: `Lotação simulada na Sala #${roomId}! Auto-replicação disparada (${alloc.totalInstances} instâncias ativas).`,
        allocation: alloc,
      });
    }

    const server = await repo.Server.findByPk(Number(serverId));
    if (!server) {
      return res.status(404).json({ success: false, error: "Instância de servidor não encontrada." });
    }

    if (action === "TOGGLE_CLOSE") {
      const nextClosed = !server.isClosed;
      await server.update({
        isClosed: nextClosed,
        status: nextClosed ? "closed" : "online",
        playersCount: nextClosed ? 0 : server.playersCount,
      });
      return res.json({
        success: true,
        message: `Instância #${server.id} agora está ${nextClosed ? "FECHADA" : "ONLINE"}.`,
      });
    }

    if (action === "DELETE") {
      await server.destroy();
      return res.json({
        success: true,
        message: `Instância de servidor #${serverId} excluída.`,
      });
    }

    return res.status(400).json({ success: false, error: "Ação de servidor desconhecida." });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ================= 5. MODERAÇÃO SOCIAL, DIÁRIO ANÔNIMO & COMUNICADOS GLOBAIS =================
router.get("/api/moderation/overview", requireAdminAuth, async (req, res) => {
  try {
    const [posts, reels, diaryPages, diaryComments, announcements] = await Promise.all([
      repo.Post
        ? repo.Post.findAll({
            include: [{ model: repo.Profile, as: "profile", attributes: ["id", "name", "thumbnail"] }],
            order: [["id", "DESC"]],
            limit: 20,
          }).catch(() => [])
        : [],
      repo.MiniReel
        ? repo.MiniReel.findAll({
            include: [{ model: repo.Profile, as: "profile", attributes: ["id", "name", "thumbnail"] }],
            order: [["id", "DESC"]],
            limit: 20,
          }).catch(() => [])
        : [],
      repo.sequelize
        .query(
          `SELECT p.id, p."userId", p."avatarId", p.title, p.content, p."moodKey", p.category,
                  p."isPublicAnonymous", p."anonymousAlias", p."uniqueReadersCount", p."totalReactions", p."createdAt",
                  u."userName"
           FROM public.diary_pages p
           LEFT JOIN public.users u ON u.id = p."userId"
           ORDER BY p.id DESC
           LIMIT 20`,
          { type: repo.Sequelize.QueryTypes.SELECT }
        )
        .catch(() => []),
      repo.sequelize
        .query(
          `SELECT c.id, c."pageId", c."userId", c."anonymousAlias", c.content, c."createdAt",
                  p.title AS "pageTitle"
           FROM public.diary_comments c
           LEFT JOIN public.diary_pages p ON p.id = c."pageId"
           ORDER BY c.id DESC
           LIMIT 20`,
          { type: repo.Sequelize.QueryTypes.SELECT }
        )
        .catch(() => []),
      repo.SystemAnnouncement
        ? repo.SystemAnnouncement.findAll({ order: [["id", "DESC"]], limit: 15 }).catch(() => [])
        : [],
    ]);

    return res.json({
      success: true,
      posts: posts.map((p) => (typeof p.get === "function" ? p.get({ plain: true }) : p)),
      reels: reels.map((r) => (typeof r.get === "function" ? r.get({ plain: true }) : r)),
      diaryPages: diaryPages || [],
      diaryComments: diaryComments || [],
      announcements: announcements.map((a) => (typeof a.get === "function" ? a.get({ plain: true }) : a)),
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /admin/api/moderation/delete -> Moderar / Excluir Post, Reel, Folha do Diário ou Comentário
router.post("/api/moderation/delete", requireAdminAuth, async (req, res) => {
  try {
    const { targetType, targetId } = req.body || {};
    const id = Number(targetId);
    if (!targetType || !id) {
      return res.status(400).json({ success: false, error: "Informe targetType e targetId." });
    }

    if (targetType === "post" && repo.Post) {
      await repo.Post.destroy({ where: { id } });
      return res.json({ success: true, message: `Publicação #${id} removida do Feed Social.` });
    }
    if (targetType === "reel" && repo.MiniReel) {
      await repo.MiniReel.destroy({ where: { id } });
      return res.json({ success: true, message: `Mini Reel / Sentimento #${id} removido.` });
    }
    if (targetType === "diary_page") {
      await repo.sequelize.query(`DELETE FROM public.diary_comments WHERE "pageId" = :id`, { replacements: { id } }).catch(() => {});
      await repo.sequelize.query(`DELETE FROM public.diary_reactions WHERE "pageId" = :id`, { replacements: { id } }).catch(() => {});
      await repo.sequelize.query(`DELETE FROM public.diary_pages WHERE id = :id`, { replacements: { id } });
      return res.json({ success: true, message: `Folha do Diário #${id} removida pela moderação.` });
    }
    if (targetType === "diary_unpublish") {
      await repo.sequelize.query(`UPDATE public.diary_pages SET "isPublicAnonymous" = false WHERE id = :id`, {
        replacements: { id },
      });
      return res.json({ success: true, message: `Folha do Diário #${id} ocultada do mural público (tornada privada).` });
    }
    if (targetType === "diary_comment") {
      await repo.sequelize.query(`DELETE FROM public.diary_comments WHERE id = :id`, { replacements: { id } });
      return res.json({ success: true, message: `Bilhete do Diário #${id} removido.` });
    }

    return res.status(400).json({ success: false, error: "Tipo de conteúdo inválido para moderação." });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /admin/api/broadcast -> Enviar Comunicado Oficial na Bag de Todos os Jogadores + Bônus de Evento Opcional
router.post("/api/broadcast", requireAdminAuth, async (req, res) => {
  try {
    const {
      title,
      message,
      targetUserId, // vazio = todos os usuários
      giftCoins = 0,
      giftChips = 0,
    } = req.body || {};

    if (!title || !message) {
      return res.status(400).json({ success: false, error: "Informe o título e a mensagem do comunicado." });
    }

    const bonusCoins = Math.max(0, Math.floor(Number(giftCoins) || 0));
    const bonusChips = Math.max(0, Math.floor(Number(giftChips) || 0));

    if (repo.SystemAnnouncement && !targetUserId) {
      await repo.SystemAnnouncement.create({
        title: String(title).trim(),
        content: String(message).trim(),
        type: "info",
        isActive: true,
      }).catch(() => {});
    }

    const users = targetUserId
      ? await repo.User.findAll({ where: { id: Number(targetUserId) } })
      : await repo.User.findAll({ attributes: ["id", "avatarId"] });

    let notifiedCount = 0;
    for (const u of users) {
      if (bonusCoins > 0 || bonusChips > 0) {
        let w = await repo.Currency.findOne({ where: { userId: u.id } });
        if (!w) {
          w = await repo.Currency.create({ userId: u.id, avatarId: u.avatarId || null, cash: 0, coins: 0, chips: 0 });
        }
        await w.update({
          coins: Number(w.coins || 0) + bonusCoins,
          chips: Number(w.chips || 0) + bonusChips,
        });
      }

      const giftSuffix =
        bonusCoins > 0 || bonusChips > 0
          ? ` 🎁 Presente incluso: ${bonusCoins > 0 ? `+${bonusCoins} Coins ` : ""}${bonusChips > 0 ? `+${bonusChips} Fichas` : ""}!`
          : "";

      await createNotification({
        userId: u.id,
        avatarId: u.avatarId || null,
        type: "ADMIN_BROADCAST",
        title: `📢 ${String(title).trim()}`,
        message: `${String(message).trim()}${giftSuffix}`,
      }).catch(() => {});
      notifiedCount++;
    }

    return res.json({
      success: true,
      message: `Comunicado enviado para a Bag de ${notifiedCount} jogador(es)${bonusCoins || bonusChips ? " com presente creditado nas carteiras" : ""}!`,
      notifiedCount,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ================= 6. LOJA 3D (SHOP_CONTAINERS) & ENVIO DE ITEM DE PRESENTE =================
router.get("/api/shop", requireAdminAuth, async (req, res) => {
  try {
    const [catalog, totalOwnedCount, totalEquippedCount] = await Promise.all([
      listShopCatalog({ includeInactive: true }),
      repo.Inventory ? repo.Inventory.count({ where: { itemType: 0 } }).catch(() => 0) : 0,
      repo.AvatarOutfit ? repo.AvatarOutfit.count({ where: { equipped: true } }).catch(() => 0) : 0,
    ]);
    return res.json({
      success: true,
      items: catalog.items || [],
      rules: SHOP_3D_RULES,
      metrics: {
        catalogCount: (catalog.items || []).length,
        totalOwnedCount,
        totalEquippedCount,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/api/shop/save", requireAdminAuth, async (req, res) => {
  try {
    const result = await saveShopCatalogItem(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/api/shop/delete", requireAdminAuth, async (req, res) => {
  try {
    const id = req.body?.id || req.query?.id;
    const result = await deleteShopCatalogItem(id);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /admin/api/shop/grant -> Enviar Roupa 3D de Presente para o Guarda-Roupa de qualquer Avatar
router.post("/api/shop/grant", requireAdminAuth, async (req, res) => {
  try {
    const { avatarId, shopContainerId } = req.body || {};
    const av = await repo.Avatar.findByPk(Number(avatarId));
    if (!av) {
      return res.status(404).json({ success: false, error: "Avatar destinatário não encontrado." });
    }
    const item = await repo.ShopContainer.findByPk(Number(shopContainerId));
    if (!item) {
      return res.status(404).json({ success: false, error: "Item 3D não encontrado no catálogo." });
    }

    const existing = await repo.Inventory.findOne({
      where: { avatarId: av.id, itemId: item.id, itemType: 0 },
    });
    if (existing) {
      return res.status(400).json({ success: false, error: `O Avatar "${av.name}" já possui "${item.name}" no guarda-roupa.` });
    }

    await repo.Inventory.create({
      avatarId: av.id,
      itemId: item.id,
      itemType: 0,
      quantity: 1,
    });

    await createNotification({
      userId: av.userId,
      avatarId: av.id,
      type: "SHOP_GIFT_ADMIN",
      title: "🎁 Nova Roupa 3D no seu Guarda-Roupa!",
      message: `A Administração enviou "${item.name}" de presente para o seu Avatar "${av.name}"!`,
    }).catch(() => {});

    return res.json({
      success: true,
      message: `Peça 3D "${item.name}" enviada para o guarda-roupa do Avatar #${av.id} (${av.name})!`,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ================= 7. SIMULADOR DE BOTS & MANUTENÇÃO DO SISTEMA =================
router.post("/api/bots/simulate", requireAdminAuth, async (req, res) => {
  try {
    const { runBotSimulation } = require("../../../scripts/bot_simulator");
    const botsCount = Math.min(Math.max(Number(req.body?.botsCount || 6), 1), 25);
    const rounds = Math.min(Math.max(Number(req.body?.rounds || 2), 1), 10);
    const delayMs = Math.min(Math.max(Number(req.body?.delayMs || 50), 10), 2000);
    const protocol = req.protocol || "http";
    const host = req.get("host") || `localhost:${process.env.PORT || 5000}`;
    const baseUrl = `${protocol}://${host}`;

    const report = await runBotSimulation({
      baseUrl,
      botsCount,
      rounds,
      delayMs,
      verbose: true,
    });
    return res.json({ success: true, report });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/api/system/maintenance", requireAdminAuth, async (req, res) => {
  try {
    const { action } = req.body || {};
    if (action === "CLEAR_TELEMETRY") {
      clearVisitTelemetry();
      return res.json({ success: true, message: "Histórico de telemetria de visitas em memória zerado com sucesso!" });
    }
    if (action === "CLEAN_EXPIRED_REELS") {
      const removed = repo.MiniReel
        ? await repo.MiniReel.destroy({
            where: { expiresAt: { [repo.Sequelize.Op.lt]: new Date() } },
          })
        : 0;
      return res.json({ success: true, message: `${removed} Mini Reel(s)/Sentimento(s) expirados foram limpos do banco.` });
    }
    if (action === "CLEAN_CLOSED_SERVERS") {
      const removed = repo.Server
        ? await repo.Server.destroy({
            where: { isClosed: true },
          })
        : 0;
      return res.json({ success: true, message: `${removed} instância(s) fechada(s) removida(s) da tabela servers.` });
    }
    if (action === "SYNC_DB") {
      await repo.sequelize.sync({ alter: true });
      return res.json({ success: true, message: "Todas as tabelas PostgreSQL / Sequelize foram sincronizadas com sucesso!" });
    }
    return res.status(400).json({ success: false, error: "Ação de manutenção inválida." });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= 8. SAÚDE FINANCEIRA & DESPESAS OPERACIONAIS =================
router.get("/api/financial-health", requireAdminAuth, async (req, res) => {
  try {
    const { getPlatformFinancialHealth } = require("../../services/financialHealth.service");
    const health = await getPlatformFinancialHealth();
    return res.json({ success: true, health });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/api/expenses", requireAdminAuth, async (req, res) => {
  try {
    const { listOperationalExpenses } = require("../../services/financialHealth.service");
    const result = await listOperationalExpenses(req.query);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/api/expenses/create", requireAdminAuth, async (req, res) => {
  try {
    const { recordOperationalExpense } = require("../../services/financialHealth.service");
    const expense = await recordOperationalExpense({
      ...req.body,
      createdById: req.user?.id || 1,
    });
    return res.json({ success: true, expense });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/api/expenses/:id/delete", requireAdminAuth, async (req, res) => {
  try {
    const { deleteOperationalExpense } = require("../../services/financialHealth.service");
    const result = await deleteOperationalExpense(req.params.id);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ================= PÁGINAS DO PAINEL ADMIN (PROTEGIDAS) =================
router.get("/", requireAdminAuth, (req, res) => {
  sendPage("index", res);
});

router.get("/home", requireAdminAuth, (req, res) => {
  sendPage("home", res);
});

const routers = require("./routers.js");
router.use(requireAdminAuth, routers.router);

module.exports = {
  router,
  auth: requireAdminAuth,
  sendPage,
};