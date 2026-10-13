const path = require("path");
require("dotenv").config();

const { Sequelize, Op } = require("sequelize");
const modelsInitializer = require('../models/index.js');
const gameModels = require('../models/game/index.js');

const DB_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

// Validação explícita para evitar crash silencioso no Sequelize
if (!DB_URL) {
  console.error(
    "❌ ERRO CRÍTICO: DATABASE_URL não foi encontrada. Verifique o caminho do seu arquivo .env",
  );
  process.exit(1);
}

const sequelize = new Sequelize(DB_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    family: 4, // Força IPv4 para evitar erro ENETUNREACH
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Inicializa os modelos
const models = modelsInitializer(sequelize);

Object.keys(models).forEach((modelName) => {
  if (typeof models[modelName].associate === "function") {
    models[modelName].associate(models);
  }
});

async function dropLegacyProfileConstraints() {
  try {
    await sequelize.query(`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (
          SELECT tc.table_name, tc.constraint_name
          FROM information_schema.table_constraints tc
          LEFT JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            AND (
              ccu.table_name = 'profiles'
              OR tc.table_name IN ('friends', 'posts', 'likes', 'comments', 'photos', 'follows', 'match_profiles', 'mini_reels')
              OR tc.constraint_name IN (
                'chat_participants_profile_id_fkey',
                'chat_messages_profile_id_fkey',
                'ignores_profileId_fkey',
                'system_announcements_created_by_fkey'
              )
            )
        ) LOOP
          EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
        END LOOP;
      END $$;
    `);
  } catch (err) {
    console.warn("⚠️ Aviso ao limpar FKs legadas de profiles:", err.message);
  }
}

dropLegacyProfileConstraints()
  .then(() => sequelize.sync({ alter: true }))
  .then(() => dropLegacyProfileConstraints())
  .then(() =>
    console.log("⚡ Banco PostgreSQL (Supabase) e tabelas sincronizados!"),
  )
  .catch((err) =>
    console.error("❌ Erro ao sincronizar o banco PostgreSQL:", err),
  );

function translateOperator(opStr) {
  const map = {
    "=": Op.eq,
    "⁼": Op.eq,
    "!=": Op.ne,
    ">": Op.gt,
    "<": Op.lt,
    ">=": Op.gte,
    "<=": Op.lte,
    like: Op.iLike,
    "≃": Op.iLike,
  };
  return map[opStr.trim().toLowerCase()] || Op.eq;
}

function parseOrderByString(queryString) {
  if (!queryString || !queryString.includes("|")) return [["id", "ASC"]];

  const orderPart = queryString.split("|")[1].trim();
  const [field, direction] = orderPart.split(/\s+/);

  if (field) {
    const dir =
      direction && direction.toUpperCase() === "DESC" ? "DESC" : "ASC";
    return [[field, dir]];
  }

  return [["id", "ASC"]];
}

//recebe o parseQueryStringToWhere, retorna o whereCondition



function parseQueryStringToWhere(queryString) {
  if (!queryString) return {};

  let filterPart = queryString.split("|")[0].trim();
  filterPart = filterPart.replace(/^where/i, "").trim();
  if (!filterPart) return {};

  const whereCondition = {};
  const regex = /(and|or|,)?\s*\[([^,]+),([^,]+),([^\]]+)\]/gi;
  let match;

  const andConditions = [];
  const orConditions = [];

  while ((match = regex.exec(filterPart)) !== null) {
    const connector = match[1] ? match[1].toLowerCase() : ",";
    const field = match[2].trim();
    const operator = match[3].trim();
    let value = match[4].trim();

    value = value.replace(/^['"]|['"]$/g, "");

    if (!isNaN(value) && value !== "") {
      value = Number(value);
    } else if (value === "true") {
      value = true;
    } else if (value === "false") {
      value = false;
    }

    const seqOp = translateOperator(operator);
    const finalValue =
      seqOp === Op.iLike || seqOp === Op.like ? `%${value}%` : value;
    const conditionBlock = { [field]: { [seqOp]: finalValue } };

    if (connector === "or") {
      orConditions.push(conditionBlock);
    } else {
      andConditions.push(conditionBlock);
    }
  }

  if (andConditions.length > 0) {
    if (andConditions.length === 1) {
      Object.assign(whereCondition, andConditions[0]);
    } else {
      whereCondition[Op.and] = andConditions;
    }
  }

  if (orConditions.length > 0) {
    if (orConditions.length === 1 && andConditions.length === 0) {
      Object.assign(whereCondition, orConditions[0]);
    } else {
      whereCondition[Op.or] = orConditions;
    }
  }

  return whereCondition;
}

module.exports = {
  sequelize,
  parseOrderByString,
  parseQueryStringToWhere,
  Sequelize,
  ...models,
};
