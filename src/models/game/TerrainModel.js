const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const Terrain = sequelize.define("Terrain", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, defaultValue: "" },
    image: { type: DataTypes.STRING, defaultValue: "" },
    description: { type: DataTypes.STRING, defaultValue: "" },
    uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    target_uid: { type: DataTypes.STRING, allowNull: true, defaultValue: DataTypes.UUIDV4 },
    path: { type: DataTypes.STRING, defaultValue: "" },
    hash: { type: DataTypes.STRING, defaultValue: "" },
    trees: { type: DataTypes.STRING, defaultValue: "" },
    detais: { type: DataTypes.STRING, defaultValue: "" },
    materials: { type: DataTypes.STRING, defaultValue: "" },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: "terrains",
    timestamps: true,
  });

  return Terrain;
};