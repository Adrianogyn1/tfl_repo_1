const router = require("express").Router();
const path = require("path");


router.get("", (req, res) => {
    res.sendFile(path.join(__dirname, "../paginas/helps/index.html"));
});



router.get("/sprite", (req, res) => {
  res.sendFile(path.join(__dirname, "../paginas/helps/sprite.html"));
});

const uploadsInfo = require("../paginas/helps/upload.js");
router.use("/arquivos/",uploadsInfo);


module.exports = router;