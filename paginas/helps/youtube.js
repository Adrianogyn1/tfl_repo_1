const router = require("express").Router();
const { exec } = require("child_process");
const http = require("http");
const https = require("https");
const ffmpeg = require("fluent-ffmpeg");

router.get("/youtube", HandleRequest);
router.get("/play", HandleRequest);
router.get("/video", ConvertToVideoUrl);
router.get("/audio", ConvertToAudioUrl);
router.get("/player", PlayerVideo);
router.get("/download", HandleDownload);
router.get("/thumbnail", HandleThumbnail);

function HandleThumbnail(req, res) {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send("<h1>Erro: URL do vídeo é obrigatória</h1>");
  }

  const command = `yt-dlp -j --extractor-args "youtube:player_client=android,ios" --no-warnings "${url}"`;

  exec(command, (error, stdout) => {
    if (error) {
      return res.status(500).send("<h1>Erro ao obter thumbnail</h1>");
    }

    try {
      const info = JSON.parse(stdout);
      const thumbnailUrl = info.thumbnail;

      if (!thumbnailUrl) {
        return res.status(404).send("<h1>Thumbnail não encontrada</h1>");
      }

      const rawTitle = info.title || "thumbnail";
      const safeTitle = rawTitle
        .replace(/[^a-zA-Z0-9_\-\s]/g, "")
        .trim()
        .replace(/\s+/g, "_");

      const client = thumbnailUrl.startsWith("https") ? https : http;
      client
        .get(thumbnailUrl, (streamRes) => {
          const contentType = streamRes.headers["content-type"] || "image/jpeg";
          const ext = contentType.includes("png")
            ? "png"
            : contentType.includes("webp")
              ? "webp"
              : "jpg";

          res.setHeader("Content-Type", contentType);
          res.setHeader(
            "Content-Disposition",
            `inline; filename="${safeTitle}.${ext}"`,
          );

          streamRes.pipe(res);
        })
        .on("error", () => {
          res
            .status(500)
            .send("<h1>Erro ao carregar a imagem da thumbnail</h1>");
        });
    } catch (e) {
      res.status(500).send("<h1>Erro ao processar thumbnail</h1>");
    }
  });
}

function HandleDownload(req, res) {
  const url = req.query.url;
  const format = req.query.f ?? "mp4";
  const type = req.query.type ?? "video";
  const title = req.query.title ?? "download";

  if (!url) {
    return res.status(400).json({ error: "URL da mídia é obrigatória" });
  }

  const host = req.protocol + "://" + req.get("host");
  const endpoint = type === "audio" ? "audio" : "video";
  const streamUrl = `${host}${req.baseUrl}/${endpoint}?url=${encodeURIComponent(url)}&f=${format}`;

  const safeTitle = encodeURIComponent(title.replace(/[^a-zA-Z0-9_\-]/g, "_"));

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeTitle}.${format}"`,
  );

  const client = streamUrl.startsWith("https") ? https : http;

  client
    .get(streamUrl, (streamRes) => {
      if (streamRes.headers["content-type"]) {
        res.setHeader("Content-Type", streamRes.headers["content-type"]);
      }
      streamRes.pipe(res);
    })
    .on("error", (err) => {
      if (!res.headersSent) {
        res
          .status(500)
          .json({ error: "Erro ao realizar download", details: err.message });
      }
    });
}

