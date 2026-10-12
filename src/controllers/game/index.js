
const shop = require("./shop/shop_controller");

const roomController = require("./rooms_controllers"); //ok
const objectController = require("./roomObjects_controllers"); //ok
const materialController = require("./material_controller"); //ok
const clothController = require("./cloth_controllers"); //ok
const currencyController = require("./currency_controllers"); //ok
const currencyRegisterController = require("./currencyRegister_controller"); //ok
const outfitItemsController = require("./outfitItems_controllers"); //ok
const outfitController = require("./outfit_controller"); //ok
const prefabController = require("./prefab_controllers"); //ok
const serverController = require("./server_controller"); //ok
const textureController = require("./textureControllers"); //ok
const avatarController = require("./avatar/avatar_controller"); //ok
const avatarInventoryController = require("./avatar/inventoryCloth_controller.");
const TerrainController = require("./terrainController");

module.exports = {
  Shop: shop,
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
  Terrain: TerrainController,
};
