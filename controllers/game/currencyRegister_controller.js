
const router = require("express").Router();
const repo = require("../../repository");
const walletController = require("./currency_controllers");
const { CheckLogin: CheckAuth } = require("../auth");

const sequelize = repo.sequelize; // ajuste se a instância estiver em outro lugar

//#region [Config]

// Taxas em % (inteiro). Sempre calculadas com Math.floor.
const FEE_PERCENT = {
  deposit: 0,   // sem taxa
  withdraw: 5,  // 5% no saque
  transfer: 2,  // 2% na transferência (descontado do valor recebido)
  convert: 2,   // 2% na conversão (descontado da moeda final)
};

// Profile "banco" que recebe as taxas, mantém o ledger fechado.
const SYSTEM_PROFILE_ID = process.env.SYSTEM_PROFILE_ID;

const CURRENCIES = ["Coins", "Cash", "Chips"];
const TYPES = [...CURRENCIES, "None", "All"];
const TRANSACTION_TYPES = [
  "Deposit", "Withdraw", "Buy", "Sell", "Bonus",
  "Rewards", "Transfer", "Convert", "None", "All",
];
const ADMIN_ROLES = ["admin", "owner", "ownner"];

// Base inteira: 1 chip = 1 unidade. 1 coin = 10 unidades, 1 cash = 250 unidades.

const CONVERSION ={
  Dollar: 5.55,
  Cash: 1,//dollar -> cash, valor: 5.55
  Coins: 250, //cash -> coins, valor: 5.55/250=0.022
  Chips: 2500,  //coins -> chips, valor: 0.0222/2500=0.0088
}


const UNIT = { Chips: 1, Coins: 10, Cash: 250 };

// Mapeamento coluna do cache da wallet
const COLUMN = { Chips: "chips", Coins: "coins", Cash: "cash" };

// Conversões permitidas
const ALLOWED_CONVERSIONS = {
  Cash: ["Coins"],
  Coins: ["Cash", "Chips"],
  Chips: ["Coins"],
};

//#endregion

//#region [Rotas]

router.get("/bank", CheckAuth, getAll);            // extrato do usuário logado
router.post("/bank", CheckAuth, create);           // cria registro manual (admin/owner)

router.post("/bank/deposit", CheckAuth, _deposit);   // depende de gateway de pagamento
router.post("/bank/withdraw", CheckAuth, _withdraw); // Cash -> saque
router.post(["/bank/transfer", "/bank/transfer/:id"], CheckAuth, _transfer);
router.post("/bank/convert", CheckAuth, _convert);   // cash<->coins, coins<->chips
router.post("/bank/balance", CheckAuth, _balance);
router.get("/bank/balance", CheckAuth, _balance);

router.get("/bank/:id", CheckAuth, getById);       // sempre depois de /bank/balance

// Registros nunca são atualizados nem removidos (ledger append-only).

//#endregion

//#region [Helpers]

class HttpError extends Error
{
  constructor(message, status = 400)
  {
    super(message);
    this.status = status;
  }
}

function sendError(res, err, extra = {})
{
  const known = err instanceof HttpError;
  if (!known) console.error("[bank]", err);
  return res.status(known ? err.status : 500).json({
    success: false,
    error: known ? err.message : "Erro interno",
    ...extra,
  });
}

function parseAmount(raw)
{
  const amount = Number(raw);
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new HttpError("Valor inválido");
  return amount;
}

function assertCurrency(type)
{
  if (!CURRENCIES.includes(type)) throw new HttpError("Tipo de moeda inválido");
}

function calcFee(amount, percent)
{
  return Math.floor((amount * percent) / 100);
}

function assertSystemProfile(fee)
{
  if (fee > 0 && !SYSTEM_PROFILE_ID) throw new Error("SYSTEM_PROFILE_ID não configurado");
}

// TODO: implementar verificação real do PIN (hash) do usuário.
async function verifyPin(userId, pin)
{
  return true;
}

async function requireAdmin(userId)
{
  const user = await repo.User.findByPk(userId);
  if (!user || !ADMIN_ROLES.includes(user.role)) throw new HttpError("Não autorizado", 403);
  return user;
}

