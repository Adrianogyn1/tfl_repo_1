// models/social/ChatMessage.js
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ChatMessage extends Model {}

  ChatMessage.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      uid: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        defaultValue: DataTypes.UUIDV4, // espelha o Guid.NewGuid() do AvatarFKBase no C#
      },

      chatId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: "chat_id",
      },
      profileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "profile_id", // remetente (FK para Profile/AvatarModel)
      },
      senderName: {
        type: DataTypes.STRING(128), // denormalizado: evita join só pra exibir histórico
        allowNull: false,
        field: "sender_name",
      },

      // espelha o enum MessageType do C# (Info, Warning, Error, Success, Chat, System, User, Game, Private, Group, Local, Notification)
      type: {
        type: DataTypes.SMALLINT,
        allowNull: false,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      hasFile: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "has_file" },
      hasImage: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "has_image" },
      hasVideo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "has_video" },
      hasAudio: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "has_audio" },
      hasLink: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "has_link" },
      linkFile: { type: DataTypes.TEXT, allowNull: true, field: "link_file" },

      // metadados do arquivo (preenchidos quando hasAudio/hasImage/hasVideo = true)
      filePath: { type: DataTypes.TEXT, allowNull: true, field: "file_path" },
      fileSize: { type: DataTypes.INTEGER, allowNull: true, field: "file_size" },
      fileDurationMs: { type: DataTypes.INTEGER, allowNull: true, field: "file_duration_ms" },
      fileMimeType: { type: DataTypes.STRING(64), allowNull: true, field: "file_mime_type" },
    },
    {
      sequelize,
      modelName: "ChatMessage",
      tableName: "chat_messages",
      underscored: true,
      timestamps: true, // created_at / updated_at
      indexes: [
        { fields: ["chat_id", "created_at"] }, // listar histórico de uma conversa em ordem
        { fields: ["profile_id"] },
        { fields: ["uid"], unique: true },
      ],
    }
  );

  return ChatMessage;
};
