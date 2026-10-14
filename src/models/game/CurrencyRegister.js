const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const CurrencyRegisterModel = sequelize.define("CurrencyRegister", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER },
    ownerId: { type: DataTypes.INTEGER, defaultValue: 0 },
    currencyId: { type: DataTypes.INTEGER, allowNull: true },
    type: { type: DataTypes.ENUM("Coins", "Cash", "Chips", "None"), defaultValue: "None" },
    transactionType: { type: DataTypes.ENUM("Deposit", "Withdraw", "Buy", "Sell", "Bonus", "Rewards","Transfer", "None"), defaultValue: "None" },
    value: { type: DataTypes.FLOAT, defaultValue: 0 },
    description: { type: DataTypes.STRING, defaultValue: "" },
    uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    target_uid: { type: DataTypes.STRING, allowNull: true, defaultValue: DataTypes.UUIDV4 },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: "currency_register",
    timestamps: true,
  });

  return CurrencyRegisterModel;
};