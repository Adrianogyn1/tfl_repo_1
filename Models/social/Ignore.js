const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const Ignore = sequelize.define(
    "Ignore",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userid: { type: DataTypes.STRING, defaultValue: "" },
      targetid: { type: DataTypes.STRING, defaultValue: "" },
      uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    },
    {
      tableName: "ignores",
      timestamps: true,
    },
  );

  return Ignore;
};