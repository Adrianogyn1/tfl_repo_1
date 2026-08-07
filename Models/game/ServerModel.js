const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ServerModel extends Model {
        isValid(obj) {
            try {
                if (!Object.type(obj) == 'object') throw new Error('obj is not an object');
                // if(!obj.pid) throw new Error('pid is required');
                if (!obj.roomId) throw new Error('roomId is required');
                // if(!obj.ip) throw new Error('ip is required');
                //  if(!obj.port) throw new Error('port is required');
                //  if(!obj.token) throw new Error('token is required');
                //  if(!obj.maxPlayers) throw new Error('maxPlayers is required');
                if (!obj.scene) throw new Error('scene is required');
                if (!obj.language) throw new Error('language is required');
                return true;
            }
            catch (e) {
                return e.message;
            }
        }
    }

    ServerModel.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        pid: { type: DataTypes.STRING, defaultValue: '' },
        roomId: { type: DataTypes.STRING, defaultValue: '' },
        ip: { type: DataTypes.STRING, defaultValue: '' },
        port: { type: DataTypes.STRING, defaultValue: '' },
        token: { type: DataTypes.STRING, defaultValue: '' },
        maxPlayers: { type: DataTypes.INTEGER, defaultValue: 30 },
        scene: { type: DataTypes.STRING, defaultValue: '' },
        language: { type: DataTypes.STRING, defaultValue: '' },
        uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },//instancia
        target_uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },//room.uid
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
        modelName: 'ServerModel',
        tableName: 'servers',
        timestamps: true
    });

    return ServerModel;
}