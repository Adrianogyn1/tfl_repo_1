const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class User extends Model {
     
    
    static  newToken() {
        return require('crypto').randomBytes(16).toString('hex');
    }
}

    User.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userName: { type: DataTypes.STRING, defaultValue: '' , allowNull: false},
        avatar: { type: DataTypes.STRING, defaultValue: '' },
        online: { type: DataTypes.BOOLEAN, defaultValue: false },
        login: { type: DataTypes.STRING, defaultValue: '', allowNull: false },
        password: { type: DataTypes.STRING, defaultValue: '' },
        age: { type: DataTypes.STRING, defaultValue: '', allowNull: false },
        token: { type: DataTypes.STRING, allowNull: true, defaultValue: '', allowNull: true, unique: true },
        roomId: { type: DataTypes.STRING, allowNull: true, defaultValue: '', allowNull: true },
        avatarId: { type: DataTypes.STRING, defaultValue: '', allowNull: true },
        currencyId: { type: DataTypes.STRING, defaultValue: '', allowNull: true },
        email: { type: DataTypes.STRING, defaultValue: '', allowNull: true },
        uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
       
        role: {
  type: DataTypes.ENUM('admin', 'player', 'moderador', 'desenvolvedor','ownner'),
  defaultValue: 'player'
},  createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true // Gerencia automaticamente createdAt e updatedAt
    });

    return User;
};
