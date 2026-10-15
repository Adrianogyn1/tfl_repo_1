const express = require("express");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { WebSocketServer } = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const { settings } = require("cluster");
const { Op } = require("sequelize");
require("dotenv").config();
const cors = require('cors');
const { spawn } = require("child_process");



const chatModule = require("./src/controllers/social/chat.js")
//require("./controllers/social/chat.js");
const routes = require("./src/routes/router.js");
//require("./router.js");
const repo = require("./src/repositories/repository.js");
//require("./repository.js");
const appHandlers = require("./src/controllers/appHandlers.js");
//require("./controllers/appHandlers.js");
//game


const Settings = {
  PORT: process.env.PORT || 5000,
  WSS_PORT: process.env.WSS_PORT || process.env.PORT || 5000,
  UPLOAD_DIR: path.join(__dirname, "./public/uploads"),
  PUBLIC_DIR: path.join(__dirname, "./public"),
};

if (!fs.existsSync(Settings.UPLOAD_DIR)) fs.mkdirSync(Settings.UPLOAD_DIR);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use("/files", express.static(Settings.UPLOAD_DIR));
app.use("/static", express.static(Settings.PUBLIC_DIR));

//app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use(session({
  secret: 'sua_chave_secreta_aqui',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // true apenas se usar HTTPS
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './src/views'));
//middlewares
app.use(require("./src/middlewares/i18n.js"));
app.use(routes);

const server = http.createServer(app);




const Cassino_Controller = require('./src/controllers/game/cassino/tables/master'); // require("../controllers/game/cassino/tables/master.js");
app.use("/cassino", Cassino_Controller.router);

const socketHub = require("./src/sockets/SoketHub").attachSocketIO;
socketHub(server);

console.log("✅ controllers carregado com sucesso");

server.listen(Settings.PORT, "0.0.0.0", () =>
  console.log(`🚀 Servidor rodando em http://localhost:${Settings.PORT}`),
);

// Encerramento gracioso de conexões para nodemon e sinais de sistema
function gracefulShutdown(signal, killPid = false) {
  server.close(async () => {
    try {
      if (repo && repo.sequelize) {
        await repo.sequelize.close();
      }
    } catch (_) {}
    if (killPid) {
      process.kill(process.pid, signal);
    } else {
      process.exit(0);
    }
  });
}

process.once("SIGUSR2", () => gracefulShutdown("SIGUSR2", true));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
