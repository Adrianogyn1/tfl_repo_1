const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Avatar = sequelize.define("Avatar", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    uid: { type: DataTypes.STRING, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING, defaultValue: "" },
    bio: { type: DataTypes.TEXT, defaultValue: "" },
    gender: { type: DataTypes.INTEGER, defaultValue: 0 },
    vip: { type: DataTypes.BOOLEAN, defaultValue: false },
    isVip: { type: DataTypes.BOOLEAN, defaultValue: false },
    vipPlan: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
    vipExpiresAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    guideRole: { type: DataTypes.STRING(32), allowNull: true, defaultValue: "" },
    isContentCreator: { type: DataTypes.BOOLEAN, defaultValue: false },
    creatorTipsCoinsTotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    thumbnail: { type: DataTypes.STRING, defaultValue: "" },
    online: { type: DataTypes.BOOLEAN, defaultValue: false },
    onlineWorld: { type: DataTypes.BOOLEAN, defaultValue: false },
    lastSeen: { type: DataTypes.TEXT, defaultValue: "" },
    lastSeenAt: { type: DataTypes.DATE, allowNull: true },
    lastSeenWorldAt: { type: DataTypes.DATE, allowNull: true },
    currentRoom: { type: DataTypes.STRING, defaultValue: "" },
    data: { type: DataTypes.TEXT, defaultValue: "" },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    selected: { type: DataTypes.BOOLEAN, defaultValue: false },
    coverUrl: { type: DataTypes.STRING, defaultValue: "" },
    privacyPosts: { type: DataTypes.STRING, defaultValue: "public" },
    privacyPhotos: { type: DataTypes.STRING, defaultValue: "public" },
    privacyRooms: { type: DataTypes.STRING, defaultValue: "public" },
    privacyFriends: { type: DataTypes.STRING, defaultValue: "public" },
    privacyFollowers: { type: DataTypes.STRING, defaultValue: "public" },
  }, {
    tableName: "avatars",
    timestamps: false,
  });

  return Avatar;
};