function PlayerVideo(req, res) {
  const url = req.query.url;
  const format = req.query.f ?? "webm";
  const quality = req.query.q ?? 1;

  if (!url) {
    return res.status(400).send("<h1>Erro: URL do vídeo é obrigatória</h1>");
  }

  const host = req.protocol + "://" + req.get("host");
  const videoStreamUrl = `${host}${req.baseUrl}/video?url=${encodeURIComponent(url)}&f=${format}&q=${quality}`;

  const mimeMap = {
    ogg: 'video/ogg; codecs="theora, vorbis"',
    webm: 'video/webm; codecs="vp8, vorbis"',
    mp4: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
    mkv: "video/x-matroska",
    flv: "video/x-flv",
  };

  const mimeType = mimeMap[format] || `video/${format}`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Player de Vídeo</title>
        <style>
            body { margin: 0; background-color: #ffffff; display: flex; justify-content: center; align-items: center; height: 100vh; }
            video { width: 100%; max-width: 900px; max-height: 100vh; outline: none; }
        </style>
    </head>
    <body>
        <h1>Player de Vídeo</h1>
        <p>URL do vídeo: ${url}</p>
        <p>Formato: ${format}</p>
        <a href="${videoStreamUrl}" download>Download</a>
        <video controls autoplay playsinline>
            <source src="${videoStreamUrl}" type='${mimeType}'>
            Seu navegador não suporta a reprodução deste formato. Tente utilizar <b>&f=webm</b> ou <b>&f=mp4</b>.
        </video>
    </body>
    </html>
    `;

  res.setHeader("Content-Type", "text/html");
  return res.send(html);
}

function ConvertToVideoUrl(req, res) {
  const url = req.query.url;

  const videoQuality = parseInt(req.query.vq ?? 6);
  const audioQuality = parseInt(req.query.aq ?? 4);
  const mp4Crf = parseInt(req.query.crf ?? 23);
  const format = (req.query.f ?? "webm").toLowerCase();

  const formatSupported = ["ogg", "webm", "mp4", "mkv", "flv"];

  if (!formatSupported.includes(format)) {
    return res.status(400).json({
      error: "Formato de saída inválido",
      formats: formatSupported,
    });
  }

  if (!url) {
    return res.status(400).json({
      error: "URL do vídeo é obrigatória",
    });
  }

  const safeVideoQuality = Math.max(0, Math.min(10, videoQuality));
  const safeAudioQuality = Math.max(0, Math.min(10, audioQuality));
  const safeMp4Crf = Math.max(0, Math.min(51, mp4Crf));

  const command = `yt-dlp -j --extractor-args "youtube:player_client=android,ios" --no-warnings "${url}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({
        error: "Erro ao extrair vídeo",
        details: stderr || error.message,
      });
    }

    try {
      const info = JSON.parse(stdout);

      const rawTitle = info.title || "video";
      const safeTitle = rawTitle
        .replace(/[^a-zA-Z0-9_\-\s]/g, "")
        .trim()
        .replace(/\s+/g, "_");

      const userAgent =
        "com.google.android.youtube/19.29.37 (Linux; U; Android 11; System) gzip";

      const validVideoFormats = info.formats.filter(
        (f) => f.vcodec && f.vcodec !== "none" && f.url,
      );
      const videoStream = validVideoFormats.sort(
        (a, b) => (b.height || 0) - (a.height || 0),
      )[0];

      if (!videoStream) {
        return res
          .status(404)
          .json({ error: "Nenhum fluxo de vídeo encontrado" });
      }

      const validAudioFormats = info.formats.filter(
        (f) => f.acodec && f.acodec !== "none" && f.url,
      );
      const audioStream = validAudioFormats.sort(
        (a, b) => (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0),
      )[0];

      const proc = ffmpeg();

      proc
        .input(videoStream.url)
        .inputOptions(["-headers", `User-Agent: ${userAgent}\r\n`]);

      const separateAudio = videoStream.acodec === "none";
      if (separateAudio) {
        if (!audioStream) {
          return res
            .status(404)
            .json({ error: "Vídeo encontrado, mas nenhum áudio disponível" });
        }
        proc
          .input(audioStream.url)
          .inputOptions(["-headers", `User-Agent: ${userAgent}\r\n`]);
      }

      const maps = ["-map 0:v:0"];
      if (separateAudio) {
        maps.push("-map 1:a:0");
      } else {
        maps.push("-map 0:a:0");
      }

      if (format === "ogg") {
        res.setHeader("Content-Type", "video/ogg");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${safeTitle}.ogv"`,
        );
        proc.outputOptions([
          ...maps,
          "-f ogv",
          "-c:v libtheora",
          "-pix_fmt yuv420p",
          `-qscale:v ${safeVideoQuality}`,
          "-c:a libvorbis",
          `-qscale:a ${safeAudioQuality}`,
        ]);
      } else if (format === "webm") {
        res.setHeader("Content-Type", "video/webm");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${safeTitle}.webm"`,
        );
        proc.outputOptions([
          ...maps,
          "-f webm",
          "-c:v libvpx",
          "-deadline realtime",
          "-cpu-used 8",
          "-crf 30",
          "-c:a libvorbis",
          `-qscale:a ${safeAudioQuality}`,
        ]);
      } else if (format === "mp4") {
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${safeTitle}.mp4"`,
        );
        proc.outputOptions([
          ...maps,
          "-f mp4",
          "-c:v libx264",
          "-preset ultrafast",
          `-crf ${safeMp4Crf}`,
          "-pix_fmt yuv420p",
          "-c:a aac",
          "-b:a 192k",
          "-movflags +frag_keyframe+empty_moov+default_base_moof",
        ]);
      } else if (format === "mkv") {
        res.setHeader("Content-Type", "video/x-matroska");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${safeTitle}.mkv"`,
        );
        proc.outputOptions([
          ...maps,
          "-f matroska",
          "-c:v libx264",
          "-preset ultrafast",
          `-crf ${safeMp4Crf}`,
          "-pix_fmt yuv420p",
          "-c:a aac",
          "-b:a 192k",
        ]);
      } else if (format === "flv") {
        res.setHeader("Content-Type", "video/x-flv");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${safeTitle}.flv"`,
        );
        proc.outputOptions([
          ...maps,
          "-f flv",
          "-c:v libx264",
          "-preset ultrafast",
          `-crf ${safeMp4Crf}`,
          "-pix_fmt yuv420p",
          "-c:a aac",
          "-b:a 128k",
        ]);
      }

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-cache");

      req.on("close", () => {
        proc.kill("SIGKILL");
      });

      proc.on("error", (err) => {
        if (!res.headersSent) {
          res.status(500).json({ error: err.message });
        }
      });

      proc.pipe(res, { end: true });
    } catch (e) {
      if (!res.headersSent) {
        res
          .status(500)
          .json({ error: "Erro no processamento", details: e.message });
      }
    }
  });
}

