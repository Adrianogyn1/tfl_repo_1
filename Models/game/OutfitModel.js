const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class OutfitModel extends Model {
        isValid(obj) {
            try{
                return true;
            }
            catch(e){
                return e.message;
            }
        }
    }

    OutfitModel.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: { type: DataTypes.STRING, defaultValue: '' },
        description: { type: DataTypes.STRING, defaultValue: '' },
        thumbnail: { type: DataTypes.STRING, defaultValue: '' },
        price: { type: DataTypes.FLOAT, defaultValue: 0 },
        tags: { type: DataTypes.STRING, defaultValue: '' },
        inventoryID: { type: DataTypes.INTEGER, defaultValue: 0 },
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
        modelName: 'Outfit',
        tableName: 'outfits',
        timestamps: true
    });

    return OutfitModel;
}