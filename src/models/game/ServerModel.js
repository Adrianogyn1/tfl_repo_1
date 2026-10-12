const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const ServerModel = sequelize.define("ServerModel", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    pid: { type: DataTypes.STRING, defaultValue: "" },
    roomId: { type: DataTypes.INTEGER, defaultValue: 0 },
    ip: { type: DataTypes.STRING, defaultValue: "" },
    port: { type: DataTypes.STRING, defaultValue: "" },
    publicPort: { type: DataTypes.STRING, defaultValue: "" },
    token: { type: DataTypes.STRING, defaultValue: "" },
    maxPlayers: { type: DataTypes.INTEGER, defaultValue: 30 },
    playersCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    scene: { type: DataTypes.STRING, defaultValue: "" },
    language: { type: DataTypes.STRING, defaultValue: "" },
    uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    target_uid: { type: DataTypes.STRING, defaultValue: DataTypes.UUIDV4 },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: "servers",
    timestamps: true,
  });

  return ServerModel;
};