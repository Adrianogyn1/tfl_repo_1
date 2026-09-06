const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Friend extends Model {}

  Friend.init(
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
      status: { type: DataTypes.STRING, defaultValue: "pending" },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "createdAt",
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "updatedAt",
      },
    },
    {
      sequelize,
      modelName: "Friend",
      tableName: "friends",
      timestamps: true,
    },
  );

  return Friend;
};
