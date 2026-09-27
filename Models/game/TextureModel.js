const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const TextureModel = sequelize.define("TextureModel", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, defaultValue: "" },
    path: { type: DataTypes.STRING, defaultValue: "" },
    hash: { type: DataTypes.STRING, defaultValue: "" },
    extension: { type: DataTypes.STRING, defaultValue: "" },
    size: { type: DataTypes.INTEGER, defaultValue: 0 },
    url: { type: DataTypes.STRING, defaultValue: "" },
    userId: { type: DataTypes.INTEGER, defaultValue: 0 },
    inventoryID: { type: DataTypes.INTEGER, defaultValue: 0 },
    uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: "textures",
    timestamps: true,
  });

  return TextureModel;
};