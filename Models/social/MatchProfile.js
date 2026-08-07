const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class MatchProfile extends Model {}

    MatchProfile.init({
        id: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        userid: { type: DataTypes.STRING, defaultValue: '' },
        name: { type: DataTypes.STRING, defaultValue: '' },
        age: { type: DataTypes.INTEGER, defaultValue: 0 },
        bio: { type: DataTypes.STRING, defaultValue: '' },
        avatar: { type: DataTypes.STRING, defaultValue: '' },
        location: { type: DataTypes.STRING, defaultValue: '' },
        photos: { type: DataTypes.JSON, defaultValue: [] },
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
        modelName: 'MatchProfile',
        tableName: 'match_profiles',
        timestamps: true
    });

    return MatchProfile;
};