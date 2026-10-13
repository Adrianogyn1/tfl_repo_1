const { DataTypes, UUIDV4 } = require("sequelize");
module.exports = (sequelize) => {
  
  const Like = sequelize.define(
    "Like",
    {
      id: {type: DataTypes.INTEGER,primaryKey: true,autoIncrement: true},
      postId: { type: DataTypes.INTEGER, allowNull:true },
      photoId: { type: DataTypes.INTEGER, allowNull:true },
      commentId: { type: DataTypes.INTEGER, allowNull:true },
      targetProfileId: { type: DataTypes.INTEGER, allowNull:true },
      roomId: { type: DataTypes.INTEGER, allowNull:true },
      reelId: { type: DataTypes.INTEGER, allowNull:true },
      userId: { type: DataTypes.INTEGER, allowNull:true },
      avatarId: { type: DataTypes.INTEGER, allowNull:true },
      profileId: { type: DataTypes.INTEGER, allowNull:true },
      uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
      target_uid:{ type: DataTypes.STRING, allowNull: true, defaultValue: DataTypes.UUIDV4 },

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