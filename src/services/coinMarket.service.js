const repo = require("../repositories/repository");
const { Op } = require("sequelize");

let _feeTablesEnsured = false;

/**
 * Garante que todas as colunas da tabela unificada de taxas (economy_rules)
 * e as tabelas de passe de 24h de salas (room_entry_passes), visitas únicas mensais (room_visits)
 * e pagamentos por cada 1.000 visitas únicas no mês (room_visit_payouts) existam no PostgreSQL.
 */
async function ensureFeeAndRoomTables() {
  if (_feeTablesEnsured) return;
  try {
    await repo.sequelize.query(`
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "cashToCoinsFeePercent" NUMERIC(6,2) DEFAULT 0.00;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "withdrawFeePercent" NUMERIC(6,2) DEFAULT 0.00;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "withdrawFixedFeeCash" NUMERIC(10,2) DEFAULT 0.00;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "shopCreationFixedFeeCoins" NUMERIC(10,2) DEFAULT 5.00;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "shopTextureUploadFixedFeeCoins" NUMERIC(10,2) DEFAULT 1.00;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "shopSalePlatformFeePercent" NUMERIC(6,2) DEFAULT 30.00;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "roomEntryPlatformFeePercent" NUMERIC(6,2) DEFAULT 15.00;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "roomPassDurationHours" INTEGER DEFAULT 24;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "roomVisitsPayoutPer1kCoins" NUMERIC(10,2) DEFAULT 50.00;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "roomBoost24hFeeCoins" NUMERIC(10,2) DEFAULT 20.00;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "p2pCoinsTransferFeePercent" NUMERIC(6,2) DEFAULT 2.00;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "vipPrice1WeekCash" NUMERIC(10,2) DEFAULT 0.75;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "vipPrice1MonthCash" NUMERIC(10,2) DEFAULT 2.00;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "vipPrice3MonthsCash" NUMERIC(10,2) DEFAULT 5.00;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "basicMaxChatOpensPerDay" INTEGER DEFAULT 3;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "basicMaxChatImagesPerDay" INTEGER DEFAULT 2;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "basicMaxChatAudioPerDay" INTEGER DEFAULT 2;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "vipMaxChatImagesPerDay" INTEGER DEFAULT 0;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "vipMaxChatAudioPerDay" INTEGER DEFAULT 0;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "casinoHouseEdgePercent" NUMERIC(6,2) DEFAULT 5.00;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "diaryMinReadSeconds" INTEGER DEFAULT 30;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "diaryReaderRewardPerPageCoins" NUMERIC(10,2) DEFAULT 0.25;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "diaryAuthorRewardPerReadCoins" NUMERIC(10,2) DEFAULT 0.50;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "diaryAuthorBonusPer10MinCoins" NUMERIC(10,2) DEFAULT 5.00;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "diaryReaderDailyLimitPages" INTEGER DEFAULT 20;
      ALTER TABLE IF EXISTS "economy_rules" ADD COLUMN IF NOT EXISTS "collectedFeesCoins" NUMERIC(16,4) DEFAULT 0.0000;

      ALTER TABLE IF EXISTS "rooms" ADD COLUMN IF NOT EXISTS "entryValue" DOUBLE PRECISION DEFAULT 0;
      ALTER TABLE IF EXISTS "rooms" ADD COLUMN IF NOT EXISTS "visits" INTEGER DEFAULT 0;
      ALTER TABLE IF EXISTS "rooms" ADD COLUMN IF NOT EXISTS "boostExpiresAt" TIMESTAMPTZ;

      ALTER TABLE IF EXISTS "avatars" ADD COLUMN IF NOT EXISTS "isVip" BOOLEAN DEFAULT FALSE;
      ALTER TABLE IF EXISTS "avatars" ADD COLUMN IF NOT EXISTS "vipExpiresAt" TIMESTAMPTZ;
      ALTER TABLE IF EXISTS "avatars" ADD COLUMN IF NOT EXISTS "vipPlan" VARCHAR(32);

      CREATE TABLE IF NOT EXISTS "room_entry_passes" (
        "id" SERIAL PRIMARY KEY,
        "roomId" INTEGER NOT NULL,
        "visitorAvatarId" INTEGER NOT NULL,
        "ownerAvatarId" INTEGER,
        "entryPrice" NUMERIC(12, 2) DEFAULT 0,
        "platformFee" NUMERIC(12, 2) DEFAULT 0,
        "ownerNetReceived" NUMERIC(12, 2) DEFAULT 0,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "room_visits" (
        "id" SERIAL PRIMARY KEY,
        "roomId" INTEGER NOT NULL,
        "visitorAvatarId" INTEGER NOT NULL,
        "visitorUserId" INTEGER,
        "monthKey" VARCHAR(16) NOT NULL,
        "visitCount" INTEGER DEFAULT 1,
        "firstVisitedAt" TIMESTAMPTZ DEFAULT NOW(),
        "lastVisitedAt" TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE ("roomId", "visitorAvatarId", "monthKey")
      );

      CREATE TABLE IF NOT EXISTS "room_visit_payouts" (
        "id" SERIAL PRIMARY KEY,
        "roomId" INTEGER NOT NULL,
        "ownerAvatarId" INTEGER NOT NULL,
        "monthKey" VARCHAR(16) NOT NULL,
        "milestone1k" INTEGER NOT NULL,
        "uniqueVisitsCount" INTEGER NOT NULL,
        "rewardCoins" NUMERIC(12, 2) NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE ("roomId", "monthKey", "milestone1k")
      );

      CREATE TABLE IF NOT EXISTS "wallet_ledger" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER,
        "avatarId" INTEGER NOT NULL,
        "currencyType" VARCHAR(16) NOT NULL DEFAULT 'Coins',
        "direction" VARCHAR(12) NOT NULL DEFAULT 'DEBIT',
        "grossAmount" NUMERIC(14, 2) NOT NULL DEFAULT 0,
        "feeAmount" NUMERIC(14, 2) NOT NULL DEFAULT 0,
        "netAmount" NUMERIC(14, 2) NOT NULL DEFAULT 0,
        "balanceAfter" NUMERIC(14, 2) DEFAULT 0,
        "category" VARCHAR(40) NOT NULL DEFAULT 'GENERAL',
        "description" TEXT,
        "relatedAvatarId" INTEGER,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "vip_subscriptions" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER,
        "avatarId" INTEGER NOT NULL,
        "planKey" VARCHAR(24) NOT NULL,
        "durationDays" INTEGER NOT NULL DEFAULT 30,
        "priceCash" NUMERIC(10, 2) NOT NULL DEFAULT 2.00,
        "currencyPaid" VARCHAR(16) NOT NULL DEFAULT 'Cash',
        "amountPaid" NUMERIC(12, 2) NOT NULL DEFAULT 2.00,
        "startsAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "user_notifications" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER,
        "avatarId" INTEGER NOT NULL,
        "type" VARCHAR(24) NOT NULL DEFAULT 'GENERAL',
        "title" VARCHAR(140) NOT NULL,
        "message" TEXT NOT NULL,
        "icon" VARCHAR(64) DEFAULT 'fa-bell',
        "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    _feeTablesEnsured = true;
  } catch (err) {
    console.warn("[ensureFeeAndRoomTables]", err.message);
  }
}

function getCurrentMonthKey(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * Busca (ou inicializa automaticamente) a tabela de regras econômicas e taxas de spread
 */
async function getEconomyRules(transaction = null) {
  await ensureFeeAndRoomTables();
  let rules = await repo.EconomyRule.findOne({
    where: { key: "default" },
    transaction,
  });

  if (!rules) {
    rules = await repo.EconomyRule.create(
      {
        key: "default",
        sellSpreadPercent: 0.500,
        buySpreadPercent: 0.100,
        rateCoinsPerCash: 250.00,
        rateChipsPerCoin: 10.00,
        usdBrlRate: 5.00,
        minPurchaseBrl: 10.00,
        minWithdrawCash: 1.00,
        buyApprovalMode: "AUTO",
        maxAutoBuyBrl: 500.00,
        withdrawApprovalMode: "AUTO",
        maxAutoWithdrawCash: 20.00,
        cashToCoinsFeePercent: 0.00,
        allowInstantCoinsToCash: true,
        instantCoinsToCashFeePercent: 30.00,
        coinsToChipsFeePercent: 0.00,
        chipsToCoinsFeePercent: 0.00,
        withdrawFeePercent: 0.00,
        withdrawFixedFeeCash: 0.00,
        shopCreationFixedFeeCoins: 5.00,
        shopTextureUploadFixedFeeCoins: 1.00,
        shopSalePlatformFeePercent: 30.00,
        roomEntryPlatformFeePercent: 15.00,
        roomPassDurationHours: 24,
        roomVisitsPayoutPer1kCoins: 50.00,
        roomBoost24hFeeCoins: 20.00,
        p2pCoinsTransferFeePercent: 2.00,
        vipPrice1WeekCash: 0.75,
        vipPrice1MonthCash: 2.00,
        vipPrice3MonthsCash: 5.00,
        basicMaxChatOpensPerDay: 3,
        basicMaxChatImagesPerDay: 2,
        basicMaxChatAudioPerDay: 2,
        vipMaxChatImagesPerDay: 0,
        vipMaxChatAudioPerDay: 0,
        casinoHouseEdgePercent: 5.00,
        diaryMinReadSeconds: 30,
        diaryReaderRewardPerPageCoins: 0.25,
        diaryAuthorRewardPerReadCoins: 0.50,
        diaryAuthorBonusPer10MinCoins: 5.00,
        diaryReaderDailyLimitPages: 20,
        collectedFeesCash: 0.0000,
        collectedFeesCoins: 0.0000,
      },
      { transaction }
    );
  }

  return rules;
}

/**
 * Atualiza as regras econômicas e de aprovação (para uso no Admin)
 */
async function updateEconomyRules(payload = {}) {
  const rules = await getEconomyRules();
  const allowedFields = [
    "sellSpreadPercent",
    "buySpreadPercent",
    "rateCoinsPerCash",
    "rateChipsPerCoin",
    "usdBrlRate",
    "minPurchaseBrl",
    "minWithdrawCash",
    "buyApprovalMode",
    "maxAutoBuyBrl",
    "withdrawApprovalMode",
    "maxAutoWithdrawCash",
    "cashToCoinsFeePercent",
    "allowInstantCoinsToCash",
    "instantCoinsToCashFeePercent",
    "coinsToChipsFeePercent",
    "chipsToCoinsFeePercent",
    "withdrawFeePercent",
    "withdrawFixedFeeCash",
    "shopCreationFixedFeeCoins",
    "shopTextureUploadFixedFeeCoins",
    "shopSalePlatformFeePercent",
    "roomEntryPlatformFeePercent",
    "roomPassDurationHours",
    "roomVisitsPayoutPer1kCoins",
    "roomBoost24hFeeCoins",
    "p2pCoinsTransferFeePercent",
    "vipPrice1WeekCash",
    "vipPrice1MonthCash",
    "vipPrice3MonthsCash",
    "basicMaxChatOpensPerDay",
    "basicMaxChatImagesPerDay",
    "basicMaxChatAudioPerDay",
    "vipMaxChatImagesPerDay",
    "vipMaxChatAudioPerDay",
    "casinoHouseEdgePercent",
    "diaryMinReadSeconds",
    "diaryReaderRewardPerPageCoins",
    "diaryAuthorRewardPerReadCoins",
    "diaryAuthorBonusPer10MinCoins",
    "diaryReaderDailyLimitPages",
  ];

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      if (field === "allowInstantCoinsToCash") {
        rules[field] = payload[field] === true || payload[field] === "true";
      } else {
        rules[field] = payload[field];
      }
    }
  }

  await rules.save();
  return rules.get({ plain: true });
}

/**
 * Retorna o estado atual do mercado (liquidez total em ordens de venda + regras e tabela completa de taxas)
 */
async function getMarketStats() {
  const rulesModel = await getEconomyRules();
  const rules = rulesModel.get({ plain: true });
  const rate = Number(rules.rateCoinsPerCash) || 250.0;
  const rateChips = Number(rules.rateChipsPerCoin) || 10.0;

  const openOrders = await repo.CoinOrder.findAll({
    where: {
      status: { [Op.in]: ["OPEN", "PARTIAL"] },
      remainingCoins: { [Op.gt]: 0 },
    },
    attributes: [
      [repo.sequelize.fn("SUM", repo.sequelize.col("remainingCoins")), "totalCoinsInPool"],
      [repo.sequelize.fn("COUNT", repo.sequelize.col("id")), "totalActiveOrders"],
    ],
    raw: true,
  });

  const totalCoinsInPool = Number(openOrders[0]?.totalCoinsInPool || 0);
  const totalActiveOrders = Number(openOrders[0]?.totalActiveOrders || 0);

  return {
    rateCoinsPerCash: rate,
    rateChipsPerCoin: rateChips,
    coinPriceInCash: Number((1 / rate).toFixed(4)),
    buybackPriceInCash: Number(((1 / rate) * (1 - Number(rules.sellSpreadPercent ?? 0.5) / 100)).toFixed(4)),
    sellSpreadPercent: Number(rules.sellSpreadPercent ?? 0.5),
    buySpreadPercent: Number(rules.buySpreadPercent ?? 0.1),
    usdBrlRate: Number(rules.usdBrlRate ?? 5.0),
    minPurchaseBrl: Number(rules.minPurchaseBrl ?? 10.0),
    minDepositBrl: Number(rules.minPurchaseBrl ?? 10.0),
    minWithdrawCash: Number(rules.minWithdrawCash ?? 1.0),
    buyApprovalMode: rules.buyApprovalMode || "AUTO",
    maxAutoBuyBrl: Number(rules.maxAutoBuyBrl ?? 500.0),
    withdrawApprovalMode: rules.withdrawApprovalMode || "AUTO",
    maxAutoWithdrawCash: Number(rules.maxAutoWithdrawCash ?? 20.0),
    cashToCoinsFeePercent: Number(rules.cashToCoinsFeePercent ?? 0.0),
    allowInstantCoinsToCash: rules.allowInstantCoinsToCash !== false,
    instantCoinsToCashFeePercent: Number(rules.instantCoinsToCashFeePercent ?? 30.0),
    coinsToChipsFeePercent: Number(rules.coinsToChipsFeePercent ?? 0.0),
    chipsToCoinsFeePercent: Number(rules.chipsToCoinsFeePercent ?? 0.0),
    withdrawFeePercent: Number(rules.withdrawFeePercent ?? 0.0),
    withdrawFixedFeeCash: Number(rules.withdrawFixedFeeCash ?? 0.0),
    shopCreationFixedFeeCoins: Number(rules.shopCreationFixedFeeCoins ?? 5.0),
    shopTextureUploadFixedFeeCoins: Number(rules.shopTextureUploadFixedFeeCoins ?? 1.0),
    shopSalePlatformFeePercent: Number(rules.shopSalePlatformFeePercent ?? 30.0),
    shopCreatorSharePercent: Number((100 - Number(rules.shopSalePlatformFeePercent ?? 30.0)).toFixed(2)),
    roomEntryPlatformFeePercent: Number(rules.roomEntryPlatformFeePercent ?? 15.0),
    roomOwnerSharePercent: Number((100 - Number(rules.roomEntryPlatformFeePercent ?? 15.0)).toFixed(2)),
    roomPassDurationHours: Number(rules.roomPassDurationHours || 24),
    roomVisitsPayoutPer1kCoins: Number(rules.roomVisitsPayoutPer1kCoins ?? 50.0),
    roomBoost24hFeeCoins: Number(rules.roomBoost24hFeeCoins ?? 20.0),
    p2pCoinsTransferFeePercent: Number(rules.p2pCoinsTransferFeePercent ?? 2.0),
    vipPrice1WeekCash: Number(rules.vipPrice1WeekCash ?? 0.75),
    vipPrice1MonthCash: Number(rules.vipPrice1MonthCash ?? 2.00),
    vipPrice3MonthsCash: Number(rules.vipPrice3MonthsCash ?? 5.00),
    vipPrice1WeekCoins: Math.ceil(Number(rules.vipPrice1WeekCash ?? 0.75) * rate),
    vipPrice1MonthCoins: Math.ceil(Number(rules.vipPrice1MonthCash ?? 2.00) * rate),
    vipPrice3MonthsCoins: Math.ceil(Number(rules.vipPrice3MonthsCash ?? 5.00) * rate),
    basicMaxChatOpensPerDay: Number(rules.basicMaxChatOpensPerDay ?? 3),
    basicMaxChatImagesPerDay: Number(rules.basicMaxChatImagesPerDay ?? 2),
    basicMaxChatAudioPerDay: Number(rules.basicMaxChatAudioPerDay ?? 2),
    vipMaxChatImagesPerDay: Number(rules.vipMaxChatImagesPerDay ?? 0),
    vipMaxChatAudioPerDay: Number(rules.vipMaxChatAudioPerDay ?? 0),
    casinoHouseEdgePercent: Number(rules.casinoHouseEdgePercent ?? 5.0),
    diaryMinReadSeconds: Number(rules.diaryMinReadSeconds ?? 30),
    diaryReaderRewardPerPageCoins: Number(rules.diaryReaderRewardPerPageCoins ?? 0.25),
    diaryAuthorRewardPerReadCoins: Number(rules.diaryAuthorRewardPerReadCoins ?? 0.50),
    diaryAuthorBonusPer10MinCoins: Number(rules.diaryAuthorBonusPer10MinCoins ?? 5.00),
    diaryReaderDailyLimitPages: Number(rules.diaryReaderDailyLimitPages ?? 20),
    collectedFeesCash: Number(rules.collectedFeesCash || 0),
    collectedFeesCoins: Number(rules.collectedFeesCoins || 0),
    totalCoinsInPool,
    totalActiveOrders,
    totalCashEquivalent: (totalCoinsInPool / rate).toFixed(2),
    rules,
  };
}

/**
 * Cria uma Ordem de Venda de Coins.
 * O sistema RESERVA as moedas imediatamente debitando da carteira do avatar.
 * A taxa de spread de venda (0.5%) fica registrada na ordem e é descontada na liquidação.
 */
async function createSellOrder(avatarId, coinsToSell, userId = null) {
  const amount = Number(coinsToSell);
  if (!amount || amount <= 0 || isNaN(amount)) {
    throw new Error("Informe uma quantidade de Coins maior que zero.");
  }

  return await repo.sequelize.transaction(async (t) => {
    const rules = await getEconomyRules(t);
    const rate = Number(rules.rateCoinsPerCash) || 250.0;
    const sellSpread = Number(rules.sellSpreadPercent ?? 0.5);

    // 1. Busca carteira do avatar com bloqueio para update
    const wallet = await repo.Currency.findOne({
      where: {
        [Op.or]: [{ avatarId }, { ownerId: avatarId }],
      },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!wallet || Number(wallet.coins) < amount) {
      throw new Error(`Saldo insuficiente. Você possui ${Number(wallet?.coins || 0)} Coins disponíveis.`);
    }

    // 2. Reserva as moedas (debita da carteira)
    wallet.coins = Number((Number(wallet.coins) - amount).toFixed(2));
    await wallet.save({ transaction: t });

    // 3. Cria a Ordem de Venda no livro de ofertas com a taxa de spread vigente
    const order = await repo.CoinOrder.create(
      {
        avatarId,
        userId,
        initialCoins: amount,
        remainingCoins: amount,
        rate: rate,
        spreadFeePercent: sellSpread,
        paidFeeCash: 0,
        status: "OPEN",
        earnedCash: 0,
      },
      { transaction: t }
    );

    // 4. Registra no Ledger de auditoria
    if (repo.CurrencyRegister) {
      await repo.CurrencyRegister.create(
        {
          userId: userId || wallet.userId,
          ownerId: avatarId,
          type: "Coins",
          transactionType: "Sell",
          value: -amount,
          description: `Reserva para Ordem de Venda #${order.id} (Spread venda: ${sellSpread}%)`,
        },
        { transaction: t }
      );
    }

    return order;
  });
}

