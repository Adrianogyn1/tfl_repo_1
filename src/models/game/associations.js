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
    Like,
  } = models;

  User.hasMany(Avatar, { foreignKey: "userId", constraints: false });
  Avatar.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
    constraints: false,
  });

  Avatar.hasMany(Inventory, {
    as: "inventory",
    foreignKey: "avatarId",
    constraints: false,
  });
  Inventory.belongsTo(Avatar, {
    foreignKey: "avatarId",
    as: "avatar",
    constraints: false,
  });

  // Associa o item do inventário ao Produto da Loja 3D (ShopContainer)
  Inventory.belongsTo(ShopContainer, {
    foreignKey: "itemId",
    as: "shopItem",
    constraints: false,
  });
  ShopContainer.hasMany(Inventory, {
    foreignKey: "itemId",
    as: "ownedInstances",
    constraints: false,
  });

  Avatar.hasMany(AvatarOutfit, {
    as: "outfits",
    foreignKey: "avatarId",
    constraints: false,
  });
  AvatarOutfit.belongsTo(Avatar, {
    foreignKey: "avatarId",
    as: "avatar",
    constraints: false,
  });
  AvatarOutfit.belongsTo(ShopContainer, {
    foreignKey: "itemId",
    as: "shopItem",
    constraints: false,
  });

  Avatar.hasMany(AvatarOutfitStyle, {
    as: "styles",
    foreignKey: "avatarId",
    constraints: false,
  });
  AvatarOutfitStyle.belongsTo(Avatar, {
    foreignKey: "avatarId",
    as: "avatar",
    constraints: false,
  });

  if (models.AvatarCareer) {
    Avatar.hasMany(models.AvatarCareer, {
      as: "careers",
      foreignKey: "avatarId",
      constraints: false,
    });
    models.AvatarCareer.belongsTo(Avatar, {
      foreignKey: "avatarId",
      as: "avatar",
      constraints: false,
    });
  }

  Avatar.hasOne(Currency, {
    as: "wallet",
    foreignKey: "avatarId",
    constraints: false,
  });
  Currency.belongsTo(Avatar, {
    foreignKey: "avatarId",
    as: "avatar",
    constraints: false,
  });

  Currency.hasMany(CurrencyRegister, {
    as: "registers",
    foreignKey: "currencyId",
    constraints: false,
  });
  CurrencyRegister.belongsTo(Currency, {
    foreignKey: "currencyId",
    as: "currency",
    constraints: false,
  });

  if (models.CoinOrder) {
    Avatar.hasMany(models.CoinOrder, {
      as: "coinOrders",
      foreignKey: "avatarId",
      constraints: false,
    });
    models.CoinOrder.belongsTo(Avatar, {
      foreignKey: "avatarId",
      as: "avatar",
      constraints: false,
    });
  }

  Avatar.hasMany(ShopContainer, {
    as: "containers",
    foreignKey: "avatarId",
    constraints: false,
  });
  ShopContainer.belongsTo(Avatar, {
    foreignKey: "avatarId",
    as: "avatar",
    constraints: false,
  });

  Avatar.hasMany(Texture, {
    as: "textures",
    foreignKey: "avatarId",
    constraints: false,
  });
  Texture.belongsTo(Avatar, {
    foreignKey: "avatarId",
    as: "avatar",
    constraints: false,
  });

  ShopContainer.hasMany(ShopItem, {
    as: "items",
    foreignKey: "containerId",
    constraints: false,
  });
  ShopItem.belongsTo(ShopContainer, {
    foreignKey: "containerId",
    as: "container",
    constraints: false,
  });

  Avatar.hasMany(RoomModel, {
    foreignKey: "avatarId",
    as: "rooms",
    constraints: false,
  });
  RoomModel.belongsTo(Avatar, {
    foreignKey: "avatarId",
    as: "avatar",
    constraints: false,
  });

  RoomModel.hasMany(models.ObjectModel, {
    foreignKey: "roomId",
    as: "objects",
    constraints: false,
  });

  models.ObjectModel.belongsTo(RoomModel, {
    foreignKey: "roomId",
    as: "room",
    constraints: false,
  });

  RoomModel.hasOne(models.Terrain, {
    foreignKey: "roomId",
    as: "terrain",
    constraints: false,
  });

  models.Terrain.belongsTo(RoomModel, {
    foreignKey: "roomId",
    as: "room",
    constraints: false,
  });

  if (Like) {
    RoomModel.hasMany(Like, {
      as: "likes",
      foreignKey: "roomId",
      constraints: false,
    });
  }

  if (models.Server) {
    RoomModel.hasMany(models.Server, {
      as: "servers",
      foreignKey: "roomId",
      constraints: false,
    });
    models.Server.belongsTo(RoomModel, {
      as: "room",
      foreignKey: "roomId",
      constraints: false,
    });
  }

  if (models.MiniAdCampaign) {
    Avatar.hasMany(models.MiniAdCampaign, {
      as: "adCampaigns",
      foreignKey: "avatarId",
      constraints: false,
    });
    models.MiniAdCampaign.belongsTo(Avatar, {
      as: "advertiser",
      foreignKey: "avatarId",
      constraints: false,
    });
  }
};