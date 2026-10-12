const router = require("express").Router();
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { Op } = require("sequelize");
const { createClient } = require("@supabase/supabase-js");
const repo = require("../../../repositories/repository");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKET_NAME = "tfl-bucket";
const upload = multer({ storage: multer.memoryStorage() });

router.get("/shop", GetAll);
router.get("/shop/home", GetIndex);
router.post("/shop/container", upload.any(), SaveMaterial);

function GetIndex(req, res)
{
  res.sendFile(path.join(__dirname, "../../paginas/shopUpload.html"));
}

// Auxiliar para sanitizar dicionários mantendo integridade com C#
function sanitizeDict(obj)
{
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
  const clean = {};
  for (const key in obj)
  {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== "")
    {
      clean[key] = obj[key];
    }
  }
  return clean;
}

// Auxiliar para upload Supabase
async function uploadFileToSupabase(file, modelName)
{
  if (!file) return null;
  const modelFolder = modelName
    ? modelName.replace(/[^a-zA-Z0-9_-]/g, "")
    : "default";
  const randomName = crypto.randomBytes(16).toString("hex");
  const ext = path.extname(file.originalname) || ".png";
  const filePath = `${modelFolder}/${randomName}${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) throw new Error(`Erro no upload para Supabase: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}

async function GetAll(req, res)
{
  try
  {
    const search = String(req.query.q || "");
    const linq = repo.parseQueryStringToWhere(search);
    const order = repo.parseOrderByString(search);

    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    const { count: total, rows } = await repo.ShopContainer.findAndCountAll({
      where: linq,
      order,
      limit,
      offset,
      distinct: true,
      include: [
        {
          model: repo.ShopItem,
          as: "items",
          required: false,
        },
      ],
    });

    const genderToEnum = {
      female: 0,
      male: 1,
      universal: 2,
    };

    const data = rows.map((row) =>
    {
      const container = row.toJSON();

      container.gender =
        genderToEnum[String(container.gender ?? "universal").toLowerCase()] ?? 2;

      container.thumb = container.thumb
        ? container.thumb.startsWith("http")
          ? container.thumb
          : container.thumb.replace(/\\/g, "/")
        : "";

      if (Array.isArray(container.items))
      {
        container.items = container.items.map((resItem) =>
        {
          if (typeof resItem.textures_paths === "string")
          {
            try
            {
              resItem.textures_paths = JSON.parse(resItem.textures_paths);
            }
            catch
            {
              resItem.textures_paths = {};
            }
          }
          else
          {
            resItem.textures_paths ??= {};
          }

          for (const key in resItem.textures_paths)
          {
            const path = resItem.textures_paths[key];

            if (path)
            {
              resItem.textures_paths[key] = path.startsWith("http")
                ? path
                : path.replace(/\\/g, "/");
            }
          }

          // container.gender já é o enum numérico convertido.
          resItem.gender = container.gender;

          resItem.values = sanitizeDict(resItem.values);
          resItem.colors = sanitizeDict(resItem.colors);
          resItem.ints = sanitizeDict(resItem.ints);
          resItem.bools = sanitizeDict(resItem.bools);
          resItem.strings = sanitizeDict(resItem.strings);
          resItem.vectors = sanitizeDict(resItem.vectors);

          return resItem;
        });
      }

      return container;
    });

    res.status(200).json({
      success: true,
      error: "",
      data,
      count: total,
      total,
      offset,
      limit,
      pages: Math.ceil(total / limit),
    });
  }
  catch (err)
  {
    console.error("Erro ao listar itens da loja:", err);

    res.status(500).json({
      success: false,
      error: err.message,
      data: null,
    });
  }
}
async function SaveMaterial(req, res)
{
  try
  {
    const payload = JSON.parse(req.body.payload || "{}");
    const files = req.files || [];

    const mainImageFile = files.find((f) => f.fieldname === "mainImage");
    const firstItemModel =
      payload.items && payload.items[0] ? payload.items[0].model : "default";
    const thumbUrl = await uploadFileToSupabase(mainImageFile, firstItemModel);

    const textureFilesMap = {};
    files
      .filter((f) => f.fieldname.startsWith("texture_"))
      .forEach((f) =>
      {
        textureFilesMap[f.fieldname] = f;
      });

    const createdContainer = await repo.ShopContainer.create({
      onnerId: payload.onnerId || 0,
      title: payload.title,
      price: payload.price,
      description: payload.description,
      thumb: thumbUrl || "",
      sales: 0,
      gender: payload.gender,
    });

    if (Array.isArray(payload.items))
    {
      const itemsToCreate = await Promise.all(
        payload.items.map(async (resItem, index) =>
        {
          const mappedTexturesPaths = {};

          if (resItem.textures_paths)
          {
            for (const key in resItem.textures_paths)
            {
              const fieldKey = `texture_${index}_${key}`;
              const fileObj = textureFilesMap[fieldKey];

              if (fileObj)
              {
                mappedTexturesPaths[key] = await uploadFileToSupabase(
                  fileObj,
                  resItem.model,
                );
              }
            }
          }

          return {
            containerId: createdContainer.id,
            model: resItem.model,
            slot: resItem.slot,
            shader: resItem.shader,
            values: resItem.values || {},
            colors: resItem.colors || {},
            ints: resItem.ints || {},
            bools: resItem.bools || {},
            strings: resItem.strings || {},
            vectors: resItem.vectors || {},
            textures_paths: mappedTexturesPaths,
          };
        }),
      );

      await repo.ShopItem.bulkCreate(itemsToCreate);
    }

    const fullCreated = await repo.ShopContainer.findByPk(createdContainer.id, {
      include: [{ model: repo.ShopItem, as: "items" }],
    });

    res.status(201).json({
      success: true,
      error: "",
      data: fullCreated,
    });
  } catch (err)
  {
    res.status(500).json({
      success: false,
      error: err.message,
      data: null,
    });
  }
}

module.exports = {
  router,
  GetAll,
  SaveMaterial,
};
