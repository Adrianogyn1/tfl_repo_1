const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ChatMessage extends Model {}

    ChatMessage.init({
        id: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        userid: { type: DataTypes.STRING, defaultValue: '' },
        text: { type: DataTypes.TEXT, defaultValue: '' }, // TEXT para suportar mensagens longas
        fileurl: { type: DataTypes.STRING, defaultValue: '' },
        roomid: { type: DataTypes.STRING, defaultValue: '' },
        seen: { type: DataTypes.BOOLEAN, defaultValue: false },
        hasfile: { type: DataTypes.BOOLEAN, defaultValue: false },
        hasimage: { type: DataTypes.BOOLEAN, defaultValue: false },
        hasvideo: { type: DataTypes.BOOLEAN, defaultValue: false },
        hasaudio: { type: DataTypes.BOOLEAN, defaultValue: false },
        haslink: { type: DataTypes.BOOLEAN, defaultValue: false },
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
        modelName: 'ChatMessage',
        tableName: 'chat_messages',
        timestamps: true
    });

    return ChatMessage;
};