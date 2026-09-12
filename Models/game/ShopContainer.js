const { DataTypes, UUIDV4 } = require("sequelize");
const ShopItemModelFactory = require("./ShopItemModel");

module.exports = (sequelize) => {
  const ItemResource = ShopItemModelFactory(sequelize);

  const ShopContainer = sequelize.define("shop_container", {
    id: {type: DataTypes.INTEGER,primaryKey: true,autoIncrement: true,},
    onnerId: {type: DataTypes.INTEGER,allowNull: false,defaultValue: 0,},
    model: {type: DataTypes.STRING,allowNull: false,},
    title: {type: DataTypes.STRING,allowNull: false,},
    price: {type: DataTypes.STRING,allowNull: false,defaultValue: "0",},
    description: {type: DataTypes.TEXT,allowNull: true,},
    thumb: {type: DataTypes.STRING,allowNull: true,},
    sales: {type: DataTypes.INTEGER,allowNull: false,defaultValue: 0,},
    uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    gender: {
      type: DataTypes.ENUM,
      values: ["male", "female", "universal"],
      allowNull: true,
      defaultValue: "universal",
    },

      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, },
  });

 

  return ShopContainer;
};