// Trava a linha da wallet para serializar operações do mesmo dono.
async function lockWallet(ownerId, t)
{
  const wallet = await repo.Wallet.findOne({
    where: { ownerId },
    transaction: t,
    lock: t.LOCK.UPDATE,
  });
  if (!wallet) throw new HttpError("Wallet não encontrada", 404);
  return wallet;
}

// Saldo real vindo do ledger (não do cache), dentro da transaction.
async function getLedgerBalance(ownerId, type, t)
{
  const sum = await repo.CurrencyRegister.sum("value", {
    where: { ownerId, type },
    transaction: t,
  });
  return Number(sum) || 0;
}

async function assertFunds(ownerId, type, amount, t)
{
  const balance = await getLedgerBalance(ownerId, type, t);
  if (balance < amount) throw new HttpError("Saldo insuficiente");
}

// Único ponto de escrita de lançamentos nas operações do banco.
async function applyEntries(entries, t)
{
  for (const e of entries)
  {
    if (!e.ownerId) throw new Error("Entry sem ownerId");
    if (!CURRENCIES.includes(e.type)) throw new Error(`Entry com type inválido: ${e.type}`);
    if (!Number.isSafeInteger(e.value) || e.value === 0) throw new Error("Entry com value inválido");
  }
  return repo.CurrencyRegister.bulkCreate(entries, { transaction: t });
}

// Recalcula o cache das wallets envolvidas (após o commit).
async function refreshBalances(ids)
{
  const unique = [...new Set(ids.filter(Boolean))];
  await Promise.all(unique.map(async (id) =>
  {
    try { await walletController.SumBalance(id); }
    catch (e) { console.error("[bank] SumBalance falhou para", id, e.message); }
  }));
}

//#endregion

//#region [Deposito, saque, transferencia, conversao]

// Depósito = crédito vindo de pagamento. Só pode ser chamado pelo gateway após confirmação.
async function _deposit(req, res)
{
  return res.status(501).json({
    success: false,
    error: "Depósito requer integração com gateway de pagamento",
  });
}

async function _withdraw(req, res)
{
  try
  {
    const { pin } = req.body;
    const amount = parseAmount(req.body.value);
    const ownerId = req.profileId;
    const userId = req.userId;

    await verifyPin(userId, pin);

    const fee = calcFee(amount, FEE_PERCENT.withdraw);
    const net = amount - fee;
    if (net <= 0) throw new HttpError("Valor muito baixo para sacar");
    assertSystemProfile(fee);

    await sequelize.transaction(async (t) =>
    {
      await lockWallet(ownerId, t);
      await assertFunds(ownerId, "Cash", amount, t);

      const desc = `Withdraw ${amount} Cash (net ${net})`;
      const entries = [
        { ownerId, userId, type: "Cash", value: -amount, description: desc, transactionType: "Withdraw" },
      ];
      if (fee > 0)
        entries.push({ ownerId: SYSTEM_PROFILE_ID, userId, type: "Cash", value: fee, description: `Fee ${desc}`, transactionType: "Withdraw" });

      await applyEntries(entries, t);
      // TODO: enfileirar o pagamento externo de `net` aqui (mesma transaction ou outbox).
    });

    await refreshBalances([ownerId, fee > 0 && SYSTEM_PROFILE_ID]);
    return res.json({ success: true, data: { amount, fee, net } });
  } catch (error)
  {
    return sendError(res, error);
  }
}

