
const { Model, DataTypes } = require("sequelize");
const { UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
    const PagBank = sequelize.define("PagBank", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        userId: { type: DataTypes.INTEGER, allowNull: true },
        avatarId: { type: DataTypes.INTEGER, allowNull: true },
        description: { type: DataTypes.STRING, allowNull: true },
        pagbankId: { type: DataTypes.STRING, allowNull: true },
        status: { type: DataTypes.STRING, allowNull: true },
        uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
        value: { type: DataTypes.INTEGER, defaultValue: 0 },

        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
        tableName: "pagbank",
        timestamps: true,
    });

    return PagBank;
};