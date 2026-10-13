const repo = require("../repositories/repository");
const { Op } = require("sequelize");

/**
 * REGRAS OFICIAIS DO SISTEMA DE ROUPAS 3D, LOJA (SHOP) E GUARDA-ROUPA (INVENTORY)
 */
const SHOP_3D_RULES = {
  // Slots 3D oficiais do esqueleto do Avatar
  SLOTS: {
    hair: { key: "hair", label: "Cabelo / Penteado", icon: "fa-scissors", conflictsWith: [] },
    head: { key: "head", label: "Cabeça / Chapéu", icon: "fa-hat-cowboy", conflictsWith: [] },
    eyes: { key: "eyes", label: "Rosto / Óculos", icon: "fa-glasses", conflictsWith: [] },
    top: { key: "top", label: "Tronco / Camisa & Jaqueta", icon: "fa-shirt", conflictsWith: ["fullbody"] },
    bottom: { key: "bottom", label: "Pernas / Calça & Saia", icon: "fa-person-walking", conflictsWith: ["fullbody"] },
    fullbody: { key: "fullbody", label: "Traje Completo / Vestido", icon: "fa-user-astronaut", conflictsWith: ["top", "bottom"] },
    shoes: { key: "shoes", label: "Calçados / Tênis & Botas", icon: "fa-shoe-prints", conflictsWith: [] },
    accessory: { key: "accessory", label: "Acessórios / Asas & Mochila", icon: "fa-gem", conflictsWith: [] },
    skin: { key: "skin", label: "Pele / Textura Corporal", icon: "fa-palette", conflictsWith: [] },
    animation: { key: "animation", label: "Pose / Emote 3D", icon: "fa-wand-magic-sparkles", conflictsWith: [] },
  },
  RARITIES: {
    common: { key: "common", label: "Comum", color: "#94a3b8" },
    rare: { key: "rare", label: "Raro", color: "#38bdf8" },
    epic: { key: "epic", label: "Épico", color: "#a855f7" },
    legendary: { key: "legendary", label: "Lendário", color: "#f59e0b" },
  },
  CURRENCIES: ["Coins", "Cash", "Chips"],
  GENDERS: ["Universal", "Male", "Female"],
  CREATOR_ROYALTY_PERCENT: 70, // Criador recebe 70% e o sistema retém 30%
  MAX_STYLES_PER_AVATAR: 10,   // Máximo de presets/looks salvos por avatar
};

const STARTER_3D_CATALOG = [
  {
    title: "Jaqueta Cyberpunk Neon",
    description: "Jaqueta 3D com detalhes emissivos neon ajustáveis e gola alta futurista.",
    slot: "top",
    category: "clothing",
    model: "mesh_top_cyber_jacket_01",
    prefabPath: "res://assets/avatars3d/clothes/tops/cyber_jacket_01.tscn",
    currencyType: "Coins",
    price: "150",
    rarity: "epic",
    gender: "Universal",
    thumb: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80",
    defaultColors: { primary: "#0ea5e9", secondary: "#ec4899" },
    stock: -1,
  },
  {
    title: "Moletom Streetwear Oversized",
    description: "Moletom urbano confortável com capuz 3D e textura de algodão premium.",
    slot: "top",
    category: "clothing",
    model: "mesh_top_hoodie_street_01",
    prefabPath: "res://assets/avatars3d/clothes/tops/hoodie_street_01.tscn",
    currencyType: "Coins",
    price: "80",
    rarity: "common",
    gender: "Universal",
    thumb: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80",
    defaultColors: { primary: "#1e293b", secondary: "#ffffff" },
    stock: -1,
  },
  {
    title: "Calça Cargo Tática Techwear",
    description: "Calça 3D com múltiplos bolsos laterais, fitas refletivas e ajuste no tornozelo.",
    slot: "bottom",
    category: "clothing",
    model: "mesh_bottom_cargo_tech_01",
    prefabPath: "res://assets/avatars3d/clothes/bottoms/cargo_tech_01.tscn",
    currencyType: "Coins",
    price: "110",
    rarity: "rare",
    gender: "Universal",
    thumb: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=400&q=80",
    defaultColors: { primary: "#0f172a", secondary: "#38bdf8" },
    stock: -1,
  },
  {
    title: "Saia Plissada Cyber Pop",
    description: "Saia 3D com física dinâmica de movimento e acabamento cintilante.",
    slot: "bottom",
    category: "clothing",
    model: "mesh_bottom_pleated_skirt_01",
    prefabPath: "res://assets/avatars3d/clothes/bottoms/pleated_skirt_01.tscn",
    currencyType: "Coins",
    price: "95",
    rarity: "rare",
    gender: "Female",
    thumb: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=400&q=80",
    defaultColors: { primary: "#db2777", secondary: "#fdf2f8" },
    stock: -1,
  },
  {
    title: "Tênis Air Glow Futurista",
    description: "Sola iluminada em LED RGB com malha respirável 3D.",
    slot: "shoes",
    category: "clothing",
    model: "mesh_shoes_air_glow_01",
    prefabPath: "res://assets/avatars3d/clothes/shoes/air_glow_01.tscn",
    currencyType: "Coins",
    price: "120",
    rarity: "rare",
    gender: "Universal",
    thumb: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
    defaultColors: { primary: "#ef4444", secondary: "#ffffff" },
    stock: -1,
  },
  {
    title: "Cabelo Anime Cyber Silver",
    description: "Penteado 3D estilizado em camadas com reflexos metálicos.",
    slot: "hair",
    category: "hair",
    model: "mesh_hair_cyber_silver_01",
    prefabPath: "res://assets/avatars3d/hairs/cyber_silver_01.tscn",
    currencyType: "Coins",
    price: "140",
    rarity: "epic",
    gender: "Universal",
    thumb: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
    defaultColors: { primary: "#e2e8f0", secondary: "#38bdf8" },
    stock: -1,
  },
  {
    title: "Óculos Holográfico Visor XR",
    description: "Visor translúcido com HUD animado projetado na lente 3D.",
    slot: "eyes",
    category: "accessory",
    model: "mesh_eyes_visor_xr_01",
    prefabPath: "res://assets/avatars3d/accessories/visor_xr_01.tscn",
    currencyType: "Coins",
    price: "90",
    rarity: "rare",
    gender: "Universal",
    thumb: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&q=80",
    defaultColors: { primary: "#06b6d4", secondary: "#111827" },
    stock: -1,
  },
  {
    title: "Boné Urbano TFL Snapback",
    description: "Boné aba reta 3D com bordado oficial The Fantasy Life.",
    slot: "head",
    category: "accessory",
    model: "mesh_head_snapback_tfl_01",
    prefabPath: "res://assets/avatars3d/accessories/snapback_tfl_01.tscn",
    currencyType: "Chips",
    price: "200",
    rarity: "common",
    gender: "Universal",
    thumb: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=80",
    defaultColors: { primary: "#2563eb", secondary: "#f8fafc" },
    stock: -1,
  },
  {
    title: "Traje de Gala Imperial (Corpo Inteiro)",
    description: "Conjunto completo de gala com detalhes dourados. Substitui camisa e calça.",
    slot: "fullbody",
    category: "clothing",
    model: "mesh_fullbody_imperial_gala_01",
    prefabPath: "res://assets/avatars3d/clothes/fullbody/imperial_gala_01.tscn",
    currencyType: "Cash",
    price: "2.50",
    rarity: "legendary",
    gender: "Universal",
    thumb: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80",
    defaultColors: { primary: "#0f172a", secondary: "#f59e0b" },
    stock: 50,
  },
  {
    title: "Asas de Cristal Arcano 3D",
    description: "Asas articuladas com partículas luminosas para o slot de acessório dorsal.",
    slot: "accessory",
    category: "accessory",
    model: "mesh_acc_crystal_wings_01",
    prefabPath: "res://assets/avatars3d/accessories/crystal_wings_01.tscn",
    currencyType: "Cash",
    price: "4.00",
    rarity: "legendary",
    gender: "Universal",
    thumb: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80",
    defaultColors: { primary: "#8b5cf6", secondary: "#38bdf8" },
    stock: 25,
  },
];

