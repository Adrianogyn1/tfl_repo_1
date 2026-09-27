// models/social/Chat.js
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ChatRoom extends Model {}

  ChatRoom.init(
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
        defaultValue: DataTypes.UUIDV4,
      },

      type: {
        type: DataTypes.ENUM("private", "group", "global"),
        allowNull: false,
        defaultValue: "private",
      },
      name: {
        type: DataTypes.STRING(128), // só usado em grupos
        allowNull: true,
      },
      ownerId: {
        type: DataTypes.INTEGER, // dono/criador do grupo (null em private/global)
        allowNull: true,
        field: "owner_id",
      },

      // atalho pra DM: evita duplicar conversa entre os mesmos 2 profiles.
      // gerado como `min(profileId1,profileId2)_max(profileId1,profileId2)`, só quando type='private'
      directKey: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
        field: "direct_key",
      },
    },
    {
      sequelize,
      modelName: "ChatRoom",
      tableName: "chats",
      underscored: true,
      timestamps: true,
    }
  );

  return ChatRoom;
};
