const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PlatformOperationalExpense = sequelize.define(
    "PlatformOperationalExpense",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      category: {
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: "server_hosting", // server_hosting, gateway_fees, infrastructure, marketing, maintenance, other
      },
      description: { type: DataTypes.TEXT, allowNull: false },
      amountBrl: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
      amountCash: { type: DataTypes.DECIMAL(12, 4), defaultValue: 0.0 },
      date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "paid", // paid, pending, forecast
      },
      receiptUrl: { type: DataTypes.STRING, defaultValue: "" },
      notes: { type: DataTypes.TEXT, defaultValue: "" },
      createdById: { type: DataTypes.INTEGER, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "platform_operational_expenses",
      timestamps: true,
      indexes: [
        { fields: ["category"] },
        { fields: ["status"] },
        { fields: ["date"] },
      ],
    }
  );

  return PlatformOperationalExpense;
};
