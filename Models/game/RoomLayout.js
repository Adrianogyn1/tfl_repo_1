const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    class RoomLayout extends Model {}

    RoomLayout.init({
        id: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        name: { type: DataTypes.STRING, defaultValue: '' },
        data: { type: DataTypes.TEXT, defaultValue: '' },
        uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
        userId: { type: DataTypes.STRING, defaultValue: '' },
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
        modelName: 'RoomLayout',
        tableName: 'room_layouts',
        timestamps: true
    });

    return RoomLayout;
    };