/**
 * Cancela uma Ordem de Venda.
 * Devolve imediatamente o saldo restante de moedas para a carteira do avatar.
 */
async function cancelSellOrder(orderId, avatarId) {
  return await repo.sequelize.transaction(async (t) => {
    const order = await repo.CoinOrder.findOne({
      where: {
        id: orderId,
        avatarId,
        status: { [Op.in]: ["OPEN", "PARTIAL"] },
      },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!order) {
      throw new Error("Ordem não encontrada ou já liquidada/cancelada.");
    }

    const refundCoins = Number(order.remainingCoins);

    // 1. Marca como cancelada
    order.remainingCoins = 0;
    order.status = "CANCELED";
    await order.save({ transaction: t });

    // 2. Devolve as moedas não vendidas para a carteira
    if (refundCoins > 0) {
      const wallet = await repo.Currency.findOne({
        where: {
          [Op.or]: [{ avatarId }, { ownerId: avatarId }],
        },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (wallet) {
        wallet.coins = Number((Number(wallet.coins) + refundCoins).toFixed(2));
        await wallet.save({ transaction: t });
      }

      if (repo.CurrencyRegister) {
        await repo.CurrencyRegister.create(
          {
            userId: wallet?.userId,
            ownerId: avatarId,
            type: "Coins",
            transactionType: "Bonus",
            value: refundCoins,
            description: `Estorno por cancelamento da Ordem #${order.id}`,
          },
          { transaction: t }
        );
      }
    }

    return { success: true, refundedCoins: refundCoins };
  });
}

/**
 * Liquida compra de Coins usando Cash.
 * - Cobra taxa de spread de compra (padrão: 0.1%) sobre o comprador.
 * - Consome primeiro as ordens de venda do Pote (FIFO).
 * - Desconta a taxa de spread de venda (padrão: 0.5%) do Cash pago a cada vendedor.
 * - Se o pote não cobrir tudo, o sistema gera a diferença.
 */
async function buyCoins(buyerAvatarId, coinsWanted, buyerUserId = null) {
  const targetCoins = Number(coinsWanted);
  if (!targetCoins || targetCoins <= 0 || isNaN(targetCoins)) {
    throw new Error("Informe uma quantidade de Coins válida.");
  }

  return await repo.sequelize.transaction(async (t) => {
    const rules = await getEconomyRules(t);
    const rate = Number(rules.rateCoinsPerCash) || 250.0;
    const buySpreadPct = Number(rules.buySpreadPercent ?? 0.1);
    const defaultSellSpreadPct = Number(rules.sellSpreadPercent ?? 0.5);

    const baseCashCost = targetCoins / rate;
    const buyFeeCash = Number((baseCashCost * (buySpreadPct / 100.0)).toFixed(4));
    const totalCashRequired = Number((baseCashCost + buyFeeCash).toFixed(4));

    // 1. Verifica saldo de Cash do comprador
    const buyerWallet = await repo.Currency.findOne({
      where: {
        [Op.or]: [{ avatarId: buyerAvatarId }, { ownerId: buyerAvatarId }],
      },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!buyerWallet || Number(buyerWallet.cash) < totalCashRequired) {
      throw new Error(
        `Saldo de Cash insuficiente. Necessário: $${totalCashRequired.toFixed(4)} Cash (Base: $${baseCashCost.toFixed(2)} + Spread ${buySpreadPct}%: $${buyFeeCash.toFixed(4)}).`
      );
    }

    // 2. Busca ordens ativas para liquidar por ordem cronológica (FIFO)
    const openOrders = await repo.CoinOrder.findAll({
      where: {
        status: { [Op.in]: ["OPEN", "PARTIAL"] },
        remainingCoins: { [Op.gt]: 0 },
        avatarId: { [Op.ne]: buyerAvatarId },
      },
      order: [["createdAt", "ASC"]],
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    let coinsStillNeeded = targetCoins;
    let coinsBoughtFromUsers = 0;
    let totalSellerSpreadFeesCash = 0;

    // 3. Consome ordens de usuários no Pote
    for (const order of openOrders) {
      if (coinsStillNeeded <= 0) break;

      const orderAvail = Number(order.remainingCoins);
      const toTake = Math.min(orderAvail, coinsStillNeeded);
      const orderRate = Number(order.rate) || rate;
      const grossCashForSlice = toTake / orderRate;

      // Calcula spread de venda (0.5%)
      const sellSpreadPct = Number(order.spreadFeePercent ?? defaultSellSpreadPct);
      const sellerFeeCash = Number((grossCashForSlice * (sellSpreadPct / 100.0)).toFixed(4));
      const netCashForSeller = Number((grossCashForSlice - sellerFeeCash).toFixed(4));

      // Atualiza ordem do vendedor
      order.remainingCoins = Number((orderAvail - toTake).toFixed(2));
      order.earnedCash = Number((Number(order.earnedCash) + netCashForSeller).toFixed(4));
      order.paidFeeCash = Number((Number(order.paidFeeCash || 0) + sellerFeeCash).toFixed(4));

      if (order.remainingCoins <= 0) {
        order.status = "COMPLETED";
      } else {
        order.status = "PARTIAL";
      }
      await order.save({ transaction: t });

      // Injeta o Cash líquido na carteira do VENDEDOR
      const sellerWallet = await repo.Currency.findOne({
        where: {
          [Op.or]: [{ avatarId: order.avatarId }, { ownerId: order.avatarId }],
        },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (sellerWallet) {
        sellerWallet.cash = Number((Number(sellerWallet.cash) + netCashForSeller).toFixed(4));
        await sellerWallet.save({ transaction: t });

        if (repo.CurrencyRegister) {
          await repo.CurrencyRegister.create(
            {
              userId: sellerWallet.userId,
              ownerId: order.avatarId,
              type: "Cash",
              transactionType: "Rewards",
              value: netCashForSeller,
              description: `Venda de ${toTake} Coins na Ordem #${order.id} (Bruto: $${grossCashForSlice.toFixed(4)} | Taxa ${sellSpreadPct}%: -$${sellerFeeCash.toFixed(4)})`,
            },
            { transaction: t }
          );
        }
      }

      coinsStillNeeded -= toTake;
      coinsBoughtFromUsers += toTake;
      totalSellerSpreadFeesCash += sellerFeeCash;
    }

    // 4. Se sobrou alguma fração não coberta pelo pote, o Sistema gera a diferença
    const coinsMintedBySystem = coinsStillNeeded > 0 ? coinsStillNeeded : 0;

    // 5. Debita o Cash total (base + spread 0.1%) do Comprador e credita os Coins
    buyerWallet.cash = Number((Number(buyerWallet.cash) - totalCashRequired).toFixed(4));
    buyerWallet.coins = Number((Number(buyerWallet.coins) + targetCoins).toFixed(2));
    await buyerWallet.save({ transaction: t });

    // 6. Contabiliza as taxas de spread (compra + venda) no cofre de regras do sistema
    const totalSpreadCollected = Number((buyFeeCash + totalSellerSpreadFeesCash).toFixed(4));
    if (totalSpreadCollected > 0) {
      rules.collectedFeesCash = Number((Number(rules.collectedFeesCash || 0) + totalSpreadCollected).toFixed(4));
      await rules.save({ transaction: t });
    }

    // Registro no Ledger para o Comprador
    if (repo.CurrencyRegister) {
      await repo.CurrencyRegister.create(
        {
          userId: buyerUserId || buyerWallet.userId,
          ownerId: buyerAvatarId,
          type: "Cash",
          transactionType: "Buy",
          value: -totalCashRequired,
          description: `Compra de ${targetCoins} Coins (Base: $${baseCashCost.toFixed(2)} + Taxa ${buySpreadPct}%: $${buyFeeCash.toFixed(4)})`,
        },
        { transaction: t }
      );

      await repo.CurrencyRegister.create(
        {
          userId: buyerUserId || buyerWallet.userId,
          ownerId: buyerAvatarId,
          type: "Coins",
          transactionType: "Deposit",
          value: targetCoins,
          description: `Recebimento de ${targetCoins} Coins (${coinsBoughtFromUsers} do pote, ${coinsMintedBySystem} gerados pelo sistema)`,
        },
        { transaction: t }
      );
    }

    return {
      success: true,
      coinsPurchased: targetCoins,
      totalCoinsBought: targetCoins,
      baseCashSpent: Number(baseCashCost.toFixed(4)),
      buySpreadFeeCash: buyFeeCash,
      cashSpent: totalCashRequired,
      coinsFromPool: coinsBoughtFromUsers,
      coinsMinted: coinsMintedBySystem,
      coinsFromSystem: coinsMintedBySystem,
    };
  });
}

/**
 * Solicitação de Saque (Conversão de Cash para Real via Pix).
 * - Valida valor mínimo de saque (padrão: 1 Cash).
 * - Reserva (debita) o Cash da carteira do avatar imediatamente.
 * - Verifica na tabela EconomyRule se aprova no AUTOMÁTICO (até maxAutoWithdrawCash) ou MANUAL.
 */
async function requestWithdraw({ userId, avatarId, cashAmount, pixKey, pixKeyType }) {
  const amount = Number(cashAmount);
  if (!amount || amount <= 0 || isNaN(amount)) {
    throw new Error("Informe uma quantidade válida de Cash para saque.");
  }
  if (!pixKey || String(pixKey).trim().length < 3) {
    throw new Error("Informe uma Chave Pix válida para receber o saque.");
  }

  return await repo.sequelize.transaction(async (t) => {
    const rules = await getEconomyRules(t);
    const minWithdraw = Number(rules.minWithdrawCash) || 1.0;
    const usdBrlRate = Number(rules.usdBrlRate) || 5.0;

    if (amount < minWithdraw) {
      throw new Error(`O valor mínimo para saque é de $${minWithdraw.toFixed(2)} Cash.`);
    }

    // 1. Verifica e debita da carteira do avatar
    const wallet = await repo.Currency.findOne({
      where: {
        [Op.or]: [{ avatarId }, { ownerId: avatarId }],
      },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!wallet || Number(wallet.cash) < amount) {
      throw new Error(`Saldo de Cash insuficiente para saque. Disponível: $${Number(wallet?.cash || 0).toFixed(2)} Cash.`);
    }

    wallet.cash = Number((Number(wallet.cash) - amount).toFixed(4));
    wallet.pixKey = String(pixKey).trim();
    await wallet.save({ transaction: t });

    // 2. Calcula valor em Reais e avalia regra de aprovação automática vs manual
    const brlValue = Number((amount * usdBrlRate).toFixed(2));
    const maxAutoCash = Number(rules.maxAutoWithdrawCash) || 20.0;
    const isAutoApproved = rules.withdrawApprovalMode === "AUTO" && amount <= maxAutoCash;

    const initialStatus = isAutoApproved ? "APPROVED_AUTO" : "WAITING_APPROVAL";
    const approvalModeUsed = isAutoApproved ? "AUTO" : "MANUAL";
    const extRef = `WD-${avatarId}-${Date.now()}`;

    const withdrawRecord = await repo.PaymentBank.create(
      {
        user_id: userId,
        avatar_id: Number(avatarId),
        description: `Saque de $${amount.toFixed(2)} Cash (R$ ${brlValue.toFixed(2)}) via Pix [${pixKeyType || "PIX"}: ${pixKey}]`,
        reference_id: extRef,
        value: brlValue,
        cash_amount: amount,
        pix_key: String(pixKey).trim(),
        pix_key_type: pixKeyType || "EVP",
        approval_mode: approvalModeUsed,
        status: initialStatus,
        provedor: "Asaas",
        type: "Withdraw",
      },
      { transaction: t }
    );

    if (repo.CurrencyRegister) {
      await repo.CurrencyRegister.create(
        {
          userId: userId || wallet.userId,
          ownerId: avatarId,
          type: "Cash",
          transactionType: "Sell",
          value: -amount,
          description: `Solicitação de Saque #${withdrawRecord.id} (${isAutoApproved ? "Aprovado Automático" : "Aguardando Aprovação Admin"})`,
        },
        { transaction: t }
      );
    }

    return {
      withdraw: withdrawRecord.get({ plain: true }),
      isAutoApproved,
      brlValue,
      cashAmount: amount,
    };
  });
}

/**
 * Cancela um Saque ainda pendente de aprovação (ou não enviado) e devolve o Cash para a carteira.
 */
async function cancelWithdraw(paymentId, userId, avatarId) {
  return await repo.sequelize.transaction(async (t) => {
    const withdraw = await repo.PaymentBank.findOne({
      where: {
        id: paymentId,
        user_id: userId,
        type: "Withdraw",
        status: { [Op.in]: ["WAITING_APPROVAL", "PENDING"] },
      },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!withdraw) {
      throw new Error("Saque não encontrado ou já foi processado/aprovado.");
    }

    const refundCash = Number(withdraw.cash_amount) || Number((Number(withdraw.value) / 5.0).toFixed(2));
    withdraw.status = "CANCELLED";
    await withdraw.save({ transaction: t });

    const targetAvatarId = avatarId || withdraw.avatar_id;
    const wallet = await repo.Currency.findOne({
      where: {
        [Op.or]: [{ avatarId: targetAvatarId }, { ownerId: targetAvatarId }],
      },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (wallet && refundCash > 0) {
      wallet.cash = Number((Number(wallet.cash) + refundCash).toFixed(4));
      await wallet.save({ transaction: t });
    }

    return { success: true, refundedCash: refundCash };
  });
}

/**
 * Aprovação / Recusa manual de Compra ou Saque (pelo Admin)
 */
async function reviewPaymentTransaction(paymentId, action = "APPROVE") {
  return await repo.sequelize.transaction(async (t) => {
    const payment = await repo.PaymentBank.findOne({
      where: { id: paymentId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!payment) throw new Error("Transação não encontrada.");

    const rules = await getEconomyRules(t);
    const usdBrlRate = Number(rules.usdBrlRate) || 5.0;
    const cashAmount = Number(payment.cash_amount) || Number((Number(payment.value) / usdBrlRate).toFixed(2));

    if (payment.type === "Withdraw") {
      if (!["WAITING_APPROVAL", "PENDING"].includes(payment.status)) {
        throw new Error(`Este saque já está com status: ${payment.status}`);
      }

      if (action === "APPROVE") {
        payment.status = "APPROVED_ADMIN";
        await payment.save({ transaction: t });
        return { success: true, status: payment.status, message: "Saque aprovado com sucesso." };
      } else {
        // Recusado pelo Admin -> Devolve o Cash para a carteira do avatar
        payment.status = "REJECTED";
        await payment.save({ transaction: t });

        const wallet = await repo.Currency.findOne({
          where: {
            [Op.or]: [
              ...(payment.avatar_id ? [{ avatarId: payment.avatar_id }, { ownerId: payment.avatar_id }] : []),
              ...(payment.user_id ? [{ userId: payment.user_id }] : []),
            ],
          },
          lock: t.LOCK.UPDATE,
          transaction: t,
        });

        if (wallet && cashAmount > 0) {
          wallet.cash = Number((Number(wallet.cash) + cashAmount).toFixed(4));
          await wallet.save({ transaction: t });
        }
        return { success: true, status: payment.status, message: "Saque recusado e saldo estornado ao jogador." };
      }
    } else if (payment.type === "Buy") {
      if (["CONFIRMED", "RECEIVED", "APPROVED_ADMIN"].includes(payment.status)) {
        throw new Error("Esta compra já foi aprovada e creditada anteriormente.");
      }

      if (action === "APPROVE") {
        payment.status = "CONFIRMED";
        await payment.save({ transaction: t });

        const wallet = await repo.Currency.findOne({
          where: {
            [Op.or]: [
              ...(payment.avatar_id ? [{ avatarId: payment.avatar_id }, { ownerId: payment.avatar_id }] : []),
              ...(payment.user_id ? [{ userId: payment.user_id }] : []),
            ],
          },
          lock: t.LOCK.UPDATE,
          transaction: t,
        });

        if (wallet && cashAmount > 0) {
          wallet.cash = Number((Number(wallet.cash) + cashAmount).toFixed(4));
          await wallet.save({ transaction: t });
        }
        return { success: true, status: payment.status, addedCash: cashAmount };
      } else {
        payment.status = "REJECTED";
        await payment.save({ transaction: t });
        return { success: true, status: payment.status };
      }
    }

    throw new Error("Tipo de transação inválido.");
  });
}

/**
 * Conversor Rápido de Moedas do Avatar:
 * - CASH_TO_COINS: 1 Cash = 250 Coins (consome do pote coletivo primeiro se houver ordens abertas)
 * - COINS_TO_CHIPS: 1 Coin = 10 Chips
 * - CHIPS_TO_COINS: 10 Chips = 1 Coin
 * - COINS_TO_CASH: Conversão direta imediata com taxa punitiva (padrão 30% de perda) para não atrapalhar o mercado
 */
async function convertCurrency(avatarId, direction, rawAmount, userId = null) {
  const amount = Number(rawAmount);
  if (!amount || amount <= 0 || isNaN(amount)) {
    throw new Error("Informe um valor válido maior que zero para converter.");
  }

  return await repo.sequelize.transaction(async (t) => {
    const rules = await getEconomyRules(t);
    const rateCoinsPerCash = Number(rules.rateCoinsPerCash) || 250.0;
    const rateChipsPerCoin = Number(rules.rateChipsPerCoin) || 10.0;

    const wallet = await repo.Currency.findOne({
      where: {
        [Op.or]: [{ avatarId }, { ownerId: avatarId }],
      },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!wallet) {
      throw new Error("Carteira do avatar não encontrada.");
    }

    // 1. CASH -> COINS (Consome do pote coletivo primeiro para girar a economia)
    if (direction === "CASH_TO_COINS") {
      if (Number(wallet.cash) < amount) {
        throw new Error(`Saldo insuficiente de Cash. Disponível: $${Number(wallet.cash || 0).toFixed(2)} Cash.`);
      }

      const cashFeePct = Number(rules.cashToCoinsFeePercent || 0);
      const grossCoins = amount * rateCoinsPerCash;
      const feeCoins = Number((grossCoins * (cashFeePct / 100.0)).toFixed(2));
      const coinsToReceive = Number((grossCoins - feeCoins).toFixed(2));
      wallet.cash = Number((Number(wallet.cash) - amount).toFixed(4));

      // Consome ordens abertas no pote (FIFO) para ajudar a liquidar vendedores
      const openOrders = await repo.CoinOrder.findAll({
        where: {
          status: { [Op.in]: ["OPEN", "PARTIAL"] },
          remainingCoins: { [Op.gt]: 0 },
        },
        order: [["createdAt", "ASC"]],
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      let coinsLeftToFulfill = coinsToReceive;
      let coinsFromPool = 0;
      let totalFeeCollected = 0;

      for (const order of openOrders) {
        if (coinsLeftToFulfill <= 0) break;
        const availableInOrder = Number(order.remainingCoins);
        const takeFromOrder = Math.min(availableInOrder, coinsLeftToFulfill);

        const orderRate = Number(order.rate) || rateCoinsPerCash;
        const orderSellSpread = Number(order.spreadFeePercent ?? rules.sellSpreadPercent ?? 0.5);
        const grossSellerCash = takeFromOrder / orderRate;
        const sellerFeeCash = grossSellerCash * (orderSellSpread / 100.0);
        const netSellerCash = grossSellerCash - sellerFeeCash;

        order.remainingCoins = Number((availableInOrder - takeFromOrder).toFixed(2));
        order.paidFeeCash = Number((Number(order.paidFeeCash || 0) + sellerFeeCash).toFixed(4));
        order.earnedCash = Number((Number(order.earnedCash || 0) + netSellerCash).toFixed(4));
        order.status = order.remainingCoins <= 0 ? "COMPLETED" : "PARTIAL";
        await order.save({ transaction: t });

        totalFeeCollected += sellerFeeCash;

        if (Number(order.avatarId) === Number(avatarId)) {
          wallet.cash = Number((Number(wallet.cash) + netSellerCash).toFixed(4));
        } else {
          const sellerWallet = await repo.Currency.findOne({
            where: {
              [Op.or]: [{ avatarId: order.avatarId }, { ownerId: order.avatarId }],
            },
            lock: t.LOCK.UPDATE,
            transaction: t,
          });
          if (sellerWallet) {
            sellerWallet.cash = Number((Number(sellerWallet.cash) + netSellerCash).toFixed(4));
            await sellerWallet.save({ transaction: t });
          }
        }

        coinsFromPool += takeFromOrder;
        coinsLeftToFulfill = Number((coinsLeftToFulfill - takeFromOrder).toFixed(2));
      }

      if (totalFeeCollected > 0 || feeCoins > 0) {
        rules.collectedFeesCash = Number((Number(rules.collectedFeesCash || 0) + totalFeeCollected).toFixed(4));
        rules.collectedFeesCoins = Number((Number(rules.collectedFeesCoins || 0) + feeCoins).toFixed(4));
        await rules.save({ transaction: t });
      }

      wallet.coins = Number((Number(wallet.coins) + coinsToReceive).toFixed(2));
      await wallet.save({ transaction: t });

      if (repo.CurrencyRegister) {
        await repo.CurrencyRegister.create(
          {
            userId: userId || wallet.userId,
            ownerId: avatarId,
            type: "Coins",
            transactionType: "Buy",
            value: coinsToReceive,
            description: `Conversão Cash -> Coins: -$${amount.toFixed(2)} Cash por +${coinsToReceive} Coins (${coinsFromPool} do pote | Taxa: ${cashFeePct}%)`,
          },
          { transaction: t }
        );
      }

      return {
        direction,
        spentAmount: amount,
        receivedAmount: coinsToReceive,
        feePercent: cashFeePct,
        feeAmount: feeCoins,
        fromUnit: "Cash",
        toUnit: "Coins",
      };
    }

    // 2. COINS -> CHIPS (1 Coin = 10 Chips)
    if (direction === "COINS_TO_CHIPS") {
      if (Number(wallet.coins) < amount) {
        throw new Error(`Saldo insuficiente de Coins. Disponível: ${Number(wallet.coins || 0)} Coins.`);
      }

      const feePct = Number(rules.coinsToChipsFeePercent || 0);
      const grossChips = amount * rateChipsPerCoin;
      const feeChips = grossChips * (feePct / 100.0);
      const netChips = Math.floor((grossChips - feeChips) * 100) / 100;

      wallet.coins = Number((Number(wallet.coins) - amount).toFixed(2));
      wallet.chips = Number((Number(wallet.chips) + netChips).toFixed(2));
      await wallet.save({ transaction: t });

      if (repo.CurrencyRegister) {
        await repo.CurrencyRegister.create(
          {
            userId: userId || wallet.userId,
            ownerId: avatarId,
            type: "Chips",
            transactionType: "Buy",
            value: netChips,
            description: `Conversão Coins -> Chips: -${amount} Coins por +${netChips} Chips`,
          },
          { transaction: t }
        );
      }

      return {
        direction,
        spentAmount: amount,
        receivedAmount: netChips,
        feePercent: feePct,
        feeAmount: feeChips,
        fromUnit: "Coins",
        toUnit: "Chips",
      };
    }

    // 3. CHIPS -> COINS (10 Chips = 1 Coin)
    if (direction === "CHIPS_TO_COINS") {
      if (Number(wallet.chips) < amount) {
        throw new Error(`Saldo insuficiente de Chips. Disponível: ${Number(wallet.chips || 0)} Chips.`);
      }

      const feePct = Number(rules.chipsToCoinsFeePercent || 0);
      const grossCoins = amount / rateChipsPerCoin;
      const feeCoins = grossCoins * (feePct / 100.0);
      const netCoins = Number((grossCoins - feeCoins).toFixed(2));

      wallet.chips = Number((Number(wallet.chips) - amount).toFixed(2));
      wallet.coins = Number((Number(wallet.coins) + netCoins).toFixed(2));
      await wallet.save({ transaction: t });

      if (feeCoins > 0) {
        rules.collectedFeesCoins = Number((Number(rules.collectedFeesCoins || 0) + feeCoins).toFixed(4));
        await rules.save({ transaction: t });
      }

      if (repo.CurrencyRegister) {
        await repo.CurrencyRegister.create(
          {
            userId: userId || wallet.userId,
            ownerId: avatarId,
            type: "Coins",
            transactionType: "Buy",
            value: netCoins,
            description: `Conversão Chips -> Coins: -${amount} Chips por +${netCoins} Coins`,
          },
          { transaction: t }
        );
      }

      return {
        direction,
        spentAmount: amount,
        receivedAmount: netCoins,
        feePercent: feePct,
        feeAmount: feeCoins,
        fromUnit: "Chips",
        toUnit: "Coins",
      };
    }

    // 4. COINS -> CASH DIRETO (Taxa alta de 30% de perda para desmotivar e proteger o livro de ordens)
    if (direction === "COINS_TO_CASH") {
      if (rules.allowInstantCoinsToCash === false) {
        throw new Error(
          "A conversão direta de Coins para Cash está desativada para proteger o mercado. Crie uma Ordem de Venda na Bolsa de Moedas!"
        );
      }

      if (Number(wallet.coins) < amount) {
        throw new Error(`Saldo insuficiente de Coins. Disponível: ${Number(wallet.coins || 0)} Coins.`);
      }

      const feePct = Number(rules.instantCoinsToCashFeePercent ?? 30.0);
      const grossCash = amount / rateCoinsPerCash;
      const feeCash = Number((grossCash * (feePct / 100.0)).toFixed(4));
      const netCash = Number((grossCash - feeCash).toFixed(4));

      wallet.coins = Number((Number(wallet.coins) - amount).toFixed(2));
      wallet.cash = Number((Number(wallet.cash) + netCash).toFixed(4));
      await wallet.save({ transaction: t });

      // A taxa retida vai para o cofre de taxas do sistema
      rules.collectedFeesCash = Number((Number(rules.collectedFeesCash || 0) + feeCash).toFixed(4));
      await rules.save({ transaction: t });

      if (repo.CurrencyRegister) {
        await repo.CurrencyRegister.create(
          {
            userId: userId || wallet.userId,
            ownerId: avatarId,
            type: "Cash",
            transactionType: "Sell",
            value: netCash,
            description: `Conversão Direta Coins -> Cash (Deságio ${feePct}%): -${amount} Coins por +$${netCash.toFixed(4)} Cash (Taxa retida: $${feeCash.toFixed(4)})`,
          },
          { transaction: t }
        );
      }

      return {
        direction,
        spentAmount: amount,
        receivedAmount: netCash,
        feePercent: feePct,
        feeAmount: feeCash,
        fromUnit: "Coins",
        toUnit: "Cash",
      };
    }

    throw new Error("Direção de conversão inválida.");
  });
}

/**
 * Enriquece uma lista de Salas 3D com:
 * - Valor de entrada (Passe 24h) + Taxa da plataforma + Valor líquido repassado ao dono
 * - Status de Passe 24h ativo para quem está visualizando (viewerAvatarId)
 * - Total de visitas da sala + Visitas Únicas no Mês atual (YYYY-MM)
 * - Progresso para o próximo pagamento automático de 1.000 visitas únicas no mês + total já recebido
 */
async function enrichRoomsWithVisitStats(roomsList = [], viewerAvatarId = 0) {
  await ensureFeeAndRoomTables();
  if (!Array.isArray(roomsList) || roomsList.length === 0) return [];

  const rules = await getEconomyRules();
  const feePct = Number(rules.roomEntryPlatformFeePercent ?? 15.0);
  const ownerSharePct = Number((100 - feePct).toFixed(2));
  const passHours = Number(rules.roomPassDurationHours || 24);
  const payoutPer1k = Number(rules.roomVisitsPayoutPer1kCoins ?? 50.0);
  const monthKey = getCurrentMonthKey();

  const plainRooms = roomsList.map((r) => (typeof r.get === "function" ? r.get({ plain: true }) : { ...r }));
  const roomIds = plainRooms.map((r) => Number(r.id)).filter((id) => id > 0);
  if (roomIds.length === 0) return plainRooms;

  const idListSql = roomIds.join(",");

  const [monthlyVisitsRows, allTimeVisitsRows, passesStatsRows, activeViewerPassesRows, payoutsStatsRows, activeServersRows] =
    await Promise.all([
      repo.sequelize
        .query(
          `SELECT "roomId", COUNT(*)::int AS "uniqueMonthly", COALESCE(SUM("visitCount"), 0)::int AS "hitsMonthly"
           FROM "room_visits"
           WHERE "roomId" IN (${idListSql}) AND "monthKey" = :monthKey
           GROUP BY "roomId"`,
          { replacements: { monthKey }, type: repo.Sequelize.QueryTypes.SELECT }
        )
        .catch(() => []),
      repo.sequelize
        .query(
          `SELECT "roomId", COUNT(DISTINCT "visitorAvatarId")::int AS "uniqueTotal", COALESCE(SUM("visitCount"), 0)::int AS "hitsTotal"
           FROM "room_visits"
           WHERE "roomId" IN (${idListSql})
           GROUP BY "roomId"`,
          { type: repo.Sequelize.QueryTypes.SELECT }
        )
        .catch(() => []),
      repo.sequelize
        .query(
          `SELECT "roomId",
                  COUNT(*)::int AS "passesSold",
                  COALESCE(SUM("ownerNetReceived"), 0)::numeric(12,2) AS "ownerRevenue",
                  COALESCE(SUM("platformFee"), 0)::numeric(12,2) AS "platformFeeTotal"
           FROM "room_entry_passes"
           WHERE "roomId" IN (${idListSql})
           GROUP BY "roomId"`,
          { type: repo.Sequelize.QueryTypes.SELECT }
        )
        .catch(() => []),
      Number(viewerAvatarId) > 0
        ? repo.sequelize
            .query(
              `SELECT "roomId", "expiresAt", "entryPrice"
               FROM "room_entry_passes"
               WHERE "roomId" IN (${idListSql})
                 AND "visitorAvatarId" = :viewerAvatarId
                 AND "expiresAt" > NOW()
               ORDER BY "expiresAt" DESC`,
              { replacements: { viewerAvatarId: Number(viewerAvatarId) }, type: repo.Sequelize.QueryTypes.SELECT }
            )
            .catch(() => [])
        : [],
      repo.sequelize
        .query(
          `SELECT "roomId",
                  COUNT(*)::int AS "milestonesCount",
                  COALESCE(SUM("rewardCoins"), 0)::numeric(12,2) AS "totalRewardCoins"
           FROM "room_visit_payouts"
           WHERE "roomId" IN (${idListSql})
           GROUP BY "roomId"`,
          { type: repo.Sequelize.QueryTypes.SELECT }
        )
        .catch(() => []),
      repo.sequelize
        .query(
          `SELECT * FROM "servers"
           WHERE "roomId" IN (${idListSql})
           ORDER BY "id" ASC`,
          { type: repo.Sequelize.QueryTypes.SELECT }
        )
        .catch(() => []),
    ]);

  const monthlyMap = new Map(monthlyVisitsRows.map((r) => [Number(r.roomId), r]));
  const allTimeMap = new Map(allTimeVisitsRows.map((r) => [Number(r.roomId), r]));
  const passesMap = new Map(passesStatsRows.map((r) => [Number(r.roomId), r]));
  const payoutsMap = new Map(payoutsStatsRows.map((r) => [Number(r.roomId), r]));
  const activePassMap = new Map();
  for (const p of activeViewerPassesRows) {
    if (!activePassMap.has(Number(p.roomId))) {
      activePassMap.set(Number(p.roomId), p);
    }
  }

  const serversByRoomMap = new Map();
  for (const srv of activeServersRows) {
    const rId = Number(srv.roomId);
    if (!serversByRoomMap.has(rId)) serversByRoomMap.set(rId, []);
    serversByRoomMap.get(rId).push(srv);
  }

  return plainRooms.map((room) => {
    const rId = Number(room.id);
    const entryVal = Math.max(0, Number(room.entryValue || 0));
    const platformFeeCoins = Number((entryVal * (feePct / 100.0)).toFixed(2));
    const ownerNetCoins = Number((entryVal - platformFeeCoins).toFixed(2));

    const mRow = monthlyMap.get(rId) || { uniqueMonthly: 0, hitsMonthly: 0 };
    const aRow = allTimeMap.get(rId) || { uniqueTotal: 0, hitsTotal: 0 };
    const pRow = passesMap.get(rId) || { passesSold: 0, ownerRevenue: 0, platformFeeTotal: 0 };
    const payRow = payoutsMap.get(rId) || { milestonesCount: 0, totalRewardCoins: 0 };
    const viewerPass = activePassMap.get(rId) || null;

    const rawServers = serversByRoomMap.get(rId) || [];
    const serverInstances = rawServers.map((srv, idx) => formatServerInstance(srv, idx, room));
    const instancesCount = serverInstances.length;
    const sumServerPlayers = serverInstances.reduce((acc, s) => acc + Number(s.playersCount || 0), 0);
    const livePlayersOnline = instancesCount > 0 ? sumServerPlayers : Number(room.playersCount || 0);
    const totalCapacityOnline =
      instancesCount > 0
        ? serverInstances.reduce((acc, s) => acc + Number(s.maxPlayers || room.maxPlayers || 30), 0)
        : Number(room.maxPlayers || 30);
    const bestInstance = serverInstances.find((s) => !s.isFull) || serverInstances[serverInstances.length - 1] || null;
    const defaultHost = `${process.env.SERVER_IP || "127.0.0.1"}:${10018 + (rId % 50)}`;
    const primaryServerAddress = bestInstance ? bestInstance.connectAddress : defaultHost;
    const primaryTflUri = bestInstance
      ? bestInstance.tflUri
      : `tfl://join?roomId=${rId}&host=${primaryServerAddress}&scene=${encodeURIComponent(room.scene || "lobby")}`;

    const monthlyUniqueVisits = Number(mRow.uniqueMonthly || 0);
    const totalVisits = Math.max(Number(room.visits || 0), Number(aRow.hitsTotal || 0));
    const currentCycleProgress = monthlyUniqueVisits % 1000;
    const nextMilestoneTarget = (Math.floor(monthlyUniqueVisits / 1000) + 1) * 1000;
    const milestoneProgressPercent = Math.min(100, Math.round((currentCycleProgress / 1000) * 100));

    const isOwner = Number(viewerAvatarId) > 0 && Number(room.avatarId) === Number(viewerAvatarId);
    const viewerHasActivePass = Boolean(viewerPass) || isOwner;
    const viewerPassRemainingHours = viewerPass
      ? Math.max(1, Math.ceil((new Date(viewerPass.expiresAt).getTime() - Date.now()) / 3600000))
      : 0;

    return {
      ...room,
      entryValue: entryVal,
      isPaidEntry: entryVal > 0,
      platformFeePercent: feePct,
      ownerSharePercent: ownerSharePct,
      platformFeeCoins,
      ownerNetPerPass: ownerNetCoins,
      passDurationHours: passHours,
      monthKey,
      visits: totalVisits,
      totalVisits,
      monthlyUniqueVisits,
      monthlyTotalHits: Number(mRow.hitsMonthly || 0),
      nextMilestoneTarget,
      milestoneProgressPercent,
      payoutPer1kCoins: payoutPer1k,
      passesSoldCount: Number(pRow.passesSold || 0),
      ownerPassRevenueCoins: Number(pRow.ownerRevenue || 0),
      milestonesPaidCount: Number(payRow.milestonesCount || 0),
      milestoneBonusEarnedCoins: Number(payRow.totalRewardCoins || 0),
      viewerHasActivePass,
      viewerPassExpiresAt: viewerPass ? viewerPass.expiresAt : null,
      viewerPassRemainingHours,
      serverInstances,
      instancesCount,
      livePlayersOnline,
      totalCapacityOnline,
      primaryServerAddress,
      primaryTflUri,
    };
  });
}

/**
 * Formata um registro da tabela `servers` (ServerModel) com endereço de conexão, lotação e URI TFL
 */
function formatServerInstance(srv, instanceIndex = 0, room = null) {
  const plain = typeof srv?.get === "function" ? srv.get({ plain: true }) : { ...(srv || {}) };
  const ip = plain.ip || process.env.SERVER_IP || "127.0.0.1";
  const port = String(plain.port || 7001 + instanceIndex);
  const publicPort = String(plain.publicPort || plain.port || 10018 + instanceIndex);
  const maxPlayers = Math.max(1, Number(plain.maxPlayers || room?.maxPlayers || 30));
  const playersCount = Math.max(0, Number(plain.playersCount || 0));
  const freeSlots = Math.max(0, maxPlayers - playersCount);
  const isFull = playersCount >= maxPlayers;
  const occupancyPercent = Math.min(100, Math.round((playersCount / maxPlayers) * 100));
  const scene = plain.scene || room?.scene || "lobby";
  const language = plain.language || "pt-BR";
  const connectAddress = `${ip}:${publicPort}`;
  const instanceNumber = instanceIndex + 1;
  const tflUri = `tfl://join?roomId=${plain.roomId}&serverId=${plain.id}&instance=${instanceNumber}&uid=${plain.uid || ""}&host=${connectAddress}&scene=${encodeURIComponent(scene)}`;

  return {
    id: Number(plain.id),
    uid: plain.uid || "",
    pid: plain.pid || "",
    roomId: Number(plain.roomId),
    instanceNumber,
    instanceLabel: `Instância #${instanceNumber}`,
    ip,
    port,
    publicPort,
    connectAddress,
    tflUri,
    playersCount,
    maxPlayers,
    freeSlots,
    isFull,
    occupancyPercent,
    scene,
    language,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

/**
 * Lista todas as instâncias ativas na tabela `servers` para uma sala (`roomId`)
 */
async function getRoomActiveServerInstances(roomId, transaction = null) {
  const rId = Number(roomId || 0);
  if (!rId || !repo.Server) {
    return { instances: [], instancesCount: 0, totalPlayersOnline: 0, bestAvailableInstance: null };
  }
  const room = await repo.RoomModel.findByPk(rId, { transaction });
  const rows = await repo.Server.findAll({
    where: { roomId: rId },
    order: [["id", "ASC"]],
    transaction,
  });
  const instances = rows.map((srv, idx) => formatServerInstance(srv, idx, room));
  const totalPlayersOnline = instances.reduce((acc, s) => acc + s.playersCount, 0);
  const bestAvailableInstance = instances.find((s) => !s.isFull) || instances[instances.length - 1] || null;
  return {
    room: room ? room.get({ plain: true }) : null,
    instances,
    instancesCount: instances.length,
    totalPlayersOnline,
    bestAvailableInstance,
  };
}

/**
 * Gerencia e replica instâncias de uma Sala na tabela `servers` (ServerModel):
 * - A sala pode ser replicada inúmeras vezes (`Instância #1`, `Instância #2`, `Instância #3`...).
 * - Sempre que todas as instâncias abertas daquela sala enchem (`playersCount >= maxPlayers`)
 *   ou quando nenhuma instância está aberta, cria automaticamente uma nova instância na tabela `servers`!
 */
async function allocateOrReplicateRoomServerInstance({
  roomId,
  preferredServerId = null,
  preferredServerUid = null,
  forceNewReplica = false,
  joinPlayer = false,
  fillCurrentToTest = false,
  transaction = null,
}) {
  const rId = Number(roomId || 0);
  if (!rId) throw new Error("roomId é obrigatório para alocar instância no servidor.");

  const room = await repo.RoomModel.findByPk(rId, { transaction });
  if (!room) throw new Error("Sala 3D não encontrada.");

  const maxPlayersPerInstance = Math.max(1, Number(room.maxPlayers || 30));
  let existingRows = await repo.Server.findAll({
    where: { roomId: rId },
    order: [["id", "ASC"]],
    transaction,
  });

  // Modo de teste: lota a instância atual (playersCount = maxPlayers) para forçar a criação automática de outra réplica
  if (fillCurrentToTest && existingRows.length > 0) {
    const targetToFill =
      existingRows.find((s) => Number(s.playersCount || 0) < Number(s.maxPlayers || maxPlayersPerInstance)) ||
      existingRows[existingRows.length - 1];
    if (targetToFill) {
      targetToFill.playersCount = Number(targetToFill.maxPlayers || maxPlayersPerInstance);
      targetToFill.updatedAt = new Date();
      await targetToFill.save({ transaction });
    }
  }

  let chosenRow = null;
  let wasRedirectedFromFull = false;
  let replicatedNewInstance = false;

  if (!forceNewReplica && existingRows.length > 0) {
    if (preferredServerId || preferredServerUid) {
      const pref = existingRows.find(
        (s) =>
          (preferredServerId && Number(s.id) === Number(preferredServerId)) ||
          (preferredServerUid && String(s.uid) === String(preferredServerUid))
      );
      if (pref) {
        if (Number(pref.playersCount || 0) < Number(pref.maxPlayers || maxPlayersPerInstance)) {
          chosenRow = pref;
        } else {
          wasRedirectedFromFull = true;
        }
      }
    }

    if (!chosenRow) {
      chosenRow =
        existingRows.find((s) => Number(s.playersCount || 0) < Number(s.maxPlayers || maxPlayersPerInstance)) || null;
    }
  }

  if (!chosenRow) {
    // Todas as instâncias estão cheias (ou não há nenhuma aberta ou foi solicitado forceNewReplica):
    // Cria uma nova réplica da sala na tabela `servers`!
    const totalServersCount = await repo.Server.count({ transaction });
    const nextOffset = totalServersCount + 1;
    const internalPort = String(7000 + nextOffset);
    const publicPort = String(10017 + nextOffset);
    const serverIp = process.env.SERVER_IP || "127.0.0.1";

    chosenRow = await repo.Server.create(
      {
        pid: `replica-r${rId}-${Date.now()}`,
        roomId: rId,
        ip: serverIp,
        port: internalPort,
        publicPort,
        token: `srv_${rId}_${Date.now().toString(36)}`,
        maxPlayers: maxPlayersPerInstance,
        playersCount: joinPlayer ? 1 : 0,
        scene: room.scene || "lobby",
        language: "pt-BR",
      },
      { transaction }
    );
    replicatedNewInstance = true;
    existingRows.push(chosenRow);
  } else if (joinPlayer) {
    chosenRow.playersCount = Math.min(
      Number(chosenRow.maxPlayers || maxPlayersPerInstance),
      Number(chosenRow.playersCount || 0) + 1
    );
    chosenRow.updatedAt = new Date();
    await chosenRow.save({ transaction });
  }

  const formattedInstances = existingRows.map((srv, idx) => formatServerInstance(srv, idx, room));
  const selectedFormatted =
    formattedInstances.find((s) => Number(s.id) === Number(chosenRow.id)) ||
    formattedInstances[formattedInstances.length - 1];
  const totalPlayersOnline = formattedInstances.reduce((acc, s) => acc + s.playersCount, 0);

  // Sincroniza playersCount total na tabela rooms
  await repo.sequelize
    .query(`UPDATE "rooms" SET "playersCount" = :totalPlayersOnline WHERE "id" = :roomId`, {
      replacements: { totalPlayersOnline, roomId: rId },
      transaction,
    })
    .catch(() => {});

  return {
    instance: selectedFormatted,
    replicatedNewInstance,
    wasRedirectedFromFull,
    instances: formattedInstances,
    instancesCount: formattedInstances.length,
    totalPlayersOnline,
    room: room.get({ plain: true }),
  };
}

/**
 * Processa a entrada / visita de um Avatar em uma Sala 3D:
 * 1. Se a sala cobrar entrada (entryValue > 0) e o visitante não for o dono:
 *    - Verifica se já possui Passe de 24h ativo em room_entry_passes (expiresAt > NOW()).
 *    - Se não possuir, cobra entryValue Coins do visitante, retém a taxa da plataforma
 *      (roomEntryPlatformFeePercent, ex: 15%) e repassa a diferença (85%) para a carteira
 *      do dono da sala, emitindo um Passe válido por 24 horas.
 * 2. Contabiliza a visita na tabela room_visits (visitas totais e visitas únicas no mês YYYY-MM).
 * 3. Verifica se a sala atingiu um novo múltiplo de 1.000 visitas únicas no mês; se sim,
 *    paga automaticamente roomVisitsPayoutPer1kCoins ao dono da sala e registra em room_visit_payouts.
 * 4. Aloca o jogador em uma instância da sala na tabela `servers` (e se a instância estiver cheia,
 *    replica automaticamente uma nova sala/instância em `servers`).
 */
async function enterRoomWithPassAndVisit({
  roomId,
  visitorAvatarId,
  visitorUserId = null,
  password = "",
  preferredServerId = null,
  preferredServerUid = null,
}) {
  await ensureFeeAndRoomTables();
  const rId = Number(roomId);
  const vAvatarId = Number(visitorAvatarId);
  if (!rId || !vAvatarId) {
    throw new Error("Informe a sala e o avatar visitante.");
  }

  return await repo.sequelize.transaction(async (t) => {
    const room = await repo.RoomModel.findByPk(rId, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!room) {
      throw new Error("Sala 3D não encontrada.");
    }

    const ownerAvatarId = Number(room.avatarId || 0);
    let ownerUserId = Number(room.userId || 0);
    if (!ownerUserId && ownerAvatarId > 0 && repo.AvatarModel) {
      const ownerAv = await repo.AvatarModel.findByPk(ownerAvatarId, { attributes: ["id", "userId"], transaction: t });
      if (ownerAv?.userId) ownerUserId = Number(ownerAv.userId);
    }
    const isOwner =
      (ownerAvatarId > 0 && ownerAvatarId === vAvatarId) ||
      (ownerUserId > 0 && Number(visitorUserId || 0) === ownerUserId);

    if (room.isPrivate && !isOwner && room.password && String(room.password).trim() !== "") {
      if (String(password || "").trim() !== String(room.password).trim()) {
        throw new Error("Esta sala é privada e requer a senha correta para entrar.");
      }
    }

    const rules = await getEconomyRules(t);
    const entryPrice = Math.max(0, Number(room.entryValue || 0));
    const feePct = Number(rules.roomEntryPlatformFeePercent ?? 15.0);
    const passHours = Number(rules.roomPassDurationHours || 24);
    const payoutPer1k = Number(rules.roomVisitsPayoutPer1kCoins ?? 50.0);

    let passStatus = "FREE_ROOM";
    let passExpiresAt = null;
    let paidCoinsNow = 0;
    let platformFeeCoins = 0;
    let ownerReceivedCoins = 0;

    if (isOwner) {
      passStatus = "OWNER_FREE";
    } else if (entryPrice > 0) {
      // Verifica se já tem passe ativo nas últimas 24h
      const existingPasses = await repo.sequelize.query(
        `SELECT * FROM "room_entry_passes"
         WHERE "roomId" = :roomId
           AND "visitorAvatarId" = :visitorAvatarId
           AND "expiresAt" > NOW()
         ORDER BY "expiresAt" DESC
         LIMIT 1`,
        {
          replacements: { roomId: rId, visitorAvatarId: vAvatarId },
          type: repo.Sequelize.QueryTypes.SELECT,
          transaction: t,
        }
      );

      if (existingPasses && existingPasses.length > 0) {
        passStatus = "ACTIVE_PASS_24H";
        passExpiresAt = existingPasses[0].expiresAt;
      } else {
        // Cobra o passe de 24h do visitante
        const visitorWallet = await repo.Currency.findOne({
          where: { [Op.or]: [{ avatarId: vAvatarId }, { ownerId: vAvatarId }] },
          lock: t.LOCK.UPDATE,
          transaction: t,
        });

        if (!visitorWallet || Number(visitorWallet.coins || 0) < entryPrice) {
          throw new Error(
            `Esta sala cobra Passe de Entrada (${passHours}h) de ${entryPrice.toFixed(2)} Coins. Seu saldo atual é ${Number(visitorWallet?.coins || 0).toFixed(2)} Coins.`
          );
        }

        platformFeeCoins = Number((entryPrice * (feePct / 100.0)).toFixed(2));
        ownerReceivedCoins = Number((entryPrice - platformFeeCoins).toFixed(2));
        paidCoinsNow = entryPrice;

        // 1. Debita do visitante
        visitorWallet.coins = Number((Number(visitorWallet.coins) - entryPrice).toFixed(2));
        await visitorWallet.save({ transaction: t });

        await recordLedgerEntry({
          userId: visitorUserId || visitorWallet.userId,
          avatarId: vAvatarId,
          currencyType: "Coins",
          direction: "DEBIT",
          grossAmount: entryPrice,
          feeAmount: 0,
          netAmount: entryPrice,
          balanceAfter: visitorWallet.coins,
          category: "ROOM_PASS",
          description: `Compra de Passe ${passHours}h na Sala "${room.name}" (#${rId})`,
          relatedAvatarId: ownerAvatarId || null,
          transaction: t,
        });

        // 2. Repassa a diferença líquida ao dono da sala
        if (ownerAvatarId > 0 && ownerReceivedCoins > 0) {
          let ownerWallet = await repo.Currency.findOne({
            where: { [Op.or]: [{ avatarId: ownerAvatarId }, { ownerId: ownerAvatarId }] },
            lock: t.LOCK.UPDATE,
            transaction: t,
          });
          if (!ownerWallet) {
            ownerWallet = await repo.Currency.create(
              {
                avatarId: ownerAvatarId,
                ownerId: ownerAvatarId,
                userId: ownerUserId || null,
                cash: 0,
                coins: 0,
                chips: 0,
              },
              { transaction: t }
            );
          }
          ownerWallet.coins = Number((Number(ownerWallet.coins || 0) + ownerReceivedCoins).toFixed(2));
          await ownerWallet.save({ transaction: t });

          await recordLedgerEntry({
            userId: ownerUserId || ownerWallet.userId,
            avatarId: ownerAvatarId,
            currencyType: "Coins",
            direction: "CREDIT",
            grossAmount: entryPrice,
            feeAmount: platformFeeCoins,
            netAmount: ownerReceivedCoins,
            balanceAfter: ownerWallet.coins,
            category: "ROOM_PASS",
            description: `Passe ${passHours}h vendido na Sala "${room.name}" (#${rId}) — Taxa ${feePct}%: -${platformFeeCoins} Coins`,
            relatedAvatarId: vAvatarId,
            transaction: t,
          });

          await createNotification({
            userId: ownerUserId || ownerWallet.userId,
            avatarId: ownerAvatarId,
            type: "ROOM",
            title: "Passe 24h Vendido na sua Sala!",
            message: `Um visitante adquiriu o Passe ${passHours}h na sala "${room.name}". Você recebeu +${ownerReceivedCoins.toFixed(2)} Coins líquidos!`,
            icon: "fa-ticket",
            transaction: t,
          });

          if (repo.CurrencyRegister) {
            await repo.CurrencyRegister.create(
              {
                userId: ownerUserId || ownerWallet.userId,
                ownerId: ownerAvatarId,
                type: "Coins",
                transactionType: "Rewards",
                value: ownerReceivedCoins,
                description: `Passe ${passHours}h vendido na Sala "${room.name}" (#${rId}) — Entrada: ${entryPrice} Coins | Taxa ${feePct}%: -${platformFeeCoins} Coins`,
              },
              { transaction: t }
            );
          }
        }

        // 3. Contabiliza a taxa da plataforma no cofre de Coins
        if (platformFeeCoins > 0) {
          rules.collectedFeesCoins = Number((Number(rules.collectedFeesCoins || 0) + platformFeeCoins).toFixed(4));
          await rules.save({ transaction: t });
        }

        if (repo.CurrencyRegister) {
          await repo.CurrencyRegister.create(
            {
              userId: visitorUserId || visitorWallet.userId,
              ownerId: vAvatarId,
              type: "Coins",
              transactionType: "Buy",
              value: -entryPrice,
              description: `Compra de Passe ${passHours}h na Sala "${room.name}" (#${rId})`,
            },
            { transaction: t }
          );
        }

        // 4. Emite o Passe válido por 24h (ou roomPassDurationHours)
        const expiresDate = new Date(Date.now() + passHours * 3600 * 1000);
        await repo.sequelize.query(
          `INSERT INTO "room_entry_passes"
            ("roomId", "visitorAvatarId", "ownerAvatarId", "entryPrice", "platformFee", "ownerNetReceived", "expiresAt", "createdAt")
           VALUES (:roomId, :visitorAvatarId, :ownerAvatarId, :entryPrice, :platformFee, :ownerNetReceived, :expiresAt, NOW())`,
          {
            replacements: {
              roomId: rId,
              visitorAvatarId: vAvatarId,
              ownerAvatarId: ownerAvatarId || null,
              entryPrice,
              platformFee: platformFeeCoins,
              ownerNetReceived: ownerReceivedCoins,
              expiresAt: expiresDate.toISOString(),
            },
            transaction: t,
          }
        );

        passStatus = "NEW_PASS_PURCHASED";
        passExpiresAt = expiresDate.toISOString();
      }
    }

    // 5. Registra a visita na sala (Total + Visita Única Mensal YYYY-MM com Anti-Farm)
    const monthKey = getCurrentMonthKey();
    room.visits = Number(room.visits || 0) + 1;
    await room.save({ transaction: t });

    // Regra Anti-Farm (Item 3):
    // Se o visitante pertence à mesma conta (userId) do dono da sala ou é o próprio dono,
    // não contabiliza como visita única para fins de pagamento do prêmio de 1.000 visitas.
    if (!isOwner) {
      await repo.sequelize.query(
        `INSERT INTO "room_visits" ("roomId", "visitorAvatarId", "visitorUserId", "monthKey", "visitCount", "firstVisitedAt", "lastVisitedAt")
         VALUES (:roomId, :visitorAvatarId, :visitorUserId, :monthKey, 1, NOW(), NOW())
         ON CONFLICT ("roomId", "visitorAvatarId", "monthKey")
         DO UPDATE SET "visitCount" = "room_visits"."visitCount" + 1, "lastVisitedAt" = NOW()`,
        {
          replacements: {
            roomId: rId,
            visitorAvatarId: vAvatarId,
            visitorUserId: visitorUserId || null,
            monthKey,
          },
          transaction: t,
        }
      );
    }

    // 6. Conta quantas visitas únicas por CONTA (userId) a sala tem no mês atual e verifica marco de 1.000 visitas únicas/mês
    const uniqueCountRes = await repo.sequelize.query(
      `SELECT COUNT(DISTINCT COALESCE("visitorUserId", -"visitorAvatarId"))::int AS "uniqueMonthly"
       FROM "room_visits"
       WHERE "roomId" = :roomId AND "monthKey" = :monthKey`,
      {
        replacements: { roomId: rId, monthKey },
        type: repo.Sequelize.QueryTypes.SELECT,
        transaction: t,
      }
    );

    const monthlyUniqueVisits = Number(uniqueCountRes[0]?.uniqueMonthly || 0);
    const milestonesReached = Math.floor(monthlyUniqueVisits / 1000);
    let milestonePaidNow = false;
    let milestoneRewardCoins = 0;

    if (milestonesReached >= 1 && ownerAvatarId > 0 && payoutPer1k > 0) {
      for (let m = 1; m <= milestonesReached; m++) {
        const existingMilestone = await repo.sequelize.query(
          `SELECT "id" FROM "room_visit_payouts"
           WHERE "roomId" = :roomId AND "monthKey" = :monthKey AND "milestone1k" = :m
           LIMIT 1`,
          {
            replacements: { roomId: rId, monthKey, m },
            type: repo.Sequelize.QueryTypes.SELECT,
            transaction: t,
          }
        );

        if (!existingMilestone || existingMilestone.length === 0) {
          await repo.sequelize.query(
            `INSERT INTO "room_visit_payouts"
              ("roomId", "ownerAvatarId", "monthKey", "milestone1k", "uniqueVisitsCount", "rewardCoins", "createdAt")
             VALUES (:roomId, :ownerAvatarId, :monthKey, :m, :uniqueVisitsCount, :rewardCoins, NOW())`,
            {
              replacements: {
                roomId: rId,
                ownerAvatarId,
                monthKey,
                m,
                uniqueVisitsCount: monthlyUniqueVisits,
                rewardCoins: payoutPer1k,
              },
              transaction: t,
            }
          );

          let ownerWallet = await repo.Currency.findOne({
            where: { [Op.or]: [{ avatarId: ownerAvatarId }, { ownerId: ownerAvatarId }] },
            lock: t.LOCK.UPDATE,
            transaction: t,
          });
          if (ownerWallet) {
            ownerWallet.coins = Number((Number(ownerWallet.coins || 0) + payoutPer1k).toFixed(2));
            await ownerWallet.save({ transaction: t });

            await recordLedgerEntry({
              userId: ownerUserId || ownerWallet.userId,
              avatarId: ownerAvatarId,
              currencyType: "Coins",
              direction: "CREDIT",
              grossAmount: payoutPer1k,
              feeAmount: 0,
              netAmount: payoutPer1k,
              balanceAfter: ownerWallet.coins,
              category: "ROOM_1K_REWARD",
              description: `Prêmio de ${m * 1000} Visitas Únicas no mês (${monthKey}) na Sala "${room.name}" (#${rId})`,
              transaction: t,
            });
          }

          await createNotification({
            userId: ownerUserId || ownerWallet?.userId,
            avatarId: ownerAvatarId,
            type: "ROOM",
            title: `🏆 Meta de ${m * 1000} Visitas Únicas Atingida!`,
            message: `Sua sala "${room.name}" alcançou ${m * 1000} visitas únicas em ${monthKey}! Você recebeu +${payoutPer1k.toFixed(2)} Coins de bônus!`,
            icon: "fa-trophy",
            transaction: t,
          });

          if (repo.CurrencyRegister) {
            await repo.CurrencyRegister.create(
              {
                userId: ownerUserId || ownerWallet?.userId,
                ownerId: ownerAvatarId,
                type: "Coins",
                transactionType: "Bonus",
                value: payoutPer1k,
                description: `Bônus de ${m * 1000} Visitas Únicas no mês (${monthKey}) na Sala "${room.name}" (#${rId})`,
              },
              { transaction: t }
            );
          }

          milestonePaidNow = true;
          milestoneRewardCoins += payoutPer1k;
        }
      }
    }

    // 7. Aloca o jogador em uma instância da sala na tabela `servers`
    // (Se a instância escolhida ou todas as existentes estiverem cheias, cria outra réplica da sala automaticamente!)
    let serverAllocation = null;
    try {
      serverAllocation = await allocateOrReplicateRoomServerInstance({
        roomId: rId,
        preferredServerId,
        preferredServerUid,
        joinPlayer: true,
        transaction: t,
      });
    } catch (srvErr) {
      console.warn("[enterRoomWithPassAndVisit:serverAllocation]", srvErr.message);
    }

    return {
      success: true,
      roomId: rId,
      roomName: room.name,
      passStatus,
      passExpiresAt,
      paidCoinsNow,
      platformFeeCoins,
      ownerReceivedCoins,
      totalVisits: Number(room.visits || 0),
      monthlyUniqueVisits,
      monthKey,
      payoutPer1kCoins: payoutPer1k,
      milestonePaidNow,
      milestoneRewardCoins,
      milestonePayoutTriggered: milestonePaidNow
        ? { milestoneVisits: milestonesReached * 1000, rewardCoins: milestoneRewardCoins }
        : null,
      serverInstance: serverAllocation?.instance || null,
      replicatedNewInstance: Boolean(serverAllocation?.replicatedNewInstance),
      wasRedirectedFromFull: Boolean(serverAllocation?.wasRedirectedFromFull),
      activeInstances: serverAllocation?.instances || [],
      instancesCount: Number(serverAllocation?.instancesCount || 0),
      totalPlayersOnline: Number(serverAllocation?.totalPlayersOnline || 0),
    };
  });
}

/**
 * Retorna o histórico recente de visitantes únicos e passes de 24h de uma sala específica
 */
async function getRoomVisitDetails(roomId, viewerAvatarId = 0) {
  await ensureFeeAndRoomTables();
  const rId = Number(roomId);
  const room = await repo.RoomModel.findByPk(rId, {
    include: [
      { model: repo.ObjectModel, as: "objects" },
      { model: repo.Terrain, as: "terrain" },
    ],
  });
  if (!room) return null;

  const [enriched] = await enrichRoomsWithVisitStats([room], viewerAvatarId);
  const monthKey = getCurrentMonthKey();

  const [recentVisitors, recentPasses, payoutsHistory] = await Promise.all([
    repo.sequelize
      .query(
        `SELECT rv."visitorAvatarId", rv."monthKey", rv."visitCount", rv."lastVisitedAt",
                a."name" AS "visitorName", a."thumbnail" AS "visitorThumb"
         FROM "room_visits" rv
         LEFT JOIN "avatars" a ON a."id" = rv."visitorAvatarId"
         WHERE rv."roomId" = :roomId AND rv."monthKey" = :monthKey
         ORDER BY rv."lastVisitedAt" DESC
         LIMIT 25`,
        { replacements: { roomId: rId, monthKey }, type: repo.Sequelize.QueryTypes.SELECT }
      )
      .catch(() => []),
    repo.sequelize
      .query(
        `SELECT rep."id", rep."visitorAvatarId", rep."entryPrice", rep."platformFee",
                rep."ownerNetReceived", rep."expiresAt", rep."createdAt",
                a."name" AS "visitorName"
         FROM "room_entry_passes" rep
         LEFT JOIN "avatars" a ON a."id" = rep."visitorAvatarId"
         WHERE rep."roomId" = :roomId
         ORDER BY rep."createdAt" DESC
         LIMIT 20`,
        { replacements: { roomId: rId }, type: repo.Sequelize.QueryTypes.SELECT }
      )
      .catch(() => []),
    repo.sequelize
      .query(
        `SELECT * FROM "room_visit_payouts"
         WHERE "roomId" = :roomId
         ORDER BY "createdAt" DESC
         LIMIT 12`,
        { replacements: { roomId: rId }, type: repo.Sequelize.QueryTypes.SELECT }
      )
      .catch(() => []),
  ]);

  return {
    ...enriched,
    room: enriched,
    recentVisitors,
    recentPasses,
    activePasses: recentPasses.filter((p) => new Date(p.expiresAt) > new Date()),
    payouts: payoutsHistory,
    payoutsHistory,
  };
}

// ============================================================================
// ITEM 1: EXTRATO COMPLETO DA CARTEIRA (wallet_ledger)
// ============================================================================
async function recordLedgerEntry({
  userId = null,
  avatarId,
  currencyType = "Coins",
  direction = "DEBIT",
  grossAmount = 0,
  feeAmount = 0,
  netAmount = 0,
  balanceAfter = 0,
  category = "GENERAL",
  description = "",
  relatedAvatarId = null,
  transaction = null,
}) {
  await ensureFeeAndRoomTables();
  if (!avatarId) return null;
  try {
    await repo.sequelize.query(
      `INSERT INTO "wallet_ledger"
        ("userId", "avatarId", "currencyType", "direction", "grossAmount", "feeAmount", "netAmount", "balanceAfter", "category", "description", "relatedAvatarId", "createdAt")
       VALUES (:userId, :avatarId, :currencyType, :direction, :grossAmount, :feeAmount, :netAmount, :balanceAfter, :category, :description, :relatedAvatarId, NOW())`,
      {
        replacements: {
          userId: userId || null,
          avatarId: Number(avatarId),
          currencyType: String(currencyType || "Coins"),
          direction: String(direction || "DEBIT"),
          grossAmount: Number(grossAmount || 0),
          feeAmount: Number(feeAmount || 0),
          netAmount: Number(netAmount || 0),
          balanceAfter: Number(balanceAfter || 0),
          category: String(category || "GENERAL"),
          description: String(description || ""),
          relatedAvatarId: relatedAvatarId ? Number(relatedAvatarId) : null,
        },
        transaction,
      }
    );
  } catch (err) {
    console.warn("[recordLedgerEntry]", err.message);
  }
}

async function getWalletLedger(avatarId, limit = 40) {
  await ensureFeeAndRoomTables();
  const avId = Number(avatarId || 0);
  if (!avId) return [];
  try {
    return await repo.sequelize.query(
      `SELECT wl.*, a."name" AS "relatedAvatarName"
       FROM "wallet_ledger" wl
       LEFT JOIN "avatars" a ON a."id" = wl."relatedAvatarId"
       WHERE wl."avatarId" = :avatarId
       ORDER BY wl."createdAt" DESC, wl."id" DESC
       LIMIT :limit`,
      {
        replacements: { avatarId: avId, limit: Math.min(Math.max(Number(limit) || 40, 1), 200) },
        type: repo.Sequelize.QueryTypes.SELECT,
      }
    );
  } catch (err) {
    console.warn("[getWalletLedger]", err.message);
    return [];
  }
}

// ============================================================================
// ITEM 4: CENTRAL DE NOTIFICAÇÕES (user_notifications)
// ============================================================================
async function createNotification({
  userId = null,
  avatarId,
  type = "GENERAL",
  title = "Notificação TFL",
  message = "",
  icon = "fa-bell",
  transaction = null,
}) {
  await ensureFeeAndRoomTables();
  if (!avatarId) return;
  try {
    await repo.sequelize.query(
      `INSERT INTO "user_notifications" ("userId", "avatarId", "type", "title", "message", "icon", "isRead", "createdAt")
       VALUES (:userId, :avatarId, :type, :title, :message, :icon, FALSE, NOW())`,
      {
        replacements: {
          userId: userId || null,
          avatarId: Number(avatarId),
          type: String(type || "GENERAL"),
          title: String(title || "Notificação"),
          message: String(message || ""),
          icon: String(icon || "fa-bell"),
        },
        transaction,
      }
    );
  } catch (err) {
    console.warn("[createNotification]", err.message);
  }
}

async function getNotifications(avatarId, limit = 30) {
  await ensureFeeAndRoomTables();
  const avId = Number(avatarId || 0);
  if (!avId) return { notifications: [], unreadCount: 0 };
  try {
    const [notifications, unreadRes] = await Promise.all([
      repo.sequelize.query(
        `SELECT * FROM "user_notifications"
         WHERE "avatarId" = :avatarId
         ORDER BY "createdAt" DESC, "id" DESC
         LIMIT :limit`,
        {
          replacements: { avatarId: avId, limit: Math.min(Math.max(Number(limit) || 30, 1), 100) },
          type: repo.Sequelize.QueryTypes.SELECT,
        }
      ),
      repo.sequelize.query(
        `SELECT COUNT(*)::int AS "unreadCount"
         FROM "user_notifications"
         WHERE "avatarId" = :avatarId AND "isRead" = FALSE`,
        {
          replacements: { avatarId: avId },
          type: repo.Sequelize.QueryTypes.SELECT,
        }
      ),
    ]);
    return {
      notifications,
      unreadCount: Number(unreadRes[0]?.unreadCount || 0),
    };
  } catch (err) {
    return { notifications: [], unreadCount: 0 };
  }
}

async function markNotificationsRead(avatarId, notificationId = null) {
  await ensureFeeAndRoomTables();
  const avId = Number(avatarId || 0);
  if (!avId) return { success: false };
  if (notificationId) {
    await repo.sequelize.query(
      `UPDATE "user_notifications" SET "isRead" = TRUE WHERE "avatarId" = :avatarId AND "id" = :id`,
      { replacements: { avatarId: avId, id: Number(notificationId) } }
    );
  } else {
    await repo.sequelize.query(
      `UPDATE "user_notifications" SET "isRead" = TRUE WHERE "avatarId" = :avatarId`,
      { replacements: { avatarId: avId } }
    );
  }
  return { success: true };
}

// ============================================================================
// ITEM 5: TRANSFERÊNCIA DE MOEDA DO JOGO (COINS) ENTRE JOGADORES (COM TAXA CONFIGURADA)
// (Estritamente proibido transferir Cash/valores reais entre usuários; apenas Coins)
// ============================================================================
async function transferCoinsBetweenPlayers({
  senderAvatarId,
  senderUserId = null,
  targetAvatarInput,
  amountCoins,
  note = "",
}) {
  await ensureFeeAndRoomTables();
  const sId = Number(senderAvatarId || 0);
  const grossCoins = Number(Number(amountCoins || 0).toFixed(2));

  if (!sId) throw new Error("Avatar remetente não identificado.");
  if (!grossCoins || grossCoins <= 0 || isNaN(grossCoins)) {
    throw new Error("Informe uma quantidade válida de Coins (maior que zero) para transferir.");
  }
  if (grossCoins < 1) {
    throw new Error("O valor mínimo para transferência entre jogadores é de 1,00 Coin.");
  }

  const rawTarget = String(targetAvatarInput || "").trim().replace(/^#/, "");
  if (!rawTarget) {
    throw new Error("Informe o ID (#ID) ou nome exato do Avatar destinatário.");
  }

  return await repo.sequelize.transaction(async (t) => {
    let targetAvatar = null;
    if (/^\d+$/.test(rawTarget)) {
      targetAvatar = await repo.AvatarModel.findByPk(Number(rawTarget), { transaction: t });
    }
    if (!targetAvatar) {
      targetAvatar = await repo.AvatarModel.findOne({
        where: {
          name: { [Op.iLike]: rawTarget },
        },
        transaction: t,
      });
    }
    if (!targetAvatar) {
      throw new Error(`Avatar destinatário "${targetAvatarInput}" não encontrado.`);
    }
    if (Number(targetAvatar.id) === sId) {
      throw new Error("Você não pode transferir Coins para o mesmo avatar.");
    }

    const senderAvatar = await repo.AvatarModel.findByPk(sId, { transaction: t });
    const rules = await getEconomyRules(t);
    const feePct = Math.max(0, Number(rules.p2pCoinsTransferFeePercent ?? 2.0));
    const feeCoins = Number(((grossCoins * feePct) / 100.0).toFixed(2));
    const netReceivedCoins = Number(Math.max(0.01, grossCoins - feeCoins).toFixed(2));

    const senderWallet = await repo.Currency.findOne({
      where: { [Op.or]: [{ avatarId: sId }, { ownerId: sId }] },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!senderWallet || Number(senderWallet.coins || 0) < grossCoins) {
      throw new Error(
        `Saldo insuficiente de Coins. Você possui ${Number(senderWallet?.coins || 0).toFixed(2)} Coins disponíveis.`
      );
    }

    let receiverWallet = await repo.Currency.findOne({
      where: { [Op.or]: [{ avatarId: targetAvatar.id }, { ownerId: targetAvatar.id }] },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!receiverWallet) {
      receiverWallet = await repo.Currency.create(
        {
          avatarId: targetAvatar.id,
          ownerId: targetAvatar.id,
          userId: targetAvatar.userId || null,
          cash: 0,
          coins: 0,
          chips: 0,
        },
        { transaction: t }
      );
    }

    // 1. Debita do remetente
    senderWallet.coins = Number((Number(senderWallet.coins) - grossCoins).toFixed(2));
    await senderWallet.save({ transaction: t });

    // 2. Credita valor líquido no destinatário
    receiverWallet.coins = Number((Number(receiverWallet.coins || 0) + netReceivedCoins).toFixed(2));
    await receiverWallet.save({ transaction: t });

    // 3. Soma a taxa no cofre do sistema
    if (feeCoins > 0) {
      rules.collectedFeesCoins = Number((Number(rules.collectedFeesCoins || 0) + feeCoins).toFixed(4));
      await rules.save({ transaction: t });
    }

    const cleanNote = String(note || "").trim().slice(0, 140);

    await recordLedgerEntry({
      userId: senderUserId || senderWallet.userId,
      avatarId: sId,
      currencyType: "Coins",
      direction: "DEBIT",
      grossAmount: grossCoins,
      feeAmount: feeCoins,
      netAmount: netReceivedCoins,
      balanceAfter: senderWallet.coins,
      category: "TRANSFER_P2P",
      description: `Transferência enviada para ${targetAvatar.name} (#${targetAvatar.id})${cleanNote ? ` — "${cleanNote}"` : ""} (Taxa ${feePct}%: ${feeCoins.toFixed(2)} Coins)`,
      relatedAvatarId: targetAvatar.id,
      transaction: t,
    });

    await recordLedgerEntry({
      userId: targetAvatar.userId || receiverWallet.userId,
      avatarId: targetAvatar.id,
      currencyType: "Coins",
      direction: "CREDIT",
      grossAmount: grossCoins,
      feeAmount: feeCoins,
      netAmount: netReceivedCoins,
      balanceAfter: receiverWallet.coins,
      category: "TRANSFER_P2P",
      description: `Transferência recebida de ${senderAvatar?.name || `Avatar #${sId}`}${cleanNote ? ` — "${cleanNote}"` : ""}`,
      relatedAvatarId: sId,
      transaction: t,
    });

    await createNotification({
      userId: targetAvatar.userId,
      avatarId: targetAvatar.id,
      type: "WALLET",
      title: "Coins Recebidos!",
      message: `${senderAvatar?.name || `Avatar #${sId}`} enviou +${netReceivedCoins.toFixed(2)} Coins para sua carteira${cleanNote ? `: "${cleanNote}"` : ""}!`,
      icon: "fa-coins",
      transaction: t,
    });

    return {
      success: true,
      senderAvatarId: sId,
      receiverAvatar: { id: targetAvatar.id, name: targetAvatar.name, thumbnail: targetAvatar.thumbnail },
      grossCoins,
      feePercent: feePct,
      feeCoins,
      netReceivedCoins,
      senderNewCoinsBalance: senderWallet.coins,
    };
  });
}

// ============================================================================
// SISTEMA VIP: PLANOS (1 SEMANA, 1 MÊS, 3 MESES), SELO VIP & LIMITES DE CHAT
// ============================================================================
const VIP_PLANS_META = {
  "1_week": { key: "1_week", label: "VIP 1 Semana (7 Dias)", durationDays: 7, ruleField: "vipPrice1WeekCash", defaultCash: 0.75 },
  "1_month": { key: "1_month", label: "VIP 1 Mês (30 Dias)", durationDays: 30, ruleField: "vipPrice1MonthCash", defaultCash: 2.00 },
  "3_months": { key: "3_months", label: "VIP Trimestral (90 Dias)", durationDays: 90, ruleField: "vipPrice3MonthsCash", defaultCash: 5.00 },
};

async function getVipStatus(avatarId, userId = null) {
  await ensureFeeAndRoomTables();
  const avId = Number(avatarId || 0);
  const rules = await getEconomyRules();
  const rate = Number(rules.rateCoinsPerCash) || 250;

  let isVip = false;
  let vipExpiresAt = null;
  let vipPlan = null;

  if (avId > 0) {
    const activeSubs = await repo.sequelize.query(
      `SELECT * FROM "vip_subscriptions"
       WHERE ("avatarId" = :avatarId OR (:userId IS NOT NULL AND "userId" = :userId))
         AND "expiresAt" > NOW()
       ORDER BY "expiresAt" DESC
       LIMIT 1`,
      {
        replacements: { avatarId: avId, userId: userId ? Number(userId) : null },
        type: repo.Sequelize.QueryTypes.SELECT,
      }
    );

    if (activeSubs && activeSubs.length > 0) {
      isVip = true;
      vipExpiresAt = activeSubs[0].expiresAt;
      vipPlan = activeSubs[0].planKey;
    } else if (repo.AvatarModel) {
      const av = await repo.AvatarModel.findByPk(avId);
      if (av && av.isVip && av.vipExpiresAt && new Date(av.vipExpiresAt) > new Date()) {
        isVip = true;
        vipExpiresAt = av.vipExpiresAt;
        vipPlan = av.vipPlan || "1_month";
      } else if (av && av.isVip && (!av.vipExpiresAt || new Date(av.vipExpiresAt) <= new Date())) {
        await repo.sequelize.query(
          `UPDATE "avatars" SET "isVip" = FALSE WHERE "id" = :avatarId`,
          { replacements: { avatarId: avId } }
        );
      }
    }
  }

  // Contabiliza o uso do Chat hoje (aberturas de conversa, imagens e áudios enviados hoje)
  let opensToday = 0;
  let imagesToday = 0;
  let audioToday = 0;

  if (avId > 0) {
    const [dmOpensRes, mediaSentRes] = await Promise.all([
      repo.sequelize
        .query(
          `SELECT COUNT(*)::int AS "cnt"
           FROM "chat_participants" cp
           INNER JOIN "chat_rooms" cr ON cr."id" = cp."chat_id"
           WHERE cp."profile_id" = :avatarId
             AND cr."type" = 'private'
             AND cp."joined_at" >= CURRENT_DATE`,
          { replacements: { avatarId: avId }, type: repo.Sequelize.QueryTypes.SELECT }
        )
        .catch(() => [{ cnt: 0 }]),
      repo.sequelize
        .query(
          `SELECT
             COALESCE(SUM(CASE WHEN "has_image" = TRUE THEN 1 ELSE 0 END), 0)::int AS "imgCnt",
             COALESCE(SUM(CASE WHEN "has_audio" = TRUE THEN 1 ELSE 0 END), 0)::int AS "audCnt"
           FROM "chat_messages"
           WHERE "profile_id" = :avatarId
             AND "created_at" >= CURRENT_DATE`,
          { replacements: { avatarId: avId }, type: repo.Sequelize.QueryTypes.SELECT }
        )
        .catch(() => [{ imgCnt: 0, audCnt: 0 }]),
    ]);

    opensToday = Number(dmOpensRes[0]?.cnt || 0);
    imagesToday = Number(mediaSentRes[0]?.imgCnt || 0);
    audioToday = Number(mediaSentRes[0]?.audCnt || 0);
  }

  const basicMaxOpens = Number(rules.basicMaxChatOpensPerDay ?? 3);
  const basicMaxImages = Number(rules.basicMaxChatImagesPerDay ?? 2);
  const basicMaxAudio = Number(rules.basicMaxChatAudioPerDay ?? 2);
  const vipMaxImages = Number(rules.vipMaxChatImagesPerDay ?? 0);
  const vipMaxAudio = Number(rules.vipMaxChatAudioPerDay ?? 0);

  const plans = Object.values(VIP_PLANS_META).map((p) => {
    const priceCash = Number(rules[p.ruleField] ?? p.defaultCash);
    const priceCoins = Math.ceil(priceCash * rate);
    return {
      key: p.key,
      label: p.label,
      durationDays: p.durationDays,
      priceCash,
      priceCoins,
    };
  });

  return {
    isVip,
    vipExpiresAt,
    vipPlan,
    badgeLabel: isVip ? "👑 VIP" : "Membro Básico",
    plans,
    chatUsageToday: {
      opens: opensToday,
      images: imagesToday,
      audio: audioToday,
    },
    limits: {
      canOpenDmWithNonFriends: isVip,
      maxChatOpensPerDay: isVip ? 0 : basicMaxOpens, // 0 = ilimitado
      maxChatImagesPerDay: isVip ? vipMaxImages : basicMaxImages,
      maxChatAudioPerDay: isVip ? vipMaxAudio : basicMaxAudio,
      basicMaxOpens,
      basicMaxImages,
      basicMaxAudio,
      vipMaxImages,
      vipMaxAudio,
    },
    gamePermissions: {
      vipBadgeIn3D: isVip,
      priorityRoomQueue: isVip,
      exclusiveEmotesAndActions: isVip,
      voiceAndMediaUnlimited: isVip,
    },
  };
}

async function enrichAvatarsWithVip(avatarsList = []) {
  await ensureFeeAndRoomTables();
  const list = Array.isArray(avatarsList)
    ? avatarsList.map((a) => (typeof a?.toJSON === "function" ? a.toJSON() : { ...a }))
    : [];
  if (list.length === 0) return [];

  const ids = list.map((a) => Number(a.id)).filter(Boolean);
  if (ids.length === 0) return list;

  const activeRows = await repo.sequelize
    .query(
      `SELECT DISTINCT "avatarId"
       FROM "vip_subscriptions"
       WHERE "avatarId" IN (:ids) AND "expiresAt" > NOW()`,
      { replacements: { ids }, type: repo.Sequelize.QueryTypes.SELECT }
    )
    .catch(() => []);

  const vipSet = new Set(activeRows.map((r) => Number(r.avatarId)));
  return list.map((av) => {
    const activeByCol = Boolean(av.isVip && (!av.vipExpiresAt || new Date(av.vipExpiresAt) > new Date()));
    const isVip = vipSet.has(Number(av.id)) || activeByCol;
    return {
      ...av,
      isVip,
    };
  });
}

async function purchaseVipSubscription({ avatarId, userId = null, planKey = "1_month", payWith = "Cash" }) {
  await ensureFeeAndRoomTables();
  const avId = Number(avatarId || 0);
  if (!avId) throw new Error("Avatar não identificado para ativar o VIP.");

  const planMeta = VIP_PLANS_META[planKey] || VIP_PLANS_META["1_month"];
  const currency = String(payWith || "Cash").toLowerCase() === "coins" ? "Coins" : "Cash";

  return await repo.sequelize.transaction(async (t) => {
    const rules = await getEconomyRules(t);
    const rate = Number(rules.rateCoinsPerCash) || 250;
    const priceCash = Number(rules[planMeta.ruleField] ?? planMeta.defaultCash);
    const priceCoins = Math.ceil(priceCash * rate);

    const wallet = await repo.Currency.findOne({
      where: { [Op.or]: [{ avatarId: avId }, { ownerId: avId }] },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!wallet) {
      throw new Error("Carteira não encontrada para este avatar.");
    }

    let amountPaid = 0;
    let balanceAfter = 0;

    if (currency === "Cash") {
      if (Number(wallet.cash || 0) < priceCash) {
        throw new Error(
          `Saldo insuficiente de Cash para o plano ${planMeta.label} ($${priceCash.toFixed(2)} Cash). Seu saldo é $${Number(wallet.cash || 0).toFixed(2)} Cash.`
        );
      }
      wallet.cash = Number((Number(wallet.cash) - priceCash).toFixed(2));
      await wallet.save({ transaction: t });
      amountPaid = priceCash;
      balanceAfter = wallet.cash;
      rules.collectedFeesCash = Number((Number(rules.collectedFeesCash || 0) + priceCash).toFixed(4));
      await rules.save({ transaction: t });
    } else {
      if (Number(wallet.coins || 0) < priceCoins) {
        throw new Error(
          `Saldo insuficiente de Coins para o plano ${planMeta.label} (${priceCoins} Coins). Seu saldo é ${Number(wallet.coins || 0).toFixed(2)} Coins.`
        );
      }
      wallet.coins = Number((Number(wallet.coins) - priceCoins).toFixed(2));
      await wallet.save({ transaction: t });
      amountPaid = priceCoins;
      balanceAfter = wallet.coins;
      rules.collectedFeesCoins = Number((Number(rules.collectedFeesCoins || 0) + priceCoins).toFixed(4));
      await rules.save({ transaction: t });
    }

    // Se já tinha VIP ativo, soma os dias ao vencimento atual
    const currentSubs = await repo.sequelize.query(
      `SELECT "expiresAt" FROM "vip_subscriptions"
       WHERE "avatarId" = :avatarId AND "expiresAt" > NOW()
       ORDER BY "expiresAt" DESC LIMIT 1`,
      { replacements: { avatarId: avId }, type: repo.Sequelize.QueryTypes.SELECT, transaction: t }
    );

    const baseDate =
      currentSubs && currentSubs.length > 0 && new Date(currentSubs[0].expiresAt) > new Date()
        ? new Date(currentSubs[0].expiresAt)
        : new Date();

    const expiresAt = new Date(baseDate.getTime() + planMeta.durationDays * 86400 * 1000);

    await repo.sequelize.query(
      `INSERT INTO "vip_subscriptions"
        ("userId", "avatarId", "planKey", "durationDays", "priceCash", "currencyPaid", "amountPaid", "startsAt", "expiresAt", "status", "createdAt")
       VALUES (:userId, :avatarId, :planKey, :durationDays, :priceCash, :currencyPaid, :amountPaid, NOW(), :expiresAt, 'ACTIVE', NOW())`,
      {
        replacements: {
          userId: userId || wallet.userId || null,
          avatarId: avId,
          planKey: planMeta.key,
          durationDays: planMeta.durationDays,
          priceCash,
          currencyPaid: currency,
          amountPaid,
          expiresAt: expiresAt.toISOString(),
        },
        transaction: t,
      }
    );

    // Atualiza todos os avatares da mesma conta (ou o avatar atual) com o selo VIP
    if (userId) {
      await repo.sequelize.query(
        `UPDATE "avatars" SET "isVip" = TRUE, "vipExpiresAt" = :expiresAt, "vipPlan" = :planKey
         WHERE "userId" = :userId OR "id" = :avatarId`,
        {
          replacements: { expiresAt: expiresAt.toISOString(), planKey: planMeta.key, userId: Number(userId), avatarId: avId },
          transaction: t,
        }
      );
    } else {
      await repo.sequelize.query(
        `UPDATE "avatars" SET "isVip" = TRUE, "vipExpiresAt" = :expiresAt, "vipPlan" = :planKey
         WHERE "id" = :avatarId`,
        {
          replacements: { expiresAt: expiresAt.toISOString(), planKey: planMeta.key, avatarId: avId },
          transaction: t,
        }
      );
    }

    await recordLedgerEntry({
      userId: userId || wallet.userId,
      avatarId: avId,
      currencyType: currency,
      direction: "DEBIT",
      grossAmount: amountPaid,
      feeAmount: 0,
      netAmount: amountPaid,
      balanceAfter,
      category: "VIP_SUBSCRIPTION",
      description: `Assinatura ${planMeta.label} ativada até ${expiresAt.toLocaleDateString("pt-BR")}`,
      transaction: t,
    });

    await createNotification({
      userId: userId || wallet.userId,
      avatarId: avId,
      type: "VIP",
      title: `👑 ${planMeta.label} Ativado!`,
      message: `Parabéns! Seu Selo VIP, limites expandidos de Voz/Imagem no Chat e vantagens exclusivas no jogo estão ativos até ${expiresAt.toLocaleDateString("pt-BR")}.`,
      icon: "fa-crown",
      transaction: t,
    });

    return {
      success: true,
      plan: planMeta,
      currencyPaid: currency,
      amountPaid,
      vipExpiresAt: expiresAt.toISOString(),
    };
  });
}

/**
 * Valida se o jogador pode realizar uma ação no Chat (abrir nova DM, enviar imagem ou enviar voz/áudio)
 * de acordo com seu status Básico vs VIP.
 */
async function checkAndRecordChatAction({ avatarId, userId = null, actionType, targetProfileId = null }) {
  const vipStatus = await getVipStatus(avatarId, userId);
  const { isVip, chatUsageToday, limits } = vipStatus;

  if (actionType === "OPEN_DM") {
    if (!isVip) {
      // Membro Básico: só pode abrir nova conversa direta com Amigos Aceitos
      if (targetProfileId && repo.Friendship) {
        const friendship = await repo.Friendship.findOne({
          where: {
            status: "accepted",
            [Op.or]: [
              { requesterId: Number(avatarId), addresseeId: Number(targetProfileId) },
              { requesterId: Number(targetProfileId), addresseeId: Number(avatarId) },
            ],
          },
        });
        if (!friendship) {
          throw new Error(
            "👑 Membros Básicos só podem abrir novas conversas privadas com Amigos aceitos. Adicione como amigo primeiro ou torne-se Membro VIP para conversar com qualquer jogador!"
          );
        }
      }
      if (limits.maxChatOpensPerDay > 0 && chatUsageToday.opens >= limits.maxChatOpensPerDay) {
        throw new Error(
          `👑 Limite diário atingido: Membros Básicos podem abrir até ${limits.maxChatOpensPerDay} novas conversas por dia. Torne-se Membro VIP para aberturas ilimitadas!`
        );
      }
    }
  } else if (actionType === "SEND_IMAGE") {
    const maxImg = limits.maxChatImagesPerDay;
    if (maxImg > 0 && chatUsageToday.images >= maxImg) {
      throw new Error(
        `👑 Limite diário de Imagens no Chat atingido (${chatUsageToday.images}/${maxImg} hoje). Torne-se Membro VIP para enviar imagens sem limites!`
      );
    }
  } else if (actionType === "SEND_AUDIO") {
    const maxAud = limits.maxChatAudioPerDay;
    if (maxAud > 0 && chatUsageToday.audio >= maxAud) {
      throw new Error(
        `👑 Limite diário de Mensagens de Voz no Chat atingido (${chatUsageToday.audio}/${maxAud} hoje). Torne-se Membro VIP para enviar voz ilimitada!`
      );
    }
  }

  return vipStatus;
}

// ============================================================================
// ITEM 2: EXPLORAR SALAS PÚBLICAS, RANKING MENSAL & IMPULSIONAR SALA 24H
// ============================================================================
async function getPublicRoomsExplorer({ viewerAvatarId = 0, filter = "all", search = "", limit = 50 } = {}) {
  await ensureFeeAndRoomTables();
  const whereClause = {};
  if (filter === "free") {
    whereClause.entryValue = { [Op.lte]: 0 };
  } else if (filter === "paid") {
    whereClause.entryValue = { [Op.gt]: 0 };
  }
  if (search && String(search).trim() !== "") {
    whereClause.name = { [Op.iLike]: `%${String(search).trim()}%` };
  }

  const rooms = await repo.RoomModel.findAll({
    where: whereClause,
    order: [["visits", "DESC"], ["id", "DESC"]],
    limit: Math.min(Math.max(Number(limit) || 50, 1), 100),
  });

  const enriched = await enrichRoomsWithVisitStats(rooms, viewerAvatarId);

  // Busca nomes e VIP dos donos das salas
  const ownerIds = [...new Set(enriched.map((r) => Number(r.avatarId)).filter(Boolean))];
  let ownersMap = new Map();
  if (ownerIds.length > 0 && repo.AvatarModel) {
    const owners = await repo.AvatarModel.findAll({
      where: { id: { [Op.in]: ownerIds } },
      attributes: ["id", "name", "thumbnail", "isVip", "vipExpiresAt"],
    });
    const enrichedOwners = await enrichAvatarsWithVip(owners);
    ownersMap = new Map(enrichedOwners.map((o) => [Number(o.id), o]));
  }

  const now = new Date();
  const withOwner = enriched.map((r) => {
    const owner = ownersMap.get(Number(r.avatarId)) || null;
    const isBoosted = Boolean(r.boostExpiresAt && new Date(r.boostExpiresAt) > now);
    return {
      ...r,
      isBoosted,
      ownerName: owner?.name || `Avatar #${r.avatarId || 1}`,
      ownerThumbnail: owner?.thumbnail || "/assets/images/default-avatar.png",
      ownerIsVip: Boolean(owner?.isVip),
    };
  });

  // Ordena: Impulsionadas (Boost 24h) primeiro, depois por Visitas Únicas no Mês, depois por Visitas Totais
  withOwner.sort((a, b) => {
    if (a.isBoosted !== b.isBoosted) return a.isBoosted ? -1 : 1;
    if ((b.monthlyUniqueVisits || 0) !== (a.monthlyUniqueVisits || 0)) {
      return (b.monthlyUniqueVisits || 0) - (a.monthlyUniqueVisits || 0);
    }
    return (b.visits || 0) - (a.visits || 0);
  });

  return withOwner;
}

async function boostRoom24h({ roomId, ownerAvatarId, ownerUserId = null }) {
  await ensureFeeAndRoomTables();
  const rId = Number(roomId || 0);
  const avId = Number(ownerAvatarId || 0);
  if (!rId || !avId) throw new Error("Sala ou Avatar inválido.");

  return await repo.sequelize.transaction(async (t) => {
    const room = await repo.RoomModel.findByPk(rId, { lock: t.LOCK.UPDATE, transaction: t });
    if (!room) throw new Error("Sala não encontrada.");
    if (Number(room.avatarId) !== avId) {
      throw new Error("Apenas o dono da sala pode impulsioná-la.");
    }

    const rules = await getEconomyRules(t);
    const boostFee = Math.max(0, Number(rules.roomBoost24hFeeCoins ?? 20.0));

    const wallet = await repo.Currency.findOne({
      where: { [Op.or]: [{ avatarId: avId }, { ownerId: avId }] },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!wallet || Number(wallet.coins || 0) < boostFee) {
      throw new Error(
        `Saldo insuficiente para Impulsionar Sala por 24h (Taxa: ${boostFee.toFixed(2)} Coins). Seu saldo é ${Number(wallet?.coins || 0).toFixed(2)} Coins.`
      );
    }

    wallet.coins = Number((Number(wallet.coins) - boostFee).toFixed(2));
    await wallet.save({ transaction: t });

    rules.collectedFeesCoins = Number((Number(rules.collectedFeesCoins || 0) + boostFee).toFixed(4));
    await rules.save({ transaction: t });

    const baseDate = room.boostExpiresAt && new Date(room.boostExpiresAt) > new Date() ? new Date(room.boostExpiresAt) : new Date();
    const boostExpiresAt = new Date(baseDate.getTime() + 24 * 3600 * 1000);

    await repo.sequelize.query(
      `UPDATE "rooms" SET "boostExpiresAt" = :boostExpiresAt WHERE "id" = :roomId`,
      { replacements: { boostExpiresAt: boostExpiresAt.toISOString(), roomId: rId }, transaction: t }
    );

    await recordLedgerEntry({
      userId: ownerUserId || wallet.userId,
      avatarId: avId,
      currencyType: "Coins",
      direction: "DEBIT",
      grossAmount: boostFee,
      feeAmount: boostFee,
      netAmount: boostFee,
      balanceAfter: wallet.coins,
      category: "ROOM_BOOST",
      description: `Impulsionamento 24h da Sala "${room.name}" (#${rId}) no Explorador`,
      transaction: t,
    });

    return {
      success: true,
      roomId: rId,
      boostFeeCoins: boostFee,
      boostExpiresAt: boostExpiresAt.toISOString(),
      newCoinsBalance: wallet.coins,
    };
  });
}

// ============================================================================
// MÓDULO DE CASSINO TFL (EM CHIPS / FICHAS) — SLOTS, ROLETA & DADOS
// ============================================================================
const SLOT_SYMBOLS = [
  { key: "wild", emoji: "🐯", name: "Golden Tiger", mult3: 15 },
  { key: "gold", emoji: "🏆", name: "Cálice de Ouro", mult3: 8 },
  { key: "dragon", emoji: "🐉", name: "Dragão Imperial", mult3: 5 },
  { key: "bag", emoji: "💰", name: "Saco da Fortuna", mult3: 3.5 },
  { key: "envelope", emoji: "🧧", name: "Envelope Real", mult3: 2.5 },
  { key: "orange", emoji: "🍊", name: "Tangerina da Sorte", mult3: 1.8 },
];

async function playCasinoGame({ avatarId, userId = null, gameType = "slots", betChips = 10, choice = "red" }) {
  await ensureFeeAndRoomTables();
  const avId = Number(avatarId || 0);
  const bet = Math.floor(Number(betChips || 0));
  if (!avId) throw new Error("Avatar não autenticado.");
  if (!bet || bet < 1 || bet > 50000) {
    throw new Error("A aposta deve ser entre 1 e 50.000 Chips (Fichas).");
  }

  return await repo.sequelize.transaction(async (t) => {
    const rules = await getEconomyRules(t);
    const houseEdgePct = Math.min(Math.max(Number(rules.casinoHouseEdgePercent ?? 5.0), 0), 40);

    const wallet = await repo.Currency.findOne({
      where: { [Op.or]: [{ avatarId: avId }, { ownerId: avId }] },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!wallet || Number(wallet.chips || 0) < bet) {
      throw new Error(
        `Fichas (Chips) insuficientes! Você possui ${Number(wallet?.chips || 0)} Chips. Converta Coins em Chips para jogar.`
      );
    }

    // Debita a aposta
    wallet.chips = Math.max(0, Number(wallet.chips || 0) - bet);

    let winChips = 0;
    let multiplier = 0;
    let resultSummary = "";
    let outcomeDetails = {};

    // Ajusta chance de vitória com base no houseEdge configurado
    const winBias = Math.max(0.5, 1 - houseEdgePct / 100);

    if (gameType === "slots") {
      // Grid 3x3 do Golden Tiger TFL
      const pickSymbol = () => {
        const r = Math.random();
        if (r < 0.06 * winBias) return SLOT_SYMBOLS[0]; // wild 🐯
        if (r < 0.16 * winBias) return SLOT_SYMBOLS[1]; // gold 🏆
        if (r < 0.30 * winBias) return SLOT_SYMBOLS[2]; // dragon 🐉
        if (r < 0.50) return SLOT_SYMBOLS[3]; // bag 💰
        if (r < 0.74) return SLOT_SYMBOLS[4]; // envelope 🧧
        return SLOT_SYMBOLS[5]; // orange 🍊
      };

      const grid = [
        [pickSymbol(), pickSymbol(), pickSymbol()],
        [pickSymbol(), pickSymbol(), pickSymbol()],
        [pickSymbol(), pickSymbol(), pickSymbol()],
      ];

      // Avalia linhas horizontais e diagonais
      const lines = [
        grid[0],
        grid[1],
        grid[2],
        [grid[0][0], grid[1][1], grid[2][2]],
        [grid[2][0], grid[1][1], grid[0][2]],
      ];

      let totalMult = 0;
      const winningLines = [];
      lines.forEach((line, idx) => {
        const nonWild = line.filter((s) => s.key !== "wild");
        const targetKey = nonWild.length > 0 ? nonWild[0].key : "wild";
        const allMatch = line.every((s) => s.key === targetKey || s.key === "wild");
        if (allMatch) {
          const symObj = SLOT_SYMBOLS.find((s) => s.key === targetKey) || SLOT_SYMBOLS[0];
          totalMult += symObj.mult3;
          winningLines.push({ line: idx + 1, symbol: symObj.emoji, name: symObj.name, mult: symObj.mult3 });
        }
      });

      // Par central na linha do meio paga 1.2x de consolação se não houve linha completa
      if (totalMult === 0) {
        const mid = grid[1];
        if (mid[0].key === mid[1].key || mid[1].key === mid[2].key || mid[0].key === "wild" || mid[1].key === "wild") {
          if (Math.random() < 0.55 * winBias) {
            totalMult = 1.5;
            winningLines.push({ line: 2, symbol: mid[1].emoji, name: "Par Dourado Central", mult: 1.5 });
          }
        }
      }

      multiplier = Number(totalMult.toFixed(2));
      winChips = Math.floor(bet * multiplier);
      resultSummary =
        winChips > 0
          ? `🐯 Golden Tiger: Você ganhou ${winChips} Chips (${multiplier}x)!`
          : `🐯 Golden Tiger: Não foi dessa vez. Tente outro giro!`;
      outcomeDetails = {
        grid: grid.map((row) => row.map((s) => ({ key: s.key, emoji: s.emoji, name: s.name }))),
        winningLines,
      };
    } else if (gameType === "roulette") {
      // Roleta TFL: 0 = Gold (14x), 1..7 = Red (2x), 8..14 = Black (2x)
      const roll = Math.floor(Math.random() * 15);
      const landedColor = roll === 0 ? "gold" : roll <= 7 ? "red" : "black";
      const userChoice = ["red", "black", "gold"].includes(String(choice).toLowerCase())
        ? String(choice).toLowerCase()
        : "red";

      if (landedColor === userChoice) {
        multiplier = landedColor === "gold" ? 14 : 2;
        winChips = Math.floor(bet * multiplier);
      }
      const colorLabels = { gold: "🟡 Ouro (14x)", red: "🔴 Vermelho (2x)", black: "⚫ Preto (2x)" };
      resultSummary =
        winChips > 0
          ? `🎡 Roleta girou #${roll} (${colorLabels[landedColor]})! Você ganhou ${winChips} Chips!`
          : `🎡 Roleta parou no #${roll} (${colorLabels[landedColor]}).`;
      outcomeDetails = { roll, landedColor, userChoice };
    } else {
      // Dados da Fortuna (2d6: 2 a 12)
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const sum = die1 + die2;
      const userChoice = ["low", "high", "lucky7"].includes(String(choice).toLowerCase())
        ? String(choice).toLowerCase()
        : "high";

      if (userChoice === "lucky7" && sum === 7) {
        multiplier = 5;
        winChips = Math.floor(bet * multiplier);
      } else if (userChoice === "low" && sum <= 6) {
        multiplier = 2;
        winChips = Math.floor(bet * multiplier);
      } else if (userChoice === "high" && sum >= 8) {
        multiplier = 2;
        winChips = Math.floor(bet * multiplier);
      }
      resultSummary =
        winChips > 0
          ? `🎲 Dados somaram ${sum} (${die1} + ${die2})! Você ganhou ${winChips} Chips (${multiplier}x)!`
          : `🎲 Dados somaram ${sum} (${die1} + ${die2}).`;
      outcomeDetails = { die1, die2, sum, userChoice };
    }

    if (winChips > 0) {
      wallet.chips = Number(wallet.chips || 0) + winChips;
    }
    await wallet.save({ transaction: t });

    await recordLedgerEntry({
      userId: userId || wallet.userId,
      avatarId: avId,
      currencyType: "Chips",
      direction: winChips >= bet ? "CREDIT" : "DEBIT",
      grossAmount: bet,
      feeAmount: 0,
      netAmount: winChips > 0 ? winChips - bet : bet,
      balanceAfter: wallet.chips,
      category: winChips > 0 ? "CASINO_WIN" : "CASINO_BET",
      description: `${resultSummary} (Aposta: ${bet} Chips)`,
      transaction: t,
    });

    return {
      success: true,
      gameType,
      betChips: bet,
      winChips,
      netProfitChips: winChips - bet,
      multiplier,
      chipsBalance: wallet.chips,
      coinsBalance: Number(wallet.coins || 0),
      message: resultSummary,
      outcome: outcomeDetails,
    };
  });
}

module.exports = {
  ensureFeeAndRoomTables,
  getCurrentMonthKey,
  getEconomyRules,
  updateEconomyRules,
  getMarketStats,
  createSellOrder,
  cancelSellOrder,
  buyCoins,
  requestWithdraw,
  cancelWithdraw,
  reviewPaymentTransaction,
  convertCurrency,
  enrichRoomsWithVisitStats,
  enterRoomWithPassAndVisit,
  getRoomVisitDetails,
  recordLedgerEntry,
  getWalletLedger,
  createNotification,
  getNotifications,
  markNotificationsRead,
  transferCoinsBetweenPlayers,
  getVipStatus,
  enrichAvatarsWithVip,
  purchaseVipSubscription,
  checkAndRecordChatAction,
  getPublicRoomsExplorer,
  boostRoom24h,
  playCasinoGame,
  formatServerInstance,
  getRoomActiveServerInstances,
  allocateOrReplicateRoomServerInstance,
};

