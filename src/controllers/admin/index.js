const router = require("express").Router();
const path = require("path");
const repo = require("../../repositories/repository.js");
const fs = require("fs");
const { getPlatformStats } = require("../../services/stats.service");
const {
  getEconomyRules,
  updateEconomyRules,
  reviewPaymentTransaction,
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

// ================= ROTAS DE API INTERNA DO PAINEL ADMIN (PROTEGIDAS) =================

// GET /admin/api/stats -> Estatísticas de Visitas, Regiões, Servidor, Comunidade, Economia e Fila Pix
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
            limit: 25,
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

// POST /admin/api/economy/rules -> Atualizar regras da Bolsa, Cotação e Aprovação Pix/Saque
router.post("/api/economy/rules", requireAdminAuth, async (req, res) => {
  try {
    const updated = await updateEconomyRules(req.body);
    return res.json({ success: true, rules: updated });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /admin/api/economy/review -> Aprovar ou Recusar manualmente transação Pix / Saque
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

// GET /admin/api/shop -> Listar catálogo completo da Loja 3D (shop_containers) + métricas de inventário
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

// POST /admin/api/shop/save -> Criar ou Editar item da Loja 3D (shop_containers)
router.post("/api/shop/save", requireAdminAuth, async (req, res) => {
  try {
    const result = await saveShopCatalogItem(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /admin/api/shop/delete -> Excluir item da Loja 3D (shop_containers)
router.post("/api/shop/delete", requireAdminAuth, async (req, res) => {
  try {
    const id = req.body?.id || req.query?.id;
    const result = await deleteShopCatalogItem(id);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /admin/api/bots/simulate -> Disparar Simulador de Bots pelo Painel Admin
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