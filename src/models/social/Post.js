const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const Post = sequelize.define(
    "Post",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      profileId: { type: DataTypes.INTEGER, allowNull: true },
      roomId: { type: DataTypes.INTEGER, allowNull: true },
      sharedPostId: { type: DataTypes.INTEGER, allowNull: true },
      text: { type: DataTypes.TEXT, defaultValue: "" },
      title: { type: DataTypes.STRING, defaultValue: "" },
      imageUrl: { type: DataTypes.STRING, defaultValue: "" },
      uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    },
    {
      sequelize,
      modelName: "Post",
      tableName: "posts",
      timestamps: true,
    },
  );

  return Post;
};