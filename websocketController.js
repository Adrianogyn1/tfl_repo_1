
// ./websocketController.js
//
// Gerenciador central de WebSocket com suporte a:
//   - Autenticação com timeout
//   - Registries de conexões (por profileId, por userId)
//   - Handlers plugáveis (chat, room, etc.)
//   - Broadcast direcionado
//   - Heartbeat (ping/pong)
//   - Presença (online/offline)

const repo = require("./repository");

// ---------------------------------------------------------------------------
// CONSTANTES
// ---------------------------------------------------------------------------

const AUTH_TIMEOUT_MS = 5000000;
const HEARTBEAT_INTERVAL_MS = 30000;
const HEARTBEAT_TIMEOUT_MS = 60000;

// ---------------------------------------------------------------------------
// REGISTRIES
// ---------------------------------------------------------------------------

const clients = new Set();
const clientsByProfile = new Map();
const clientsByUser = new Map();
const handlers = new Map();
const authTimeouts = new Map();

let wssRef = null;

// ---------------------------------------------------------------------------
// REGISTRO DE HANDLERS
// ---------------------------------------------------------------------------

function registerHandler(prefix, handler) {
  if (typeof handler !== "function") {
    throw new Error(`registerHandler("${prefix}", ...) precisa receber uma função`);
  }
  handlers.set(prefix, handler);
  console.log(`📡 Handler registrado para prefixo "${prefix}:"`);
}

// ---------------------------------------------------------------------------
// HELPERS DE ENVIO
// ---------------------------------------------------------------------------

function safeSend(ws, event, data) {
  if (!ws || ws.readyState !== ws.OPEN) return false;
  try {
    ws.send(JSON.stringify({ Event: event, Data: data ?? {} }));
    return true;
  } catch (err) {
    console.error("❌ Erro ao enviar pacote WS:", err.message);
    return false;
  }
}

function broadcastToProfile(profileId, event, data) {
  const set = clientsByProfile.get(String(profileId));
  if (!set || !set.size) return 0;
  let sent = 0;
  for (const ws of set) if (safeSend(ws, event, data)) sent++;
  return sent;
}

function broadcastToUser(userId, event, data) {
  const set = clientsByUser.get(String(userId));
  if (!set || !set.size) return 0;
  let sent = 0;
  for (const ws of set) if (safeSend(ws, event, data)) sent++;
  return sent;
}

async function broadcastToRoom(roomUid, event, data, opts = {}) {
  const { excludeProfileId } = opts;
  try {
    const room = await repo.ChatRoom.findOne({ where: { uid: roomUid } });
    if (!room) {
      console.warn(`⚠️ Sala ${roomUid} não encontrada`);
      return 0;
    }

    if (room.type === "global") {
      return broadcastAll(event, data, { excludeProfileId });
    }

    const participants = await repo.ChatParticipant.findAll({
      where: { roomId: room.id },
    });

    let sent = 0;
    for (const p of participants) {
      if (excludeProfileId != null && String(p.profileId) === String(excludeProfileId)) {
        continue;
      }
      sent += broadcastToProfile(p.profileId, event, data);
    }
    return sent;
  } catch (err) {
    console.error("❌ Erro em broadcastToRoom:", err.message);
    return 0;
  }
}

function broadcastAll(event, data, opts = {}) {
  const { excludeProfileId, excludeUserId } = opts;
  let sent = 0;
  for (const ws of clients) {
    if (excludeProfileId != null && String(ws.profileId) === String(excludeProfileId)) {
      continue;
    }
    if (excludeUserId != null && String(ws.userId) === String(excludeUserId)) {
      continue;
    }
    if (safeSend(ws, event, data)) sent++;
  }
  return sent;
}

function isProfileOnline(profileId) {
  const set = clientsByProfile.get(String(profileId));
  return !!set && set.size > 0;
}

function getOnlineProfileIds() {
  return Array.from(clientsByProfile.keys());
}

function getOnlineUserIds() {
  return Array.from(clientsByUser.keys());
}

// ---------------------------------------------------------------------------
// GERENCIAMENTO DE MAPS
// ---------------------------------------------------------------------------

function addToMap(map, key, ws) {
  const k = String(key);
  if (!map.has(k)) map.set(k, new Set());
  map.get(k).add(ws);
}

function removeFromMap(map, key, ws) {
  const k = String(key);
  const set = map.get(k);
  if (!set) return;
  set.delete(ws);
  if (!set.size) map.delete(k);
}

