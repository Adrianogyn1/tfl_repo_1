const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    class Avatar extends Model {}

    Avatar.init({
        // Alterado para INTEGER com autoIncremento conforme sua nova lógica
        id: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        data: { type: DataTypes.TEXT, defaultValue: '' },
        name: { type: DataTypes.STRING, defaultValue: '' },
        height: { type: DataTypes.FLOAT, defaultValue: 0 },
        gender: { type: DataTypes.INTEGER, defaultValue: 0 },
        material_id: { type: DataTypes.STRING, defaultValue: '' },
        inventoryID: { type: DataTypes.STRING, defaultValue: '' },
        postId: { type: DataTypes.STRING, defaultValue: '' },
        userId: { type: DataTypes.STRING, defaultValue: '' },
        thumbnail: { type: DataTypes.STRING, defaultValue: '' },
        online: { type: DataTypes.INTEGER, defaultValue: 0 },
        lastSeen: { type: DataTypes.TEXT, defaultValue: '' },
        bones: { type: DataTypes.TEXT, defaultValue: '' },
        blendShapes: { type: DataTypes.TEXT, defaultValue: '' },
        slots: { type: DataTypes.TEXT, defaultValue: '' },
        currentRoom: { type: DataTypes.STRING, defaultValue: '' },
        // Mantido o campo uid como identificador UUID secundário
        uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
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
        modelName: 'Avatar',
        tableName: 'avatars',
        timestamps: false
    });

    return Avatar;
};