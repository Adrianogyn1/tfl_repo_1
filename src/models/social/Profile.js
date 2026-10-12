const { Model, DataTypes, UUIDV4 } = require("sequelize");

//remover profile
module.exports = (sequelize) => {
  class Profile extends Model {}

  Profile.init(
    {
      id: { type: DataTypes.IProfileNTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.STRING, defaultValue: "" },
      userName: { type: DataTypes.STRING, defaultValue: "" },
      bio: { type: DataTypes.TEXT, defaultValue: "" },
      avatar: { type: DataTypes.STRING, defaultValue: "" },
       uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    },
    {
      sequelize,
      modelName: "Profile",
      tableName: "profiles",
      timestamps: true, // Gerencia o createdAt e updatedAt automaticamente
    },
  );

  return Profile;
};
