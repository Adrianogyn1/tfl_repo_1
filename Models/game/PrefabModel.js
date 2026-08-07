const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class PrefabModel extends Model {
      isValid(obj) {
            try{
                
                return true;
            }
            catch(e){
                return e.message;
            }
        }
    }

    PrefabModel.init({
        id: {type: DataTypes.INTEGER,primaryKey: true,autoIncrement: true},
        name: { type: DataTypes.STRING, defaultValue: '' },
        addressable: { type: DataTypes.STRING, defaultValue: '' },
        materialId: { type: DataTypes.STRING, defaultValue: '' },
        path: { type: DataTypes.STRING, defaultValue: '' },
        description: { type: DataTypes.STRING, defaultValue: '' },
        thumbnail: { type: DataTypes.STRING, defaultValue: '' },
        version: { type: DataTypes.STRING, defaultValue: '' },
        data: { type: DataTypes.STRING, defaultValue: '' },
        uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
        type: { type: DataTypes.ENUM("RoomObject", "AvatarOutfit", "Otters"), defaultValue: "Otters" },
        createdAt: {type: DataTypes.DATE,defaultValue: DataTypes.NOW},
        updatedAt: {type: DataTypes.DATE,defaultValue: DataTypes.NOW}
    }, {
        sequelize,
        modelName: 'PrefabModel',
        tableName: 'prefabs',
        timestamps: true
    });

    return PrefabModel;
};