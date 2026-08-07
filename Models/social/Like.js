const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Like extends Model {
    }

    Like.init({
        id: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        postId: { type: DataTypes.INTEGER, defaultValue: 0 },
        userId: { type: DataTypes.INTEGER, defaultValue: 0 },
        photoId: { type: DataTypes.INTEGER, defaultValue: 0 },
        commentId: { type: DataTypes.INTEGER, defaultValue: 0 },
        profileId: { type: DataTypes.INTEGER, defaultValue: 0 },
        roomId: { type: DataTypes.INTEGER, defaultValue: 0 },
        // Armazena o tipo da reação ('like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'),
        type: { type: DataTypes.ENUM('like', 'love','care', 'haha', 'wow', 'sad', 'angry'), defaultValue: 'like', allowNull: false }
    }, {
        sequelize,
        modelName: 'Like',
        tableName: 'likes',
        timestamps: true // Cria e gerencia automaticamente createdAt e updatedAt
    });

    return Like;
};