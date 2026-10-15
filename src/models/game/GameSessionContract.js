const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize) => {
  const GameSessionContract = sequelize.define(
    "GameSessionContract",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      uuid: { type: DataTypes.STRING, defaultValue: UUIDV4, unique: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      avatarId: { type: DataTypes.INTEGER, allowNull: false },
      gameType: { type: DataTypes.STRING(50), allowNull: false }, // 'slots_tiger', 'roleta', 'bacboo', 'fantan'
      initialChipsGranted: { type: DataTypes.BIGINT, allowNull: false },
      chipsRemaining: { type: DataTypes.BIGINT, allowNull: false },
      maxLossCap: { type: DataTypes.BIGINT, allowNull: false },
      status: {
        type: DataTypes.ENUM("active", "completed", "exhausted", "canceled"),
        defaultValue: "active",
      },
      startedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      endedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "game_session_contracts",
      timestamps: true,
      indexes: [
        { fields: ["userId"] },
        { fields: ["avatarId"] },
        { fields: ["status"] },
      ],
    }
  );

  return GameSessionContract;
};
