const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const CurrencyModel = sequelize.define("Currency", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    value: { type: DataTypes.FLOAT, defaultValue: 0 },
    coins: { type: DataTypes.FLOAT, defaultValue: 0 },
    cash: { type: DataTypes.FLOAT, defaultValue: 0 },
    chips: { type: DataTypes.FLOAT, defaultValue: 0 },
    userId: { type: DataTypes.INTEGER, defaultValue: 0 },
    ownerId :{ type: DataTypes.INTEGER, defaultValue: 0 },
    pin: { type: DataTypes.STRING, defaultValue: "" },
    pixKey: { type: DataTypes.STRING, defaultValue: "" },
    uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: "currencies",
    timestamps: true,
  });

  return CurrencyModel;
};