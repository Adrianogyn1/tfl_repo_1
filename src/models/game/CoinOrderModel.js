const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const CoinOrderModel = sequelize.define(
    "CoinOrder",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      uid: { type: DataTypes.STRING, defaultValue: UUIDV4 },
      avatarId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: true },

      // Quantidade original ofertada para venda
      initialCoins: { type: DataTypes.DECIMAL(16, 2), allowNull: false },
      // Quantidade de coins ainda disponível/restante nesta ordem
      remainingCoins: { type: DataTypes.DECIMAL(16, 2), allowNull: false },

      // Taxa de câmbio negociada: quantos Coins valem 1 Cash (Padrão: 250)
      rate: { type: DataTypes.DECIMAL(10, 2), defaultValue: 250.0 },

      // Status da Ordem:
      // OPEN = Ativa na fila aguardando compradores
      // PARTIAL = Parcialmente liquidada
      // COMPLETED = 100% vendida
      // CANCELED = Cancelada pelo usuário (moedas devolvidas para a carteira)
      status: {
        type: DataTypes.ENUM("OPEN", "PARTIAL", "COMPLETED", "CANCELED"),
        defaultValue: "OPEN",
      },

      // Total líquido de Cash que já foi arrecadado e pago ao vendedor por esta ordem
      earnedCash: { type: DataTypes.DECIMAL(14, 4), defaultValue: 0.0000 },

      // Taxa de spread aplicada na venda (padrão: 0.5%) e total de taxa retida em Cash
      spreadFeePercent: { type: DataTypes.DECIMAL(6, 3), defaultValue: 0.500 },
      paidFeeCash: { type: DataTypes.DECIMAL(14, 4), defaultValue: 0.0000 },

      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "coin_orders",
      timestamps: true,
      indexes: [
        { fields: ["avatarId"] },
        { fields: ["status", "createdAt"] },
      ],
    }
  );

  return CoinOrderModel;
};
