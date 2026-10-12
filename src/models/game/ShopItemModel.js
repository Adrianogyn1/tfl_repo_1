const { Model, DataTypes, UUIDV4 } = require("sequelize");
module.exports = (sequelize) => {

  const ItemResource = sequelize.define("item_resource", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    model: { type: DataTypes.STRING, allowNull: true },
    slot: { type: DataTypes.STRING, allowNull: true },
    shader: { type: DataTypes.STRING, allowNull: true },
    values: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
    colors: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
    ints: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
    bools: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
    strings: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
    vectors: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
    textures_paths: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
    containerId: { type: DataTypes.INTEGER, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
     uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
  });

  return ItemResource;
};