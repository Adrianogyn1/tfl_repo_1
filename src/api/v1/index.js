const router = require("express").Router();
const repo = require("../../repositories/repository");

const Social = require("./social/index.js");
const Game = require("./game/index.js");
const Bank = require("./bank/index.js");
const profileController = require("../../controllers/profile/profile_controller");
const { getPlatformStats } = require("../../services/stats.service");
const { getAvatarCareers, equipAvatarBadge } = require("../../services/avatarCareer.service");
const { getPlatformFinancialHealth } = require("../../services/financialHealth.service");

const SERVER_MASTER_TOKEN = process.env.TFL_SERVER_API_TOKEN || "tfl-server-master-key-2026";

/**
 * Middleware de Autenticação por Token para a API Unificada (/api/v1/*)
 * Permite que servidores dedicados do jogo (Godot Server), clientes do jogo (Godot Client)
 * e o Portal Web autentiquem via:
 * - Header Authorization: Bearer <token>
 * - Header tfl-token: <user_token>
 * - Header x-server-token: <server_master_token>
 * - Sessão autenticada / cookie userToken
 */
router.use(async (req, res, next) => {
  try {
    const authHeader = String(req.headers?.["authorization"] || "");
    const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";
    const serverToken =
      req.headers?.["x-server-token"] ||
      (bearerToken === SERVER_MASTER_TOKEN ? bearerToken : "");

    if (serverToken && serverToken === SERVER_MASTER_TOKEN) {
      req.isGameServer = true;
      if (!req.user) {
        req.user = { id: 1, role: "admin", userName: "TFL Dedicated Server" };
      }
      return next();
    }

    const token =
      bearerToken ||
      req.headers?.["tfl-token"] ||
      req.headers?.["token"] ||
      req.headers?.["x-api-token"] ||
      req.cookies?.userToken ||
      req.query?.token ||
      req.body?.token;

    if (req.session?.user && !bearerToken && !req.headers?.["tfl-token"]) {
      req.user = req.session.user;
      return next();
    }

    if (token) {
      const user = await repo.User.findOne({ where: { token } });
      if (user) {
        req.user = user.get({ plain: true });
        return next();
      }
    }

    return res.status(401).json({
      success: false,
      error: "Autenticação via Token obrigatória para acessar a API. Envie 'tfl-token', 'Authorization: Bearer <token>' ou 'x-server-token'.",
    });
  } catch (err) {
    console.error("Erro no middleware de token da API v1:", err);
    return res.status(500).json({ success: false, error: "Erro interno de autenticação da API." });
  }
});

