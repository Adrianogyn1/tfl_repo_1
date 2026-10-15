const express = require("express");
const router = express.Router();
const path = require("path");
require("dotenv").config();
const { repo } = require("../repositories/repository.js");
const webSite = (process.env.SERVER_URL || "localhost:5000").endsWith("/") ? process.env.SERVER_URL : `${process.env.SERVER_URL}/`;
const t = require("../locales/i18n");
const { recordSiteVisit } = require("../services/stats.service");
const { getCurrentVersion, getCurrentVersionInfo, getAllReleases } = require("../services/version.service.js");
const adminRouter = require('./admin.router.js');
const apiRouters = require('./api.routers.js');
const userRouter = require('./user.router.js');

// Beacon JS para enriquecer estatísticas de visita e região (fuso horário / idioma do navegador)
router.post("/api/visit-beacon", (req, res) => {
  recordSiteVisit(req, {
    path: req.body?.path || "/",
    timezone: req.body?.timezone || "",
    language: req.body?.language || "",
    region: req.body?.region || "",
  });
  return res.json({ success: true });
});

// Rotas de SEO e Rastreamento Orgânico (robots.txt e sitemap.xml)
router.get("/robots.txt", (req, res) => {
  const host = req.get("host") || "thefantasylife.com";
  const protocol = req.protocol || "https";
  const robotsTxt = [
    "User-agent: *",
    "Allow: /",
    "Allow: /tutorial",
    "Allow: /changelog",
    "Allow: /contact",
    "Allow: /report-bug",
    "Allow: /suggestions",
    "Disallow: /admin/",
    "Disallow: /api/v1/",
    "Disallow: /webhook/",
    "Disallow: /asaas/",
    "Disallow: /assas/",
    "",
    `Sitemap: ${protocol}://${host}/sitemap.xml`
  ].join("\n");
  res.type("text/plain");
  return res.send(robotsTxt);
});

router.get("/sitemap.xml", (req, res) => {
  const host = req.get("host") || "thefantasylife.com";
  const protocol = req.protocol || "https";
  const baseUrl = `${protocol}://${host}`;
  const now = new Date().toISOString().split("T")[0];

  const urls = [
    { loc: `${baseUrl}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${baseUrl}/tutorial`, priority: "0.8", changefreq: "weekly" },
    { loc: `${baseUrl}/changelog`, priority: "0.8", changefreq: "daily" },
    { loc: `${baseUrl}/contact`, priority: "0.7", changefreq: "monthly" },
    { loc: `${baseUrl}/report-bug`, priority: "0.7", changefreq: "monthly" },
    { loc: `${baseUrl}/suggestions`, priority: "0.8", changefreq: "daily" },
    { loc: `${baseUrl}/profile/login`, priority: "0.6", changefreq: "monthly" },
    { loc: `${baseUrl}/profile/register`, priority: "0.6", changefreq: "monthly" }
  ];

  const sitemapXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`),
    '</urlset>'
  ].join("\n");

  res.type("application/xml");
  return res.send(sitemapXml);
});

router.get("/", (req, res) => {
  recordSiteVisit(req, { path: "/" });
  res.render('home', {
    title: req.translate('home.seoTitle', {}, 'The Fantasy Life | Mundo Virtual 3D, Rede Social & Avatares'),
    t: req.translate,
    currentPath: '/',
    version: getCurrentVersion(),
    versionInfo: getCurrentVersionInfo(),
    changelog: getAllReleases()
  });
});
router.get("/tutorial", (req, res) => {
  recordSiteVisit(req, { path: "/tutorial" });
  res.render('tutorial', {
    title: req.translate('tutorial.title', {}, 'The Fantasy Life | Guia & Tutorial Oficial'),
    t: req.translate,
    currentPath: '/tutorial'
  });
});

// Central de Contato, Reportar Bugs e Sugestões (Nomes canônicos em inglês com aliases para compatibilidade)
router.get(["/contact", "/contato", "/contatos", "/fale-conosco"], (req, res) => {
  recordSiteVisit(req, { path: "/contact" });
  res.render('feedback/index', {
    title: req.translate('feedback.contact.pageTitle', {}, 'The Fantasy Life | Contato & Atendimento'),
    t: req.translate,
    currentPath: '/contact',
    activeTab: 'contact',
    version: getCurrentVersion(),
  });
});

router.get(["/report-bug", "/bug-report", "/reportar-bug", "/bugs", "/bug"], (req, res) => {
  recordSiteVisit(req, { path: "/report-bug" });
  res.render('feedback/index', {
    title: req.translate('feedback.bug.pageTitle', {}, 'The Fantasy Life | Reportar um Problema ou Bug'),
    t: req.translate,
    currentPath: '/report-bug',
    activeTab: 'bug',
    version: getCurrentVersion(),
  });
});

router.get(["/suggestions", "/feedback", "/sugestoes", "/sugestao"], (req, res) => {
  recordSiteVisit(req, { path: "/suggestions" });
  res.render('feedback/index', {
    title: req.translate('feedback.suggestion.pageTitle', {}, 'The Fantasy Life | Sugestões & Votação da Comunidade'),
    t: req.translate,
    currentPath: '/suggestions',
    activeTab: 'suggestion',
    version: getCurrentVersion(),
  });
});

// Página dedicada para notas de versão (sem poluir a Home)
router.get(["/changelog", "/versoes", "/notas-de-versao"], (req, res) => {
  recordSiteVisit(req, { path: "/changelog" });
  res.render('changelog', {
    title: req.translate('changelog.pageTitle', {}, 'The Fantasy Life | Notas de Atualização do Sistema'),
    t: req.translate,
    currentPath: '/changelog',
    version: getCurrentVersion(),
    versionInfo: getCurrentVersionInfo(),
    changelog: getAllReleases(),
  });
});

router.all(["/locale", "/locale/:lang", "/profile/locale", "/api/locale"], (req, res) => {
  const raw = req.body?.lang || req.query?.lang || req.params?.lang || 'pt-BR';
  const lang = t.normalizeLocale(raw);
  res.cookie('lang', lang, { maxAge: 365 * 24 * 60 * 60 * 1000, path: '/' });
  if (req.xhr || req.headers?.accept?.includes('application/json') || req.method === 'POST') {
    return res.json({ success: true, lang });
  }
  return res.redirect(req.get('Referer') || '/');
});
router.use("/register", (req, res) => {
    res.redirect("/profile/register");
});
router.use("/login", (req, res) => {
    res.redirect("/profile/login");
});
router.use("/forgot-password", (req, res) => {
    res.redirect("/profile/forgot");
});

//nova api
router.use(apiRouters);
router.use("/admin",adminRouter);
router.use(["/profile", '/home'],userRouter);



//slots
const slotsController = require('../controllers/game/cassino/slots/slots_controller.js'); // require("../../controllers/game/cassino/slots/slots_controller.js");
router.use("/slot", slotsController.router);
//webhook
const webhookController = require("../api/v1/old/api_webhock.js");
router.use("/webhook", webhookController.router);
//asas
const asasController = require("../api/v1/old/bank_controller.js");
router.use(["/asaas", "/assas"], asasController.router);
//youtube
const youtubeRouter = require('../controllers/youtube.js'); //require("../../paginas/helps/youtube.js");
router.use(youtubeRouter);

//error 404
router.use((req,res)=>
{
  res.sendFile(path.join(__dirname, "../views/errors/404.html"));
});

//error 500
router.use((err, req, res, next) => {
  console.error(err.stack); // Bom para debug no console
  res.status(500).sendFile(path.join(__dirname, "../views/errors/500.html"));
});



module.exports = router;
