const roomController = require('./roomsControllers'); //ok
const objectController = require('./roomObjectsControllers');//ok
const materialController = require('./materialController');//ok
const clothController = require('./clothControllers');//ok
const currencyController = require('./currencyControllers');//ok
const currencyRegisterController = require('./currencyRegisterController');//ok
const outfitItemsController = require('./outfitItemsControllers');//ok
const outfitController = require('./outfitController');//ok
const prefabController = require('./prefabControllers');//ok
const serverController = require('./serverController');//ok
const textureController = require('./textureControllers');//ok
const avatarController = require('./avatarController');//ok
const TerrainController = require('./terrainController');

module.exports = {
    Avatar: avatarController,
    Room: roomController,
    Object: objectController,
    Material: materialController,
    Cloth: clothController,
    Currency: currencyController,
    CurrencyRegister: currencyRegisterController,
    OutfitItems: outfitItemsController,
    Outfit: outfitController,
    Prefab: prefabController,
    Server: serverController,
    Texture: textureController,
    Terrain: TerrainController
};