const { DataTypes, UUIDV4 } = require("sequelize");
module.exports = (sequelize) => {
  const Photo = sequelize.define(
    "Photo",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: { type: DataTypes.INTEGER, allowNull: true },
postId: { type: DataTypes.INTEGER, allowNull: true },
      url: { type: DataTypes.STRING, defaultValue: "" },
      description: { type: DataTypes.STRING, defaultValue: "" },
      isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
       uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    },
    {
      tableName: "photos",
      timestamps: true,
    },
  );

  return Photo;
};