const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ChatMessage extends Model {}

  ChatMessage.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      uid: { type: DataTypes.UUID, defaultValue: DataTypes.STRING },
      userId: { type: DataTypes.STRING, defaultValue: "" },
      text: { type: DataTypes.TEXT, defaultValue: "" }, // TEXT para suportar mensagens longas
      fileurl: { type: DataTypes.STRING, defaultValue: "" },
      chatId: { type: DataTypes.STRING, defaultValue: "" },
      seen: { type: DataTypes.BOOLEAN, defaultValue: false },
      hasFile: { type: DataTypes.BOOLEAN, defaultValue: false },
      hasImage: { type: DataTypes.BOOLEAN, defaultValue: false },
      hasVideo: { type: DataTypes.BOOLEAN, defaultValue: false },
      hasAudio: { type: DataTypes.BOOLEAN, defaultValue: false },
      hasLink: { type: DataTypes.BOOLEAN, defaultValue: false },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "ChatMessage",
      tableName: "chat_messages",
      timestamps: true,
    },
  );

  return ChatMessage;
};