function ConvertToAudioUrl(req, res) {
  const url = req.query.url;
  const format = req.query.f ?? "ogg";
  const formatSupported = ["ogg", "mp3", "wav", "flac", "m4a", "webm"];
  const mimeTypes = [
    "audio/ogg",
    "audio/mpeg",
    "audio/wav",
    "audio/flac",
    "audio/m4a",
    "audio/webm",
  ];

  if (!formatSupported.includes(format)) {
    return res.status(400).json({ error: "Formato de saída inválido" });
  }
  const mimeType = mimeTypes[formatSupported.indexOf(format)];

  if (!url) {
    return res.status(400).json({ error: "URL do vídeo é obrigatória" });
  }

  const command = `yt-dlp -j --extractor-args "youtube:player_client=android,ios" --no-warnings "${url}"`;
  exec(command, (error, stdout) => {
    if (error) return res.status(500).json({ error: "Erro ao extrair áudio" });

    try {
      const info = JSON.parse(stdout);
      const audio = info.formats.find((f) => f.acodec !== "none" && f.url);
      if (!audio)
        return res.status(404).json({ error: "Áudio não encontrado" });

      res.setHeader("Content-Type", mimeType);

      let proc = ffmpeg(audio.url).format(format);

      if (format === "ogg") {
        proc.audioCodec("libvorbis");
      }

      req.on("close", () => {
        proc.kill("SIGKILL");
      });

      proc
        .on(
          "error",
          (err) =>
            !res.headersSent && res.status(500).json({ error: err.message }),
        )
        .pipe(res, { end: true });
    } catch (e) {
      res.status(500).json({ error: "Erro no processamento" });
    }
  });
}

