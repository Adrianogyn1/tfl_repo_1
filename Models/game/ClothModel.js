const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ClothModel extends Model {
        isValid(obj) {
            try {
                return true;
            } catch (e) {
                return e.message;
            }
        }
    }

    ClothModel.init({
        id: {type: DataTypes.INTEGER,primaryKey: true,autoIncrement: true},
        name: { type: DataTypes.STRING, defaultValue: '' },
        objectId: { type: DataTypes.STRING, defaultValue: '' },
        path: { type: DataTypes.STRING, defaultValue: '' },
        addressable: { type: DataTypes.STRING, defaultValue: '' },
        slot: { type: DataTypes.STRING, defaultValue: '' },
        gender: { type: DataTypes.STRING, defaultValue: '' },
        isNude: { type: DataTypes.BOOLEAN, defaultValue: false },
        materialId: { type: DataTypes.INTEGER, defaultValue: 0 }, // Corrigido aqui (de DataTypes.INTEGER para 0)
        description: { type: DataTypes.STRING, defaultValue: '' },
        thumbnail: { type: DataTypes.STRING, defaultValue: '' },
        uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
        
        createdAt: {type: DataTypes.DATE,defaultValue: DataTypes.NOW},
        updatedAt: {type: DataTypes.DATE,defaultValue: DataTypes.NOW}
    }, {
        sequelize,
        modelName: 'Cloth', // O Sequelize vai registrar o modelo com este nome
        tableName: 'clothes',
        timestamps: true    
    });
    return ClothModel; // Corrigido aqui (retornando a classe exata que foi criada)
}