// Telemetria e Estatísticas em Tempo Real (Autenticado via Token / Admin / Servidor Godot)
router.get("/stats", async (req, res) => {
  try {
    const stats = await getPlatformStats();
    return res.json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Catálogo Auto-Documentado de Endpoints da API Unificada (Web + Godot Engine)
router.get("/endpoints", (req, res) => {
  return res.json({
    success: true,
    version: "1.1.0",
    engine: "The Fantasy Life — Unified Web & Godot Engine API (Token Protected)",
    authentication: {
      headers: {
        "tfl-token": "<user_token>",
        "Authorization": "Bearer <user_token_or_server_token>",
        "x-server-token": "<dedicated_server_token (para servidores online do jogo)>",
        "x-profile-id": "<active_avatar_id (opcional: se omitido usa o avatar selecionado)>"
      }
    },
    modules: {
      auth: [
        { method: "POST", path: "/api/auth/signin", body: "{ login, password }", desc: "Login da conta e retorno do token + lista de avatares" },
        { method: "POST", path: "/api/auth/signup", body: "{ login, password, userName, email, age }", desc: "Criação de nova conta" }
      ],
      account_and_avatars: [
        { method: "GET",  path: "/api/v1/account/overview", desc: "Estado completo: Conta, Avatares, Avatar Ativo, VIP, Salas, Carteira, Extrato, Notificações, Amigos e Estatísticas" },
        { method: "POST", path: "/api/v1/account/switch-avatar", body: "{ avatarId }", desc: "Alterna o avatar ativo da conta" },
        { method: "POST", path: "/api/v1/account/avatar/create", body: "{ name, bio, gender, thumbnail, coverUrl }", desc: "Cria novo avatar na conta" },
        { method: "POST", path: "/api/v1/account/avatar/update", body: "{ avatarId, name, bio, gender, thumbnail, coverUrl }", desc: "Atualiza dados do avatar" },
        { method: "POST", path: "/api/v1/account/avatar/customize", body: "{ avatarId, coverUrl, privacyPosts, privacyPhotos, privacyRooms, privacyFriends, privacyFollowers }", desc: "Atualiza capa e privacidade granular" },
        { method: "GET",  path: "/api/v1/account/vip/status", desc: "Status VIP do avatar, selo VIP, validade e cotas diárias de chat" },
        { method: "POST", path: "/api/v1/account/vip/subscribe", body: "{ avatarId, planKey: '1_WEEK'|'1_MONTH'|'3_MONTHS', paymentCurrency: 'Cash'|'Coins' }", desc: "Assina ou renova Clube VIP" },
        { method: "GET",  path: "/api/v1/account/notifications", desc: "Lista notificações em tempo real do avatar e contagem de não lidas" },
        { method: "POST", path: "/api/v1/account/notifications/read", body: "{ avatarId, notificationId }", desc: "Marca notificações como lidas" },
        { method: "GET",  path: "/api/v1/avatars/me/careers", desc: "Lista trilhas de carreiras e selos do avatar ativo" },
        { method: "POST", path: "/api/v1/avatars/me/careers/equip", body: "{ careerKey }", desc: "Equipa selo de carreira principal do avatar" },
        { method: "GET",  path: "/api/v1/avatars/:id/careers", desc: "Lista trilhas de carreiras e selo equipado de qualquer avatar público" }
      ],
      social: [
        { method: "GET",  path: "/api/v1/social/feed?filter=all|friends|mine", desc: "Lista feed social respeitando privacidade" },
        { method: "POST", path: "/api/v1/social/posts", body: "{ avatarId, title, text, imageUrl, roomId }", desc: "Publica no mural (texto, foto, sala 3D)" },
        { method: "POST", path: "/api/v1/social/posts/:id/share", body: "{ avatarId, text }", desc: "Compartilha publicação" },
        { method: "POST", path: "/api/v1/social/posts/:id/delete", body: "{ avatarId }", desc: "Exclui publicação" },
        { method: "POST", path: "/api/v1/social/react", body: "{ avatarId, targetType, targetId, reactionType, forceReaction }", desc: "Reage (like, love, care, haha, wow, sad, angry) em post, photo, comment, profile, room ou reel" },
        { method: "POST", path: "/api/v1/social/comment", body: "{ avatarId, postId, photoId, reelId, commentId, text }", desc: "Comenta ou responde recursivamente" },
        { method: "POST", path: "/api/v1/social/comments/:id/delete", body: "{ avatarId }", desc: "Exclui comentário" },
        { method: "GET",  path: "/api/v1/social/gallery?filter=all|friends|mine", desc: "Lista galeria de fotos" },
        { method: "POST", path: "/api/v1/social/gallery", body: "{ avatarId, imageUrl, description, shareOnFeed }", desc: "Adiciona foto na galeria" },
        { method: "GET",  path: "/api/v1/social/photos/:photoId", desc: "Detalhes da foto + árvore recursiva de comentários" },
        { method: "POST", path: "/api/v1/social/photos/:photoId/delete", desc: "Remove foto da galeria" },
        { method: "GET",  path: "/api/v1/social/reels", desc: "Lista Mini Reels (24h) e Sentimentos (6h) ativos" },
        { method: "POST", path: "/api/v1/social/reels", body: "{ avatarId, type, imageUrl, text, feelingEmoji, feelingLabel, bgStyle }", desc: "Publica Mini Reel (24h) ou Sentimento (6h)" },
        { method: "POST", path: "/api/v1/social/reels/:id/delete", desc: "Exclui Mini Reel ou Sentimento" },
        { method: "POST", path: "/api/v1/social/follow", body: "{ avatarId, targetProfileId }", desc: "Segue ou deixa de seguir outro avatar" },
        { method: "POST", path: "/api/v1/social/match", body: "{ avatarId, targetProfileId }", desc: "Envia Crush / Match 💘 (cria DM automática se mútuo)" },
        { method: "GET",  path: "/api/v1/social/avatar/:targetId", desc: "Perfil social completo + Mini Profile + relação com o visitante" },
        { method: "GET",  path: "/api/v1/social/friends/list", desc: "Lista amigos aceitos, pendentes e sugestões" },
        { method: "GET",  path: "/api/v1/social/friends/search?q=", desc: "Busca avatares por nome ou #ID" },
        { method: "POST", path: "/api/v1/social/friends/request", body: "{ avatarId, targetProfileId }", desc: "Envia convite de amizade" },
        { method: "POST", path: "/api/v1/social/friends/accept", body: "{ avatarId, friendshipId }", desc: "Aceita convite de amizade e cria DM" },
        { method: "POST", path: "/api/v1/social/friends/remove", body: "{ avatarId, friendshipId }", desc: "Remove amizade ou cancela convite" }
      ],
      chat: [
        { method: "GET",  path: "/api/chats", desc: "Lista conversas (Global, Grupos e DMs)" },
        { method: "GET",  path: "/api/chats/vip-quota", desc: "Status VIP e cotas diárias de abertura de DM, imagens e voz no chat" },
        { method: "POST", path: "/api/chats/direct", body: "{ profileId }", desc: "Abre ou cria DM privada (Membro Básico: apenas amigos e com limite diário; VIP: livre)" },
        { method: "POST", path: "/api/chats/group", body: "{ name, memberIds }", desc: "Cria grupo de chat com amigos" },
        { method: "GET",  path: "/api/chats/:uid/messages", desc: "Histórico de mensagens da sala de chat" },
        { method: "POST", path: "/api/chats/:uid/messages", body: "{ text }", desc: "Envia mensagem de texto" },
        { method: "POST", path: "/api/chats/:uid/messages/media", body: "multipart/form-data (file, type: 'image'|'audio')", desc: "Envia imagem ou mensagem de voz no chat respeitando cota diária Básica/VIP" },
        { method: "WS",   path: "/ws/chat?profileId=<avatarId>", desc: "WebSocket em tempo real para chat, digitação, amizades e match" }
      ],
      bank_and_market: [
        { method: "GET",  path: "/api/v1/bank/wallet", desc: "Saldo da carteira (Cash, Coins, Chips), VIP, ordens e extrato completo" },
        { method: "GET",  path: "/api/v1/bank/ledger", desc: "Extrato detalhado da carteira (wallet_ledger)" },
        { method: "POST", path: "/api/v1/bank/transfer-coins", body: "{ avatarId, recipient, amountCoins, note }", desc: "Transfere SOMENTE moeda do jogo (Coins) para outro jogador com taxa configurada" },
        { method: "GET",  path: "/api/v1/bank/market/stats", desc: "Cotações, pote de liquidez FIFO e regras econômicas" },
        { method: "POST", path: "/api/v1/bank/market/buy", body: "{ avatarId, coins }", desc: "Compra Coins consumindo o pote FIFO" },
        { method: "POST", path: "/api/v1/bank/market/sell", body: "{ avatarId, coins }", desc: "Cria ordem de venda de Coins no pote FIFO" },
        { method: "POST", path: "/api/v1/bank/market/cancel", body: "{ avatarId, orderId }", desc: "Cancela ordem de venda ativa" },
        { method: "POST", path: "/api/v1/bank/market/convert", body: "{ avatarId, direction, amount }", desc: "Conversor rápido entre Cash, Coins e Chips" },
        { method: "POST", path: "/api/v1/bank/market/pix/create", body: "{ avatarId, cashAmount }", desc: "Gera QR Code Pix dinâmico para compra de Cash" },
        { method: "POST", path: "/api/v1/bank/market/withdraw", body: "{ avatarId, cashAmount, pixKey, pixKeyType }", desc: "Solicita saque de Cash via Pix" },
        { method: "GET",  path: "/api/v1/financial-health", desc: "Saúde financeira da plataforma, passivo de Cash dos usuários e solvência" }
      ],
      game_3d_and_casino: [
        { method: "GET",  path: "/api/v1/game/rooms", desc: "Lista salas 3D do avatar" },
        { method: "GET",  path: "/api/v1/game/rooms/explore", desc: "Explorador de salas públicas + Ranking de visitas únicas do mês" },
        { method: "POST", path: "/api/v1/game/room/create", body: "{ avatarId, name, description, maxPlayers, isPrivate, password, entryValue }", desc: "Cria nova sala 3D" },
        { method: "POST", path: "/api/v1/game/room/update", body: "{ roomId, name, description, maxPlayers, isPrivate, password, entryValue }", desc: "Atualiza sala 3D" },
        { method: "POST", path: "/api/v1/game/room/:id/enter", body: "{ avatarId, password }", desc: "Entra na sala 3D (cobra passe 24h se houver e contabiliza visita única mensal com anti-farm)" },
        { method: "POST", path: "/api/v1/game/room/:id/boost", body: "{ avatarId }", desc: "Impulsiona sala 3D no topo do ranking por 24 horas" },
        { method: "GET",  path: "/api/v1/game/room/:id/details", desc: "Retorna sala 3D completa com objetos instanciados e terreno para o Godot" },
        { method: "GET",  path: "/api/v1/room/:id/servers", desc: "Lista instâncias de servidor ativas da sala (tabela servers) com IP:Porta e lotação" },
        { method: "POST", path: "/api/v1/room/:id/replicate", desc: "Aloca ou replica nova instância de servidor dedicado para a sala" },
        { method: "GET",  path: "/api/v1/shop/catalog", desc: "Catálogo de roupas e itens 3D (slots, modelos, prefabs, preços)" },
        { method: "GET",  path: "/api/v1/shop/wardrobe", desc: "Guarda-roupa do avatar, slots equipados e estilos salvos" },
        { method: "POST", path: "/api/v1/shop/equip", body: "{ avatarId, slot, itemId }", desc: "Equipa ou desequipa item 3D no avatar" },
        { method: "POST", path: "/api/v1/shop/buy", body: "{ avatarId, containerId }", desc: "Compra item 3D da loja" },
        { method: "GET",  path: "/api/v1/shop/app-data", desc: "Exporta metadados 3D prontos para Babylon.js e Godot Engine" },
        { method: "POST", path: "/api/v1/game/shop/gift", body: "{ avatarId, containerId, recipient }", desc: "Envia roupa/item 3D de presente para outro jogador (em Coins)" },
        { method: "GET",  path: "/api/v1/casino/status", desc: "Status do Cassino TFL (fichas, limites e jogos disponíveis)" },
        { method: "POST", path: "/api/v1/casino/play", body: "{ avatarId, gameType: 'slots'|'roulette'|'dice', betChips, choice }", desc: "Joga no Cassino TFL usando Fichas (Chips)" }
      ],
      diary_anonymous: [
        { method: "GET",  path: "/api/v1/diary/overview", desc: "Cantinho de desabafo anônimo + páginas do diário secreto" },
        { method: "POST", path: "/api/v1/diary/page/save", body: "{ avatarId, title, content, mood, isPublicAnonymous }", desc: "Escreve nova folha de caderno ou publica desabafo anônimo" },
        { method: "POST", path: "/api/v1/diary/page/:id/visibility", desc: "Alterna visibilidade entre Privado e Público Anônimo" },
        { method: "POST", path: "/api/v1/diary/page/:id/delete", desc: "Exclui página do diário" },
        { method: "POST", path: "/api/v1/diary/page/:id/react", body: "{ avatarId, reactionType }", desc: "Reage anonimamente à página (abraço, carinho, apoio, etc.)" },
        { method: "POST", path: "/api/v1/diary/page/:id/comment", body: "{ avatarId, text }", desc: "Comenta anonimamente na página de desabafo" },
        { method: "POST", path: "/api/v1/diary/page/:id/read-reward", body: "{ avatarId, activeReadSeconds }", desc: "Registra tempo de leitura e credita recompensa em Coins para leitor e autor" }
      ],
      telemetry: [
        { method: "GET",  path: "/api/v1/stats", desc: "Estatísticas em tempo real de servidor, banco, comunidade, social e economia" },
        { method: "POST", path: "/api/v1/bots/simulate", body: "{ botsCount, rounds, delayMs }", desc: "Dispara N bots autônomos interagindo com todo o site exclusivamente via API + WebSocket" }
      ]
    }
  });
});

// Disparo de Simulação de Bots via API
router.post("/bots/simulate", async (req, res) => {
  try {
    const { runBotSimulation } = require("../../../scripts/bot_simulator");
    const botsCount = Math.min(Math.max(Number(req.body?.botsCount || 5), 1), 25);
    const rounds = Math.min(Math.max(Number(req.body?.rounds || 2), 1), 10);
    const delayMs = Math.min(Math.max(Number(req.body?.delayMs || 60), 10), 2000);
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
    console.error("Erro ao executar simulador de bots:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= CARREIRAS & SELOS DO AVATAR =================
router.get("/avatars/me/careers", async (req, res) => {
  try {
    const avatarId =
      req.headers?.["x-profile-id"] ||
      req.query?.avatarId ||
      req.body?.avatarId ||
      (await repo.Avatar.findOne({
        where: { userId: req.user.id },
        order: [["selected", "DESC"], ["id", "ASC"]],
      }))?.id;

    if (!avatarId) {
      return res.status(404).json({ success: false, error: "Nenhum avatar encontrado para este usuário." });
    }

    const careers = await getAvatarCareers(avatarId);
    return res.json({ success: true, avatarId: Number(avatarId), careers });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/avatars/me/careers/equip", async (req, res) => {
  try {
    const { careerKey } = req.body || {};
    if (!careerKey) {
      return res.status(400).json({ success: false, error: "Chave da carreira (careerKey) é obrigatória." });
    }

    const avatarId =
      req.headers?.["x-profile-id"] ||
      req.query?.avatarId ||
      req.body?.avatarId ||
      (await repo.Avatar.findOne({
        where: { userId: req.user.id },
        order: [["selected", "DESC"], ["id", "ASC"]],
      }))?.id;

    if (!avatarId) {
      return res.status(404).json({ success: false, error: "Nenhum avatar encontrado para este usuário." });
    }

    await equipAvatarBadge(avatarId, careerKey);
    const careers = await getAvatarCareers(avatarId);
    return res.json({ success: true, avatarId: Number(avatarId), equippedCareerKey: careerKey, careers });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/avatars/:id/careers", async (req, res) => {
  try {
    const idParam = req.params.id;
    let targetAvatarId = null;

    if (idParam === "me") {
      targetAvatarId =
        req.headers?.["x-profile-id"] ||
        req.query?.avatarId ||
        req.body?.avatarId ||
        (await repo.Avatar.findOne({
          where: { userId: req.user.id },
          order: [["selected", "DESC"], ["id", "ASC"]],
        }))?.id;
    } else {
      targetAvatarId = Number(idParam);
    }

    if (!targetAvatarId) {
      return res.status(404).json({ success: false, error: "Avatar não informado ou inexistente." });
    }

    const careers = await getAvatarCareers(targetAvatarId);
    return res.json({ success: true, avatarId: Number(targetAvatarId), careers });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= SAÚDE FINANCEIRA & BALANÇO =================
router.get("/financial-health", async (req, res) => {
  try {
    const health = await getPlatformFinancialHealth();
    return res.json({ success: true, ...health });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/bank/financial-health", async (req, res) => {
  try {
    const health = await getPlatformFinancialHealth();
    return res.json({ success: true, ...health });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.use("/social", Social);
router.use("/game", Game);
router.use("/bank", Bank);
router.use("/account", profileController);
router.use("/portal", profileController);

// Submódulos adicionais para acesso direto da API externa v1
router.use("/diary", (req, res, next) => {
  if (!req.url.startsWith("/diary")) {
    req.url = "/diary" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  return profileController(req, res, next);
});

router.use("/shop", (req, res, next) => {
  if (!req.url.startsWith("/shop")) {
    req.url = "/shop" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  return profileController(req, res, next);
});

router.use("/casino", (req, res, next) => {
  if (!req.url.startsWith("/casino")) {
    req.url = "/casino" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  return profileController(req, res, next);
});

router.use("/vip", (req, res, next) => {
  if (!req.url.startsWith("/vip")) {
    req.url = "/vip" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  return profileController(req, res, next);
});

// Fallback universal: Todas as rotas do controlador central ficam acessíveis diretamente em /api/v1/*
router.use(profileController);

module.exports = {
  router
};