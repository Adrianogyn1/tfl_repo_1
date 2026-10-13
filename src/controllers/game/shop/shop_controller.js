const router = require("express").Router();
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { Op } = require("sequelize");
const { createClient } = require("@supabase/supabase-js");
const repo = require("../../../repositories/repository");
const {
  ensureShopSchemaAndSeed,
  buyShopItem,
  getAvatarWardrobe,
} = require("../../../services/shop3d.service");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

const BUCKET_NAME = "tfl-bucket";
const upload = multer({ storage: multer.memoryStorage() });

// Mapeamentos bidirecionais entre C# (Godot phone_menus) e Banco/Web
const GENDER_TO_ENUM = {
  female: 0,
  0: 0,
  male: 1,
  1: 1,
  universal: 2,
  2: 2,
};

const GENDER_TO_DB = {
  0: "Female",
  female: "Female",
  1: "Male",
  male: "Male",
  2: "Universal",
  universal: "Universal",
};

// C# ClothingSlotType: UpperBody=0, LowerBody=1, FullBody=2, Hair=3, Shoes=4, Eyes=5, EyeBrow=6, EyeLash=7, Skin=8, None=9
const SLOT_TO_GODOT_ENUM = {
  top: 0,
  upperbody: 0,
  0: 0,
  bottom: 1,
  lowerbody: 1,
  1: 1,
  fullbody: 2,
  2: 2,
  hair: 3,
  3: 3,
  shoes: 4,
  4: 4,
  eyes: 5,
  5: 5,
  eyebrow: 6,
  6: 6,
  eyelash: 7,
  7: 7,
  skin: 8,
  8: 8,
  head: 3,
  accessory: 0,
  animation: 9,
  none: 9,
  9: 9,
};

const SLOT_TO_WEB_KEY = {
  0: "top",
  upperbody: "top",
  top: "top",
  1: "bottom",
  lowerbody: "bottom",
  bottom: "bottom",
  2: "fullbody",
  fullbody: "fullbody",
  3: "hair",
  hair: "hair",
  4: "shoes",
  shoes: "shoes",
  5: "eyes",
  eyes: "eyes",
  6: "eyes",
  eyebrow: "eyes",
  7: "eyes",
  eyelash: "eyes",
  8: "skin",
  skin: "skin",
  head: "head",
  accessory: "accessory",
  animation: "animation",
};

function normalizeDbGender(val) {
  if (val === undefined || val === null) return "Universal";
  return GENDER_TO_DB[String(val).toLowerCase()] || "Universal";
}

function normalizeWebSlot(val) {
  if (val === undefined || val === null) return "top";
  return SLOT_TO_WEB_KEY[String(val).toLowerCase()] || "top";
}

function normalizeGodotSlotEnum(val) {
  if (val === undefined || val === null) return 0;
  const key = String(val).toLowerCase();
  return SLOT_TO_GODOT_ENUM[key] !== undefined ? SLOT_TO_GODOT_ENUM[key] : 0;
}

// Auxiliar para sanitizar dicionários mantendo integridade com C#
function sanitizeDict(obj) {
  let parsed = obj;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return {};
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  const clean = {};
  for (const key in parsed) {
    if (parsed[key] !== null && parsed[key] !== undefined && parsed[key] !== "") {
      clean[key] = parsed[key];
    }
  }
  return clean;
}

function formatContainerForGodot(row) {
  if (!row) return null;
  const container = typeof row.toJSON === "function" ? row.toJSON() : { ...row };

  container.gender =
    GENDER_TO_ENUM[String(container.gender ?? "universal").toLowerCase()] ?? 2;

  container.thumb = container.thumb
    ? container.thumb.startsWith("http") || container.thumb.startsWith("/")
      ? container.thumb
      : container.thumb.replace(/\\/g, "/")
    : "";

  if (Array.isArray(container.items)) {
    container.items = container.items.map((resItem) => {
      resItem.textures_paths = sanitizeDict(resItem.textures_paths);
      for (const key in resItem.textures_paths) {
        const p = resItem.textures_paths[key];
        if (p && typeof p === "string") {
          resItem.textures_paths[key] = p.startsWith("http")
            ? p
            : p.replace(/\\/g, "/");
        }
      }

      resItem.gender = container.gender;
      resItem.slot = normalizeGodotSlotEnum(resItem.slot ?? container.slot);
      resItem.values = sanitizeDict(resItem.values);
      resItem.colors = sanitizeDict(resItem.colors);
      resItem.ints = sanitizeDict(resItem.ints);
      resItem.bools = sanitizeDict(resItem.bools);
      resItem.strings = sanitizeDict(resItem.strings);
      resItem.vectors = sanitizeDict(resItem.vectors);
      return resItem;
    });
  } else {
    container.items = [];
  }

  return container;
}

