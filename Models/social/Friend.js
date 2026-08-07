const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Friend extends Model {}

    Friend.init({
        id: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        userid: { type: DataTypes.STRING, defaultValue: '' },
        targetid: { type: DataTypes.STRING, defaultValue: '' },
        status: { type: DataTypes.STRING, defaultValue: 'pending' },
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
        modelName: 'Friend',
        tableName: 'friends',
        timestamps: true
    });

    return Friend;
};