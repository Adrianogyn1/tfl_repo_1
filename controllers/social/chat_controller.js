

// controllers/social/chatController.js
const repo = require("../../repository");//reposition
const router = require("express").Router();
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

// Model do perfil/avatar. AJUSTE o nome conforme o que o seu repository exporta
// (dica: console.log(Object.keys(repo)) mostra os nomes disponíveis).
// Resolvido na hora do uso, pois o repository pode popular os models depois do require.
const getProfile = () => {
  const P = repo.Profile || repo.AvatarModel || repo.Avatar;
  if (!P) {
    throw new Error("Model de perfil não encontrado no repository. Disponíveis: " + Object.keys(repo).join(", "));
  }
  return P;
};

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

// espelha o enum MessageType do C#
const MessageType = {
  Info: 0, Warning: 1, Error: 2, Success: 3, Chat: 4, System: 5,
  User: 6, Game: 7, Private: 8, Group: 9, Local: 10, Notification: 11,
};

const ROOM_MESSAGE_TYPE = {
  private: MessageType.Private,
  group: MessageType.Group,
  global: MessageType.Chat,
};

const MAX_TEXT = 4000;
const PAGE_DEFAULT = 30;
const PAGE_MAX = 100;

// opções de mídia aceitas (mime -> flag do ChatMessage)
const MEDIA_KINDS = {
  image: { flag: "hasImage", mimes: ["image/jpeg", "image/png", "image/gif", "image/webp"], maxSize: 10 * 1024 * 1024 },
  video: { flag: "hasVideo", mimes: ["video/mp4", "video/webm", "video/quicktime"], maxSize: 50 * 1024 * 1024 },
  audio: { flag: "hasAudio", mimes: ["audio/mpeg", "audio/mp4", "audio/ogg", "audio/webm", "audio/wav"], maxSize: 15 * 1024 * 1024 },
  file:  { flag: "hasFile",  mimes: null, maxSize: 20 * 1024 * 1024 }, // qualquer tipo
};

