const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const MatchProfile = sequelize.define(
    "MatchProfile",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userid: { type: DataTypes.STRING, defaultValue: "" },
      name: { type: DataTypes.STRING, defaultValue: "" },
      age: { type: DataTypes.INTEGER, defaultValue: 0 },
      bio: { type: DataTypes.STRING, defaultValue: "" },
      avatar: { type: DataTypes.STRING, defaultValue: "" },
      location: { type: DataTypes.STRING, defaultValue: "" },
      photos: { type: DataTypes.JSON, defaultValue: [] },
      uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
    },
    {
      tableName: "match_profiles",
      timestamps: true,
    },
  );

  return MatchProfile;
};