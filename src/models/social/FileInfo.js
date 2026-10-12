const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const FileInfo = sequelize.define(
    "FileInfo",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      hash: { type: DataTypes.STRING, defaultValue: "" },
      name: { type: DataTypes.STRING, defaultValue: "" },
      type: { type: DataTypes.STRING, defaultValue: "" },
      size: { type: DataTypes.INTEGER, defaultValue: 0 },
      url: { type: DataTypes.STRING, defaultValue: "" },
      userId: { type: DataTypes.STRING, defaultValue: "" },
      token: { type: DataTypes.STRING, defaultValue: "" },
      status: { type: DataTypes.STRING, defaultValue: "" },
      inCdn: { type: DataTypes.BOOLEAN, defaultValue: false },
      publicId: { type: DataTypes.STRING, defaultValue: "" },
      uid: { type: DataTypes.STRING, allowNull: true, defaultValue: UUIDV4 },
      target_uid: { type: DataTypes.STRING, allowNull: true, defaultValue: DataTypes.UUIDV4 },
    },
    {
      tableName: "file_infos",
      timestamps: true,
    },
  );

  return FileInfo;
};