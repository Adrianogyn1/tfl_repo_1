const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const RoomModel = sequelize.define("RoomModel", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, defaultValue: 0 },
    name: { type: DataTypes.STRING, defaultValue: "" },
    link: { type: DataTypes.STRING, defaultValue: "" },
    description: { type: DataTypes.STRING, defaultValue: "" },
    maxPlayers: { type: DataTypes.INTEGER, defaultValue: 30 },
    playersCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    scene: { type: DataTypes.STRING, defaultValue: "" },
    password: { type: DataTypes.STRING, defaultValue: "" },
    isPrivate: { type: DataTypes.BOOLEAN, defaultValue: false },
    visits: { type: DataTypes.INTEGER, defaultValue: 0 },
    entryValue: { type: DataTypes.FLOAT, defaultValue: 0 },
    thumbnail: { type: DataTypes.STRING, defaultValue: 0 },
    ownnerId: { type: DataTypes.INTEGER, defaultValue: 0 },
    layoutId: { type: DataTypes.INTEGER, defaultValue: 0 },
    inventoryId: { type: DataTypes.INTEGER, defaultValue: 0 },
    uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    target_uid: { type: DataTypes.STRING, defaultValue: DataTypes.UUIDV4 },
    requestOnlineData: { type: DataTypes.BOOLEAN, defaultValue: false },
    size: { type: DataTypes.FLOAT, defaultValue: 1 },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },

    avatarId: { type: DataTypes.INTEGER, allowNull: true },

    
  }, {
    tableName: "rooms",
    timestamps: true,
  });

  RoomModel.associate = (models) => {
    RoomModel.hasMany(models.ObjectModel, {
      foreignKey: "roomId",
      onDelete: "CASCADE",
    });
    models.ObjectModel.belongsTo(RoomModel, {
      foreignKey: "roomId",
    });

    RoomModel.hasOne(models.Terrain, {
      foreignKey: "roomId",
      onDelete: "CASCADE",
    });
    models.Terrain.belongsTo(RoomModel, {
      foreignKey: "roomId",
    });
  };

  return RoomModel;
};