const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class OutfitItemsModel extends Model {
        isValid(obj) {
            try {
                return true;
            }
            catch(e) {
                return e.message;
            }
        }
    }

    OutfitItemsModel.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        visible: { type: DataTypes.BOOLEAN, defaultValue: false },
        type: { type: DataTypes.STRING, defaultValue: "" },
        prefabId: { type: DataTypes.INTEGER, defaultValue: 0 },
        outfitId: { type: DataTypes.INTEGER, defaultValue: 0 },
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
        modelName: 'OutfitItems',
        tableName: 'outfit_items',
        timestamps: true
    });

    // CORREÇÃO: Retornando a classe exata que foi declarada e inicializada acima
    return OutfitItemsModel;
}