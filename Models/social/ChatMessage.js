const { DataTypes, UUIDV4 } = require("sequelize");
module.exports = (sequelize) => {
  const ChatMessage = sequelize.define(
    "ChatMessage",
    {
      id: {type: DataTypes.INTEGER,primaryKey: true,autoIncrement: true,},
      uid: { type: DataTypes.STRING, defaultValue: DataTypes.STRING },
     // userId: { type: DataTypes.INTEGER, allowNull: true },
      text: { type: DataTypes.TEXT, defaultValue: "" },
      fileurl: { type: DataTypes.STRING, defaultValue: "" },
    //  chatId: { type: DataTypes.INTEGER, allowNull: true },
      seen: { type: DataTypes.BOOLEAN, defaultValue: false },
      hasFile: { type: DataTypes.BOOLEAN, defaultValue: false },
      hasImage: { type: DataTypes.BOOLEAN, defaultValue: false },
      hasVideo: { type: DataTypes.BOOLEAN, defaultValue: false },
      hasAudio: { type: DataTypes.BOOLEAN, defaultValue: false },
      hasLink: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: "chat_messages",
      timestamps: true,
    },
  );

  return ChatMessage;
};