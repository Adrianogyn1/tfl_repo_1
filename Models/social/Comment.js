const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Comment extends Model {
      
    }

    Comment.init({
        id: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        userId: { type: DataTypes.STRING, defaultValue: '' },
        postId: { type: DataTypes.STRING, defaultValue: '' },
        photoId: { type: DataTypes.STRING, defaultValue: '' },
        commentId: { type: DataTypes.STRING, defaultValue: '' },
        text: { type: DataTypes.STRING, defaultValue: '' },
        createdAt: { 
            type: DataTypes.DATE, 
            defaultValue: DataTypes.NOW 
        },
        updatedAt: { 
            type: DataTypes.DATE, 
            defaultValue: DataTypes.NOW 
        }
    }, {
        sequelize,
        modelName: 'Comment',
        tableName: 'comments',
        timestamps: true
    });

    return Comment;
};