const UserFactory = require("../social/User.js");
const CurrencyFactory = require("./CurrencyModel.js");
const CurrencyRegisterFactory = require("./CurrencyRegister.js");
const PrefabFactory = require("./PrefabModel.js");
const RoomFactory = require("./RoomModel.js");
const LayoutFactory = require("./RoomLayout.js");
const ServerFactory = require("./ServerModel.js");
const TextureFactory = require("./TextureModel.js");
const MateriaModelFactory = require("./MateriaModel.js");
const ObjectModelFactory = require("./ObjectModel.js");
const TerrainFactory = require("./TerrainModel.js");
const RoomModelFactory = require("./RoomModel.js");
const PrefabModelFactory = require("./PrefabModel.js");

const AvatarModelFactory = require("./AvatarModel.js");
const AvatarOutfitFactory = require("./AvatarOutfit.js");
const AvatarOutfitStyleFactory = require("./AvatarOutfitStyle.js");
const InventoryFactory = require("./inventory.js");

const ShopItemFactory = require("./ShopItemModel.js");
const ShopContainerFactory = require("./ShopContainer.js");
const ApplyAssociations = require("./associations.js"); // Arquivo separado de associações

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
  const CoinOrderFactory = require("./CoinOrderModel.js");
  const CoinOrder = CoinOrderFactory(sequelize);
  const EconomyRuleFactory = require("./EconomyRuleModel.js");
  const EconomyRule = EconomyRuleFactory(sequelize);
  const AvatarCareerFactory = require("./AvatarCareerModel.js");
  const AvatarCareer = AvatarCareerFactory(sequelize);
  const GameSessionContractFactory = require("./GameSessionContract.js");
  const GameSessionContract = GameSessionContractFactory(sequelize);
  const MiniAdCampaignFactory = require("./MiniAdCampaign.js");
  const MiniAdCampaign = MiniAdCampaignFactory(sequelize);
  const MiniAdImpressionFactory = require("./MiniAdImpression.js");
  const MiniAdImpression = MiniAdImpressionFactory(sequelize);

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
    CoinOrder,
    EconomyRule,
    AvatarCareer,
    GameSessionContract,
    MiniAdCampaign,
    MiniAdImpression,
  };

  ApplyAssociations(models);

  const Profile = Avatar;
  return models;
};