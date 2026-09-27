// models/social/SystemAnnouncement.js
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class SystemAnnouncement extends Model {}

  SystemAnnouncement.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

      scope: {
        type: DataTypes.ENUM("global", "chat"), // global = todo o servidor, chat = só uma sala/grupo específico
        allowNull: false,
        defaultValue: "global",
      },
      chatId: {
        type: DataTypes.BIGINT,
        allowNull: true, // só preenchido quando scope = 'chat'
        field: "chat_id",
      },

      level: {
        type: DataTypes.SMALLINT, // reaproveita o enum MessageType do C# (Info=0, Warning=1, Error=2, Success=3...)
        allowNull: false,
        defaultValue: 0,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      pinned: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true, // null = não expira
        field: "expires_at",
      },

      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true, // profile admin que criou; null se automático do sistema
        field: "created_by",
      },
    },
    {
      sequelize,
      modelName: "SystemAnnouncement",
      tableName: "system_announcements",
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ["scope", "pinned"] },
        { fields: ["chat_id"] },
      ],
    }
  );

  return SystemAnnouncement;
};
