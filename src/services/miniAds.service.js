/**
 * ============================================================================
 * TFL MINI ADS & INFLUENCERS SERVICE
 * ============================================================================
 * Gerencia:
 * - Campanhas de impulsionamento em Reels, Feed de Posts, Salas e Chat
 * - Distribuição de Revenue Share ético para Criadores de Conteúdo (50%)
 * - Micro-recompensas para espectadores por visualização qualificada (Pay-to-View ético)
 * - Gorjetas (Tips) diretas de Coins para Criadores de Conteúdo e Guias
 * - Telemetria e entrega randômica de impressões sem saturação
 */

const repo = require("../repositories/repository");
const { recordLedgerEntry, createNotification } = require("./coinMarket.service");

// Pacotes oficiais de compra de impressões
const AD_PACKAGES = {
  "100": { impressions: 100, costCoins: 5.0, discountPercent: 0, label: "100 Impressões" },
  "500": { impressions: 500, costCoins: 22.5, discountPercent: 10, label: "500 Impressões (-10%)" },
  "1000": { impressions: 1000, costCoins: 40.0, discountPercent: 20, label: "1.000 Impressões (-20%)" },
};

let schemaEnsured = false;
async function ensureMiniAdsSchema() {
  if (schemaEnsured) return;
  try {
    await repo.sequelize.query(`
      ALTER TABLE IF EXISTS mini_ad_campaigns 
        ADD COLUMN IF NOT EXISTS "userId" INTEGER,
        ADD COLUMN IF NOT EXISTS "targetUrl" VARCHAR(255) DEFAULT '',
        ADD COLUMN IF NOT EXISTS "mediaUrl" VARCHAR(255) DEFAULT '',
        ADD COLUMN IF NOT EXISTS "badgeLabel" VARCHAR(40) DEFAULT 'Patrocinado ✨',
        ADD COLUMN IF NOT EXISTS "callToAction" VARCHAR(60) DEFAULT 'Conferir';
    `);
    schemaEnsured = true;
  } catch (_) {
    schemaEnsured = true;
  }
}

/**
 * Cria uma nova campanha de Mini Ads com débito de Coins e validação de PIN
 */
async function createAdCampaign({
  avatarId,
  userId,
  title,
  description = "",
  targetType = "room",
  targetId = "",
  targetUrl = "",
  mediaUrl = "",
  packageKey = "100",
  badgeLabel = "Patrocinado ✨",
  callToAction = "Conferir",
  walletPin = null,
}) {
  await ensureMiniAdsSchema();
  const avId = Number(avatarId);
  const uId = Number(userId);

  if (!title || !String(title).trim()) {
    throw new Error("O anúncio precisa ter um título.");
  }

  const pkg = AD_PACKAGES[String(packageKey)] || AD_PACKAGES["100"];
  const costCoins = pkg.costCoins;
  const impressions = pkg.impressions;

  // 1. Validação de PIN de segurança do Usuário
  const user = await repo.User.findByPk(uId);
  if (!user || !user.walletPin || String(user.walletPin).trim().length !== 4) {
    throw new Error("Cadastre seu PIN de 4 dígitos na aba Conta antes de criar anúncios.");
  }
  if (!walletPin || String(walletPin).trim() !== String(user.walletPin).trim()) {
    throw new Error("PIN de segurança incorreto.");
  }

  // 2. Validação e débito da carteira do Avatar
  const wallet = await repo.Currency.findOne({
    where: {
      [repo.Sequelize.Op.or]: [{ avatarId: avId }, { ownerId: avId }],
    },
  });

  if (!wallet || Number(wallet.coins || 0) < costCoins) {
    throw new Error(
      `Saldo insuficiente de Coins (${Number(wallet?.coins || 0).toFixed(2)} Coins). O pacote custa ${costCoins.toFixed(2)} Coins.`
    );
  }

  wallet.coins = Number((Number(wallet.coins) - costCoins).toFixed(2));
  await wallet.save();

  // 3. Cria a campanha
  const campaign = await repo.MiniAdCampaign.create({
    avatarId: avId,
    userId: uId,
    title: String(title).trim().slice(0, 160),
    description: String(description || "").trim(),
    targetType,
    targetId: String(targetId || ""),
    targetUrl: String(targetUrl || ""),
    mediaUrl: String(mediaUrl || ""),
    badgeLabel: String(badgeLabel || "Patrocinado ✨").slice(0, 40),
    callToAction: String(callToAction || "Conferir").slice(0, 60),
    costCoins,
    impressionsPurchased: impressions,
    impressionsDelivered: 0,
    qualifiedViewsCount: 0,
    status: "active",
  });

  // 4. Registro no Ledger contábil
  await recordLedgerEntry({
    avatarId: avId,
    userId: uId,
    currencyType: "COINS",
    operationType: "AD_CAMPAIGN_PURCHASE",
    amountGross: costCoins,
    feeRetained: 0,
    amountNet: costCoins,
    balanceAfter: wallet.coins,
    description: `Contratação de Mini Ad: ${campaign.title} (${impressions} impressões)`,
    metadata: { campaignId: campaign.id, packageKey, impressions },
  });

  return campaign.get({ plain: true });
}

