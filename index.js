const express = require("express");
const { WebSocketServer } = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const chatModule = require("./controllers/chat.js");
const routes = require("./router.js");
const repo = require("./repository.js");
const { settings } = require("cluster");
const { Op } = require("sequelize");
require("dotenv").config();
const appHandlers = require("./controllers/appHandlers.js");
//game
const routeGameController = require("./controllers/game/routers.js");

const Settings = {
  PORT: process.env.PORT || 5000,
  UPLOAD_DIR: path.join(__dirname, "./uploads"),
  PUBLIC_DIR: path.join(__dirname, "./paginas/public"),
};

if (!fs.existsSync(Settings.UPLOAD_DIR)) fs.mkdirSync(Settings.UPLOAD_DIR);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use("/files", express.static(Settings.UPLOAD_DIR));
app.use("/static", express.static(Settings.PUBLIC_DIR));
//app.use(express.json({ limit: '10mb' }));

// Transformada em async para esperar a resposta do banco de dados
global.CheckLogin = async function (req, res) {
  // 1. Captura o token de todas as origens possíveis (Headers, Query String ou Body)
  let token = req.userToken;
  // 3. Executa a busca usando findOne do Sequelize
  const user = await repo.User.findOne({ where: { token: token } });
  if (!user) {
    console.log(`[Auth Falhou] Token recebido: "${token}"`);
    // Se nem o usuário de teste existir, bloqueia a requisição
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  req.userId = user.id;
  return true;
};

// Middleware de autenticação adaptado para o Sequelize (async/await)
app.use(async (req, res, next) => {
  req.userToken = req.headers["tfl-token"] || req.headers["token"] || "";

  // Procura o usuário de forma estrita no banco de dados
  const user = await repo.User.findOne({ where: { token: req.userToken } });

  if (user) {
    req.userId = user.id;
    console.log(
      `Usuário Autenticado -> ID: ${req.userId} | Token: ${req.userToken}`,
    );
  } else {
    console.log(
      `⚠️ Token Inválido ou Ausente recebido  Token: "${req.userToken}"`,
    );
  }

  next();
});

// Compartilha referências dinâmicas das funções de rede com o roteador
app.set("clients", () => clients);
app.set("broadcast", () => broadcast);
app.set("sendPacketToUser", () => sendPacketToUser);

app.use(routes);
app.use(routeGameController);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const clients = new Set();
chatModule.setWss(wss);
// Evento de conexão adaptado com async para realizar a busca no Sequelize
wss.on("connection", async (ws, req) => {
  // 1. Tenta pegar dos cabeçalhos HTTP normais
  let tk = req.headers["tfl-token"] || req.headers["token"];

  // 2. Se não achar nos cabeçalhos, extrai da Query String da URL de forma segura
  if (!tk && req.url) {
    try {
      // Constrói uma URL válida para o parser, usando o host ou localhost como fallback
      const baseUrl = `http://${req.headers.host || "localhost"}`;
      const parsedUrl = new URL(req.url, baseUrl);
      tk =
        parsedUrl.searchParams.get("token") ||
        parsedUrl.searchParams.get("tfl-token");
    } catch (e) {
      console.error("Erro ao processar parâmetros da URL do WebSocket:", e);
    }
  }

  // Garante que se tudo falhar, vire uma string vazia
  tk = tk || "";
  if (tk == "app_open") {
    appHandlers.setApp(ws);
    console.log("📡 Conexão Estabelecida: App Open");
    return;
  }

  // Busca o usuário no banco usando findOne do Sequelize
  const user = await repo.User.findOne({ where: { token: tk } });

  if (!user) {
    console.log(
      `⚠️ Conexão Recusada: Token "${tk}" inválido ou não encontrado no banco.`,
    );
    ws.close(4001, "Unauthorized");
    return;
  }

  ws.userId = user.id;
  clients.add(ws);
  console.log(`📡 Conexão Estabelecida: ID ${user.id} | Token: ${tk}`);

  ws.on("message", (message) => {
    try {
      const payload = message.toString("utf-8");
      console.log("Message:", payload);

      const packet = JSON.parse(payload);
      console.log(`📡 Recebendo pacote: ${packet.Event}`);

      if (packet.Event.includes("chat"))
        chatModule.route(ws, packet.Event, packet.Data, wss);
      else if (packet.Event.includes("room"))
        appHandlers.route(ws, packet.Event, packet.Data, wss);
      else console.log(`Rota nao encontrada para o evento: ${packet.Event}`);
    } catch (err) {
      console.error("Erro ao analisar pacote:", err);
    }
  });
  ws.on("close", () => clients.delete(ws));
});

function sendPacketToUser(userId, eventName, data) {
  for (let client of clients) {
    if (client.userId === userId) {
      sendPacket(client, eventName, data);
      break;
    }
  }
}

function sendPacket(ws, eventName, data) {
  console.log(`📡 Enviando pacote: ${eventName}`);
  if (ws.readyState === ws.OPEN) {
    const packet = {
      Event: eventName,
      Data: typeof data === "string" ? data : JSON.stringify(data),
    };
    ws.send(JSON.stringify(packet));
  }
}

function broadcast(eventName, data) {
  clients.forEach((client) => sendPacket(client, eventName, data));
}
const api = require("./controllers/game/Api.js");
app.get("/game", api.API);
server.listen(Settings.PORT, () =>
  console.log(`🚀 Servidor rodando em http://localhost:${Settings.PORT}`),
);

app.get("/online", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/helps", (req, res) => {
  res.sendFile(path.join(__dirname, "/paginas/helps/index.html"));
});
app.get("/helps/sprite", (req, res) => {
  res.sendFile(path.join(__dirname, "paginas/helps/sprite.html"));
});
//youtube
const youtubeRouter = require("./paginas/helps/youtube.js");
app.use(youtubeRouter);

//Inicia o instanciador
const { spawn } = require("child_process");
const appOpen = path.resolve("AppOpen/app.js");
spawn("node", [appOpen]);

//remover<-
//require('./controllers/placeHolder.js');
