const { Model, DataTypes, ENUM , UUIDV4} = require("sequelize");

module.exports = (sequelize) => {
  class Avatar extends Model {}

  Avatar.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      uid: { type: DataTypes.STRING, defaultValue: DataTypes.UUIDV4 },
      name: { type: DataTypes.STRING, defaultValue: "" },
      bio: { type: DataTypes.TEXT, defaultValue: "" },
      gender: { type: DataTypes.INTEGER, defaultValue: 0 }, //0 universal, 1 male, 2 female
      //vip: {type: DataTypes.BOOLEAN, defaultValue: false},//0 basic, 1 vip
      vipExpiresAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },

      //owner
      userId: { type: DataTypes.INTEGER, allowNull: true },
      //preview e status
      thumbnail: { type: DataTypes.STRING, defaultValue: "" },
      online: { type: DataTypes.BOOLEAN, defaultValue: false },
      lastSeen: { type: DataTypes.TEXT, defaultValue: "" },
      currentRoom: { type: DataTypes.STRING, defaultValue: "" },

      //
      data: { type: DataTypes.TEXT, defaultValue: "" },

      /*Remover os campos */
      //vamos concentrar em data, todo o json
      // height: { type: DataTypes.FLOAT, defaultValue: 0 },
      //  gender: { type: DataTypes.INTEGER, defaultValue: 0 },
      //   bones: { type: DataTypes.TEXT, defaultValue: '' },
      //   blendShapes: { type: DataTypes.TEXT, defaultValue: '' },
      //   slots: { type: DataTypes.TEXT, defaultValue: '' },
      // postId: { type: DataTypes.STRING, defaultValue: '' },//vamoos usar o uid do avatar
      //   material_id: { type: DataTypes.STRING, defaultValue: '' },//remover
      //  inventoryID: { type: DataTypes.STRING, defaultValue: '' },//remover

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
      modelName: "Avatar",
      tableName: "avatars",
      timestamps: false,
    },
  );

  return Avatar;
};