async function _transfer(req, res)
{
  try
  {
    const { toID, pin, type } = req.body; // toID = userId do destinatário
    const amount = parseAmount(req.body.value);
    assertCurrency(type);

    const ownerId = req.profileId;
    const userId = req.userId;

    await verifyPin(userId, pin);

    const [fromProfile, toProfile] = await Promise.all([
      repo.Profile.findByPk(ownerId),
      repo.Profile.findOne({ where: { userId: toID } }),
    ]);
    if (!fromProfile) throw new HttpError("Perfil de origem não encontrado", 404);
    if (!toProfile) throw new HttpError("Destinatário não encontrado", 404);
    if (toProfile.id === ownerId) throw new HttpError("Não é possível transferir para si mesmo");

    const fee = calcFee(amount, FEE_PERCENT.transfer);
    const net = amount - fee;
    if (net <= 0) throw new HttpError("Valor muito baixo para transferir");
    assertSystemProfile(fee);

    await sequelize.transaction(async (t) =>
    {
      await lockWallet(ownerId, t);
      await assertFunds(ownerId, type, amount, t);

      const entries = [
        { ownerId, userId, type, value: -amount, description: `Transfer to ${toProfile.name}`, transactionType: "Transfer" },
        { ownerId: toProfile.id, userId, type, value: net, description: `Transfer from ${fromProfile.name}`, transactionType: "Transfer" },
      ];
      if (fee > 0)
        entries.push({ ownerId: SYSTEM_PROFILE_ID, userId, type, value: fee, description: `Transfer fee (${fromProfile.name} -> ${toProfile.name})`, transactionType: "Transfer" });

      await applyEntries(entries, t);
    });

    await refreshBalances([ownerId, toProfile.id, fee > 0 && SYSTEM_PROFILE_ID]);
    return res.json({ success: true, data: { amount, fee, received: net } });
  } catch (error)
  {
    return sendError(res, error);
  }
}

async function _convert(req, res)
{
  try
  {
    const { type, toType, pin } = req.body;
    const amount = parseAmount(req.body.value);
    const ownerId = req.profileId;
    const userId = req.userId;

    assertCurrency(type);
    assertCurrency(toType);
    if (!ALLOWED_CONVERSIONS[type]?.includes(toType)) throw new HttpError("Conversão não permitida");

    await verifyPin(userId, pin);

    const gross = Math.floor((amount * UNIT[type]) / UNIT[toType]);
    const fee = calcFee(gross, FEE_PERCENT.convert);
    const net = gross - fee;
    if (net <= 0) throw new HttpError("Valor muito baixo para converter");
    assertSystemProfile(fee);

    const desc = `Convert ${amount} ${type} to ${net} ${toType}`;

    await sequelize.transaction(async (t) =>
    {
      await lockWallet(ownerId, t);
      await assertFunds(ownerId, type, amount, t);

      const entries = [
        { ownerId, userId, type, value: -amount, description: desc, transactionType: "Convert" },
        { ownerId, userId, type: toType, value: net, description: desc, transactionType: "Convert" },
      ];
      if (fee > 0)
        entries.push({ ownerId: SYSTEM_PROFILE_ID, userId, type: toType, value: fee, description: `Fee ${desc}`, transactionType: "Convert" });

      await applyEntries(entries, t);
    });

    await refreshBalances([ownerId, fee > 0 && SYSTEM_PROFILE_ID]);
    const wallet = await walletController._getByOwnerId(ownerId);
    return res.json({ success: true, data: wallet, meta: { gross, fee, net } });
  } catch (error)
  {
    return sendError(res, error);
  }
}

//#endregion

//#region [Consultas]

async function _balance(req, res)
{
  try
  {
    const wallet = await walletController._getByOwnerId(req.profileId);
    return res.json({ success: true, data: wallet });
  } catch (error)
  {
    return sendError(res, error);
  }
}

async function getAll(req, res)
{
  try
  {
    const queryStr = req.query?.q || req.body?.q || "";
    const whereCondition = repo.parseQueryStringToWhere(queryStr);
    const orderCondition = repo.parseOrderByString(queryStr);

    const limit = Math.min(
      parseInt(req.query?.limit || req.body?.limit || req.body?.take) || 50,
      200,
    );
    const offset = Math.max(
      parseInt(req.query?.offset || req.body?.skip || req.body?.offset) || 0,
      0,
    );

    const registers = await repo.CurrencyRegister.findAndCountAll({
      // ownerId DEPOIS do spread: a query do cliente nunca sobrescreve o filtro
      where: { ...whereCondition, ownerId: req.profileId },
      order: orderCondition,
      limit,
      offset,
    });

    const count = registers?.count || 0;
    return res.json({
      success: true,
      data: registers?.rows || [],
      count,
      skip: offset,
      limit,
      nextPage: count <= offset + limit ? 0 : Math.ceil((offset + limit) / limit) + 1,
    });
  } catch (err)
  {
    return sendError(res, err, { data: [] });
  }
}

