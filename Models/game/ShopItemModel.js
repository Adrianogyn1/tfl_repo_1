const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // Tabela Pai: Container do Item da Loja
    const ShopContainer = sequelize.define('shop_container', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        onnerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        model: {
            type: DataTypes.STRING,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        price: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "0"
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        thumb: {
            type: DataTypes.STRING,
            allowNull: true
        },
        sales: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    });

    // Tabela Filho: Recursos do Item (Materiais / Slots de Personagem)
    const ItemResource = sequelize.define('item_resource', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        model: {
            type: DataTypes.STRING,
            allowNull: true
        },
        slot: {
            type: DataTypes.STRING,
            allowNull: true
        },
        shader: {
            type: DataTypes.STRING,
            allowNull: true
        },
        values: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        colors: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        ints: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        bools: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        strings: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        vectors: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        textures_paths: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        }
    });

    // Relacionamento (1 Container -> Vários ItemResources)
    ShopContainer.hasMany(ItemResource, {
        as: 'items',
        foreignKey: 'containerId',
        onDelete: 'CASCADE'
    });

    ItemResource.belongsTo(ShopContainer, {
        foreignKey: 'containerId'
    });

    return {
        ShopContainer,
        ItemResource
    };
};