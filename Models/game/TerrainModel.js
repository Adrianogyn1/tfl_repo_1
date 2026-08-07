const {Model, DataTypes} = require('sequelize');


module.exports = (sequelize) => {
    class Terrain extends Model {}

    Terrain.init({
        id: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        name: { type: DataTypes.STRING, defaultValue: '' },
        image: { type: DataTypes.STRING, defaultValue: '' },
        description: { type: DataTypes.STRING, defaultValue: '' },
        uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
        target_uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },//room.uid
        path: { type: DataTypes.STRING, defaultValue: '' },
        hash: { type: DataTypes.STRING, defaultValue: '' },
        trees: { type: DataTypes.STRING, defaultValue: '' },
        detais: { type: DataTypes.STRING, defaultValue: '' },
        materials: { type: DataTypes.STRING, defaultValue: '' },
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
        modelName: 'Terrain',
        tableName: 'terrains',
        timestamps: true
    });

    return Terrain;
};