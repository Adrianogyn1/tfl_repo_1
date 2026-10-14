const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const ShopContainer = sequelize.define("shop_container", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    avatarId: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    onnerId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    title: { type: DataTypes.STRING, allowNull: false, defaultValue: "Item 3D" },
    itemName: { type: DataTypes.STRING, allowNull: true, defaultValue: "Item 3D" },
    description: { type: DataTypes.TEXT, allowNull: true, defaultValue: "" },
    slot: { type: DataTypes.STRING, allowNull: false, defaultValue: "top" },
    category: { type: DataTypes.STRING, allowNull: true, defaultValue: "clothing" },
    model: { type: DataTypes.STRING, allowNull: false, defaultValue: "default_mesh" },
    prefabPath: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
    currencyType: { type: DataTypes.STRING, allowNull: false, defaultValue: "Coins" },
    price: { type: DataTypes.STRING, allowNull: false, defaultValue: "100" },
    rarity: { type: DataTypes.STRING, allowNull: false, defaultValue: "common" },
    thumb: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
    defaultColors: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: { primary: "#3b82f6", secondary: "#ffffff" },
    },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: -1 },
    sales: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "Universal",
    },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });

  return ShopContainer;
};