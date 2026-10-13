const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const Friend = sequelize.define(
    "Friend",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // O Avatar (Profile) é o dono dos amigos
      profileId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      targetProfileId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // Mantidos por compatibilidade com rotas legadas/C#
      userId: {
        type: DataTypes.STRING,
        defaultValue: "",
        field: "userId",
      },
      targetId: {
        type: DataTypes.STRING,
        defaultValue: "",
        field: "targetId",
      },
      uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
      status: { type: DataTypes.STRING, defaultValue: "pending" }, // 'pending' | 'accepted' | 'blocked'
    },
    {
      tableName: "friends",
      timestamps: true,
    },
  );

  return Friend;
};