let _schemaChecked = false;
async function ensureShopSchemaAndSeed() {
  if (_schemaChecked) return;
  try {
    await repo.sequelize.query(`
      ALTER TABLE IF EXISTS "shop_containers" ADD COLUMN IF NOT EXISTS "avatarId" INTEGER DEFAULT 0;
      ALTER TABLE IF EXISTS "shop_containers" ADD COLUMN IF NOT EXISTS "slot" VARCHAR(60) DEFAULT 'top';
      ALTER TABLE IF EXISTS "shop_containers" ADD COLUMN IF NOT EXISTS "category" VARCHAR(60) DEFAULT 'clothing';
      ALTER TABLE IF EXISTS "shop_containers" ADD COLUMN IF NOT EXISTS "prefabPath" VARCHAR(255) DEFAULT '';
      ALTER TABLE IF EXISTS "shop_containers" ADD COLUMN IF NOT EXISTS "currencyType" VARCHAR(30) DEFAULT 'Coins';
      ALTER TABLE IF EXISTS "shop_containers" ADD COLUMN IF NOT EXISTS "rarity" VARCHAR(30) DEFAULT 'common';
      ALTER TABLE IF EXISTS "shop_containers" ADD COLUMN IF NOT EXISTS "defaultColors" JSONB DEFAULT '{"primary":"#3b82f6","secondary":"#ffffff"}';
      ALTER TABLE IF EXISTS "shop_containers" ADD COLUMN IF NOT EXISTS "stock" INTEGER DEFAULT -1;
      ALTER TABLE IF EXISTS "shop_containers" ADD COLUMN IF NOT EXISTS "active" BOOLEAN DEFAULT true;
      ALTER TABLE IF EXISTS "shop_containers" ALTER COLUMN "gender" TYPE VARCHAR(40) USING "gender"::text;
      ALTER TABLE IF EXISTS "shop_containers" ALTER COLUMN "gender" SET DEFAULT 'Universal';

      ALTER TABLE IF EXISTS "avatar_inventories" ADD COLUMN IF NOT EXISTS "avatarId" INTEGER;
      ALTER TABLE IF EXISTS "avatar_inventories" ADD COLUMN IF NOT EXISTS "slot" VARCHAR(60) DEFAULT 'top';
      ALTER TABLE IF EXISTS "avatar_inventories" ADD COLUMN IF NOT EXISTS "customColors" JSONB DEFAULT '{}';

      ALTER TABLE IF EXISTS "avatar_outfits" ADD COLUMN IF NOT EXISTS "inventoryId" INTEGER;
    `);

    const count = await repo.ShopContainer.count();
    if (count === 0) {
      for (const item of STARTER_3D_CATALOG) {
        const created = await repo.ShopContainer.create({
          ...item,
          onnerId: 0,
          avatarId: 0,
          sales: 0,
          active: true,
        });
        await repo.ShopItem.create({
          containerId: created.id,
          model: item.model,
          slot: item.slot,
          shader: "standard_pbr_3d",
          colors: item.defaultColors || {},
          strings: { prefabPath: item.prefabPath || "" },
          textures_paths: { main: item.thumb || "" },
        });
      }
    }

    if (repo.PrefabModel) {
      const prefabCount = await repo.PrefabModel.count({ where: { type: "AvatarOutfit" } });
      if (prefabCount === 0) {
        const starterPrefabs = [
          // Male (HM)
          { name: "HM Jacket Cyber", addressable: "HM_Jacket_Cyber", path: "res://assets/avatars/HM/HM_Jacket_Cyber.tscn", slot: "UpperBody", type: "AvatarOutfit", active: true, description: "Jaqueta Masculina 3D" },
          { name: "HM Hoodie Street", addressable: "HM_Hoodie_Street", path: "res://assets/avatars/HM/HM_Hoodie_Street.tscn", slot: "UpperBody", type: "AvatarOutfit", active: true, description: "Moletom Masculino 3D" },
          { name: "HM Cargo Pants", addressable: "HM_Cargo_Pants", path: "res://assets/avatars/HM/HM_Cargo_Pants.tscn", slot: "LowerBody", type: "AvatarOutfit", active: true, description: "Calça Cargo Masculina 3D" },
          { name: "HM Suit FullBody", addressable: "HM_Suit_FullBody", path: "res://assets/avatars/HM/HM_Suit_FullBody.tscn", slot: "FullBody", type: "AvatarOutfit", active: true, description: "Traje Completo Masculino 3D" },
          { name: "HM Hair Spiky", addressable: "HM_Hair_Spiky", path: "res://assets/avatars/HM/HM_Hair_Spiky.tscn", slot: "Hair", type: "AvatarOutfit", active: true, description: "Cabelo Masculino Estilizado" },
          { name: "HM Sneakers Glow", addressable: "HM_Sneakers_Glow", path: "res://assets/avatars/HM/HM_Sneakers_Glow.tscn", slot: "Shoes", type: "AvatarOutfit", active: true, description: "Tênis Masculino 3D" },
          { name: "HM Eyes Base", addressable: "HM_Eyes_Base", path: "res://assets/avatars/HM/HM_Eyes_Base.tscn", slot: "Eyes", type: "AvatarOutfit", active: true, description: "Olhos / Lentes Masculinas" },
          { name: "HM Skin Head", addressable: "HM_Skin_Head", path: "res://assets/avatars/HM/HM_Skin_Head.tscn", slot: "Skin", type: "AvatarOutfit", active: true, description: "Pele da Cabeça Masculina (Make/Tattoo)" },
          { name: "HM Skin Body", addressable: "HM_Skin_Body", path: "res://assets/avatars/HM/HM_Skin_Body.tscn", slot: "Skin", type: "AvatarOutfit", active: true, description: "Pele do Corpo Masculino (Tattoo/Cloth)" },
          // Female (HF)
          { name: "HF Top Crop Cyber", addressable: "HF_Top_Crop_Cyber", path: "res://assets/avatars/HF/HF_Top_Crop_Cyber.tscn", slot: "UpperBody", type: "AvatarOutfit", active: true, description: "Top Cropped Feminino 3D" },
          { name: "HF Hoodie Oversized", addressable: "HF_Hoodie_Oversized", path: "res://assets/avatars/HF/HF_Hoodie_Oversized.tscn", slot: "UpperBody", type: "AvatarOutfit", active: true, description: "Moletom Feminino 3D" },
          { name: "HF Skirt Pleated", addressable: "HF_Skirt_Pleated", path: "res://assets/avatars/HF/HF_Skirt_Pleated.tscn", slot: "LowerBody", type: "AvatarOutfit", active: true, description: "Saia Plissada Feminina 3D" },
          { name: "HF Dress Gala", addressable: "HF_Dress_Gala", path: "res://assets/avatars/HF/HF_Dress_Gala.tscn", slot: "FullBody", type: "AvatarOutfit", active: true, description: "Vestido Completo Feminino 3D" },
          { name: "HF Hair Long Wave", addressable: "HF_Hair_Long_Wave", path: "res://assets/avatars/HF/HF_Hair_Long_Wave.tscn", slot: "Hair", type: "AvatarOutfit", active: true, description: "Cabelo Longo Ondulado Feminino" },
          { name: "HF Boots Platform", addressable: "HF_Boots_Platform", path: "res://assets/avatars/HF/HF_Boots_Platform.tscn", slot: "Shoes", type: "AvatarOutfit", active: true, description: "Bota Plataforma Feminina 3D" },
          { name: "HF Eyes Base", addressable: "HF_Eyes_Base", path: "res://assets/avatars/HF/HF_Eyes_Base.tscn", slot: "Eyes", type: "AvatarOutfit", active: true, description: "Olhos / Lentes Femininas" },
          { name: "HF Skin Head", addressable: "HF_Skin_Head", path: "res://assets/avatars/HF/HF_Skin_Head.tscn", slot: "Skin", type: "AvatarOutfit", active: true, description: "Pele da Cabeça Feminina (Make/Blush/Lips)" },
          { name: "HF Skin Body", addressable: "HF_Skin_Body", path: "res://assets/avatars/HF/HF_Skin_Body.tscn", slot: "Skin", type: "AvatarOutfit", active: true, description: "Pele do Corpo Feminino (Tattoo/Cloth)" },
        ];
        await repo.PrefabModel.bulkCreate(starterPrefabs);
      }
    }

    _schemaChecked = true;
  } catch (err) {
    console.warn("[shop3d.service] Aviso ao garantir schema/seed da loja 3D:", err.message);
  }
}

