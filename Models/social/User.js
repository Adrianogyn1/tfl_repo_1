const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userName: { type: DataTypes.STRING, defaultValue: "", allowNull: false },
      avatar: { type: DataTypes.STRING, defaultValue: "" },
      online: { type: DataTypes.BOOLEAN, defaultValue: false },
      login: { type: DataTypes.STRING, defaultValue: "", allowNull: false },
      password: { type: DataTypes.STRING, defaultValue: "" },
      age: { type: DataTypes.STRING, defaultValue: "", allowNull: false },
      birdDay: { type: DataTypes.STRING, defaultValue: "", allowNull: false },
      token: {type: DataTypes.STRING,allowNull: true,defaultValue: UUIDV4},
      roomId: {type: DataTypes.STRING,allowNull: true,defaultValue:''},
      avatarId: { type: DataTypes.STRING, defaultValue: "", allowNull: true },
      currencyId: { type: DataTypes.STRING, defaultValue: "", allowNull: true },
      email: { type: DataTypes.STRING, defaultValue: "", allowNull: true },
      uid: { type: DataTypes.STRING, allowNull: true, defaultValue:UUIDV4},
      gender: { type: DataTypes.INTEGER, defaultValue: 1 },

      role: {
        type: DataTypes.ENUM(
          "admin",
          "player",
          "moderador",
          "desenvolvedor",
          "ownner",
        ),
        defaultValue: "player",
      },
      createdAt: {type: DataTypes.DATE,defaultValue: DataTypes.NOW,},
      updatedAt: {type: DataTypes.DATE,defaultValue: DataTypes.NOW,},
    },
    {
      tableName: "users",
      timestamps: true,
    },
  );

  User.newToken = function () {
    return require("crypto").randomBytes(16).toString("hex");
  };

  return User;
};