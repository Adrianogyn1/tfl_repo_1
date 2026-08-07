const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Follow extends Model {
        constructor(...args) 
        {
            super(...args);
            this.userName='';
            this.thumbnail='';
        }
    }

    Follow.init({
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
        modelName: 'Follow',
        tableName: 'follows',
        timestamps: true
    });

    return Follow;
};