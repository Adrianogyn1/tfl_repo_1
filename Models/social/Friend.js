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
      status: { type: DataTypes.STRING, defaultValue: "pending" },
    },
    {
      tableName: "friends",
      timestamps: true,
    },
  );

  return Friend;
};