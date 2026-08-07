const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class TextureModel extends Model {
        isValid(obj) {
            try {

                return true;
            }
            catch (e) {
                return e.message;
            }
        }
    }

    TextureModel.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: { type: DataTypes.STRING, defaultValue: '' },
        path: { type: DataTypes.STRING, defaultValue: '' },
        hash: { type: DataTypes.STRING, defaultValue: '' },
        extension: { type: DataTypes.STRING, defaultValue: '' },
        size: { type: DataTypes.INTEGER, defaultValue: 0 },
        url: { type: DataTypes.STRING, defaultValue: '' },
        userId: { type: DataTypes.INTEGER, defaultValue: 0 },
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
        modelName: 'TextureModel',
        tableName: 'textures',
        timestamps: true
    });

    return TextureModel;
}