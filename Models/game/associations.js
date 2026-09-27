module.exports = (models) => {
  const {
    User,
    Avatar,
    Inventory,
    AvatarOutfit,
    AvatarOutfitStyle,
    ShopItem,
    ShopContainer,
    RoomModel,
    Currency,
    CurrencyRegister,
    Texture,
    Like
  } = models;

  User.hasMany(Avatar, { foreignKey: "userId" });
  Avatar.belongsTo(User, {
    foreignKey: "userId",
    as : "user",
    onDelete: "CASCADE",
  });

  Avatar.hasMany(Inventory, {
    as: "inventory",
    foreignKey: "avatarId",
    onDelete: "CASCADE",
  });
  Inventory.belongsTo(Avatar, {
    foreignKey: "avatarId",
    as : "avatar",
  });

  Avatar.hasMany(AvatarOutfit, {
    as: "outfits",
    foreignKey: "avatarId",
    onDelete: "CASCADE",
  });
  AvatarOutfit.belongsTo(Avatar, {
    foreignKey: "avatarId",
    as : "avatar",
  });

  Avatar.hasMany(AvatarOutfitStyle, {
    as: "styles",
    foreignKey: "avatarId",
    onDelete: "CASCADE",
  });
  AvatarOutfitStyle.belongsTo(Avatar, {
    foreignKey: "avatarId",
    as : "avatar",
  });

  Avatar.hasOne(Currency, {
    as: "wallet",
    foreignKey: "avatarId",
    onDelete: "CASCADE",
  });
  Currency.belongsTo(Avatar, {
    foreignKey: "avatarId",
    as : "avatar",
  });

  Currency.hasMany(CurrencyRegister, {
    as: "registers",
    foreignKey: "currencyId",
    onDelete: "CASCADE",
  });
  CurrencyRegister.belongsTo(Currency, {
    foreignKey: "currencyId",
    as : "currency",
  });

  Avatar.hasMany(ShopContainer, {
    as: "containers",
    foreignKey: "avatarId",
    onDelete: "RESTRICT",
    hooks: true,
  });
  ShopContainer.belongsTo(Avatar, {
    foreignKey: "avatarId",
    as : "avatar",
  });

  Avatar.hasMany(Texture, {
    as: "textures",
    foreignKey: "avatarId",
    onDelete: "RESTRICT",
    hooks: true,
  });
  Texture.belongsTo(Avatar, {
    foreignKey: "avatarId",
    as : "avatar",
    onDelete: "RESTRICT",
  });

  ShopContainer.hasMany(ShopItem, {
    as: "items",
    foreignKey: "containerId",
    onDelete: "CASCADE",
  });
  ShopItem.belongsTo(ShopContainer, {
    foreignKey: "containerId",
    as : "container",
  });

  models.RoomModel.belongsTo(models.Avatar, {
    foreignKey: "avatarId",
    as : "avatar",
  });

  models.RoomModel.hasMany(models.ObjectModel, {
    foreignKey: "roomId",
    as : "objects",
    onDelete: "CASCADE",
  });

  models.ObjectModel.belongsTo(models.RoomModel, {
    foreignKey: "roomId",
    as : "room",
  });

  models.RoomModel.hasOne(models.Terrain, {
    foreignKey: "roomId",
    as : "terrain",
    onDelete: "CASCADE",
  });

  models.Terrain.belongsTo(models.RoomModel, {
    foreignKey: "roomId",
    as : "room",
  });

  if (Like) {
    models.RoomModel.hasMany(Like, {
      as: "likes",
      foreignKey: "roomId",
      onDelete: "CASCADE",
    });
  }
};