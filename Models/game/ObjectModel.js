const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ObjectModel extends Model {
    isValid(obj) {
            try{
                
                return true;
            }
            catch(e){
                return e.message;
            }
        }
  }

  ObjectModel.init({
    id: {
      type: DataTypes.INTEGER,
    autoIncrement: true,
      primaryKey: true
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // FKs
    ownnerId: {
      type: DataTypes.INTEGER,
      defaultValue:0,
      allowNull: true
    },
    layoutId: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true
    },
    materialId: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true
    },
    roomId: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true
    }, 
    // Campos de Texto
    name: {
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    thumbnail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    addressable: {
      type: DataTypes.UUID,
      allowNull: true
    },
    // Vetores do Unity (tratados como JSON devido ao atributo [JsonColumn])
    position: {
      type: DataTypes.JSON, // Armazena {x, y, z}
      defaultValue: { x: 0, y: 0, z: 0 },
      allowNull: true
    },
    rotation: {
      type: DataTypes.JSON, // Armazena {x, y, z}
      defaultValue: { x: 0, y: 0, z: 0 },
      allowNull: true
    },
    scale: {
      type: DataTypes.JSON, // Armazena {x, y, z}
      defaultValue: { x: 1, y: 1, z: 1 },
      allowNull: true
    },
     uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
        
    // Campos de Data
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
    modelName: 'ObjectModel',
    tableName: 'room_objects', // Mapeia o [Table("room_objects")]
    timestamps: true // Ative ou desative se a DTOBase gerenciar timestamps
  });

  return ObjectModel;

  };