// Auxiliar para upload Supabase
async function uploadFileToSupabase(file, modelName) {
  if (!file || !supabase) return null;
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

async function resolveCallerAvatarId(req) {
  const explicit =
    req.headers?.["x-profile-id"] ||
    req.body?.avatarId ||
    req.query?.avatarId ||
    req.body?.onnerId;
  if (explicit && Number(explicit) > 0) return Number(explicit);

  const token =
    req.headers?.["tfl-token"] ||
    req.headers?.["token"] ||
    (req.headers?.authorization
      ? req.headers.authorization.replace(/^Bearer\s+/i, "").trim()
      : "") ||
    req.cookies?.userToken;

  if (token && repo.User && repo.Avatar) {
    const user = await repo.User.findOne({ where: { token } });
    if (user) {
      const av = await repo.Avatar.findOne({
        where: { userId: user.id },
        order: [
          ["selected", "DESC"],
          ["id", "ASC"],
        ],
      });
      if (av) return av.id;
    }
  }
  return 0;
}

// ==================== ROTAS DA LOJA 3D (GODOT + WEB) ====================
router.get("/shop", GetAll);
router.get("/shop/home", GetIndex);
router.get("/shop/my", GetMyShopAndInventory);
router.get("/shop/:id", GetById);
router.post("/shop", CreateJson);
router.post("/shop/container", upload.any(), SaveMaterial);
router.post("/shop/checkout", CheckoutCart);
router.post("/shop/buy", CheckoutCart);
router.put("/shop/:id", UpdateJson);
router.delete("/shop/:id", DeleteById);

function GetIndex(req, res) {
  res.sendFile(path.join(__dirname, "../../paginas/shopUpload.html"));
}

async function GetAll(req, res) {
  try {
    await ensureShopSchemaAndSeed();
    const search = String(req.query.q || "");
    // Converte filtro numérico de gender vindo do QB<ItemShopContainner> do C# (ex: gender=0,1,2) para o ENUM do banco
    const normalizedSearch = search.replace(
      /\bgender\s*=\s*['"]?([012])['"]?/gi,
      (_, gNum) => `gender='${GENDER_TO_DB[gNum] || "Universal"}'`
    );

    const linq = repo.parseQueryStringToWhere(normalizedSearch);
    const order = repo.parseOrderByString(normalizedSearch);

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

    const data = rows.map(formatContainerForGodot);

    res.status(200).json({
      success: true,
      error: "",
      data,
      count: total,
      total,
      offset,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error("Erro ao listar itens da loja:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      data: null,
    });
  }
}

async function GetById(req, res) {
  try {
    const id = Number(req.params.id);
    const row = await repo.ShopContainer.findByPk(id, {
      include: [{ model: repo.ShopItem, as: "items", required: false }],
    });
    if (!row) {
      return res.status(404).json({
        success: false,
        error: "Item não encontrado na loja.",
        data: null,
      });
    }
    return res.json({
      success: true,
      error: "",
      data: formatContainerForGodot(row),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      data: null,
    });
  }
}

/**
 * POST /api/shop -> Usado pelo CreateItemPage.cs (ShopService.Create) no Godot phone_menus
 */
async function CreateJson(req, res) {
  try {
    const payload = req.body || {};
    const callerAvatarId = await resolveCallerAvatarId(req);
    const rawItems = Array.isArray(payload.items) ? payload.items : [];
    const firstSlot = rawItems[0]?.slot ?? payload.slot ?? "top";
    const webSlot = normalizeWebSlot(firstSlot);
    const firstModel = rawItems[0]?.model || payload.model || payload.prefabPath || "";

    const createdContainer = await repo.ShopContainer.create({
      onnerId: Number(payload.onnerId || callerAvatarId || 0),
      avatarId: Number(payload.avatarId || callerAvatarId || 0) || null,
      title: String(payload.title || payload.itemName || "Item 3D").trim(),
      price: Number(payload.price ?? 0),
      currencyType: payload.currencyType || "Coins",
      slot: webSlot,
      category: payload.category || "Clothes",
      prefabPath: firstModel,
      rarity: payload.rarity || "common",
      description: String(payload.description || ""),
      thumb: String(payload.thumb || payload.thumbnail || ""),
      sales: 0,
      stock: payload.stock !== undefined ? Number(payload.stock) : -1,
      active: payload.active !== false,
      gender: normalizeDbGender(payload.gender),
    });

    if (rawItems.length > 0) {
      const itemsToCreate = rawItems.map((resItem) => ({
        containerId: createdContainer.id,
        model: resItem.model || firstModel,
        slot: String(normalizeWebSlot(resItem.slot ?? firstSlot)),
        shader: resItem.shader || "",
        values: sanitizeDict(resItem.values),
        colors: sanitizeDict(resItem.colors),
        ints: sanitizeDict(resItem.ints),
        bools: sanitizeDict(resItem.bools),
        strings: sanitizeDict(resItem.strings),
        vectors: sanitizeDict(resItem.vectors),
        textures_paths: sanitizeDict(resItem.textures_paths),
      }));
      await repo.ShopItem.bulkCreate(itemsToCreate);
    }

    const fullCreated = await repo.ShopContainer.findByPk(createdContainer.id, {
      include: [{ model: repo.ShopItem, as: "items" }],
    });

    return res.status(201).json({
      success: true,
      error: "",
      data: formatContainerForGodot(fullCreated),
    });
  } catch (err) {
    console.error("[shop_controller:CreateJson]", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      data: null,
    });
  }
}

/**
 * PUT /api/shop/:id -> Usado pelo ShopService.Update(model) no Godot phone_menus
 */
async function UpdateJson(req, res) {
  try {
    const id = Number(req.params.id || req.body?.id);
    const container = await repo.ShopContainer.findByPk(id);
    if (!container) {
      return res.status(404).json({
        success: false,
        error: "Item não encontrado para atualização.",
        data: null,
      });
    }

    const payload = req.body || {};
    const rawItems = Array.isArray(payload.items) ? payload.items : null;
    const firstSlot = rawItems?.[0]?.slot ?? payload.slot ?? container.slot;

    await container.update({
      title: payload.title !== undefined ? String(payload.title).trim() : container.title,
      price: payload.price !== undefined ? Number(payload.price) : container.price,
      description: payload.description !== undefined ? String(payload.description) : container.description,
      gender: payload.gender !== undefined ? normalizeDbGender(payload.gender) : container.gender,
      slot: normalizeWebSlot(firstSlot),
      thumb: payload.thumb !== undefined ? String(payload.thumb) : container.thumb,
      prefabPath: rawItems?.[0]?.model || payload.model || container.prefabPath,
    });

    if (rawItems) {
      await repo.ShopItem.destroy({ where: { containerId: container.id } });
      const itemsToCreate = rawItems.map((resItem) => ({
        containerId: container.id,
        model: resItem.model || container.prefabPath || "",
        slot: String(normalizeWebSlot(resItem.slot ?? firstSlot)),
        shader: resItem.shader || "",
        values: sanitizeDict(resItem.values),
        colors: sanitizeDict(resItem.colors),
        ints: sanitizeDict(resItem.ints),
        bools: sanitizeDict(resItem.bools),
        strings: sanitizeDict(resItem.strings),
        vectors: sanitizeDict(resItem.vectors),
        textures_paths: sanitizeDict(resItem.textures_paths),
      }));
      await repo.ShopItem.bulkCreate(itemsToCreate);
    }

    const updated = await repo.ShopContainer.findByPk(container.id, {
      include: [{ model: repo.ShopItem, as: "items" }],
    });

    return res.json({
      success: true,
      error: "",
      data: formatContainerForGodot(updated),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      data: null,
    });
  }
}

async function DeleteById(req, res) {
  try {
    const id = Number(req.params.id);
    const container = await repo.ShopContainer.findByPk(id);
    if (!container) {
      return res.status(404).json({
        success: false,
        error: "Item não encontrado.",
        data: null,
      });
    }
    await repo.ShopItem.destroy({ where: { containerId: id } });
    await container.destroy();
    return res.json({
      success: true,
      error: "",
      data: formatContainerForGodot(container),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      data: null,
    });
  }
}

/**
 * GET /api/shop/my -> Retorna itens comprados (purchasedItems) e criados (createdItems) pelo Avatar
 * para preencher a InventoryPage.cs do Godot phone_menus.
 */
async function GetMyShopAndInventory(req, res) {
  try {
    const avatarId = await resolveCallerAvatarId(req);
    if (!avatarId) {
      return res.status(401).json({
        success: false,
        error: "Avatar não identificado.",
        purchasedItems: [],
        createdItems: [],
      });
    }

    const wardrobe = await getAvatarWardrobe(avatarId);
    const ownedIds = (wardrobe.inventory || []).map((i) => Number(i.shopItemId)).filter(Boolean);

    const [purchasedRows, createdRows] = await Promise.all([
      ownedIds.length > 0
        ? repo.ShopContainer.findAll({
            where: { id: { [Op.in]: ownedIds } },
            include: [{ model: repo.ShopItem, as: "items", required: false }],
          })
        : [],
      repo.ShopContainer.findAll({
        where: {
          [Op.or]: [{ onnerId: avatarId }, { avatarId: avatarId }],
        },
        include: [{ model: repo.ShopItem, as: "items", required: false }],
        order: [["id", "DESC"]],
      }),
    ]);

    return res.json({
      success: true,
      error: "",
      purchasedItems: purchasedRows.map(formatContainerForGodot),
      createdItems: createdRows.map(formatContainerForGodot),
      wardrobe,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      purchasedItems: [],
      createdItems: [],
    });
  }
}

/**
 * POST /api/shop/checkout (ou /api/shop/buy) -> Finaliza a compra de 1 ou múltiplos itens do carrinho (ShopCardPage.cs)
 */
async function CheckoutCart(req, res) {
  try {
    const avatarId = await resolveCallerAvatarId(req);
    if (!avatarId) {
      return res.status(401).json({
        success: false,
        error: "Autentique-se para finalizar a compra.",
      });
    }

    const itemIds = Array.isArray(req.body?.itemIds)
      ? req.body.itemIds
      : Array.isArray(req.body?.items)
      ? req.body.items.map((i) => (typeof i === "object" ? i.id : i))
      : req.body?.shopItemId || req.body?.id
      ? [req.body.shopItemId || req.body.id]
      : [];

    if (itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Nenhum item informado no carrinho.",
      });
    }

    const results = [];
    for (const rawId of itemIds) {
      const result = await buyShopItem({
        avatarId,
        shopItemId: Number(rawId),
        autoEquip: Boolean(req.body?.autoEquip),
      });
      results.push(result);
    }

    return res.json({
      success: true,
      error: "",
      purchasedCount: results.length,
      results,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
}

async function SaveMaterial(req, res) {
  try {
    const payload = JSON.parse(req.body.payload || "{}");
    const files = req.files || [];
    const callerAvatarId = await resolveCallerAvatarId(req);

    const mainImageFile = files.find((f) => f.fieldname === "mainImage");
    const firstItemModel =
      payload.items && payload.items[0] ? payload.items[0].model : "default";
    const thumbUrl = await uploadFileToSupabase(mainImageFile, firstItemModel);

    const textureFilesMap = {};
    files
      .filter((f) => f.fieldname.startsWith("texture_"))
      .forEach((f) => {
        textureFilesMap[f.fieldname] = f;
      });

    const firstSlot = payload.items?.[0]?.slot ?? payload.slot ?? "top";

    const createdContainer = await repo.ShopContainer.create({
      onnerId: payload.onnerId || callerAvatarId || 0,
      avatarId: payload.avatarId || callerAvatarId || null,
      title: payload.title,
      price: payload.price,
      description: payload.description,
      thumb: thumbUrl || payload.thumb || "",
      sales: 0,
      slot: normalizeWebSlot(firstSlot),
      prefabPath: firstItemModel,
      gender: normalizeDbGender(payload.gender),
    });

    if (Array.isArray(payload.items)) {
      const itemsToCreate = await Promise.all(
        payload.items.map(async (resItem, index) => {
          const mappedTexturesPaths = {};

          if (resItem.textures_paths) {
            for (const key in resItem.textures_paths) {
              const fieldKey = `texture_${index}_${key}`;
              const fileObj = textureFilesMap[fieldKey];

              if (fileObj) {
                mappedTexturesPaths[key] = await uploadFileToSupabase(
                  fileObj,
                  resItem.model
                );
              } else if (typeof resItem.textures_paths[key] === "string") {
                mappedTexturesPaths[key] = resItem.textures_paths[key];
              }
            }
          }

          return {
            containerId: createdContainer.id,
            model: resItem.model,
            slot: String(normalizeWebSlot(resItem.slot ?? firstSlot)),
            shader: resItem.shader,
            values: resItem.values || {},
            colors: resItem.colors || {},
            ints: resItem.ints || {},
            bools: resItem.bools || {},
            strings: resItem.strings || {},
            vectors: resItem.vectors || {},
            textures_paths: mappedTexturesPaths,
          };
        })
      );

      await repo.ShopItem.bulkCreate(itemsToCreate);
    }

    const fullCreated = await repo.ShopContainer.findByPk(createdContainer.id, {
      include: [{ model: repo.ShopItem, as: "items" }],
    });

    res.status(201).json({
      success: true,
      error: "",
      data: formatContainerForGodot(fullCreated),
    });
  } catch (err) {
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
  GetById,
  CreateJson,
  UpdateJson,
  DeleteById,
  GetMyShopAndInventory,
  CheckoutCart,
  SaveMaterial,
};
