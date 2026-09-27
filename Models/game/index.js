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
const ApplyAssociations = require("./associations"); // Arquivo separado de associações

module.exports = (sequelize) => {
  const User = UserFactory(sequelize);
  const Avatar = AvatarModelFactory(sequelize);
  const Inventory = InventoryFactory(sequelize);
  const AvatarOutfit = AvatarOutfitFactory(sequelize);
  const AvatarOutfitStyle = AvatarOutfitStyleFactory(sequelize);
  const ShopItem = ShopItemFactory(sequelize);
  const ShopContainer = ShopContainerFactory(sequelize);
  const RoomModel = RoomModelFactory(sequelize);
  const ObjectModel = ObjectModelFactory(sequelize);
  const Terrain = TerrainFactory(sequelize);
  const LayoutModel = LayoutFactory(sequelize);
  const Texture = TextureFactory(sequelize);
  const Material = MateriaModelFactory(sequelize);
  const Currency = CurrencyFactory(sequelize);
  const CurrencyRegister = CurrencyRegisterFactory(sequelize);

  const PrefabModel = PrefabModelFactory(sequelize);
  const Prefab = PrefabFactory(sequelize);
  const Room = RoomFactory(sequelize);
  const Server = ServerFactory(sequelize);

  const models = {
    User,
    Avatar,
    Inventory,
    AvatarOutfit,
    AvatarOutfitStyle,
    ShopItem,
    ShopContainer,
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
    Currency,
    CurrencyRegister,
  };

  ApplyAssociations(models);

  const Profile = Avatar;
  return models;
};