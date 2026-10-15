const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const MiniAdImpression = sequelize.define(
    "MiniAdImpression",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      campaignId: { type: DataTypes.INTEGER, allowNull: false },
      viewerAvatarId: { type: DataTypes.INTEGER, allowNull: false },
      viewerUserId: { type: DataTypes.INTEGER, allowNull: true },
      creatorAvatarId: { type: DataTypes.INTEGER, allowNull: true }, // Dono do reel/post que exibiu o ad
      placement: {
        type: DataTypes.ENUM("reels", "feed_posts", "rooms_explorer", "chat_broadcast"),
        defaultValue: "reels",
      },
      qualified: { type: DataTypes.BOOLEAN, defaultValue: false }, // 10s+ assistido ou clique
      viewerRewardCoins: { type: DataTypes.DECIMAL(6, 3), defaultValue: 0.000 },
      creatorRewardCoins: { type: DataTypes.DECIMAL(6, 3), defaultValue: 0.000 },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "mini_ad_impressions",
      timestamps: false,
      indexes: [
        { fields: ["campaignId"] },
        { fields: ["viewerAvatarId"] },
        { fields: ["creatorAvatarId"] },
        { fields: ["createdAt"] },
      ],
    }
  );

  return MiniAdImpression;
};