function registerClient(ws) {
  clients.add(ws);
  if (ws.profileId != null) addToMap(clientsByProfile, ws.profileId, ws);
  if (ws.userId != null) addToMap(clientsByUser, ws.userId, ws);
  
  // Notificar presença online
  if (ws.profileId != null) {
    broadcastPresence("online", ws.profileId);
  }
}

function removeClient(ws) {
  // Evitar chamadas duplicadas
  if (!clients.has(ws)) return;

  clients.delete(ws);
  
  const profileId = ws.profileId;
  const userId = ws.userId;

  if (profileId != null) removeFromMap(clientsByProfile, profileId, ws);
  if (userId != null) removeFromMap(clientsByUser, userId, ws);

  // Notificar presença offline
  if (profileId != null) {
    broadcastPresence("offline", profileId);
  }

  // Limpar timeout de autenticação
  if (authTimeouts.has(ws)) {
    clearTimeout(authTimeouts.get(ws));
    authTimeouts.delete(ws);
  }
}

// ---------------------------------------------------------------------------
// PRESENÇA
// ---------------------------------------------------------------------------

function broadcastPresence(type, profileId) {
  if (profileId == null) return; // Validação
  const online = getOnlineProfileIds();
  broadcastAll(`presence:${type}`, { profileId: String(profileId), onlineProfiles: online });
}

// ---------------------------------------------------------------------------
// AUTENTICAÇÃO
// ---------------------------------------------------------------------------

function extractToken(req) {
  let tk = req.headers["tfl-token"] || req.headers["token"];
  let profileIdFromQuery = null;

  if (!tk && req.url) {
    try {
      const baseUrl = `http://${req.headers.host || "localhost"}`;
      const parsedUrl = new URL(req.url, baseUrl);
      tk = parsedUrl.searchParams.get("token") || parsedUrl.searchParams.get("tfl-token");
      profileIdFromQuery = parsedUrl.searchParams.get("profileId");
    } catch (err) {
      console.error("❌ Erro ao processar URL do WS:", err.message);
    }
  }

  if (!profileIdFromQuery && req.url && req.url.includes("/?profileId=")) {
    profileIdFromQuery = req.url.split("/?profileId=")[1];
  }

  return { token: tk || "", profileIdFromQuery };
}

async function resolveAuth(req) {
  let { token, profileIdFromQuery } = extractToken(req);
  let profileId = profileIdFromQuery || null;

  if (profileId) {
    try {
      const avatar = await repo.Avatar.findByPk(profileId);
      if (avatar) {
        const user = await repo.User.findByPk(avatar.userId);
        if (user) token = user.token;
      }
    } catch (err) {
      console.error("❌ Erro ao resolver profileId:", err.message);
    }
  }

  token = token || "";

  // Caso especial: app_open (sem autenticação)
  if (token === "app_open") {
    return { isAppOpen: true };
  }

  try {
    const user = await repo.User.findOne({ where: { token } });
    if (!user) {
      console.warn(`⚠️ Token Inválido ou Ausente: "${token}"`);
      return { isAppOpen: false, user: null, token };
    }
    return { isAppOpen: false, user, token, profileId };
  } catch (err) {
    console.error("❌ Erro ao buscar usuário:", err.message);
    return { isAppOpen: false, user: null, token };
  }
}

// ---------------------------------------------------------------------------
// PARSING DE PACOTES
// ---------------------------------------------------------------------------

function parsePacket(raw) {
  const payload = raw.toString("utf-8");
  const packet = JSON.parse(payload);
  const event = packet.Event || packet.event;
  const data = packet.Data || packet.data;

  if (!event || typeof event !== "string") {
    throw new Error("Pacote sem campo Event válido");
  }

  // Validar que data é um objeto
  if (data != null && typeof data !== "object") {
    throw new Error("Campo Data deve ser um objeto");
  }

  return { event, data: data || {} };
}

// ---------------------------------------------------------------------------
// DISPATCH / ROTEAMENTO
// ---------------------------------------------------------------------------

function dispatch(ws, event, data) {
  const prefix = event.split(":")[0];
  const handler = handlers.get(prefix);
  if (!handler) {
    console.warn(`⚠️ Nenhum handler registrado para: ${event}`);
    return;
  }
  try {
    handler(ws, event, data, wssRef);
  } catch (err) {
    console.error(`❌ Erro no handler de "${event}":`, err.message);
    safeSend(ws, "error", { message: "Erro ao processar evento", event });
  }
}