const UPLOAD_DIR = process.env.CHAT_UPLOAD_DIR || path.join(process.cwd(), "uploads", "chat");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`);
    },
  }),
  limits: { fileSize: Math.max(...Object.values(MEDIA_KINDS).map((k) => k.maxSize)) },
});

// ---------------------------------------------------------------------------
// Helpers HTTP
// ---------------------------------------------------------------------------

// AJUSTE AQUI conforme o seu middleware de auth
const getProfileId = (req) =>
  req.user?.profileId ??
  req.user?.id ??
  req.profile?.id ??
  // SÓ PARA TESTE: liga com CHAT_DEV_AUTH=true no .env e desligue em produção
  (process.env.CHAT_DEV_AUTH === "true" ? req.headers["x-profile-id"] : null) ??
  null;

const requireProfile = (req, res, next) => {
  const profileId = getProfileId(req);
  if (!profileId) return res.status(401).json({ error: "Não autenticado" });
  req.profileId = Number(profileId);
  next();
};

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const clampLimit = (v) => Math.min(Math.max(parseInt(v, 10) || PAGE_DEFAULT, 1), PAGE_MAX);

const directKeyOf = (a, b) => `${Math.min(a, b)}_${Math.max(a, b)}`;

const detectMediaKind = (mime) => {
  if (!mime) return "file";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
};

const removeFileQuietly = (file) => {
  if (file?.path) fs.unlink(file.path, () => {});
};

// busca a sala pelo uid e garante que o profile participa dela
async function loadRoomForMember(req, res) {
  const room = await repo.ChatRoom.findOne({ where: { uid: req.params.uid } });
  if (!room) {
    res.status(404).json({ error: "Chat não encontrado" });
    return null;
  }

  const participant = await repo.ChatParticipant.findOne({
    where: { chatId: room.id, profileId: req.profileId },
  });

  // sala global é aberta a todos; as demais exigem participação
  if (!participant && room.type !== "global") {
    res.status(403).json({ error: "Você não participa deste chat" });
    return null;
  }

  return { room, participant };
}

const isAdmin = (participant) => participant && ["owner", "admin"].includes(participant.role);

async function getSenderName(profileId) {
  const p = await getProfile().findByPk(profileId);
  // AJUSTE AQUI conforme o campo de nome do seu Profile
  return p?.name || p?.username || p?.displayName || `Profile ${profileId}`;
}

async function createMessage(room, req, data) {
  return repo.ChatMessage.create({
    chatId: room.id,
    profileId: req.profileId,
    senderName: await getSenderName(req.profileId),
    type: ROOM_MESSAGE_TYPE[room.type] ?? MessageType.Chat,
    ...data,
  });
}

// ---------------------------------------------------------------------------
// WebSocket — conexões, registro e broadcast
// ---------------------------------------------------------------------------
// Todo o "roteamento" de WS fica aqui dentro do controller, como conversamos.
// No seu bootstrap do servidor (onde hoje você cria o wss), basta fazer:
//
//   const { router, chatWs } = require("./controllers/social/chatController");
//   const wss = new WebSocket.Server({ server, path: "/ws" }); // ou noServer + upgrade manual
//   wss.on("connection", chatWs.handleConnection);
//
// Se você já usa noServer + handleUpgrade manual (pra combinar com outro path),
// chame chatWs.handleConnection(ws, req) no callback da sua própria lógica de upgrade.

const clientsByProfile = new Map(); // profileId(Number) -> Set<ws>

function wsSend(ws, event, data) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ event, data, ts: Date.now() }));
  }
}

function registerClient(profileId, ws) {
  if (!clientsByProfile.has(profileId)) clientsByProfile.set(profileId, new Set());
  clientsByProfile.get(profileId).add(ws);
}

function removeClient(profileId, ws) {
  const set = clientsByProfile.get(profileId);
  if (!set) return;
  set.delete(ws);
  if (!set.size) clientsByProfile.delete(profileId);
}

function broadcastToProfile(profileId, event, data) {
  const set = clientsByProfile.get(Number(profileId));
  if (!set) return;
  for (const ws of set) wsSend(ws, event, data);
}

function broadcastToProfiles(profileIds, event, data, exceptProfileId) {
  for (const id of profileIds) {
    if (exceptProfileId != null && Number(id) === Number(exceptProfileId)) continue;
    broadcastToProfile(id, event, data);
  }
}

function broadcastAll(event, data, exceptProfileId) {
  for (const [profileId, set] of clientsByProfile) {
    if (exceptProfileId != null && Number(profileId) === Number(exceptProfileId)) continue;
    for (const ws of set) wsSend(ws, event, data);
  }
}

async function getRoomMemberIds(room) {
  if (room.type === "global") return null; // null = "todo mundo conectado"
  const participants = await repo.ChatParticipant.findAll({
    where: { chatId: room.id },
    attributes: ["profileId"],
  });
  return participants.map((p) => p.profileId);
}

async function broadcastToRoom(room, event, data, exceptProfileId) {
  const memberIds = await getRoomMemberIds(room);
  if (memberIds === null) broadcastAll(event, data, exceptProfileId);
  else broadcastToProfiles(memberIds, event, data, exceptProfileId);
}

// Resolve o profileId da conexão WS. AJUSTE conforme seu auth real.
// Como o handshake de WS do browser não manda headers customizados,
// o mais comum é vir por query string (?profileId=) em dev, e por
// sessão/cookie/JWT (req.user, já resolvido por um middleware de upgrade) em produção.
function getWsProfileId(req) {
  try {
    const url = new URL(req.url, "http://localhost");
    const fromQuery = url.searchParams.get("profileId");
    const resolved = req.user?.profileId ?? req.user?.id ?? fromQuery ?? null;
    const n = Number(resolved);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

// ============================================================================
// HANDLERS DE EVENTOS WS (chat:*)
// ============================================================================

async function onWsMessageSend(ws, data) {
  const profileId = ws.profileId;
  if (!profileId) {
    wsSend(ws, "error", { message: "Não autenticado" });
    return;
  }

  const { roomUid, text } = data;
  if (!roomUid || !text) {
    wsSend(ws, "error", { message: "roomUid e text obrigatórios" });
    return;
  }

  if (text.length > MAX_TEXT) {
    wsSend(ws, "error", { message: `Texto excede ${MAX_TEXT} caracteres` });
    return;
  }

  try {
    const room = await repo.ChatRoom.findOne({ where: { uid: roomUid } });
    if (!room) {
      wsSend(ws, "error", { message: "Sala não encontrada" });
      return;
    }

    // Verifica participação (global é aberta a todos)
    if (room.type !== "global") {
      const participant = await repo.ChatParticipant.findOne({
        where: { chatId: room.id, profileId },
      });
      if (!participant) {
        wsSend(ws, "error", { message: "Sem permissão nesta sala" });
        return;
      }
    }

    const message = await repo.ChatMessage.create({
      uid: uuidv4(),
      chatId: room.id,
      profileId,
      senderName: await getSenderName(profileId),
      text,
      type: ROOM_MESSAGE_TYPE[room.type] ?? MessageType.Chat,
    });

    await room.changed("updatedAt", true);
    await room.save();

    // Broadcast para todos da sala (excluindo quem enviou)
    await broadcastToRoom(room, "chat:message", message, profileId);

    // Confirma para o remetente
    wsSend(ws, "chat:message:sent", { uid: message.uid, chatUid: room.uid });

    console.log(`✅ Mensagem WS criada: ${message.uid} em ${roomUid}`);
  } catch (err) {
    console.error("❌ Erro ao criar mensagem WS:", err.message);
    wsSend(ws, "error", { message: "Erro ao enviar mensagem" });
  }
}

async function onWsTyping(ws, data) {
  const profileId = ws.profileId;
  if (!profileId) return;

  const { roomUid, isTyping } = data;
  if (!roomUid) return;

  try {
    const room = await repo.ChatRoom.findOne({ where: { uid: roomUid } });
    if (!room) return;

    // Verifica participação
    if (room.type !== "global") {
      const participant = await repo.ChatParticipant.findOne({
        where: { chatId: room.id, profileId },
      });
      if (!participant) return;
    }

    const senderName = await getSenderName(profileId);

    // Broadcast para a sala (excluindo remetente)
    await broadcastToRoom(room, "chat:typing", {
      roomUid,
      profileId,
      senderName,
      isTyping: !!isTyping,
    }, profileId);
  } catch (err) {
    console.error("❌ Erro em onWsTyping:", err.message);
  }
}

async function onWsRead(ws, data) {
  const profileId = ws.profileId;
  if (!profileId) return;

  const { roomUid } = data;
  if (!roomUid) return;

  try {
    const room = await repo.ChatRoom.findOne({ where: { uid: roomUid } });
    if (!room) return;

    // Verifica participação
    if (room.type !== "global") {
      const participant = await repo.ChatParticipant.findOne({
        where: { chatId: room.id, profileId },
      });
      if (!participant) return;
    }

    // Marca mensagens como lidas
    await repo.ChatMessage.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          chatId: room.id,
          profileId: { [Op.ne]: profileId },
          isRead: false,
        },
      }
    );

    // Broadcast para a sala
    await broadcastToRoom(room, "chat:read", {
      roomUid,
      profileId,
      readAt: new Date().toISOString(),
    });

    console.log(`✅ Marcado como lido por ${profileId} em ${roomUid}`);
  } catch (err) {
    console.error("❌ Erro em onWsRead:", err.message);
  }
}

async function onWsHistory(ws, data) {
  const profileId = ws.profileId;
  if (!profileId) {
    wsSend(ws, "error", { message: "Não autenticado" });
    return;
  }

  const { roomUid, limit = 30, before } = data;
  if (!roomUid) {
    wsSend(ws, "error", { message: "roomUid obrigatório" });
    return;
  }

  try {
    const room = await repo.ChatRoom.findOne({ where: { uid: roomUid } });
    if (!room) {
      wsSend(ws, "error", { message: "Sala não encontrada" });
      return;
    }

    // Verifica participação
    if (room.type !== "global") {
      const participant = await repo.ChatParticipant.findOne({
        where: { chatId: room.id, profileId },
      });
      if (!participant) {
        wsSend(ws, "error", { message: "Sem permissão" });
        return;
      }
    }

    const where = { chatId: room.id };
    if (before) {
      const cursor = await repo.ChatMessage.findOne({ where: { uid: before, chatId: room.id } });
      if (cursor) where.createdAt = { [Op.lt]: cursor.createdAt };
    }

    const messages = await repo.ChatMessage.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: Math.min(clampLimit(limit), 100),
    });

    wsSend(ws, "chat:history", {
      roomUid,
      messages: messages.reverse(),
      hasMore: messages.length >= limit,
    });
  } catch (err) {
    console.error("❌ Erro em onWsHistory:", err.message);
    wsSend(ws, "error", { message: "Erro ao buscar histórico" });
  }
}

async function onWsRoomList(ws, data) {
  const profileId = ws.profileId;
  if (!profileId) {
    wsSend(ws, "error", { message: "Não autenticado" });
    return;
  }

  try {
    const participations = await repo.ChatParticipant.findAll({
      where: { profileId },
      include: [
        {
          model: repo.ChatRoom,
          where: { type: { [Op.ne]: "global" } },
        },
      ],
    });

    const rooms = participations.map((p) => ({
      uid: p.ChatRoom.uid,
      id: p.ChatRoom.id,
      type: p.ChatRoom.type,
      name: p.ChatRoom.name,
      createdAt: p.ChatRoom.createdAt.toISOString(),
    }));

    // Adiciona sala global
    const globalRoom = await repo.ChatRoom.findOne({ where: { type: "global" } });
    if (globalRoom) {
      rooms.push({
        uid: globalRoom.uid,
        id: globalRoom.id,
        type: "global",
        name: "Chat Global",
        createdAt: globalRoom.createdAt.toISOString(),
      });
    }

    wsSend(ws, "chat:room:list", { rooms });
  } catch (err) {
    console.error("❌ Erro em onWsRoomList:", err.message);
    wsSend(ws, "error", { message: "Erro ao listar salas" });
  }
}

async function handleWsMessage(ws, raw) {
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }

  const { type, data } = msg || {};
  if (!type) return;

  switch (type) {
    case "chat:message:send":
      await onWsMessageSend(ws, data);
      break;
    case "chat:typing":
      await onWsTyping(ws, data);
      break;
    case "chat:read":
      await onWsRead(ws, data);
      break;
    case "chat:history":
      await onWsHistory(ws, data);
      break;
    case "chat:room:list":
      await onWsRoomList(ws, data);
      break;
    case "ping":
      wsSend(ws, "pong", {});
      break;
    default:
      console.warn(`⚠️ Evento WS desconhecido: ${type}`);
  }
}

function handleWsConnection(ws, req) {
  const profileId = getWsProfileId(req);
  if (!profileId) {
    ws.close(4001, "unauthorized");
    return;
  }

  ws.profileId = profileId;
  ws.isAlive = true;
  registerClient(profileId, ws);
  wsSend(ws, "chat:connected", { profileId });

  console.log(`📡 WS Conectado: profileId=${profileId}`);

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (raw) => {
    handleWsMessage(ws, raw).catch((e) => console.error("[chatController:ws:message]", e));
  });

  ws.on("close", () => {
    removeClient(profileId, ws);
    console.log(`📡 WS Desconectado: profileId=${profileId}`);
  });

  ws.on("error", (err) => {
    console.error("[chatController:ws:error]", err.message);
    removeClient(profileId, ws);
  });
}

// heartbeat simples pra limpar conexões mortas (chame clearInterval se derrubar o processo)
const heartbeat = setInterval(() => {
  for (const set of clientsByProfile.values()) {
    for (const ws of set) {
      if (ws.isAlive === false) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      if (typeof ws.ping === "function") ws.ping();
    }
  }
}, 30000);
heartbeat.unref?.();

function attachChatWebSocket(wss) {
  wss.on("connection", handleWsConnection);
}

// ---------------------------------------------------------------------------
// Anúncios do sistema
// ---------------------------------------------------------------------------

// GET /announcements?chat=<uid> -> globais ativos + (opcional) os da sala
router.get("/announcements", requireProfile, wrap(async (req, res) => {
  const notExpired = { [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }] };
  const or = [{ scope: "global" }];

  if (req.query.chat) {
    const ctx = await loadRoomForMember({ ...req, params: { uid: req.query.chat } }, res);
    if (!ctx) return;
    or.push({ scope: "chat", chatId: ctx.room.id });
  }

  const list = await repo.SystemAnnouncement.findAll({
    where: { [Op.and]: [{ [Op.or]: or }, notExpired] },
    order: [["pinned", "DESC"], ["createdAt", "DESC"]],
  });

  res.json(list);
}));

// POST /announcements  { scope, chatUid?, level, text, pinned?, expiresAt? } -> só admin do sistema
// AJUSTE AQUI: troque pela sua checagem de admin global
const requireSystemAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Apenas administradores" });
  next();
};

router.post("/announcements", requireProfile, requireSystemAdmin, wrap(async (req, res) => {
  const text = String(req.body.text || "").trim();
  if (!text) return res.status(400).json({ error: "Texto obrigatório" });

  const scope = req.body.scope === "chat" ? "chat" : "global";
  let room = null;

  if (scope === "chat") {
    room = await repo.ChatRoom.findOne({ where: { uid: req.body.chatUid } });
    if (!room) return res.status(404).json({ error: "Chat não encontrado" });
  }

  const announcement = await repo.SystemAnnouncement.create({
    scope,
    chatId: room ? room.id : null,
    level: Number.isInteger(req.body.level) ? req.body.level : MessageType.Info,
    text,
    pinned: !!req.body.pinned,
    expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
    createdBy: req.profileId,
  });

  // NOVO: avisa em tempo real quem precisa ver o anúncio
  if (scope === "global") broadcastAll("chat:announcement", announcement);
  else await broadcastToRoom(room, "chat:announcement", announcement);

  res.status(201).json(announcement);
}));

// DELETE /announcements/:id
router.delete("/announcements/:id", requireProfile, requireSystemAdmin, wrap(async (req, res) => {
  const announcement = await repo.SystemAnnouncement.findByPk(req.params.id);
  if (!announcement) return res.status(404).json({ error: "Anúncio não encontrado" });

  await announcement.destroy();

  // NOVO: notifica remoção
  if (announcement.scope === "global") {
    broadcastAll("chat:announcement:deleted", { id: announcement.id });
  } else if (announcement.chatId) {
    const room = await repo.ChatRoom.findByPk(announcement.chatId);
    if (room) await broadcastToRoom(room, "chat:announcement:deleted", { id: announcement.id });
  }

  res.status(204).end();
}));

// ---------------------------------------------------------------------------
// Salas
// ---------------------------------------------------------------------------

// GET /chats -> minhas conversas, com última mensagem e contagem de não lidas
router.get("/", requireProfile, wrap(async (req, res) => {
  const participations = await repo.ChatParticipant.findAll({ where: { profileId: req.profileId } });
  const chatIds = participations.map((p) => p.chatId);

  const rooms = await repo.ChatRoom.findAll({
    where: { [Op.or]: [{ id: { [Op.in]: chatIds } }, { type: "global" }] },
    include: [{ model: getProfile(), as: "profiles", through: { attributes: [] } }],
    order: [["updatedAt", "DESC"]],
  });

  const lastReadByChat = new Map(participations.map((p) => [String(p.chatId), p.lastReadAt]));

  const result = await Promise.all(rooms.map(async (room) => {
    const lastMessage = await repo.ChatMessage.findOne({
      where: { chatId: room.id },
      order: [["createdAt", "DESC"]],
    });

    const lastReadAt = lastReadByChat.get(String(room.id));
    const unread = await repo.ChatMessage.count({
      where: {
        chatId: room.id,
        profileId: { [Op.ne]: req.profileId },
        ...(lastReadAt ? { createdAt: { [Op.gt]: lastReadAt } } : {}),
      },
    });

    return { ...room.toJSON(), lastMessage, unread };
  }));

  res.json(result);
}));

// POST /chats/direct  { profileId } -> abre (ou cria) a DM com outro profile
router.post("/direct", requireProfile, wrap(async (req, res) => {
  const otherId = Number(req.body.profileId);
  if (!otherId || otherId === req.profileId) {
    return res.status(400).json({ error: "profileId inválido" });
  }

  const other = await getProfile().findByPk(otherId);
  if (!other) return res.status(404).json({ error: "Profile não encontrado" });

  const directKey = directKeyOf(req.profileId, otherId);

  let room = await repo.ChatRoom.findOne({ where: { directKey } });
  let created = false;

  if (!room) {
    room = await repo.ChatRoom.create({ type: "private", directKey });
    await repo.ChatParticipant.bulkCreate([
      { chatId: room.id, profileId: req.profileId, role: "member" },
      { chatId: room.id, profileId: otherId, role: "member" },
    ]);
    created = true;

    // NOVO: avisa o outro profile que uma nova conversa apareceu pra ele
    broadcastToProfile(otherId, "chat:room:new", room);
  }

  res.status(created ? 201 : 200).json(room);
}));

// POST /chats/group  { name, memberIds: [] }
router.post("/group", requireProfile, wrap(async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name || name.length > 128) return res.status(400).json({ error: "Nome do grupo inválido" });

  const memberIds = [...new Set((req.body.memberIds || []).map(Number).filter((id) => id && id !== req.profileId))];

  const room = await repo.ChatRoom.create({ type: "group", name, ownerId: req.profileId });

  await repo.ChatParticipant.bulkCreate([
    { chatId: room.id, profileId: req.profileId, role: "owner" },
    ...memberIds.map((profileId) => ({ chatId: room.id, profileId, role: "member" })),
  ]);

  // NOVO: avisa todos os membros (menos quem criou, que já tem a resposta HTTP)
  broadcastToProfiles(memberIds, "chat:room:new", room);

  res.status(201).json(room);
}));

// GET /chats/:uid -> detalhes da sala + participantes
router.get("/:uid", requireProfile, wrap(async (req, res) => {
  const ctx = await loadRoomForMember(req, res);
  if (!ctx) return;

  const full = await repo.ChatRoom.findByPk(ctx.room.id, {
    include: [{ model: repo.ChatParticipant, as: "participants" }],
  });

  res.json(full);
}));

// PATCH /chats/:uid  { name } -> renomeia grupo
router.patch("/:uid", requireProfile, wrap(async (req, res) => {
  const ctx = await loadRoomForMember(req, res);
  if (!ctx) return;

  if (ctx.room.type !== "group") return res.status(400).json({ error: "Só grupos podem ser renomeados" });
  if (!isAdmin(ctx.participant)) return res.status(403).json({ error: "Sem permissão" });

  const name = String(req.body.name || "").trim();
  if (!name || name.length > 128) return res.status(400).json({ error: "Nome inválido" });

  await ctx.room.update({ name });

  // NOVO
  await broadcastToRoom(ctx.room, "chat:room:updated", ctx.room, req.profileId);

  res.json(ctx.room);
}));

// DELETE /chats/:uid -> apaga o grupo (só owner)
router.delete("/:uid", requireProfile, wrap(async (req, res) => {
  const ctx = await loadRoomForMember(req, res);
  if (!ctx) return;

  if (ctx.room.type !== "group") return res.status(400).json({ error: "Só grupos podem ser apagados" });
  if (ctx.participant?.role !== "owner") return res.status(403).json({ error: "Apenas o dono pode apagar o grupo" });

  // NOVO: pega os membros ANTES de destruir (cascade pode remover os participants)
  const memberIds = await getRoomMemberIds(ctx.room);
  const roomUid = ctx.room.uid;

  await ctx.room.destroy();

  if (memberIds) broadcastToProfiles(memberIds, "chat:room:deleted", { uid: roomUid }, req.profileId);

  res.status(204).end();
}));

// ---------------------------------------------------------------------------
// Participantes (grupos)
// ---------------------------------------------------------------------------

// POST /chats/:uid/participants  { profileIds: [] }
router.post("/:uid/participants", requireProfile, wrap(async (req, res) => {
  const ctx = await loadRoomForMember(req, res);
  if (!ctx) return;

  if (ctx.room.type !== "group") return res.status(400).json({ error: "Só é possível adicionar membros em grupos" });
  if (!isAdmin(ctx.participant)) return res.status(403).json({ error: "Sem permissão" });

  const ids = [...new Set((req.body.profileIds || []).map(Number).filter(Boolean))];
  if (!ids.length) return res.status(400).json({ error: "profileIds vazio" });

  const existing = await repo.ChatParticipant.findAll({
    where: { chatId: ctx.room.id, profileId: { [Op.in]: ids } },
  });
  const already = new Set(existing.map((p) => p.profileId));

  const toAdd = ids.filter((id) => !already.has(id)).map((profileId) => ({
    chatId: ctx.room.id, profileId, role: "member",
  }));

  if (toAdd.length) await repo.ChatParticipant.bulkCreate(toAdd);

  // NOVO: avisa quem entrou (pra sala aparecer na lista deles) e avisa a sala
  const addedIds = toAdd.map((p) => p.profileId);
  broadcastToProfiles(addedIds, "chat:room:new", ctx.room);
  await broadcastToRoom(ctx.room, "chat:participants:added", { chatUid: ctx.room.uid, profileIds: addedIds }, req.profileId);

  res.status(201).json({ added: toAdd.length });
}));

// PATCH /chats/:uid/participants/:profileId  { role } -> promove/rebaixa
router.patch("/:uid/participants/:profileId", requireProfile, wrap(async (req, res) => {
  const ctx = await loadRoomForMember(req, res);
  if (!ctx) return;

  if (ctx.participant?.role !== "owner") return res.status(403).json({ error: "Apenas o dono altera cargos" });

  const role = req.body.role;
  if (!["admin", "member"].includes(role)) return res.status(400).json({ error: "role inválido" });

  const target = await repo.ChatParticipant.findOne({
    where: { chatId: ctx.room.id, profileId: Number(req.params.profileId) },
  });
  if (!target) return res.status(404).json({ error: "Participante não encontrado" });
  if (target.role === "owner") return res.status(400).json({ error: "Não é possível alterar o dono" });

  await target.update({ role });

  // NOVO
  await broadcastToRoom(ctx.room, "chat:participants:updated", {
    chatUid: ctx.room.uid, profileId: target.profileId, role: target.role,
  });

  res.json(target);
}));

// DELETE /chats/:uid/participants/:profileId -> remove alguém (admin) ou sai (o próprio)
router.delete("/:uid/participants/:profileId", requireProfile, wrap(async (req, res) => {
  const ctx = await loadRoomForMember(req, res);
  if (!ctx) return;

  if (ctx.room.type !== "group") return res.status(400).json({ error: "Só é possível sair/remover em grupos" });

  const targetId = Number(req.params.profileId);
  const isSelf = targetId === req.profileId;

  if (!isSelf && !isAdmin(ctx.participant)) return res.status(403).json({ error: "Sem permissão" });

  const target = await repo.ChatParticipant.findOne({ where: { chatId: ctx.room.id, profileId: targetId } });
  if (!target) return res.status(404).json({ error: "Participante não encontrado" });
  if (target.role === "owner") return res.status(400).json({ error: "O dono não pode sair; apague o grupo ou transfira a posse" });

  await target.destroy();

  // NOVO: avisa a sala e avisa diretamente quem saiu/foi removido (pra tirar da lista dele)
  await broadcastToRoom(ctx.room, "chat:participants:removed", { chatUid: ctx.room.uid, profileId: targetId }, targetId);
  broadcastToProfile(targetId, "chat:room:removed", { uid: ctx.room.uid });

  res.status(204).end();
}));

// ---------------------------------------------------------------------------
// Mensagens
// ---------------------------------------------------------------------------

// GET /chats/:uid/messages?limit=30&before=<messageUid>
// paginação por cursor: traz as mensagens mais antigas que `before`
router.get("/:uid/messages", requireProfile, wrap(async (req, res) => {
  const ctx = await loadRoomForMember(req, res);
  if (!ctx) return;

  const limit = clampLimit(req.query.limit);
  const where = { chatId: ctx.room.id };

  if (req.query.before) {
    const cursor = await repo.ChatMessage.findOne({ where: { uid: req.query.before, chatId: ctx.room.id } });
    if (!cursor) return res.status(400).json({ error: "Cursor inválido" });
    where.createdAt = { [Op.lt]: cursor.createdAt };
  }

  // filtro opcional por mídia: ?media=image|video|audio|file|link
  const mediaFlags = { image: "hasImage", video: "hasVideo", audio: "hasAudio", file: "hasFile", link: "hasLink" };
  if (req.query.media && mediaFlags[req.query.media]) {
    where[mediaFlags[req.query.media]] = true;
  }

  const rows = await repo.ChatMessage.findAll({
    where,
    order: [["createdAt", "DESC"], ["id", "DESC"]],
    limit: limit + 1,
  });

  const hasMore = rows.length > limit;
  const messages = rows.slice(0, limit);

  res.json({
    messages,
    hasMore,
    nextCursor: hasMore ? messages[messages.length - 1].uid : null,
  });
}));

// POST /chats/:uid/messages  { text, linkFile? } -> mensagem de texto (com link opcional)
router.post("/:uid/messages", requireProfile, wrap(async (req, res) => {
  const ctx = await loadRoomForMember(req, res);
  if (!ctx) return;

  const text = String(req.body.text || "").trim();
  const linkFile = req.body.linkFile ? String(req.body.linkFile).trim() : null;

  if (!text && !linkFile) return res.status(400).json({ error: "Mensagem vazia" });
  if (text.length > MAX_TEXT) return res.status(400).json({ error: `Texto excede ${MAX_TEXT} caracteres` });

  const message = await createMessage(ctx.room, req, {
    text: text || null,
    hasLink: !!linkFile,
    linkFile,
  });

  await ctx.room.changed("updatedAt", true);
  await ctx.room.save();

  // NOVO: entrega em tempo real pra todo mundo da sala (inclusive quem enviou,
  // o front já dedupe por uid — assim funciona igual em múltiplos dispositivos)
  await broadcastToRoom(ctx.room, "chat:message", message);

  res.status(201).json(message);
}));

// POST /chats/:uid/messages/media  (multipart/form-data)
//   file: arquivo | text?: legenda | kind?: image|video|audio|file | durationMs?: number
router.post("/:uid/messages/media", requireProfile, upload.single("file"), wrap(async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "Arquivo não enviado (campo 'file')" });

  const ctx = await loadRoomForMember(req, res);
  if (!ctx) return removeFileQuietly(file);

  const kind = MEDIA_KINDS[req.body.kind] ? req.body.kind : detectMediaKind(file.mimetype);
  const rule = MEDIA_KINDS[kind];

  if (rule.mimes && !rule.mimes.includes(file.mimetype)) {
    removeFileQuietly(file);
    return res.status(415).json({ error: `Tipo ${file.mimetype} não suportado para ${kind}` });
  }
  if (file.size > rule.maxSize) {
    removeFileQuietly(file);
    return res.status(413).json({ error: `Arquivo excede o limite de ${Math.round(rule.maxSize / 1024 / 1024)}MB` });
  }

  const text = String(req.body.text || "").trim();
  if (text.length > MAX_TEXT) {
    removeFileQuietly(file);
    return res.status(400).json({ error: `Texto excede ${MAX_TEXT} caracteres` });
  }

  const durationMs = parseInt(req.body.durationMs, 10);

  const message = await createMessage(ctx.room, req, {
    text: text || null,
    [rule.flag]: true,
    filePath: path.relative(process.cwd(), file.path).replace(/\\/g, "/"),
    fileSize: file.size,
    fileMimeType: file.mimetype.slice(0, 64),
    fileDurationMs: Number.isFinite(durationMs) && (kind === "audio" || kind === "video") ? durationMs : null,
  });

  await ctx.room.changed("updatedAt", true);
  await ctx.room.save();

  // NOVO
  await broadcastToRoom(ctx.room, "chat:message", message);

  res.status(201).json(message);
}));

// GET /chats/:uid/messages/:messageUid/file -> baixa/serve a mídia (respeita participação)
router.get("/:uid/messages/:messageUid/file", requireProfile, wrap(async (req, res) => {
  const ctx = await loadRoomForMember(req, res);
  if (!ctx) return;

  const message = await repo.ChatMessage.findOne({
    where: { uid: req.params.messageUid, chatId: ctx.room.id },
  });
  if (!message || !message.filePath) return res.status(404).json({ error: "Arquivo não encontrado" });

  const abs = path.resolve(process.cwd(), message.filePath);
  // evita path traversal: o arquivo precisa estar dentro do diretório de uploads
  if (!abs.startsWith(path.resolve(UPLOAD_DIR))) return res.status(403).json({ error: "Acesso negado" });
  if (!fs.existsSync(abs)) return res.status(404).json({ error: "Arquivo removido do servidor" });

  if (message.fileMimeType) res.type(message.fileMimeType);
  res.sendFile(abs);
}));

// DELETE /chats/:uid/messages/:messageUid -> autor ou admin do chat
router.delete("/:uid/messages/:messageUid", requireProfile, wrap(async (req, res) => {
  const ctx = await loadRoomForMember(req, res);
  if (!ctx) return;

  const message = await repo.ChatMessage.findOne({
    where: { uid: req.params.messageUid, chatId: ctx.room.id },
  });
  if (!message) return res.status(404).json({ error: "Mensagem não encontrada" });

  const isAuthor = message.profileId === req.profileId;
  if (!isAuthor && !isAdmin(ctx.participant)) return res.status(403).json({ error: "Sem permissão" });

  if (message.filePath) {
    const abs = path.resolve(process.cwd(), message.filePath);
    if (abs.startsWith(path.resolve(UPLOAD_DIR))) fs.unlink(abs, () => {});
  }

  const messageUid = message.uid;
  await message.destroy();

  // NOVO
  await broadcastToRoom(ctx.room, "chat:message:deleted", { chatUid: ctx.room.uid, messageUid });

  res.status(204).end();
}));

// POST /chats/:uid/read -> marca a conversa como lida (atualiza lastReadAt)
router.post("/:uid/read", requireProfile, wrap(async (req, res) => {
  const ctx = await loadRoomForMember(req, res);
  if (!ctx) return;

  // sala global sem participação: cria o vínculo pra poder guardar o lastReadAt
  let participant = ctx.participant;
  if (!participant) {
    participant = await repo.ChatParticipant.create({ chatId: ctx.room.id, profileId: req.profileId, role: "member" });
  }

  await participant.update({ lastReadAt: new Date() });

  // NOVO: avisa os outros participantes que este profile leu até agora (recibo de leitura)
  await broadcastToRoom(ctx.room, "chat:read", {
    chatUid: ctx.room.uid,
    profileId: req.profileId,
    lastReadAt: participant.lastReadAt,
  }, req.profileId);

  res.json({ lastReadAt: participant.lastReadAt });
}));

// ---------------------------------------------------------------------------
// Tratamento de erro do multer / genérico deste router
// ---------------------------------------------------------------------------
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  console.error("[chatController]", err);
  res.status(500).json({
    error: "Erro interno",
    // SÓ PARA TESTE: mostra a causa no navegador quando CHAT_DEV_AUTH=true
    ...(process.env.CHAT_DEV_AUTH === "true" ? { detail: err.message } : {}),
  });
});

module.exports = {
  router,
  chatWs: {
    handleConnection: handleWsConnection,
    attach: attachChatWebSocket,
    broadcastToProfile,
    broadcastToRoom,
    broadcastAll,
  },
};

