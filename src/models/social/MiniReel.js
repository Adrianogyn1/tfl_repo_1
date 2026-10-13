const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const MiniReel = sequelize.define(
    "MiniReel",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      profileId: { type: DataTypes.INTEGER, allowNull: true },
      // 'feeling' (6h) | 'photo' (24h) | 'text' (24h)
      type: { type: DataTypes.STRING, defaultValue: "photo" },
      imageUrl: { type: DataTypes.STRING, defaultValue: "" },
      text: { type: DataTypes.TEXT, defaultValue: "" },
      feelingEmoji: { type: DataTypes.STRING, defaultValue: "" },
      feelingLabel: { type: DataTypes.STRING, defaultValue: "" },
      bgStyle: {
        type: DataTypes.STRING,
        defaultValue: "from-blue-700 via-indigo-800 to-purple-900",
      },
      feelingExpiresAt: { type: DataTypes.DATE, allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      tableName: "mini_reels",
      timestamps: true,
    }
  );

  return MiniReel;
};
