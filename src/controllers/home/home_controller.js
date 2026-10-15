const router = require("express").Router();
require("dotenv").config();
const { getDownloadsInfo } = require("../../services/download.service.js");
const { getCurrentVersion, getCurrentVersionInfo, getAllReleases } = require("../../services/version.service.js");

router.get("/info", async (req, res) => {
  const images = {
    './static/images/galery/1.png': { active: true },
    "./static/images/galey/2.png": { active: true },
    "./static/images/galery/3.png": { active: true },
    "./static/images/galery/4.png": { active: true },
  };

  // Coleta dados dinâmicos da pasta de downloads
  const dynamicDownloads = getDownloadsInfo();

  const files = {
    android: {
      url: process.env.ANDROID_DOWNLOAD || dynamicDownloads.android?.url || "/downloads/android/latest/TheFantasyLife.apk",
      active: true,
      version: dynamicDownloads.android?.version || "1.0.0"
    },
    ios: {
      url: process.env.IOS_DOWNLOAD || dynamicDownloads.ios?.url || "",
      active: false,
      version: dynamicDownloads.ios?.version || "1.0.0"
    },
    windows: {
      url: process.env.WINDOWS_DOWNLOAD || dynamicDownloads.windows?.url || "/downloads/windows/latest/TheFantasyLife-Setup.exe",
      active: true,
      version: dynamicDownloads.windows?.version || "1.0.0"
    },
    linux: {
      url: process.env.LINUX_DOWNLOAD || dynamicDownloads.linux?.url || "/downloads/linux/latest/TheFantasyLife.AppImage",
      active: true,
      version: dynamicDownloads.linux?.version || "1.0.0"
    },
  };

  let pix = { payload: "", image: "" };
  try {
    const { GerarQrCode } = require('../api/bank_controller.js');
    const data = await GerarQrCode('donate');
    if (data) {
      pix = { payload: data.payload, image: data.encodedImage };
    }
  } catch (e) {
    // Silencioso se bank controller não estiver pronto
  }

  const info = {
    images,
    files,
    pix,
    version: getCurrentVersion(),
    versionInfo: getCurrentVersionInfo()
  };
  res.json(info);
});

router.get("/changelog", (req, res) => {
  return res.json({
    success: true,
    current: getCurrentVersionInfo(),
    history: getAllReleases()
  });
});

module.exports = {
  router,
};