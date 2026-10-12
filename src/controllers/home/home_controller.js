const router = require("express").Router();
require("dotenv").config();



router.get("/info", async (req, res) =>
{
  const images = {
    './static/images/galery/1.png': { active: true },
    "./static/images/galey/2.png": { active: true },
    "./static/images/galery/3.png": { active: true },
     "./static/images/galery/4.png": { active: true },
  };
  const files = {
    android: { url: process.env.ANDROID_DOWNLOAD || "", active: true },
    ios: { url: process.env.IOS_DOWNLOAD || "", active: false },
    windows: { url: process.env.WINDOWS_DOWNLOAD || "", active: true },
    linux: { url: process.env.LINUX_DOWNLOAD || "", active: true },
  };
   const { GerarQrCode } = require('../api/bank_controller.js')

  // return res.json({ "status": "ok",payload: qrCodePix.payload(), image: await qrCodePix.base64() });
  const data = await GerarQrCode('donate');
  const pix = {
    payload: data.payload, image: data.encodedImage
  };

  const info = {
    images,
    files,
    pix
  };
  res.json(info);
});


module.exports = {
    router,
};