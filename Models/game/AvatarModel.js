const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Avatar = sequelize.define("Avatar", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    uid: { type: DataTypes.STRING, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING, defaultValue: "" },
    bio: { type: DataTypes.TEXT, defaultValue: "" },
    gender: { type: DataTypes.INTEGER, defaultValue: 0 },
    vipExpiresAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    thumbnail: { type: DataTypes.STRING, defaultValue: "" },
    online: { type: DataTypes.BOOLEAN, defaultValue: false },
    lastSeen: { type: DataTypes.TEXT, defaultValue: "" },
    currentRoom: { type: DataTypes.STRING, defaultValue: "" },
    data: { type: DataTypes.TEXT, defaultValue: "" },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: "avatars",
    timestamps: false,
  });

  return Avatar;
};