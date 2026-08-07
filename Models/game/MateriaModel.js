const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class MaterialModel extends Model {
        isValid(obj) {
            try{
                
                return true;
            }
            catch(e){
                return e.message;
            }
        }
    }

    MaterialModel.init({
        id: {type: DataTypes.INTEGER,primaryKey: true,autoIncrement: true},
        name: { type: DataTypes.STRING, defaultValue: '' },
        objectId: { type: DataTypes.STRING, defaultValue: '' },
        color: { type: DataTypes.STRING, defaultValue: '' },
        channel: { type: DataTypes.STRING, defaultValue: 'diffuse' },
        shader: { type: DataTypes.STRING, defaultValue: '' },
        obj_uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 }, // Ajustado para gerar UUID padrão válido
        textures: { type: DataTypes.STRING, defaultValue: '' },
        values: { type: DataTypes.STRING, defaultValue: '' },        
        userId: { type: DataTypes.INTEGER, defaultValue: 0 }, // Corrigido DataTypes.INTEGER
        inventoryID: { type: DataTypes.INTEGER, defaultValue: 0 }, // Corrigido DataTypes.INTEGER
        uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
        description: { type: DataTypes.STRING, defaultValue: '' },
        createdAt: {type: DataTypes.DATE,defaultValue: DataTypes.NOW},
        updatedAt: {type: DataTypes.DATE,defaultValue: DataTypes.NOW}
    },
    {
        sequelize,
        modelName: 'MaterialModel',
        tableName: 'materiais',
        timestamps: true    
    });

    return MaterialModel;
};