async function getById(req, res)
{
  try
  {
    const register = await repo.CurrencyRegister.findOne({
      where: { id: req.params.id, ownerId: req.profileId },
    });
    if (!register) throw new HttpError("Currency register not found", 404);
    return res.json({ success: true, data: register });
  } catch (err)
  {
    return sendError(res, err);
  }
}

//#endregion

//#region [Criação manual (admin)]

function checkData(registerData)
{
  let error = "";
  try
  {
    if (!registerData)
      throw new Error("Dados do registro de moeda são obrigatórios.");
    if (!registerData.userId)
      throw new Error("O userId é obrigatório.");
    if (!registerData.type)
      throw new Error("O tipo de transação (type) é obrigatório.");
    if (!TYPES.includes(registerData.type))
      throw new Error("Tipo de moeda (type) inválido.");
    if (registerData.value === undefined || registerData.value === null)
      throw new Error("O valor (value) é obrigatório.");
    if (!Number.isFinite(Number(registerData.value)))
      throw new Error("O valor (value) deve ser numérico.");
    if (!registerData.ownerId)
      throw new Error("O ownerId é obrigatório.");
    if (registerData.transactionType && !TRANSACTION_TYPES.includes(registerData.transactionType))
      throw new Error("transactionType inválido.");
  } catch (e)
  {
    error = e.message;
  }
  return error;
}

async function create(req, res)
{
  try
  {
    await requireAdmin(req.userId);

    const b = req.body || {};
    const registerData = {
      ownerId: b.ownerId,
      userId: b.userId || req.userId,
      type: b.type,
      value: b.value,
      description: b.description,
      transactionType: b.transactionType,
    };

    const error = checkData(registerData);
    if (error) throw new HttpError(error);

    const result = await CreateCurrencyRegister(registerData, req.userId);
    if (!result.success) throw new HttpError(result.error);

    await refreshBalances([registerData.ownerId]);
    return res.json({ success: true, data: result.data });
  } catch (err)
  {
    return sendError(res, err);
  }
}

//#endregion

//#region [API interna (exportada)]

// Registros são imutáveis.
async function UpdateCurrencyRegister(registerData, userId, transaction = null)
{
  return { error: "not authorized", success: false };
}

// Leitura do cache da wallet.
async function GetValue(avatarID, type = "Coins")
{
  if (!CURRENCIES.includes(type)) return 0;
  const wallet = await walletController._getByUserId(avatarID);
  if (!wallet) return 0;
  return wallet[COLUMN[type]] ?? 0;
}

async function GetRegisters(avatarID, type = "Coins", limit = 100)
{
  const normalized = type === "Coin" ? "Coins" : type;
  const where = { ownerId: avatarID };
  if (CURRENCIES.includes(normalized)) where.type = normalized;
  else if (normalized === "None") where.type = "None";
  // "All" ou desconhecido: sem filtro de tipo

  return repo.CurrencyRegister.findAll({
    where,
    order: [["id", "DESC"]],
    limit,
  });
}

// Mantém o contrato { success, data | error } usado por outros módulos.
async function CreateCurrencyRegister(registerData, userId, transaction = null)
{
  try
  {
    const valid = checkData(registerData);
    if (valid) throw new Error(valid);

    const user = await repo.User.findByPk(userId);
    if (!user) throw new Error("User not found");

    const register = transaction === null
      ? await repo.CurrencyRegister.create(registerData)
      : await repo.CurrencyRegister.create(registerData, { transaction });

    if (!register) throw new Error("Currency register not created");
    return { success: true, data: register };
  } catch (err)
  {
    return { error: err.message, success: false };
  }
}
//#endregion

//auxiliar para conversao na compra

///<param name="value">valor em moedas</param>
///<returns>valor em real brl</returns>
async function ConvertCoinToMoney(value) {
  return value * (CONVERSION.Dollar/CONVERSION.Coins);
}
///<param name="value">valor em usd</param>
///<returns>valor em moedas</returns>
async function ConvertMoneyToCoin(value) {
  return value / (CONVERSION.Dollar/CONVERSION.Coins);
}


module.exports = {
  ConvertCoinToMoney,
  ConvertMoneyToCoin,

  CreateCurrencyRegister,
  UpdateCurrencyRegister,
  GetValue,
  GetRegisters,
  router,
};
