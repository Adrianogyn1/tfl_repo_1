const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const Inventory = sequelize.define("avatar_inventory", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    avatarId: { type: DataTypes.INTEGER, allowNull: true },
    itemId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
    slot: { type: DataTypes.STRING, allowNull: true, defaultValue: "top" },
    categoria: { type: DataTypes.STRING, allowNull: true, defaultValue: "clothing" },
    itemType: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    position: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    isEquipped: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    customColors: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
    data: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });

  return Inventory;
};