function normalizeGenderStr(g) {
  const s = String(g ?? "Universal").trim().toLowerCase();
  if (s === "male" || s === "1" || s === "masculino") return "Male";
  if (s === "female" || s === "0" || s === "feminino") return "Female";
  return "Universal";
}

function isGenderCompatible(itemGender, avatarGenderInt) {
  const norm = normalizeGenderStr(itemGender);
  if (norm === "Universal") return true;
  // No TFL: avatar.gender === 0 é Feminino, avatar.gender === 1 é Masculino
  if (norm === "Female" && Number(avatarGenderInt) === 0) return true;
  if (norm === "Male" && Number(avatarGenderInt) !== 0) return true;
  return false;
}

/**
 * Lista o catálogo da Loja 3D com filtros e estado de posse/equipamento do Avatar ativo
 */
async function listShopCatalog({
  slot = "",
  gender = "",
  currencyType = "",
  rarity = "",
  search = "",
  includeInactive = false,
  viewerAvatarId = 0,
} = {}) {
  await ensureShopSchemaAndSeed();

  const where = {};
  if (!includeInactive) {
    where.active = true;
  }
  if (slot && slot !== "all") {
    where.slot = slot;
  }
  if (gender && gender !== "all") {
    where.gender = normalizeGenderStr(gender);
  }
  if (currencyType && currencyType !== "all") {
    where.currencyType = currencyType;
  }
  if (rarity && rarity !== "all") {
    where.rarity = rarity;
  }
  if (search && String(search).trim()) {
    const q = String(search).trim();
    where[Op.or] = [
      { title: { [Op.iLike]: `%${q}%` } },
      { description: { [Op.iLike]: `%${q}%` } },
      { model: { [Op.iLike]: `%${q}%` } },
    ];
  }

  const rows = await repo.ShopContainer.findAll({
    where,
    include: [{ model: repo.ShopItem, as: "items", required: false }],
    order: [["id", "DESC"]],
  });

  // Verifica quais itens o avatar já possui no Guarda-Roupa
  const ownedMap = new Map();
  if (Number(viewerAvatarId) > 0) {
    const invRows = await repo.Inventory.findAll({
      where: { avatarId: Number(viewerAvatarId) },
    });
    for (const inv of invRows) {
      ownedMap.set(Number(inv.itemId), inv.get({ plain: true }));
    }
  }

  const items = rows.map((r) => {
    const plain = r.get({ plain: true });
    const ownedInv = ownedMap.get(Number(plain.id)) || null;
    const isOwned = Boolean(ownedInv);
    const isEquipped = Boolean(ownedInv?.isEquipped);
    const thumbUrl =
      plain.thumb ||
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80";
    return {
      ...plain,
      itemName: plain.title || `Peça #${plain.id}`,
      thumbnail: thumbUrl,
      thumb: thumbUrl,
      price: Number(plain.price || 0),
      priceNumber: Number(plain.price || 0),
      owned: isOwned,
      ownedByMe: isOwned,
      equipped: isEquipped,
      equippedByMe: isEquipped,
      inventoryId: ownedInv?.id || null,
    };
  });

  return {
    rules: SHOP_3D_RULES,
    items,
  };
}

