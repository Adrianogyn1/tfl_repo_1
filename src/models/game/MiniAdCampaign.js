const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const MiniAdCampaign = sequelize.define(
    "MiniAdCampaign",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      avatarId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      title: { type: DataTypes.STRING(160), allowNull: false },
      description: { type: DataTypes.TEXT, defaultValue: "" },
      targetType: {
        type: DataTypes.STRING(32),
        defaultValue: "room",
      },
      targetId: { type: DataTypes.STRING(64), defaultValue: "" },
      targetUrl: { type: DataTypes.STRING(255), defaultValue: "" },
      mediaUrl: { type: DataTypes.STRING(255), defaultValue: "" },
      badgeLabel: { type: DataTypes.STRING(40), defaultValue: "Patrocinado ✨" },
      callToAction: { type: DataTypes.STRING(60), defaultValue: "Conferir Agora" },
      costCoins: { type: DataTypes.DECIMAL(10, 2), defaultValue: 5.00 },
      impressionsPurchased: { type: DataTypes.INTEGER, defaultValue: 100 },
      impressionsDelivered: { type: DataTypes.INTEGER, defaultValue: 0 },
      qualifiedViewsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      rewardPerQualifiedViewCoins: { type: DataTypes.DECIMAL(6, 3), defaultValue: 0.050 },
      creatorRevenueSharePercent: { type: DataTypes.DECIMAL(6, 2), defaultValue: 50.00 },
      status: {
        type: DataTypes.ENUM("active", "paused", "completed"),
        defaultValue: "active",
      },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "mini_ad_campaigns",
      timestamps: true,
      indexes: [
        { fields: ["avatarId"] },
        { fields: ["status"] },
        { fields: ["targetType"] },
      ],
    }
  );

  return MiniAdCampaign;
};
