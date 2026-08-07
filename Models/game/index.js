const ClothFactory = require('./ClothModel');
const OutfitFactory = require('./OutfitModel');
const OutfitItemsFactory = require('./OutfitItems');
const CurrencyFactory = require('./CurrencyModel');
const CurrencyRegisterFactory = require('./CurrencyRegister');
const PrefabFactory = require('./PrefabModel');
const RoomFactory = require('./RoomModel');
const LayoutFactory = require('./RoomLayout');
const ServerFactory = require('./ServerModel');
const TextureFactory = require('./TextureModel');
const MateriaModelFactory = require('./MateriaModel');
const ObjectModelFactory = require('./ObjectModel');
const TerrainFactory = require('./TerrainModel');
const RoomModelFactory = require('./RoomModel');
const PrefabModelFactory = require('./PrefabModel');
const AvatarModelFactory = require('./AvatarModel');
const { Material } = require('../../repository');

module.exports = (sequelize) => {
    const Cloth = ClothFactory(sequelize);
    const Outfit = OutfitFactory(sequelize);
    const OutfitItems = OutfitItemsFactory(sequelize);
    const Currency = CurrencyFactory(sequelize);
    const Prefab = PrefabFactory(sequelize);
    const Room = RoomFactory(sequelize);
    const Server = ServerFactory(sequelize);
    const Texture = TextureFactory(sequelize);
    const Material = MateriaModelFactory(sequelize);
    const ObjectModel = ObjectModelFactory(sequelize);
    const Terrain = TerrainFactory(sequelize);
    const RoomModel = RoomModelFactory(sequelize);
    const LayoutModel = LayoutFactory(sequelize);
    const PrefabModel = PrefabModelFactory(sequelize);
    const CurrencyRegister = CurrencyRegisterFactory(sequelize);
    const Avatar = AvatarModelFactory(sequelize);

    return {
        Avatar,
        Cloth,
        Outfit,
        OutfitItems,
        Currency,
        Prefab,
        Room,
        Server,
        Texture,
        Material,
        ObjectModel,
        Terrain,
        RoomModel,
        LayoutModel,
        PrefabModel,
        CurrencyRegister,
    };
};