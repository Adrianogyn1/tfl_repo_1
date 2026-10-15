const router = require("express").Router();

const authController = require('./../controllers/auth.js'); //require("../../controllers/auth");
const socialController = require("../controllers/social/router_controller.js");
const homeController = require("../controllers/home/home_controller.js");
const { getCurrentVersion, getCurrentVersionInfo, getAllReleases } = require("../services/version.service.js");
const api = require("../api/index.js");

router.use("/api", api);

router.get("/api/version", (req, res) => {
  return res.json({
    success: true,
    version: getCurrentVersion(),
    ...getCurrentVersionInfo()
  });
});

router.get("/api/changelog", (req, res) => {
  return res.json({
    success: true,
    current: getCurrentVersionInfo(),
    history: getAllReleases()
  });
});

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const { uploadMedia } = require("../services/storage.service");
const feedbackService = require("../services/feedback.service.js");

// Endpoints de Envio de Feedback (Contato, Bug, Sugestão) com persistência no banco
router.post("/api/feedback/contact", async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";
    const userId = req.session?.user?.id || req.user?.id || null;

    const record = await feedbackService.createContactMessage({
      name: req.body?.name,
      email: req.body?.email,
      subject: req.body?.subject,
      message: req.body?.message,
      ip,
      userAgent,
      userId,
    });

    return res.json({
      success: true,
      message: (req.translate ? req.translate("feedback.api.contactSuccess", {}, "Mensagem enviada com sucesso! Entraremos em contato em breve.") : "Mensagem enviada com sucesso! Entraremos em contato em breve."),
      id: record.id,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || (req.translate ? req.translate("feedback.api.contactError", {}, "Erro ao registrar mensagem de contato.") : "Erro ao registrar mensagem de contato."),
    });
  }
});

router.post("/api/feedback/bug", upload.single("screenshot"), async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";
    const userId = req.session?.user?.id || req.user?.id || null;

    let screenshotUrl = req.body?.screenshotUrl || "";
    if (req.file) {
      try {
        const uploadResult = await uploadMedia(req.file, "bugs");
        screenshotUrl = uploadResult.url || "";
      } catch (uploadErr) {
        console.warn("⚠️ Aviso ao salvar print do bug:", uploadErr.message);
      }
    }

    const record = await feedbackService.createBugReport({
      title: req.body?.title,
      category: req.body?.category,
      severity: req.body?.severity,
      description: req.body?.description,
      stepsToReproduce: req.body?.stepsToReproduce,
      expectedBehavior: req.body?.expectedBehavior,
      screenshotUrl,
      email: req.body?.email,
      ip,
      userAgent,
      userId,
    });

    return res.json({
      success: true,
      message: (req.translate ? req.translate("feedback.api.bugSuccess", {}, "Relatório de bug registrado com sucesso! Obrigado por ajudar a aprimorar o TFL.") : "Relatório de bug registrado com sucesso! Obrigado por ajudar a aprimorar o TFL."),
      id: record.id,
      screenshotUrl: record.screenshotUrl,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || (req.translate ? req.translate("feedback.api.bugError", {}, "Erro ao registrar relatório de bug.") : "Erro ao registrar relatório de bug."),
    });
  }
});

router.post("/api/feedback/suggestion", async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";
    const userId = req.session?.user?.id || req.user?.id || null;

    const record = await feedbackService.createUserSuggestion({
      title: req.body?.title,
      category: req.body?.category,
      description: req.body?.description,
      expectedBenefit: req.body?.expectedBenefit,
      email: req.body?.email,
      ip,
      userAgent,
      userId,
    });

    return res.json({
      success: true,
      message: (req.translate ? req.translate("feedback.api.suggestionSuccess", {}, "Sugestão recebida com sucesso! Sua ideia será analisada pela equipe.") : "Sugestão recebida com sucesso! Sua ideia será analisada pela equipe."),
      id: record.id,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || (req.translate ? req.translate("feedback.api.suggestionError", {}, "Erro ao registrar sugestão.") : "Erro ao registrar sugestão."),
    });
  }
});

// Painel de Votação da Comunidade para Sugestões
router.get("/api/feedback/suggestions", async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
    const userId = req.session?.user?.id || req.user?.id || null;
    const sort = req.query?.sort === "recent" ? "recent" : "votes";
    const category = req.query?.category || "all";

    const suggestions = await feedbackService.listCommunitySuggestions({
      sort,
      category,
      userId,
      ip,
    });

    return res.json({
      success: true,
      suggestions,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Erro ao carregar painel de sugestões.",
    });
  }
});

router.post("/api/feedback/suggestions/:id/vote", async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
    const userId = req.session?.user?.id || req.user?.id || null;

    const result = await feedbackService.toggleSuggestionVote({
      suggestionId: req.params.id,
      userId,
      ip,
    });

    return res.json({
      success: true,
      ...result,
      message: result.hasVoted
        ? (req.translate ? req.translate("feedback.voting.votedSuccess", {}, "Voto computado! Obrigado por apoiar esta ideia.") : "Voto computado! Obrigado por apoiar esta ideia.")
        : (req.translate ? req.translate("feedback.voting.unvotedSuccess", {}, "Voto removido.") : "Voto removido."),
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Erro ao processar voto.",
    });
  }
});

router.use("/api/home", homeController.router);
//Auth
router.use("/api/auth", authController.router);
//Social
router.use("/api", socialController.router);
const apiController = require("../api/v1/old/api_controller.js");
router.use("/api/", apiController.router);
const routeGameController = require("../controllers/game/routers.js");
router.use("/api/", routeGameController.router);
const manifestController = require("../api/v1/old/manifest_controller.js");
router.use("/api/manifest", manifestController.router);


module.exports = router;