const { Model, DataTypes , UUIDV4} = require("sequelize");

module.exports = (sequelize) => {
    
  const Inventory = sequelize.define("avatar_inventory", {
    id: {type: DataTypes.INTEGER,primaryKey: true,autoIncrement: true,},
   // avatarId: {type: DataTypes.INTEGER,allowNull: false},
    name: {type: DataTypes.STRING,allowNull: true},
    itemId: {type: DataTypes.INTEGER,allowNull: false,},
    categoria: {type: DataTypes.STRING,allowNull: true,defaultValue: ""},
    itemType: {type: DataTypes.INTEGER,allowNull: true,defaultValue: 0},
    position: {type: DataTypes.INTEGER,allowNull: true,defaultValue: 0},
    isEquipped: {type: DataTypes.BOOLEAN,allowNull: true,defaultValue: false},
    data: {type: DataTypes.JSON,allowNull: true,defaultValue: {},},
    uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    createdAt: {type: DataTypes.DATE,defaultValue: DataTypes.NOW,},
    updatedAt: {type: DataTypes.DATE,defaultValue: DataTypes.NOW,},
  });

  return Inventory;
};