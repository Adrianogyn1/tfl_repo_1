const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) =>
{
    return sequelize.define("avatar_outfit", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, },
        avatarId: { type: DataTypes.INTEGER, allowNull: false, },
        slot: { type: DataTypes.STRING, allowNull: false, },
        isEquiped: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, },
        itemId: { type: DataTypes.INTEGER, allowNull: false, },
        data: { type: DataTypes.JSON, allowNull: true, defaultValue: {}, },
        uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },

        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, },
    });
};