/**
 * Entrega anúncios ativos para um determinado placement (reels, feed_posts, rooms_explorer, chat_broadcast)
 */
async function getActiveAdsForPlacement({ placement = "reels", limit = 3, excludeAvatarId = null } = {}) {
  const Op = repo.Sequelize.Op;
  const where = {
    status: "active",
    impressionsDelivered: { [Op.lt]: repo.Sequelize.col("impressionsPurchased") },
  };

  if (excludeAvatarId) {
    where.avatarId = { [Op.ne]: Number(excludeAvatarId) };
  }

  const ads = await repo.MiniAdCampaign.findAll({
    where,
    order: repo.Sequelize.literal("RANDOM()"),
    limit: Number(limit) || 3,
  });

  // Incrementa contagem de entrega de impressões
  for (const ad of ads) {
    ad.impressionsDelivered = (ad.impressionsDelivered || 0) + 1;
    if (ad.impressionsDelivered >= ad.impressionsPurchased) {
      ad.status = "completed";
    }
    await ad.save();
  }

  return ads.map((a) => a.get({ plain: true }));
}

/**
 * Registra interação qualificada com o anúncio (10s+ assistido ou clique), pagando espectador e criador (Revenue Share)
 */
async function recordQualifiedAdView({
  campaignId,
  viewerAvatarId,
  viewerUserId = null,
  creatorAvatarId = null,
  placement = "reels",
}) {
  const cId = Number(campaignId);
  const vId = Number(viewerAvatarId);
  const crId = creatorAvatarId ? Number(creatorAvatarId) : null;

  const campaign = await repo.MiniAdCampaign.findByPk(cId);
  if (!campaign || campaign.status !== "active") {
    return { success: false, reason: "Campanha inativa ou concluída." };
  }

  // Não premia o próprio anunciante assistindo seu anúncio
  if (campaign.avatarId === vId) {
    return { success: false, reason: "Visualização própria não gera recompensas." };
  }

  // Anti-farm: limite diário de recompensas de Ads por espectador
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const viewerViewsToday = await repo.MiniAdImpression.count({
    where: {
      viewerAvatarId: vId,
      qualified: true,
      createdAt: { [repo.Sequelize.Op.gte]: todayStart },
    },
  });

  const rewardViewer = viewerViewsToday < 10;
  const viewerRewardAmount = rewardViewer ? Number(campaign.rewardPerQualifiedViewCoins || 0.05) : 0.0;

  // 1. Paga o Espectador se ainda tiver cota diária
  if (viewerRewardAmount > 0) {
    const vWallet = await repo.Currency.findOne({
      where: {
        [repo.Sequelize.Op.or]: [{ avatarId: vId }, { ownerId: vId }],
      },
    });
    if (vWallet) {
      vWallet.coins = Number((Number(vWallet.coins) + viewerRewardAmount).toFixed(3));
      await vWallet.save();

      await recordLedgerEntry({
        avatarId: vId,
        userId: viewerUserId,
        currencyType: "COINS",
        operationType: "AD_VIEWER_REWARD",
        amountGross: viewerRewardAmount,
        feeRetained: 0,
        amountNet: viewerRewardAmount,
        balanceAfter: vWallet.coins,
        description: `Recompensa por visualização de anúncio: ${campaign.title}`,
        metadata: { campaignId: cId, placement },
      });
    }
  }

  // 2. Revenue Share para o Criador de Conteúdo / Influenciador (se o ad passou no reel/post dele)
  let creatorRewardAmount = 0.0;
  if (crId && crId !== vId) {
    const creatorAvatar = await repo.Avatar.findByPk(crId);
    if (creatorAvatar && (creatorAvatar.isContentCreator || creatorAvatar.guideRole)) {
      // 50% de revenue share sobre a impressão qualificada
      const sharePercent = Number(campaign.creatorRevenueSharePercent || 50.0);
      creatorRewardAmount = Number(((Number(campaign.costCoins) / campaign.impressionsPurchased) * (sharePercent / 100.0)).toFixed(3));

      if (creatorRewardAmount > 0) {
        const crWallet = await repo.Currency.findOne({
          where: {
            [repo.Sequelize.Op.or]: [{ avatarId: crId }, { ownerId: crId }],
          },
        });
        if (crWallet) {
          crWallet.coins = Number((Number(crWallet.coins) + creatorRewardAmount).toFixed(3));
          await crWallet.save();

          await recordLedgerEntry({
            avatarId: crId,
            userId: creatorAvatar.userId,
            currencyType: "COINS",
            operationType: "AD_CREATOR_SHARE",
            amountGross: creatorRewardAmount,
            feeRetained: 0,
            amountNet: creatorRewardAmount,
            balanceAfter: crWallet.coins,
            description: `Revenue Share de Criador (Mini Ad em seu conteúdo): ${campaign.title}`,
            metadata: { campaignId: cId, viewerAvatarId: vId },
          });
        }
      }
    }
  }

  // 3. Registra a impressão qualificada
  await repo.MiniAdImpression.create({
    campaignId: cId,
    viewerAvatarId: vId,
    viewerUserId,
    creatorAvatarId: crId,
    placement,
    qualified: true,
    viewerRewardCoins: viewerRewardAmount,
    creatorRewardCoins: creatorRewardAmount,
  });

  campaign.qualifiedViewsCount = (campaign.qualifiedViewsCount || 0) + 1;
  await campaign.save();

  return {
    success: true,
    viewerRewarded: viewerRewardAmount > 0,
    viewerRewardAmount,
    creatorRewardAmount,
  };
}

