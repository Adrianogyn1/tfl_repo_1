const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Ignore extends Model {
    
    }

    Ignore.init({
        id: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        userid: { type: DataTypes.STRING, defaultValue: '' },
        targetid: { type: DataTypes.STRING, defaultValue: '' },
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
        modelName: 'Ignore',
        tableName: 'ignores',
        timestamps: true
    });

    return Ignore;
};