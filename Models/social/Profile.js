const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Profile extends Model {
  
    }

    Profile.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: { 
            type: DataTypes.STRING, 
            defaultValue: '' 
        },
        userName: { 
            type: DataTypes.STRING, 
            defaultValue: '' 
        },
        bio: { 
            type: DataTypes.TEXT, 
            defaultValue: '' 
        },
        avatar: { 
            type: DataTypes.STRING, 
            defaultValue: '' 
        }
    }, {
        sequelize,
        modelName: 'Profile',
        tableName: 'profiles',
        timestamps: true // Gerencia o createdAt e updatedAt automaticamente
    });

    return Profile;
};