const { DataTypes, UUIDV4 } = require("sequelize");
module.exports = (sequelize) => {
  
  const Like = sequelize.define(
    "Like",
    {
      id: {type: DataTypes.INTEGER,primaryKey: true,autoIncrement: true},
      postId: { type: DataTypes.INTEGER, allowNull:true },
      userId: { type: DataTypes.INTEGER, allowNull:true },
      avatarId: { type: DataTypes.INTEGER, allowNull:true },
       uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    //  photoId: { type: DataTypes.INTEGER, defaultValue: 0 },
    //  commentId: { type: DataTypes.INTEGER, defaultValue: 0 },
    //  profileId: { type: DataTypes.INTEGER, defaultValue: 0 },
    //  roomId: { type: DataTypes.INTEGER, defaultValue: 0 },

      type: {
        type: DataTypes.ENUM(
          "like",
          "love",
          "care",
          "haha",
          "wow",
          "sad",
          "angry",
        ),
        defaultValue: "like",
        allowNull: false,
      },
    },
    {
      tableName: "likes",
      timestamps: true,
    },
  );

  return Like;
};