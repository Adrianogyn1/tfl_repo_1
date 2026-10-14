const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const AvatarCareer = sequelize.define(
    "AvatarCareer",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      avatarId: { type: DataTypes.INTEGER, allowNull: false },
      careerKey: { type: DataTypes.STRING(32), allowNull: false },
      careerName: { type: DataTypes.STRING(64), allowNull: false },
      badgeIcon: { type: DataTypes.STRING(64), defaultValue: "🏆" },
      level: { type: DataTypes.INTEGER, defaultValue: 1 },
      xp: { type: DataTypes.INTEGER, defaultValue: 0 },
      nextLevelXp: { type: DataTypes.INTEGER, defaultValue: 100 },
      titleReward: { type: DataTypes.STRING(64), defaultValue: "" },
      description: { type: DataTypes.TEXT, defaultValue: "" },
      isEquipped: { type: DataTypes.BOOLEAN, defaultValue: false },
      unlockedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "avatar_careers",
      timestamps: true,
      indexes: [
        { unique: true, fields: ["avatarId", "careerKey"] },
        { fields: ["avatarId"] },
        { fields: ["isEquipped"] },
      ],
    }
  );

  return AvatarCareer;
};
