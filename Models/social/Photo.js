const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Photo extends Model {
    }

    Photo.init({
        id: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        userId: { type: DataTypes.STRING, defaultValue: '' },
        postId: { type: DataTypes.INTEGER, defaultValue: null }, 
        url: { type: DataTypes.STRING, defaultValue: '' },
        description: { type: DataTypes.STRING, defaultValue: '' },
        isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
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
        modelName: 'Photo',
        tableName: 'photos',
        timestamps: true
    });

    return Photo;
};