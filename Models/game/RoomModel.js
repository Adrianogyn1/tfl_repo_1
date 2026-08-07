const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class RoomModel extends Model {

        isValid(obj) {
            try{
                if(Object.type(obj) != 'object') throw new Error('obj is not an object');
                if(!obj.name) throw new Error('name is required');
                if(!obj.scene) throw new Error('scene is required');
                if(!obj.ownnerID) throw new Error('ownnerID is required');
                return true;
            }
            catch(e){
                return e.message;
            }
        }
    }

    RoomModel.init({
        id: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        name: { type: DataTypes.STRING, defaultValue: '' },
        link: { type: DataTypes.STRING, defaultValue: '' },
        description: { type: DataTypes.STRING, defaultValue: '' },
        uid: { type: DataTypes.STRING, defaultValue: '' },
        maxPlayers: { type: DataTypes.INTEGER, defaultValue: 30 },
        playersCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        scene: { type: DataTypes.STRING, defaultValue: '' },
        password: { type: DataTypes.STRING, defaultValue: '' },
        isPrivate: { type: DataTypes.BOOLEAN, defaultValue: false },
        visits: { type: DataTypes.INTEGER, defaultValue: 0 },
        entryValue: { type: DataTypes.FLOAT, defaultValue: 0 },
        thumbnail: { type: DataTypes.STRING, defaultValue: 0 },
        ownnerId: { type: DataTypes.INTEGER, defaultValue: 0 },
        layoutId: { type: DataTypes.INTEGER, defaultValue: 0 },
        inventoryId: { type: DataTypes.INTEGER, defaultValue: 0 },
        uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
        target_uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
      requestOnlineData: { type: DataTypes.BOOLEAN, defaultValue: false },
      size: { type: DataTypes.FLOAT, defaultValue: 1 },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        userId: { type: DataTypes.INTEGER, defaultValue: 0 }
    
    }, {
        sequelize, // <-- Faltava esse bloco de opções aqui
        modelName: 'RoomModel',
        tableName: 'rooms', // Ajuste para o nome real da sua tabela se necessário
        timestamps: true
    });

    return RoomModel;
};
