const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class CurrencyRegisterModel extends Model {
        isValid(obj) {
            try {
                return true;
            }
            catch(e) {
                return e.message;
            }
        }
    }

    CurrencyRegisterModel.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: { 
            type: DataTypes.INTEGER 
        },
        type: { 
            //coins moeda de jogo, cash dinheiro, chips fichas de aposta
            type: DataTypes.ENUM('Coins', 'Cash', "Chips", 'None'),
            defaultValue: 'None'
        },
        transactionType: { 
            //deposito, saque, compra, venda, bonus do jogo, rewards
            type: DataTypes.ENUM('Deposit', 'Withdraw', 'Buy', 'Sell',"Bonus", "Rewards","None"),
            defaultValue: 'None'
        },
        value: { 
            type: DataTypes.FLOAT, 
            defaultValue: 0 
        },
        description: { 
            type: DataTypes.STRING, 
            defaultValue: '' 
        },
        uid: { 
            type: DataTypes.UUID, 
            defaultValue: DataTypes.UUIDV4 
        },
        target_uid: { 
            type: DataTypes.UUID, 
            defaultValue: DataTypes.UUIDV4 
        },
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
        modelName: 'CurrencyRegister',
        tableName: 'currency_register',
        timestamps: true
    });

    // Retornando a classe correta que foi inicializada acima
    return CurrencyRegisterModel;
}