// ---------------------------------------------------------------------------
// HANDLER DE CONEXÃO
// ---------------------------------------------------------------------------

async function handleConnection(ws, req, appOpenHandler) {
  let auth;
  try {
    auth = await resolveAuth(req);
  } catch (err) {
    console.error("❌ Erro ao autenticar WS:", err.message);
    ws.close(4000, "Erro interno");
    return;
  }

  if (auth.isAppOpen) {
    if (typeof appOpenHandler === "function") appOpenHandler(ws);
    console.log("📡 Conexão Estabelecida: App Open");
    return;
  }

  if (!auth.user) {
    console.warn("⚠️ Conexão Recusada: Token inválido");
    ws.close(4001, "Unauthorized");
    return;
  }

  ws.userId = auth.user.id;
  ws.profileId = auth.profileId || null;
  ws.isAlive = true;
  ws.isAuthenticated = true;

  registerClient(ws);
  console.log(
    `📡 Conexão Estabelecida: userId=${ws.userId} profileId=${ws.profileId || "-"}`
  );

  // Enviar lista de online
  safeSend(ws, "presence:list", { onlineProfiles: getOnlineProfileIds() });

  // Timeout de autenticação (caso não envie mensagem válida)
  const authTimeout = setTimeout(() => {
    if (!ws.hasReceivedValidMessage) {
      console.warn(`⚠️ Conexão inativa descartada: userId=${ws.userId}`);
      ws.close(4002, "Auth timeout");
    }
  }, AUTH_TIMEOUT_MS);
  authTimeouts.set(ws, authTimeout);

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (raw) => {
    let event, data;
    try {
      ({ event, data } = parsePacket(raw));
    } catch (err) {
      console.error("❌ Erro ao analisar pacote:", err.message);
      return;
    }

    ws.hasReceivedValidMessage = true;

    // Limpar timeout após primeira mensagem válida
    if (authTimeouts.has(ws)) {
      clearTimeout(authTimeouts.get(ws));
      authTimeouts.delete(ws);
    }

    console.log(`📡 Recebendo pacote: ${event}`);
    dispatch(ws, event, data);
  });

  ws.on("close", () => {
    removeClient(ws);
    console.log(
      `📡 Conexão Encerrada: userId=${ws.userId} profileId=${ws.profileId || "-"}`
    );
  });

  ws.on("error", (err) => {
    console.error("❌ Erro na conexão WS:", err.message);
    removeClient(ws);
  });
}

// ---------------------------------------------------------------------------
// HEARTBEAT
// ---------------------------------------------------------------------------

let heartbeatInterval = null;

function startHeartbeat(intervalMs = HEARTBEAT_INTERVAL_MS) {
  stopHeartbeat();
  heartbeatInterval = setInterval(() => {
    for (const ws of clients) {
      if (ws.isAlive === false) {
        console.warn(`⚠️ Conexão morta detectada: userId=${ws.userId}`);
        ws.terminate();
        removeClient(ws);
        continue;
      }
      ws.isAlive = false;
      try {
        ws.ping();
      } catch (_) {
        /* ignora */
      }
    }
  }, intervalMs);
}

function stopHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = null;
}

// ---------------------------------------------------------------------------
// PONTO DE ENTRADA
// ---------------------------------------------------------------------------

function attach(wss, opts = {}) {
  wssRef = wss;
  wss.on("connection", (ws, req) => handleConnection(ws, req, opts.onAppOpen));
  startHeartbeat(opts.heartbeatMs || HEARTBEAT_INTERVAL_MS);
  console.log("📡 WebSocket Manager conectado");
}

// ---------------------------------------------------------------------------
// LIMPEZA (para graceful shutdown)
// ---------------------------------------------------------------------------

function shutdown() {
  stopHeartbeat();
  authTimeouts.forEach((timeout) => clearTimeout(timeout));
  authTimeouts.clear();
  clients.forEach((ws) => ws.close(1000, "Server shutdown"));
  clients.clear();
  clientsByProfile.clear();
  clientsByUser.clear();
}

module.exports = {
  attach,
  shutdown,
  registerHandler,
  broadcastToProfile,
  broadcastToUser,
  broadcastToRoom,
  broadcastAll,
  isProfileOnline,
  getOnlineProfileIds,
  getOnlineUserIds,
  safeSend,
};
