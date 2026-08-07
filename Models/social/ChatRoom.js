const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ChatRoom extends Model {
       
      
    }

    ChatRoom.init({
        id: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        istyping: { type: DataTypes.BOOLEAN, defaultValue: false },
        name: { type: DataTypes.STRING, defaultValue: '' },
        users: { type: DataTypes.JSON, defaultValue: [] },
        messages: { type: DataTypes.JSON, defaultValue: [] },
        createdAt: { 
            type: DataTypes.DATE, 
            defaultValue: DataTypes.NOW 
        },
        updatedAt: { 
            type: DataTypes.DATE, 
            defaultValue: DataTypes.NOW 
        }
    }, {
        sequelize,
        modelName: 'ChatRoom',
        tableName: 'chat_rooms',
        timestamps: true
    });

    return ChatRoom;
};