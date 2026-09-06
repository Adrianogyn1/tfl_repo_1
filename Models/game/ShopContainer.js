/* */
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  // Modelo Principal (Container)
  const ShopContainer = sequelize.define("shop_container", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    onnerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "container",
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    thumb: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sales: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    gender: {
      type: DataTypes.ENUM,
      values: ["male", "female", "universal"],
      allowNull: false,
      defaultValue: "female",
    },
  });

  // Modelo Secundário (ItemResource)
  const ItemResource = sequelize.define("item_resource", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    containerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    slot: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shader: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    values: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    colors: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    ints: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    bools: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    strings: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    vectors: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    textures_paths: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  });

  // Definindo a relação 1:N com chaves explícitas
  ShopContainer.hasMany(ItemResource, {
    as: "items",
    foreignKey: "containerId",
    onDelete: "CASCADE",
  });

  ItemResource.belongsTo(ShopContainer, {
    as: "container",
    foreignKey: "containerId",
  });

  return {
    ShopContainer,
    ItemResource,
  };
};
/**/
