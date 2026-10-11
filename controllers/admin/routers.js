const router = require("express").Router();
const path = require("path");
const sequelizeErd = require("sequelize-erd");
const db = require("../../repository");

router.use("/db", async (req, res) => {
  try {
    const svg = await sequelizeErd({
      source: db.sequelize,
      direction: "LR",
    });

    const html = '<html>' +
      '<head>' +
      '<style>' +
      'body { margin: 0; background: #1a202c; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }' +
      '.container { width: 100%; height: 100%; cursor: grab; display: flex; justify-content: center; align-items: center; }' +
      '.container:active { cursor: grabbing; }' +
      'svg { width: 100%; height: 100%; transform-origin: center; }' +
      '</style>' +
      '</head>' +
      '<body>' +
      '<div class="container" id="zoomContainer">' +
      svg +
      '</div>' +
      '<script>' +
      'const container = document.getElementById("zoomContainer");' +
      'const svgEl = container.querySelector("svg");' +
      'let scale = 1, panning = false, pointX = 0, pointY = 0, startX = 0, startY = 0;' +
      'container.addEventListener("mousedown", function(e) {' +
      '  panning = true;' +
      '  startX = e.clientX - pointX;' +
      '  startY = e.clientY - pointY;' +
      '});' +
      'window.addEventListener("mouseup", function() { panning = false; });' +
      'container.addEventListener("mousemove", function(e) {' +
      '  if (!panning) return;' +
      '  pointX = e.clientX - startX;' +
      '  pointY = e.clientY - startY;' +
      '  svgEl.style.transform = "translate(" + pointX + "px, " + pointY + "px) scale(" + scale + ")";' +
      '});' +
      'container.addEventListener("wheel", function(e) {' +
      '  e.preventDefault();' +
      '  var xs = (e.clientX - pointX) / scale, ys = (e.clientY - pointY) / scale;' +
      '  scale = e.deltaY < 0 ? scale * 1.1 : scale / 1.1;' +
      '  pointX = e.clientX - xs * scale;' +
      '  pointY = e.clientY - ys * scale;' +
      '  svgEl.style.transform = "translate(" + pointX + "px, " + pointY + "px) scale(" + scale + ")";' +
      '});' +
      '</script>' +
      '</body>' +
      '</html>';

    res.send(html);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.use("/prefab", async (req, res) => {
    res.sendFile(path.join(__dirname, "../../paginas/admin/prefab.html"));
});
router.get('/assas', async (req, res) =>
{
    res.sendFile(path.join(__dirname, "../../paginas/admin/assas.html"));
});


router.use("/users", async (req, res) => {
    res.sendFile(path.join(__dirname, "../../paginas/admin/users.html"));
});
router.use("/arquivos", async (req, res) => {
  res.sendFile(path.join(__dirname, "../../paginas/admin/upload.html"));
});
const controllerFiles = require("./files_controller");
router.use("/filemanager", controllerFiles.router);

//const {helps} = require("../../routers/routes.js");
//router.use("/",helps);


module.exports = {
    router
};