/**
 * Retorna o Guarda-Roupa completo do Avatar (Inventário + Slots 3D Equipados + Presets de Estilo)
 */
async function getAvatarWardrobe(avatarId) {
  await ensureShopSchemaAndSeed();
  const avId = Number(avatarId);
  if (!avId) {
    return {
      avatarId: 0,
      inventory: [],
      equippedBySlot: {},
      styles: [],
      rules: SHOP_3D_RULES,
    };
  }

  const [invRows, styleRows] = await Promise.all([
    repo.Inventory.findAll({
      where: { avatarId: avId },
      include: [
        {
          model: repo.ShopContainer,
          as: "shopItem",
          include: [{ model: repo.ShopItem, as: "items", required: false }],
        },
      ],
      order: [["isEquipped", "DESC"], ["id", "DESC"]],
    }),
    repo.AvatarOutfitStyle.findAll({
      where: { avatarId: avId },
      order: [["id", "DESC"]],
    }),
  ]);

  const inventory = [];
  const equippedBySlot = {};

  for (const row of invRows) {
    const plain = row.get({ plain: true });
    const shopContainer = plain.shopItem || {};
    const slotKey = plain.slot || shopContainer.slot || "top";
    const mergedColors =
      plain.customColors && Object.keys(plain.customColors).length > 0
        ? plain.customColors
        : shopContainer.defaultColors || { primary: "#3b82f6", secondary: "#ffffff" };
    const itemName = plain.name || shopContainer.title || `Item #${plain.itemId}`;
    const thumbUrl =
      shopContainer.thumb ||
      plain.data?.thumb ||
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80";

    const formatted = {
      id: plain.id,
      inventoryId: plain.id,
      uid: plain.uid,
      avatarId: plain.avatarId,
      itemId: plain.itemId,
      shopItemId: plain.itemId,
      name: itemName,
      itemName,
      description: shopContainer.description || "",
      slot: slotKey,
      categoria: plain.categoria || shopContainer.category || "clothing",
      isEquipped: Boolean(plain.isEquipped),
      equipped: Boolean(plain.isEquipped),
      customColors: mergedColors,
      model: shopContainer.model || plain.data?.model || "",
      prefabPath: shopContainer.prefabPath || plain.data?.prefabPath || "",
      thumb: thumbUrl,
      thumbnail: thumbUrl,
      rarity: shopContainer.rarity || "common",
      gender: shopContainer.gender || "Universal",
      resources3d: shopContainer.items || [],
    };

    inventory.push(formatted);
    if (formatted.isEquipped) {
      equippedBySlot[slotKey] = formatted;
    }
  }

  return {
    avatarId: avId,
    inventory,
    equippedBySlot,
    styles: styleRows.map((s) => s.get({ plain: true })),
    rules: SHOP_3D_RULES,
  };
}

/**
 * Compra um item na Loja 3D aplicando todas as regras de negócio (Estoque, Gênero, Não-Duplicidade, Moeda e Royalty UGC)
 */
