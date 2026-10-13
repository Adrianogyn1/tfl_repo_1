const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("avatar_outfit", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    avatarId: { type: DataTypes.INTEGER, allowNull: false },
    slot: { type: DataTypes.STRING, allowNull: false, defaultValue: "top" },
    isEquiped: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    itemId: { type: DataTypes.INTEGER, allowNull: false },
    inventoryId: { type: DataTypes.INTEGER, allowNull: true },
    data: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });
};