function HandleRequest(req, res) {
  const videoUrl = req.query.url;

  if (req.query.stream === "true") {
    const targetUrl = req.query.target;
    if (!targetUrl) {
      return res.status(400).json({ error: "URL alvo ausente para streaming" });
    }
    return StreamProxy(targetUrl, req, res);
  }

  if (!videoUrl) {
    return res.status(400).json({ error: "URL do vídeo é obrigatória" });
  }

  const command = `yt-dlp -j --extractor-args "youtube:player_client=android,ios" --no-warnings "${videoUrl}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("Erro no yt-dlp:", stderr || error.message);
      return res.status(500).json({
        error: "Falha ao extrair links do vídeo",
        details: stderr || error.message,
      });
    }

    try {
      const info = JSON.parse(stdout);
      const host = req.protocol + "://" + req.get("host");

      const combined = info.formats.find(
        (f) => f.vcodec !== "none" && f.acodec !== "none" && f.url,
      );

      if (combined) {
        const proxyUrl = `${host}${req.baseUrl}/play?stream=true&target=${encodeURIComponent(combined.url)}`;
        return res.json({
          type: "single_stream",
          video: {
            quality: combined.format_note || combined.resolution,
            mimeType: combined.ext === "mp4" ? "video/mp4" : "video/webm",
            directUrl: proxyUrl,
            size: combined.filesize,
            duration: combined.duration,
            combined: combined,
          },
        });
      }

      const video = info.formats
        .reverse()
        .find(
          (f) =>
            f.vcodec !== "none" &&
            f.acodec === "none" &&
            f.ext === "mp4" &&
            f.url,
        );
      const audio = info.formats.find(
        (f) => f.vcodec === "none" && f.acodec !== "none" && f.url,
      );

      if (!video) {
        return res
          .status(404)
          .json({ error: "Nenhum formato de vídeo encontrado" });
      }

      const videoProxyUrl = `${host}${req.baseUrl}/play?stream=true&target=${encodeURIComponent(video.url)}`;
      const audioProxyUrl = audio
        ? `${host}${req.baseUrl}/play?stream=true&target=${encodeURIComponent(audio.url)}`
        : null;

      return res.json({
        type: "separate_streams",
        video: {
          quality: video.format_note || video.resolution,
          mimeType: `video/${video.ext}`,
          directUrl: videoProxyUrl,
        },
        audio: {
          mimeType: `audio/${audio ? audio.ext : "m4a"}`,
          directUrl: audioProxyUrl,
        },
      });
    } catch (e) {
      return res
        .status(500)
        .json({ error: "Erro ao processar JSON do vídeo", details: e.message });
    }
  });
}

function StreamProxy(targetUrl, req, res) {
  const client = targetUrl.startsWith("https") ? https : http;

  const headers = {
    "User-Agent":
      "com.google.android.youtube/19.29.37 (Linux; U; Android 11; System) gzip",
    Accept: "*/*",
    Connection: "keep-alive",
  };

  if (req.headers.range) {
    headers["range"] = req.headers.range;
  }

  const proxyReq = client.get(targetUrl, { headers }, (proxyRes) => {
    if (proxyRes.statusCode >= 400) {
      if (!res.headersSent) {
        return res.status(proxyRes.statusCode).json({
          error: "O YouTube recusou a requisição do stream",
          statusCode: proxyRes.statusCode,
        });
      }
    }

    res.status(proxyRes.statusCode);

    [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
    ].forEach((h) => {
      if (proxyRes.headers[h]) {
        res.setHeader(h, proxyRes.headers[h]);
      }
    });

    res.setHeader("Access-Control-Allow-Origin", "*");

    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    console.error("Erro no proxy:", err.message);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Erro ao se conectar ao stream do YouTube",
        details: err.message,
      });
    }
  });

  req.on("close", () => {
    proxyReq.destroy();
  });
}

module.exports = router;
