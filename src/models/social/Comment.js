const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const Comment = sequelize.define(
    "Comment",
    {
      id: {type: DataTypes.INTEGER,primaryKey: true,autoIncrement: true, },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      postId: { type: DataTypes.INTEGER, allowNull: true },
      photoId: { type: DataTypes.INTEGER, allowNull: true },
      commentId: { type: DataTypes.INTEGER, allowNull: true },
      text: { type: DataTypes.STRING, defaultValue: "" },
    },
    {
      tableName: "comments",
      timestamps: true,
    },
  );

  return Comment;
};