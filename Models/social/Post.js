const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Post extends Model {
        
    }

    Post.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: { type: DataTypes.STRING, defaultValue: '' },
        text: { type: DataTypes.TEXT, defaultValue: '' },
        title: { type: DataTypes.STRING, defaultValue: '' }
    }, {
        sequelize,
        modelName: 'Post',
        tableName: 'posts',
        timestamps: true
    });

    return Post;
};