const path = require("path");
// Aponta para o .env localizado na raiz do projeto
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const fs = require("fs");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const repo = require("../../../repository");

// 1. Configuração do Supabase via process.env
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não foram definidos no .env",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const BUCKET_NAME = "tfl-bucket";

// Mapeamento simples de extensões para MimeType
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".tga":
      return "image/x-tga";
    default:
      return "application/octet-stream";
  }
}

// 2. Função de Upload por arquivo
async function uploadToSupabase(localPath, modelName) {
  if (!fs.existsSync(localPath)) {
    console.warn(`[AVISO] Arquivo não encontrado no disco: ${localPath}`);
    return null;
  }

  const fileBuffer = fs.readFileSync(localPath);
  const modelFolder = modelName
    ? modelName.replace(/[^a-zA-Z0-9_-]/g, "")
    : "default";
  const randomName = crypto.randomBytes(16).toString("hex");
  const ext = path.extname(localPath) || ".png";
  const destinationPath = `${modelFolder}/${randomName}${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(destinationPath, fileBuffer, {
      contentType: getMimeType(localPath),
      upsert: true,
    });

  if (error) {
    throw new Error(`Erro no upload: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(destinationPath);

  return data.publicUrl;
}

// 3. Processamento em Paginação
async function startReupload() {
  const BATCH_SIZE = 50;
  let offset = 0;
  let totalProcessed = 0;

  console.log("--- Iniciando processo de migração ---");

  while (true) {
    const containers = await repo.ShopContainer.findAll({
      limit: BATCH_SIZE,
      offset: offset,
      include: [{ model: repo.ItemResource, as: "items" }],
      order: [["id", "ASC"]],
    });

    if (containers.length === 0) {
      console.log("--- Migração concluída com sucesso! ---");
      break;
    }

    console.log(
      `\nProcessando lote de ${containers.length} registros (Offset: ${offset})...`,
    );

    for (const container of containers) {
      try {
        if (container.thumb && !container.thumb.startsWith("http")) {
          const fullPath = path.join(
            __dirname,
            "../../uploads/shop",
            container.thumb,
          );
          const newUrl = await uploadToSupabase(fullPath, "thumbs");
          if (newUrl) {
            await container.update({ thumb: newUrl });
          }
        }

        if (Array.isArray(container.items)) {
          for (const item of container.items) {
            let updated = false;
            const textures = { ...(item.textures_paths || {}) };

            for (const key in textures) {
              const currentPath = textures[key];
              if (currentPath && !currentPath.startsWith("http")) {
                const fullPath = path.join(
                  __dirname,
                  "../../uploads/shop",
                  currentPath,
                );
                const newUrl = await uploadToSupabase(fullPath, item.model);
                if (newUrl) {
                  textures[key] = newUrl;
                  updated = true;
                }
              }
            }

            if (updated) {
              await item.update({ textures_paths: textures });
            }
          }
        }

        totalProcessed++;
        console.log(`[OK] Container ID ${container.id} migrado.`);
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (err) {
        console.error(
          `[ERRO] Falha no Container ID ${container.id}:`,
          err.message,
        );
      }
    }

    offset += BATCH_SIZE;
  }

  process.exit(0);
}

startReupload();
