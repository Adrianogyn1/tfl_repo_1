const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class CurrencyModel extends Model {
        isValid(obj) {
            try {
                return true;
            } catch (e) {
                return e.message;
            }
        }
    }

    CurrencyModel.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        value: { type: DataTypes.FLOAT, defaultValue: 0 }, 
        userId: { type: DataTypes.INTEGER, defaultValue: 0 }, // Corrigido aqui
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
        modelName: 'Currency',
        tableName: 'currencies',
        timestamps: true
    });

    return CurrencyModel; // Corrigido aqui
}