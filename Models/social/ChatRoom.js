const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const ChatRoom = sequelize.define(
    "ChatRoom",
    {
      id: {type: DataTypes.INTEGER,primaryKey: true,autoIncrement: true,},
      uid: { type: DataTypes.STRING, allowNull: true, defaultValue: DataTypes.UUIDV4 },
      istyping: { type: DataTypes.BOOLEAN, defaultValue: false },
      name: { type: DataTypes.STRING, defaultValue: "" },
      users: { type: DataTypes.JSON, defaultValue: [] },
   //   messages: { type: DataTypes.JSON, defaultValue: [] },
    },
    {
      tableName: "chat_rooms",
      timestamps: true,
    },
  );

  return ChatRoom;
};