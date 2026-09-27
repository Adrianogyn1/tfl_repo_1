const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const ObjectModel = sequelize.define("ObjectModel", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    data: { type: DataTypes.TEXT, allowNull: true },
    ownnerId: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: true },
    layoutId: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: true },
    materialId: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: true },
    roomId: { type: DataTypes.INTEGER, allowNull: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING, defaultValue: "", allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    thumbnail: { type: DataTypes.STRING, allowNull: true },
    addressable: { type: DataTypes.STRING, allowNull: true },
    position: { type: DataTypes.JSON, defaultValue: { x: 0, y: 0, z: 0 }, allowNull: true },
    rotation: { type: DataTypes.JSON, defaultValue: { x: 0, y: 0, z: 0 }, allowNull: true },
    scale: { type: DataTypes.JSON, defaultValue: { x: 1, y: 1, z: 1 }, allowNull: true },
    uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: "room_objects",
    timestamps: true,
  });

  return ObjectModel;
};