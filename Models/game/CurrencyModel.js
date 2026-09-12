const { Model, DataTypes, UUIDV4 } = require("sequelize");

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

  CurrencyModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      value: { type: DataTypes.FLOAT, defaultValue: 0 },

      coins: { type: DataTypes.FLOAT, defaultValue: 0 },//moedas do jogo //pode ser convertido para cash
      cash: { type: DataTypes.FLOAT, defaultValue: 0 },//dinheiro
      chips: { type: DataTypes.FLOAT, defaultValue: 0 },//moedas de aposta pode ser convertido para coins

      userId: { type: DataTypes.INTEGER, defaultValue: 0 }, // Corrigido aqui
     // avatarId: { type: DataTypes.INTEGER, allowNull: true },
      uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Currency",
      tableName: "currencies",
      timestamps: true,
    },
  );

  return CurrencyModel; // Corrigido aqui
};
