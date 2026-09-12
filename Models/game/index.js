const UserFactory = require("../social/User.js");
const CurrencyFactory = require("./CurrencyModel");
const CurrencyRegisterFactory = require("./CurrencyRegister");
const PrefabFactory = require("./PrefabModel");
const RoomFactory = require("./RoomModel");
const LayoutFactory = require("./RoomLayout");
const ServerFactory = require("./ServerModel");
const TextureFactory = require("./TextureModel");
const MateriaModelFactory = require("./MateriaModel");
const ObjectModelFactory = require("./ObjectModel");
const TerrainFactory = require("./TerrainModel");
const RoomModelFactory = require("./RoomModel");
const PrefabModelFactory = require("./PrefabModel");

const AvatarModelFactory = require("./AvatarModel");
const AvatarOutfitFactory = require("./AvatarOutfit");
const AvatarOutfitStyleFactory = require("./AvatarOutfitStyle");
const InventoryFactory = require("./inventory");

const ShopItemFactory = require("./ShopItemModel");
const ShopContainerFactory = require("./ShopContainer");



module.exports = (sequelize) => {


  //avatar
  const User = UserFactory(sequelize);
  const Avatar = AvatarModelFactory(sequelize);
  const Inventory = InventoryFactory(sequelize);
  const AvatarOutfit = AvatarOutfitFactory(sequelize);
  const AvatarOutfitStyle = AvatarOutfitStyleFactory(sequelize);
  const ShopItem = ShopItemFactory(sequelize);//item de Inventory
  const ShopContainer = ShopContainerFactory(sequelize);//item de Inventory
  const RoomModel = RoomModelFactory(sequelize);//item de Inventory
  const ObjectModel = ObjectModelFactory(sequelize);//item de Inventory
  const Terrain = TerrainFactory(sequelize);//item de Inventory
  const LayoutModel = LayoutFactory(sequelize);//item de Inventory
  const Texture = TextureFactory(sequelize);//item de Inventory, nao pode ser deletado se fizer parte de algum item
  const Material = MateriaModelFactory(sequelize);//item de Inventory
  const Currency = CurrencyFactory(sequelize);//wallet de avatar
  const CurrencyRegister = CurrencyRegisterFactory(sequelize);//registros de transação

  //gamecontroller
  const PrefabModel = PrefabModelFactory(sequelize);
  const Prefab = PrefabFactory(sequelize);
  const Room = RoomFactory(sequelize);
  const Server = ServerFactory(sequelize);

  /*=====================================
    Relacionamentos
  =======================================*/
  
  // Currency: containners de moedas relação de 1:1 com avatar
  // CurrencyRegister: registro de transação, relação n:1 com currency
  // Room: remover (ou usar RoomModel)
  // LayoutModel: uma tabela para poder salvar layout, sala salva como layout, só existe no inventario, podendo atualizar os itens daquela sala
  // RoomModel: salas criadas pelo jogador, relação de n:1 com avatar
  // Terrain: terreno da sala, relacionamento de 1:1 com room
  // ObjectModel: itens da sala, relacionamento de n:1 com room
  // Texture: texturas e imagens enviadas pelo jogador, relação de n:1 com user
  // Material: materiais criados pelo jogador (mantido em JSON, removido daqui)
  // Prefab / Server / PrefabModel: game controller
  // ShopContainer: relacionamento de 1:n com avatar //ok?
  // ItemResource: relacionamento de n:1 com ShopContainer e também com avatar

 User.hasMany(Avatar, { foreignKey: "userId" });

  Avatar.belongsTo(User, {
    foreignKey: "userId",
    onDelete: "CASCADE",
  });
  
  Avatar.hasMany(Inventory, {
    as: "inventory",
    foreignKey: "avatarId",
    onDelete: "CASCADE",
  });

  Inventory.belongsTo(Avatar, {
    foreignKey: "avatarId",
  });

  Avatar.hasMany(AvatarOutfit, {
    as: "outfits",
    foreignKey: "avatarId",
    onDelete: "CASCADE",
  });

  AvatarOutfit.belongsTo(Avatar, {
    foreignKey: "avatarId",
  });

  Avatar.hasMany(AvatarOutfitStyle, {
    as: "styles",
    foreignKey: "avatarId",
    onDelete: "CASCADE",
  });

  AvatarOutfitStyle.belongsTo(Avatar, {
    foreignKey: "avatarId",
  });

  Avatar.hasOne(Currency, {
    as: "wallet",
    foreignKey: "avatarId",
    onDelete: "CASCADE",
  });

  Currency.belongsTo(Avatar, {
    foreignKey: "avatarId",
  });

  Currency.hasMany(CurrencyRegister, {
    as: "registers",
    foreignKey: "currencyId",
    onDelete: "CASCADE",
  });

  CurrencyRegister.belongsTo(Currency, {
    foreignKey: "currencyId",
  });

  Avatar.hasMany(RoomModel, {
    as: "rooms",
    foreignKey: "avatarId",
    onDelete: "CASCADE",
  });

  RoomModel.belongsTo(Avatar, {
    foreignKey: "avatarId",
  });
  
  RoomModel.hasMany(ObjectModel, {
    as: "objects",
    foreignKey: "roomId",
    onDelete: "CASCADE",
  });
  ObjectModel.belongsTo(RoomModel, {
    foreignKey: "roomId",
  });

  RoomModel.hasOne(Terrain, {
    as: "terrain",
    foreignKey: "roomId",
    onDelete: "CASCADE",
  });

  Terrain.belongsTo(RoomModel, {
    foreignKey: "roomId",
  });

  Avatar.hasMany(ShopContainer, {
    as: "containers",
    foreignKey: "avatarId",
    onDelete: "RESTRICT",//nunca deleta pois se nao quem obteve vai ficar sem
    hooks: true
  });

  ShopContainer.belongsTo(Avatar, {
    foreignKey: "avatarId",
  });

  Avatar.hasMany(Texture, {
    as: "textures",
    foreignKey: "avatarId",
    onDelete: "RESTRICT",
    hooks: true
  });

  Texture.belongsTo(Avatar, {
    foreignKey: "avatarId",
    onDelete: "RESTRICT",
  });
  

  ShopContainer.hasMany(ShopItem, {
    as: "items",
    foreignKey: "containerId",
    onDelete: "CASCADE",
  });

  ShopItem.belongsTo(ShopContainer, {
    foreignKey: "containerId",
  });



const Profile = Avatar;
  return {
    Avatar,
    Profile,
    Inventory,
    Currency,
    CurrencyRegister,
    ShopContainer,
    ShopItem,
    Room,
    ObjectModel,
    Terrain,
    RoomModel,
    LayoutModel,
    Texture,

    Prefab,
    Server,
    Material,
    PrefabModel,
  };
};