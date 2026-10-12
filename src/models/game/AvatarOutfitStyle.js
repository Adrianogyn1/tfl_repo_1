const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("avatar_outfit_style", {
    id: {type: DataTypes.INTEGER,primaryKey: true,autoIncrement: true,},
    avatarId: {type: DataTypes.INTEGER,allowNull: false,}, //definido na relação
    name: {type: DataTypes.STRING,allowNull: false,defaultValue: "Meu Estilo"},
    items: {type: DataTypes.JSON,allowNull: false,defaultValue: [],},
     uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
  });
};