/**
 * Envia gorjeta (Tip) direta em Coins para um Criador de Conteúdo ou Guia
 */
async function tipContentCreator({
  fromAvatarId,
  fromUserId,
  toAvatarId,
  amountCoins,
  message = "",
  walletPin = null,
}) {
  const senderId = Number(fromAvatarId);
  const recipientId = Number(toAvatarId);
  const amount = Number(amountCoins);

  if (senderId === recipientId) {
    throw new Error("Você não pode enviar gorjeta para você mesmo.");
  }
  if (!amount || amount <= 0 || isNaN(amount)) {
    throw new Error("Valor de gorjeta inválido.");
  }

  // Validação de PIN de segurança
  const user = await repo.User.findByPk(fromUserId);
  if (!user || !user.walletPin || String(user.walletPin).trim().length !== 4) {
    throw new Error("Cadastre seu PIN de 4 dígitos na aba Conta antes de enviar gorjetas.");
  }
  if (!walletPin || String(walletPin).trim() !== String(user.walletPin).trim()) {
    throw new Error("PIN de segurança incorreto.");
  }

  const recipientAvatar = await repo.Avatar.findByPk(recipientId);
  if (!recipientAvatar) {
    throw new Error("Criador de conteúdo não encontrado.");
  }

  const senderWallet = await repo.Currency.findOne({
    where: { [repo.Sequelize.Op.or]: [{ avatarId: senderId }, { ownerId: senderId }] },
  });
  if (!senderWallet || Number(senderWallet.coins || 0) < amount) {
    throw new Error("Saldo insuficiente de Coins para enviar esta gorjeta.");
  }

  const recipientWallet = await repo.Currency.findOne({
    where: { [repo.Sequelize.Op.or]: [{ avatarId: recipientId }, { ownerId: recipientId }] },
  });
  if (!recipientWallet) {
    throw new Error("Carteira do criador não encontrada.");
  }

  // Executa a transferência de gorjeta sem taxa da plataforma (100% vai pro criador!)
  senderWallet.coins = Number((Number(senderWallet.coins) - amount).toFixed(2));
  recipientWallet.coins = Number((Number(recipientWallet.coins) + amount).toFixed(2));
  recipientAvatar.creatorTipsCoinsTotal = Number((Number(recipientAvatar.creatorTipsCoinsTotal || 0) + amount).toFixed(2));

  await Promise.all([senderWallet.save(), recipientWallet.save(), recipientAvatar.save()]);

  // Registros no ledger
  await recordLedgerEntry({
    avatarId: senderId,
    userId: fromUserId,
    currencyType: "COINS",
    operationType: "CREATOR_TIP_SENT",
    amountGross: amount,
    feeRetained: 0,
    amountNet: amount,
    balanceAfter: senderWallet.coins,
    description: `Gorjeta enviada para ${recipientAvatar.name}: "${message || 'Parabéns pelo conteúdo!'}"`,
    metadata: { toAvatarId: recipientId },
  });

  await recordLedgerEntry({
    avatarId: recipientId,
    userId: recipientAvatar.userId,
    currencyType: "COINS",
    operationType: "CREATOR_TIP_RECEIVED",
    amountGross: amount,
    feeRetained: 0,
    amountNet: amount,
    balanceAfter: recipientWallet.coins,
    description: `Gorjeta recebida: "${message || 'Parabéns pelo conteúdo!'}"`,
    metadata: { fromAvatarId: senderId },
  });

  // Notifica o criador com carinho
  await createNotification({
    avatarId: recipientId,
    userId: recipientAvatar.userId,
    type: "SUCCESS",
    title: "💖 Você recebeu uma Gorjeta de Criador!",
    message: `Um fã enviou +${amount.toFixed(2)} Coins com a mensagem: "${message || 'Parabéns pelo conteúdo!'}"`,
    link: "/profile/social",
  });

  return { success: true, amount, recipientName: recipientAvatar.name };
}

