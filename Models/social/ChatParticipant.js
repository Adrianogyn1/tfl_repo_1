// models/social/ChatParticipant.js
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ChatParticipant extends Model {}

  ChatParticipant.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      chatId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: "chat_id",
      },
      profileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "profile_id", // FK para Profile/AvatarModel
      },

      role: {
        type: DataTypes.ENUM("owner", "admin", "member"),
        allowNull: false,
        defaultValue: "member",
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "joined_at",
      },

      // usado pra calcular "lida": compara message.createdAt <= lastReadAt
      lastReadAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "last_read_at",
      },
    },
    {
      sequelize,
      modelName: "ChatParticipant",
      tableName: "chat_participants",
      underscored: true,
      timestamps: false,
      indexes: [
        { unique: true, fields: ["chat_id", "profile_id"] },
        { fields: ["profile_id"] }, // "quais chats eu participo"
      ],
    }
  );

  return ChatParticipant;
};
