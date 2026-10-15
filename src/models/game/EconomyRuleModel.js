const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const EconomyRuleModel = sequelize.define(
    "EconomyRule",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      key: { type: DataTypes.STRING, defaultValue: "default" },

      // ================= TAXAS DE SPREAD DO MERCADO (BOLSA DE COINS) =================
      // Taxa cobrada sobre a venda de Coins (padrão: 0.5%)
      sellSpreadPercent: { type: DataTypes.DECIMAL(6, 3), defaultValue: 0.500 },
      // Taxa cobrada sobre a compra de Coins (padrão: 0.1%)
      buySpreadPercent: { type: DataTypes.DECIMAL(6, 3), defaultValue: 0.100 },

      // ================= COTAÇÕES BASE =================
      // Quantos Coins equivalem a 1 Cash ($1 USD)
      rateCoinsPerCash: { type: DataTypes.DECIMAL(10, 2), defaultValue: 250.00 },
      // Quantos Chips equivalem a 1 Coin
      rateChipsPerCoin: { type: DataTypes.DECIMAL(10, 2), defaultValue: 10.00 },
      // Valor de 1 Cash ($1 USD) em Reais (BRL) para Pix Asaas
      usdBrlRate: { type: DataTypes.DECIMAL(10, 2), defaultValue: 5.00 },

      // ================= LIMITES MÍNIMOS (COMPRA & SAQUE) =================
      // Valor mínimo em Reais (BRL) para compra via Pix dinâmico no Asaas (padrão: R$ 10,00)
      minPurchaseBrl: { type: DataTypes.DECIMAL(10, 2), defaultValue: 10.00 },
      // Valor mínimo em Cash para solicitar saque via Pix (padrão: 1.00 Cash)
      minWithdrawCash: { type: DataTypes.DECIMAL(10, 2), defaultValue: 1.00 },

      // ================= REGRAS DE APROVAÇÃO (AUTOMÁTICO VS MANUAL) =================
      // Modo de aprovação para Compra de Cash: 'AUTO' ou 'MANUAL'
      buyApprovalMode: {
        type: DataTypes.ENUM("AUTO", "MANUAL"),
        defaultValue: "AUTO",
      },
      // Valor máximo em Reais (BRL) para aprovação automática de compra
      maxAutoBuyBrl: { type: DataTypes.DECIMAL(12, 2), defaultValue: 500.00 },

      // Modo de aprovação para Saque de Cash: 'AUTO' ou 'MANUAL'
      withdrawApprovalMode: {
        type: DataTypes.ENUM("AUTO", "MANUAL"),
        defaultValue: "AUTO",
      },
      // Valor máximo em Cash para aprovação automática de saque (acima disso cai para aprovação manual do Admin)
      maxAutoWithdrawCash: { type: DataTypes.DECIMAL(12, 2), defaultValue: 20.00 },

      // ================= REGRAS DE CONVERSÃO DIRETA DE MOEDAS =================
      // Taxa opcional na conversão Cash -> Coins (padrão: 0%)
      cashToCoinsFeePercent: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0.00 },
      // Permite ou bloqueia totalmente a conversão direta de Coins -> Cash fora da Bolsa
      allowInstantCoinsToCash: { type: DataTypes.BOOLEAN, defaultValue: true },
      // Taxa punitiva (deságio) na conversão direta Coins -> Cash para proteger o livro de ofertas (padrão: 30%)
      instantCoinsToCashFeePercent: { type: DataTypes.DECIMAL(6, 2), defaultValue: 30.00 },
      // Taxa opcional na conversão Coins -> Chips (padrão: 0%)
      coinsToChipsFeePercent: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0.00 },
      // Taxa opcional na conversão Chips -> Coins (padrão: 0%)
      chipsToCoinsFeePercent: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0.00 },

      // ================= TAXAS DE SAQUE DA CARTEIRA =================
      // Taxa percentual cobrada no saque Pix (padrão: 0%)
      withdrawFeePercent: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0.00 },
      // Taxa fixa em Cash cobrada por solicitação de saque Pix (padrão: $0.00)
      withdrawFixedFeeCash: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },

      // ================= TAXAS DA LOJA 3D & UPLOADS UGC =================
      // Taxa de valor fixo (em Coins) para criar/publicar um item 3D na loja (padrão: 5.00 Coins)
      shopCreationFixedFeeCoins: { type: DataTypes.DECIMAL(10, 2), defaultValue: 5.00 },
      // Taxa de valor fixo (em Coins) para upload de imagem/textura na loja (padrão: 1.00 Coin)
      shopTextureUploadFixedFeeCoins: { type: DataTypes.DECIMAL(10, 2), defaultValue: 1.00 },
      // Comissão da plataforma sobre vendas de itens UGC na loja (padrão: 30% plataforma / 70% criador)
      shopSalePlatformFeePercent: { type: DataTypes.DECIMAL(6, 2), defaultValue: 30.00 },

      // ================= SALAS 3D: PASSE DE ENTRADA (24H) & PAGAMENTO POR 1K VISITAS ÚNICAS/MÊS =================
      // Taxa retida pela plataforma sobre a entrada cobrada na sala (padrão: 15% plataforma / 85% dono da sala)
      roomEntryPlatformFeePercent: { type: DataTypes.DECIMAL(6, 2), defaultValue: 15.00 },
      // Duração em horas do passe de entrada da sala (padrão: 24 horas)
      roomPassDurationHours: { type: DataTypes.INTEGER, defaultValue: 24 },
      // Pagamento automático ao dono da sala a cada 1.000 visitas únicas no mês (padrão: 50.00 Coins por 1k visitas)
      roomVisitsPayoutPer1kCoins: { type: DataTypes.DECIMAL(10, 2), defaultValue: 50.00 },
      // Taxa fixa (em Coins) para impulsionar/destacar uma sala por 24 horas no Explorador de Salas (padrão: 20.00 Coins)
      roomBoost24hFeeCoins: { type: DataTypes.DECIMAL(10, 2), defaultValue: 20.00 },

      // ================= TRANSFERÊNCIA DE MOEDA DO JOGO (COINS) ENTRE JOGADORES =================
      // Taxa percentual cobrada na transferência de Coins entre jogadores (padrão: 2.00% - somente moeda do jogo, nunca Cash/BRL)
      p2pCoinsTransferFeePercent: { type: DataTypes.DECIMAL(6, 2), defaultValue: 2.00 },

      // ================= SISTEMA VIP (PLANOS 1 SEMANA, 1 MÊS E 3 MESES + LIMITES DE CHAT) =================
      // Preço do VIP de 1 Semana em Cash (padrão: $0.75 Cash)
      vipPrice1WeekCash: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.75 },
      // Preço do VIP de 1 Mês em Cash (padrão: $2.00 Cash)
      vipPrice1MonthCash: { type: DataTypes.DECIMAL(10, 2), defaultValue: 2.00 },
      // Preço do VIP de 3 Meses em Cash (padrão: $5.00 Cash)
      vipPrice3MonthsCash: { type: DataTypes.DECIMAL(10, 2), defaultValue: 5.00 },
      // Limite diário de aberturas de novas conversas privadas para Membro Básico (apenas amigos)
      basicMaxChatOpensPerDay: { type: DataTypes.INTEGER, defaultValue: 3 },
      // Limite diário de envio de imagens no chat para Membro Básico
      basicMaxChatImagesPerDay: { type: DataTypes.INTEGER, defaultValue: 2 },
      // Limite diário de envio de voz/áudio no chat para Membro Básico
      basicMaxChatAudioPerDay: { type: DataTypes.INTEGER, defaultValue: 2 },
      // Limite diário de envio de imagens no chat para Membro VIP (0 = ilimitado)
      vipMaxChatImagesPerDay: { type: DataTypes.INTEGER, defaultValue: 0 },
      // Limite diário de envio de voz/áudio no chat para Membro VIP (0 = ilimitado)
      vipMaxChatAudioPerDay: { type: DataTypes.INTEGER, defaultValue: 0 },

      // ================= CASSINO TFL (EM CHIPS / FICHAS) =================
      // Taxa / House Edge do Cassino sobre apostas em Chips (padrão: 5.00%)
      casinoHouseEdgePercent: { type: DataTypes.DECIMAL(6, 2), defaultValue: 5.00 },

      // ================= DIÁRIO SECRETO & CANTINHO DE DESABAFO ANÔNIMO (LEITURA PREMIADA) =================
      // Tempo mínimo de leitura ativa (em segundos) para qualificar pagamento (padrão: 30s)
      diaryMinReadSeconds: { type: DataTypes.INTEGER, defaultValue: 30 },
      // Recompensa em Coins para o leitor ao concluir a leitura ativa de uma página pública (padrão: 0.25 Coins)
      diaryReaderRewardPerPageCoins: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.25 },
      // Recompensa em Coins para o autor a cada leitura qualificada de sua página pública (padrão: 0.50 Coins)
      diaryAuthorRewardPerReadCoins: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.50 },
      // Bônus extra em Coins para o autor a cada 10 minutos acumulados de leitura nas suas páginas (padrão: 5.00 Coins)
      diaryAuthorBonusPer10MinCoins: { type: DataTypes.DECIMAL(10, 2), defaultValue: 5.00 },
      // Limite diário de páginas premiadas por leitor por dia (padrão: 20 páginas/dia)
      diaryReaderDailyLimitPages: { type: DataTypes.INTEGER, defaultValue: 20 },

      // ================= MINI ADS & IMPULSIONAMENTO DE CONTEÚDO =================
      // Preço em Coins por pacote de 100 impressões (padrão: 5.00 Coins)
      adPricePer100ImpressionsCoins: { type: DataTypes.DECIMAL(10, 2), defaultValue: 5.00 },
      // Porcentagem de Revenue Share paga ao Criador/Influenciador onde o Ad foi exibido (padrão: 50.00%)
      adCreatorRevenueSharePercent: { type: DataTypes.DECIMAL(6, 2), defaultValue: 50.00 },
      // Micro-recompensa em Coins ao espectador por visualização qualificada de 10s+ (padrão: 0.050 Coins)
      adViewerRewardCoins: { type: DataTypes.DECIMAL(6, 3), defaultValue: 0.050 },
      // Limite diário de recompensas de Ads por espectador por dia (padrão: 10/dia)
      adMaxDailyViewerRewards: { type: DataTypes.INTEGER, defaultValue: 10 },

      // ================= COFRE DO SISTEMA (TAXAS ARRECADADAS) =================
      collectedFeesCash: { type: DataTypes.DECIMAL(16, 4), defaultValue: 0.0000 },
      collectedFeesCoins: { type: DataTypes.DECIMAL(16, 4), defaultValue: 0.0000 },

      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "economy_rules",
      timestamps: true,
      indexes: [
        { unique: true, fields: ["key"] },
      ],
    }
  );

  return EconomyRuleModel;
};