/**
 * Lista campanhas de anúncios criadas a nível de Usuário (pega todos os avatares e nós da conta)
 */
async function getMyAdCampaigns(params) {
  await ensureMiniAdsSchema();
  let whereClause = null;

  if (typeof params === 'object' && params !== null) {
    const conditions = [];
    if (params.userId && Number(params.userId) > 0) {
      conditions.push({ userId: Number(params.userId) });
    }
    if (params.avatarId && Number(params.avatarId) > 0) {
      conditions.push({ avatarId: Number(params.avatarId) });
    }

    if (conditions.length > 1) {
      whereClause = { [repo.Sequelize.Op.or]: conditions };
    } else if (conditions.length === 1) {
      whereClause = conditions[0];
    }
  } else if (params) {
    const num = Number(params);
    if (!isNaN(num) && num > 0) {
      whereClause = {
        [repo.Sequelize.Op.or]: [{ userId: num }, { avatarId: num }]
      };
    }
  }

  if (!whereClause) {
    return [];
  }

  const campaigns = await repo.MiniAdCampaign.findAll({
    where: whereClause,
    order: [["createdAt", "DESC"]],
  });
  return campaigns.map((c) => c.get({ plain: true }));
}

module.exports = {
  AD_PACKAGES,
  createAdCampaign,
  getActiveAdsForPlacement,
  recordQualifiedAdView,
  tipContentCreator,
  getMyAdCampaigns,
};