async function buyShopItem({ userId, avatarId, containerId, shopItemId, itemId, autoEquip = true }) {
  await ensureShopSchemaAndSeed();
  const avId = Number(avatarId);
  const cId = Number(containerId || shopItemId || itemId);
  if (!avId || !cId) {
    throw new Error("Selecione um avatar válido e um item da loja.");
  }

  return await repo.sequelize.transaction(async (t) => {
    const avatar = await repo.Avatar.findByPk(avId, { transaction: t });
    if (!avatar) throw new Error("Avatar não encontrado.");
    if (userId && Number(avatar.userId) !== Number(userId)) {
      throw new Error("Este avatar não pertence à sua conta.");
    }

    const container = await repo.ShopContainer.findByPk(cId, {
      include: [{ model: repo.ShopItem, as: "items" }],
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!container || !container.active) {
      throw new Error("Este item não está disponível na Loja 3D.");
    }

    // Regra 1: Estoque
    if (Number(container.stock) === 0) {
      throw new Error("Este item exclusivo esgotou na loja!");
    }

    // Regra 2: Compatibilidade de Gênero 3D
    if (!isGenderCompatible(container.gender, avatar.gender)) {
      throw new Error(
        `Esta peça é exclusiva para o esqueleto 3D ${container.gender === "Female" ? "Feminino" : "Masculino"}.`
      );
    }

    // Regra 3: Não-duplicidade no Guarda-Roupa do mesmo Avatar
    const existing = await repo.Inventory.findOne({
      where: { avatarId: avId, itemId: cId },
      transaction: t,
    });
    if (existing) {
      throw new Error("Seu avatar já possui esta peça no Guarda-Roupa!");
    }

    // Regra 4: Validação e Débito da Carteira (Coins, Cash ou Chips)
    const currencyType = ["Coins", "Cash", "Chips"].includes(container.currencyType)
      ? container.currencyType
      : "Coins";
    const price = Math.max(0, Number(container.price || 0));

    let wallet = await repo.Currency.findOne({
      where: { [Op.or]: [{ avatarId: avId }, { ownerId: avId }] },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!wallet) {
      wallet = await repo.Currency.create(
        { avatarId: avId, ownerId: avId, userId: avatar.userId, cash: 0, coins: 0, chips: 50 },
        { transaction: t }
      );
    }

    const fieldMap = { Coins: "coins", Cash: "cash", Chips: "chips" };
    const walletField = fieldMap[currencyType];
    const currentBalance = Number(wallet[walletField] || 0);

    if (currentBalance < price) {
      throw new Error(
        `Saldo insuficiente de ${currencyType}. Necessário: ${price} ${currencyType} (Disponível: ${currentBalance}).`
      );
    }

    if (price > 0) {
      wallet[walletField] = Number((currentBalance - price).toFixed(4));
      await wallet.save({ transaction: t });

      await repo.sequelize
        .query(
          `INSERT INTO "wallet_ledger"
            ("userId", "avatarId", "currencyType", "direction", "grossAmount", "feeAmount", "netAmount", "balanceAfter", "category", "description", "relatedAvatarId", "createdAt")
           VALUES (:userId, :avatarId, :currencyType, 'DEBIT', :grossAmount, 0, :netAmount, :balanceAfter, 'SHOP_BUY', :description, :relatedAvatarId, NOW())`,
          {
            replacements: {
              userId: avatar.userId || null,
              avatarId: avId,
              currencyType,
              grossAmount: price,
              netAmount: price,
              balanceAfter: wallet[walletField],
              description: `Compra na Loja 3D: "${container.title}" (#${container.id})`,
              relatedAvatarId: Number(container.avatarId || container.onnerId || 0) || null,
            },
            transaction: t,
          }
        )
        .catch(() => {});

      if (repo.CurrencyRegister) {
        await repo.CurrencyRegister.create(
          {
            userId: avatar.userId,
            ownerId: avId,
            type: currencyType,
            transactionType: "Buy",
            value: -price,
            description: `Compra na Loja 3D: ${container.title} (#${container.id})`,
          },
          { transaction: t }
        );
      }

      // Regra 5: Repasse de Royalty ao Criador UGC conforme shopSalePlatformFeePercent na tabela economy_rules
      const creatorAvatarId = Number(container.avatarId || container.onnerId || 0);
      if (creatorAvatarId > 0 && creatorAvatarId !== avId) {
        const ecoRule = await repo.EconomyRule.findOne({ where: { key: "default" }, transaction: t });
        const platformFeePct = Number(ecoRule?.shopSalePlatformFeePercent ?? SHOP_3D_RULES.PLATFORM_FEE_PERCENT ?? 30);
        const creatorSharePct = Math.max(0, 100 - platformFeePct);
        const creatorShare = Number(((price * creatorSharePct) / 100).toFixed(4));
        const platformShare = Number((price - creatorShare).toFixed(4));

        const creatorWallet = await repo.Currency.findOne({
          where: { [Op.or]: [{ avatarId: creatorAvatarId }, { ownerId: creatorAvatarId }] },
          lock: t.LOCK.UPDATE,
          transaction: t,
        });
        if (creatorWallet && creatorShare > 0) {
          creatorWallet[walletField] = Number((Number(creatorWallet[walletField] || 0) + creatorShare).toFixed(4));
          await creatorWallet.save({ transaction: t });

          await repo.sequelize
            .query(
              `INSERT INTO "wallet_ledger"
                ("userId", "avatarId", "currencyType", "direction", "grossAmount", "feeAmount", "netAmount", "balanceAfter", "category", "description", "relatedAvatarId", "createdAt")
               VALUES (:userId, :avatarId, :currencyType, 'CREDIT', :grossAmount, :feeAmount, :netAmount, :balanceAfter, 'SHOP_SALE', :description, :relatedAvatarId, NOW())`,
              {
                replacements: {
                  userId: creatorWallet.userId || null,
                  avatarId: creatorAvatarId,
                  currencyType,
                  grossAmount: price,
                  feeAmount: platformShare,
                  netAmount: creatorShare,
                  balanceAfter: creatorWallet[walletField],
                  description: `Venda de Item UGC "${container.title}" (#${container.id}) — Repasse ${creatorSharePct}% (Taxa ${platformFeePct}%: -${platformShare} ${currencyType})`,
                  relatedAvatarId: avId,
                },
                transaction: t,
              }
            )
            .catch(() => {});

          await repo.sequelize
            .query(
              `INSERT INTO "user_notifications" ("userId", "avatarId", "type", "title", "message", "icon", "isRead", "createdAt")
               VALUES (:userId, :avatarId, 'SHOP', :title, :message, 'fa-shirt', FALSE, NOW())`,
              {
                replacements: {
                  userId: creatorWallet.userId || null,
                  avatarId: creatorAvatarId,
                  title: "Peça 3D Vendida na Loja!",
                  message: `${avatar.name || `Avatar #${avId}`} comprou "${container.title}". Você recebeu +${creatorShare.toFixed(2)} ${currencyType} (${creatorSharePct}%)!`,
                },
                transaction: t,
              }
            )
            .catch(() => {});
        }
        if (ecoRule && platformShare > 0) {
          if (currencyType === "Cash") {
            ecoRule.collectedFeesCash = Number((Number(ecoRule.collectedFeesCash || 0) + platformShare).toFixed(4));
          } else if (currencyType === "Coins") {
            ecoRule.collectedFeesCoins = Number((Number(ecoRule.collectedFeesCoins || 0) + platformShare).toFixed(4));
          }
          await ecoRule.save({ transaction: t });
        }
      }
    }

    // Atualiza vendas e estoque
    container.sales = Number(container.sales || 0) + 1;
    if (Number(container.stock) > 0) {
      container.stock = Number(container.stock) - 1;
    }
    await container.save({ transaction: t });

    // Cria no Inventário do Avatar
    const slotKey = container.slot || "top";
    const invItem = await repo.Inventory.create(
      {
        avatarId: avId,
        itemId: container.id,
        name: container.title,
        slot: slotKey,
        categoria: container.category || "clothing",
        isEquipped: false,
        customColors: container.defaultColors || { primary: "#3b82f6", secondary: "#ffffff" },
        data: {
          model: container.model,
          prefabPath: container.prefabPath || "",
          thumb: container.thumb || "",
          rarity: container.rarity || "common",
        },
      },
      { transaction: t }
    );

    // Se autoEquip estiver ativo, já equipa respeitando a regra de conflito de slots 3D
    if (autoEquip) {
      await applySlotEquipInternal(avId, invItem, container, t);
    }

    return {
      inventoryItem: invItem.get({ plain: true }),
      wallet: wallet.get({ plain: true }),
      container: container.get({ plain: true }),
    };
  });
}

async function applySlotEquipInternal(avatarId, invItem, shopContainer, transaction) {
  const slotKey = invItem.slot || shopContainer?.slot || "top";
  const slotRule = SHOP_3D_RULES.SLOTS[slotKey] || { conflictsWith: [] };
  const slotsToUnequip = [slotKey, ...(slotRule.conflictsWith || [])];

  // Desequipa qualquer outro item nos slots conflitantes
  await repo.Inventory.update(
    { isEquipped: false },
    {
      where: {
        avatarId,
        slot: { [Op.in]: slotsToUnequip },
        id: { [Op.ne]: invItem.id },
      },
      transaction,
    }
  );

  await repo.AvatarOutfit.destroy({
    where: {
      avatarId,
      slot: { [Op.in]: slotsToUnequip },
    },
    transaction,
  });

  invItem.isEquipped = true;
  await invItem.save({ transaction });

  await repo.AvatarOutfit.create(
    {
      avatarId,
      slot: slotKey,
      isEquiped: true,
      itemId: invItem.itemId,
      inventoryId: invItem.id,
      data: {
        name: invItem.name,
        model: shopContainer?.model || invItem.data?.model || "",
        prefabPath: shopContainer?.prefabPath || invItem.data?.prefabPath || "",
        customColors: invItem.customColors || {},
      },
    },
    { transaction }
  );
}

/**
 * Equipa ou desequipa uma peça do Guarda-Roupa e/ou atualiza as cores customizadas 3D
 */
async function toggleEquipItem({ userId, avatarId, inventoryId, forceEquip = null, customColors = null }) {
  await ensureShopSchemaAndSeed();
  const avId = Number(avatarId);
  const invId = Number(inventoryId);
  if (!avId || !invId) throw new Error("Parâmetros de guarda-roupa inválidos.");

  return await repo.sequelize.transaction(async (t) => {
    const avatar = await repo.Avatar.findByPk(avId, { transaction: t });
    if (!avatar) throw new Error("Avatar não encontrado.");
    if (userId && Number(avatar.userId) !== Number(userId)) {
      throw new Error("Sem permissão para alterar o guarda-roupa deste avatar.");
    }

    const invItem = await repo.Inventory.findOne({
      where: { id: invId, avatarId: avId },
      include: [{ model: repo.ShopContainer, as: "shopItem" }],
      transaction: t,
    });
    if (!invItem) throw new Error("Peça não encontrada no guarda-roupa deste avatar.");

    if (customColors && typeof customColors === "object") {
      invItem.customColors = { ...(invItem.customColors || {}), ...customColors };
    }

    const shouldEquip =
      forceEquip !== null && forceEquip !== undefined ? Boolean(forceEquip) : !invItem.isEquipped;

    if (shouldEquip) {
      await applySlotEquipInternal(avId, invItem, invItem.shopItem, t);
    } else {
      invItem.isEquipped = false;
      await invItem.save({ transaction: t });
      await repo.AvatarOutfit.destroy({
        where: { avatarId: avId, slot: invItem.slot || "top" },
        transaction: t,
      });
    }

    return {
      isEquipped: invItem.isEquipped,
      slot: invItem.slot,
      item: invItem.get({ plain: true }),
    };
  });
}

/**
 * Salva a combinação atual de peças equipadas no Avatar como um Preset/Estilo ("Look")
 */
async function saveOutfitStyle({ userId, avatarId, name }) {
  await ensureShopSchemaAndSeed();
  const avId = Number(avatarId);
  const styleName = String(name || "Meu Look 3D").trim().slice(0, 60);
  if (!avId || !styleName) throw new Error("Informe um nome para o Look.");

  const avatar = await repo.Avatar.findByPk(avId);
  if (!avatar) throw new Error("Avatar não encontrado.");
  if (userId && Number(avatar.userId) !== Number(userId)) {
    throw new Error("Sem permissão.");
  }

  const count = await repo.AvatarOutfitStyle.count({ where: { avatarId: avId } });
  if (count >= SHOP_3D_RULES.MAX_STYLES_PER_AVATAR) {
    throw new Error(`Limite máximo de ${SHOP_3D_RULES.MAX_STYLES_PER_AVATAR} looks salvos atingido.`);
  }

  const equippedItems = await repo.Inventory.findAll({
    where: { avatarId: avId, isEquipped: true },
  });

  if (equippedItems.length === 0) {
    throw new Error("Equipe pelo menos uma peça no avatar antes de salvar um Look!");
  }

  const itemsSnapshot = equippedItems.map((i) => ({
    inventoryId: i.id,
    itemId: i.itemId,
    slot: i.slot,
    name: i.name,
    customColors: i.customColors || {},
  }));

  const created = await repo.AvatarOutfitStyle.create({
    avatarId: avId,
    name: styleName,
    items: itemsSnapshot,
  });

  return created.get({ plain: true });
}

/**
 * Aplica todas as peças de um Preset/Estilo ("Look") salvo de uma só vez
 */
async function applyOutfitStyle({ userId, avatarId, styleId }) {
  await ensureShopSchemaAndSeed();
  const avId = Number(avatarId);
  const stId = Number(styleId);

  return await repo.sequelize.transaction(async (t) => {
    const avatar = await repo.Avatar.findByPk(avId, { transaction: t });
    if (!avatar) throw new Error("Avatar não encontrado.");
    if (userId && Number(avatar.userId) !== Number(userId)) {
      throw new Error("Sem permissão.");
    }

    const style = await repo.AvatarOutfitStyle.findOne({
      where: { id: stId, avatarId: avId },
      transaction: t,
    });
    if (!style) throw new Error("Look não encontrado.");

    // Desequipa tudo primeiro
    await repo.Inventory.update({ isEquipped: false }, { where: { avatarId: avId }, transaction: t });
    await repo.AvatarOutfit.destroy({ where: { avatarId: avId }, transaction: t });

    const itemsList = Array.isArray(style.items) ? style.items : [];
    for (const entry of itemsList) {
      const invItem = await repo.Inventory.findOne({
        where: { id: Number(entry.inventoryId), avatarId: avId },
        include: [{ model: repo.ShopContainer, as: "shopItem" }],
        transaction: t,
      });
      if (invItem) {
        if (entry.customColors) invItem.customColors = entry.customColors;
        await applySlotEquipInternal(avId, invItem, invItem.shopItem, t);
      }
    }

    return { appliedStyle: style.get({ plain: true }) };
  });
}

async function deleteOutfitStyle({ userId, avatarId, styleId }) {
  const avId = Number(avatarId);
  const avatar = await repo.Avatar.findByPk(avId);
  if (!avatar || (userId && Number(avatar.userId) !== Number(userId))) {
    throw new Error("Sem permissão.");
  }
  await repo.AvatarOutfitStyle.destroy({ where: { id: Number(styleId), avatarId: avId } });
  return { success: true };
}

/**
 * Criação ou Edição de Item na Loja 3D (usado pelo /admin ou Criador Autorizado)
 */
async function saveShopCatalogItem(payload = {}) {
  await ensureShopSchemaAndSeed();
  const id = payload.id ? Number(payload.id) : null;
  const slotKey = SHOP_3D_RULES.SLOTS[payload.slot] ? payload.slot : "top";
  const currencyType = SHOP_3D_RULES.CURRENCIES.includes(payload.currencyType) ? payload.currencyType : "Coins";
  const rarity = SHOP_3D_RULES.RARITIES[payload.rarity] ? payload.rarity : "common";
  const gender = normalizeGenderStr(payload.gender);

  const fields = {
    title: String(payload.title || "Nova Roupa 3D").trim(),
    description: String(payload.description || "").trim(),
    slot: slotKey,
    category: String(payload.category || "clothing").trim(),
    model: String(payload.model || `mesh_${slotKey}_${Date.now()}`).trim(),
    prefabPath: String(payload.prefabPath || `res://assets/avatars3d/clothes/${slotKey}/${payload.model || "item"}.tscn`).trim(),
    currencyType,
    price: String(Math.max(0, Number(payload.price || 0))),
    rarity,
    gender,
    thumb: String(payload.thumb || "").trim(),
    defaultColors: payload.defaultColors || {
      primary: payload.primaryColor || "#3b82f6",
      secondary: payload.secondaryColor || "#ffffff",
    },
    stock: payload.stock !== undefined && payload.stock !== "" ? Number(payload.stock) : -1,
    active: payload.active !== undefined ? Boolean(payload.active === true || payload.active === "true") : true,
    avatarId: Number(payload.avatarId || 0),
    onnerId: Number(payload.avatarId || payload.onnerId || 0),
  };

  let container;
  if (id) {
    container = await repo.ShopContainer.findByPk(id);
    if (!container) throw new Error("Item da loja não encontrado.");
    await container.update(fields);
  } else {
    container = await repo.ShopContainer.create(fields);
    await repo.ShopItem.create({
      containerId: container.id,
      model: fields.model,
      slot: fields.slot,
      shader: payload.shader || "standard_pbr_3d",
      colors: fields.defaultColors,
      strings: { prefabPath: fields.prefabPath },
      textures_paths: { main: fields.thumb },
    });
  }

  return await repo.ShopContainer.findByPk(container.id, {
    include: [{ model: repo.ShopItem, as: "items" }],
  });
}

async function deleteShopCatalogItem(containerId) {
  const cId = Number(containerId);
  await repo.ShopItem.destroy({ where: { containerId: cId } });
  await repo.ShopContainer.destroy({ where: { id: cId } });
  return { deletedId: cId };
}

/**
 * Presentear outro jogador (Avatar) com uma peça da Loja 3D usando Coins (moeda do jogo)
 */
async function giftShopItem({ buyerUserId, buyerAvatarId, recipientAvatarInput, containerId }) {
  await ensureShopSchemaAndSeed();
  const sId = Number(buyerAvatarId || 0);
  const cId = Number(containerId || 0);
  const rawRecipient = String(recipientAvatarInput || "").trim().replace(/^#/, "");
  if (!sId || !cId || !rawRecipient) {
    throw new Error("Informe o item e o ID ou nome do amigo para presentear.");
  }

  return await repo.sequelize.transaction(async (t) => {
    const buyerAvatar = await repo.Avatar.findByPk(sId, { transaction: t });
    if (!buyerAvatar) throw new Error("Avatar comprador não encontrado.");

    let recipientAvatar = null;
    if (/^\d+$/.test(rawRecipient)) {
      recipientAvatar = await repo.Avatar.findByPk(Number(rawRecipient), { transaction: t });
    }
    if (!recipientAvatar) {
      recipientAvatar = await repo.Avatar.findOne({
        where: { name: { [Op.iLike]: rawRecipient } },
        transaction: t,
      });
    }
    if (!recipientAvatar) {
      throw new Error(`Avatar destinatário "${recipientAvatarInput}" não encontrado.`);
    }
    if (Number(recipientAvatar.id) === sId) {
      throw new Error("Para você mesmo, use o botão Comprar Agora.");
    }

    const container = await repo.ShopContainer.findByPk(cId, { lock: t.LOCK.UPDATE, transaction: t });
    if (!container || !container.active) {
      throw new Error("Este item não está disponível na Loja 3D.");
    }
    if (Number(container.stock) === 0) {
      throw new Error("Este item esgotou na loja!");
    }
    if (!isGenderCompatible(container.gender, recipientAvatar.gender)) {
      throw new Error(
        `Esta peça é exclusiva para o esqueleto 3D ${container.gender === "Female" ? "Feminino" : "Masculino"} e não é compatível com o avatar de ${recipientAvatar.name}.`
      );
    }

    const existing = await repo.Inventory.findOne({
      where: { avatarId: recipientAvatar.id, itemId: cId },
      transaction: t,
    });
    if (existing) {
      throw new Error(`${recipientAvatar.name} já possui esta peça no Guarda-Roupa!`);
    }

    const priceCoins = Math.max(0, Number(container.price || 0));
    const buyerWallet = await repo.Currency.findOne({
      where: { [Op.or]: [{ avatarId: sId }, { ownerId: sId }] },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!buyerWallet || Number(buyerWallet.coins || 0) < priceCoins) {
      throw new Error(`Saldo insuficiente de Coins para presentear (${priceCoins} Coins necessários).`);
    }

    if (priceCoins > 0) {
      buyerWallet.coins = Number((Number(buyerWallet.coins) - priceCoins).toFixed(2));
      await buyerWallet.save({ transaction: t });

      await repo.sequelize
        .query(
          `INSERT INTO "wallet_ledger"
            ("userId", "avatarId", "currencyType", "direction", "grossAmount", "feeAmount", "netAmount", "balanceAfter", "category", "description", "relatedAvatarId", "createdAt")
           VALUES (:userId, :avatarId, 'Coins', 'DEBIT', :grossAmount, 0, :netAmount, :balanceAfter, 'SHOP_GIFT', :description, :relatedAvatarId, NOW())`,
          {
            replacements: {
              userId: buyerUserId || buyerAvatar.userId || null,
              avatarId: sId,
              grossAmount: priceCoins,
              netAmount: priceCoins,
              balanceAfter: buyerWallet.coins,
              description: `Presente enviado na Loja 3D: "${container.title}" para ${recipientAvatar.name} (#${recipientAvatar.id})`,
              relatedAvatarId: recipientAvatar.id,
            },
            transaction: t,
          }
        )
        .catch(() => {});

      const creatorAvatarId = Number(container.avatarId || container.onnerId || 0);
      if (creatorAvatarId > 0 && creatorAvatarId !== sId) {
        const ecoRule = await repo.EconomyRule.findOne({ where: { key: "default" }, transaction: t });
        const platformFeePct = Number(ecoRule?.shopSalePlatformFeePercent ?? 30);
        const creatorSharePct = Math.max(0, 100 - platformFeePct);
        const creatorShare = Number(((priceCoins * creatorSharePct) / 100).toFixed(2));
        const platformShare = Number((priceCoins - creatorShare).toFixed(2));

        const creatorWallet = await repo.Currency.findOne({
          where: { [Op.or]: [{ avatarId: creatorAvatarId }, { ownerId: creatorAvatarId }] },
          lock: t.LOCK.UPDATE,
          transaction: t,
        });
        if (creatorWallet && creatorShare > 0) {
          creatorWallet.coins = Number((Number(creatorWallet.coins || 0) + creatorShare).toFixed(2));
          await creatorWallet.save({ transaction: t });
        }
        if (ecoRule && platformShare > 0) {
          ecoRule.collectedFeesCoins = Number((Number(ecoRule.collectedFeesCoins || 0) + platformShare).toFixed(4));
          await ecoRule.save({ transaction: t });
        }
      }
    }

    container.sales = Number(container.sales || 0) + 1;
    if (Number(container.stock) > 0) container.stock = Number(container.stock) - 1;
    await container.save({ transaction: t });

    const invItem = await repo.Inventory.create(
      {
        avatarId: recipientAvatar.id,
        itemId: container.id,
        name: container.title,
        slot: container.slot || "top",
        categoria: container.category || "clothing",
        isEquipped: false,
        customColors: container.defaultColors || { primary: "#3b82f6", secondary: "#ffffff" },
        data: {
          model: container.model,
          prefabPath: container.prefabPath || "",
          thumb: container.thumb || "",
          rarity: container.rarity || "common",
          giftedByAvatarId: sId,
          giftedByName: buyerAvatar.name,
        },
      },
      { transaction: t }
    );

    await repo.sequelize
      .query(
        `INSERT INTO "user_notifications" ("userId", "avatarId", "type", "title", "message", "icon", "isRead", "createdAt")
         VALUES (:userId, :avatarId, 'SHOP', :title, :message, 'fa-gift', FALSE, NOW())`,
        {
          replacements: {
            userId: recipientAvatar.userId || null,
            avatarId: recipientAvatar.id,
            title: "🎁 Você recebeu um Presente 3D!",
            message: `${buyerAvatar.name} presenteou você com "${container.title}" na Loja 3D! Já está no seu Guarda-Roupa.`,
          },
          transaction: t,
        }
      )
      .catch(() => {});

    return {
      success: true,
      recipient: { id: recipientAvatar.id, name: recipientAvatar.name },
      item: container.get({ plain: true }),
      inventoryItem: invItem.get({ plain: true }),
    };
  });
}

module.exports = {
  SHOP_3D_RULES,
  ensureShopSchemaAndSeed,
  listShopCatalog,
  getAvatarWardrobe,
  buyShopItem,
  giftShopItem,
  toggleEquipItem,
  saveOutfitStyle,
  applyOutfitStyle,
  deleteOutfitStyle,
  saveShopCatalogItem,
  deleteShopCatalogItem,
};
