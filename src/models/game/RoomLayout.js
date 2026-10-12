const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const RoomLayout = sequelize.define("RoomLayout", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, defaultValue: "" },
    data: { type: DataTypes.TEXT, defaultValue: "" },
    uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    userId: { type: DataTypes.STRING, defaultValue: "" },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: "room_layouts",
    timestamps: true,
  });

  return RoomLayout;
};