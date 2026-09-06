"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      userName: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      avatar: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      online: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: false,
      },
      login: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      age: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      token: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      roomId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      avatarId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      currencyId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      role: {
        type: Sequelize.ENUM,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "player",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("profiles", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      userName: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      avatar: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
      },
    });

    await queryInterface.createTable("likes", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      postId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      photoId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      commentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      profileId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      roomId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      type: {
        type: Sequelize.ENUM,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "like",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
      },
    });

    await queryInterface.createTable("posts", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
      },
    });

    await queryInterface.createTable("photos", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      postId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: null,
      },
      url: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("comments", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      postId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      photoId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      commentId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      text: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("chat_rooms", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
      },
      istyping: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      users: {
        type: Sequelize.JSON,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: [],
      },
      messages: {
        type: Sequelize.JSON,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: [],
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("chat_messages", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      fileurl: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      chatId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      seen: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: false,
      },
      hasFile: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: false,
      },
      hasImage: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: false,
      },
      hasVideo: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: false,
      },
      hasAudio: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: false,
      },
      hasLink: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("match_profiles", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      userid: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      bio: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      avatar: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      photos: {
        type: Sequelize.JSON,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: [],
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("friends", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      userid: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      targetid: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "pending",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("ignores", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      userid: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      targetid: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("follows", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      userid: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      targetid: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("file_infos", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      hash: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      url: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      token: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      inCdn: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: false,
      },
      publicId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      target_uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("clothes", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      objectId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      path: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      addressable: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      slot: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      gender: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      isNude: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: false,
      },
      materialId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      thumbnail: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("outfits", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      thumbnail: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      tags: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      inventoryID: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("outfit_items", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      visible: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: false,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      prefabId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      outfitId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("currencies", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      value: {
        type: Sequelize.FLOAT,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("servers", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      pid: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      roomId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      ip: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      port: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      token: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      maxPlayers: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 30,
      },
      playersCount: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      scene: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      language: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      target_uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("textures", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      path: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      hash: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      extension: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      url: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      inventoryID: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("materiais", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      objectId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      color: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      channel: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "diffuse",
      },
      shader: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      obj_uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      textures: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      values: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      inventoryID: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("room_objects", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      data: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
      },
      ownnerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      layoutId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      materialId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      roomId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
      },
      thumbnail: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
      },
      addressable: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
      },
      position: {
        type: Sequelize.JSON,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {
          x: 0,
          y: 0,
          z: 0,
        },
      },
      rotation: {
        type: Sequelize.JSON,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {
          x: 0,
          y: 0,
          z: 0,
        },
      },
      scale: {
        type: Sequelize.JSON,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {
          x: 1,
          y: 1,
          z: 1,
        },
      },
      uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("terrains", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      target_uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      path: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      hash: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      trees: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      detais: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      materials: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("rooms", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      link: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      maxPlayers: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 30,
      },
      playersCount: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      scene: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      isPrivate: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: false,
      },
      visits: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      entryValue: {
        type: Sequelize.FLOAT,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      thumbnail: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      ownnerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      layoutId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      inventoryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      target_uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      requestOnlineData: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: false,
      },
      size: {
        type: Sequelize.FLOAT,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 1,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
    });

    await queryInterface.createTable("room_layouts", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      data: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("prefabs", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      addressable: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      materialId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      path: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      thumbnail: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      version: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      data: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      type: {
        type: Sequelize.ENUM,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "Otters",
      },
      slot: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("currency_register", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
      },
      type: {
        type: Sequelize.ENUM,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "None",
      },
      transactionType: {
        type: Sequelize.ENUM,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "None",
      },
      value: {
        type: Sequelize.FLOAT,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      target_uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("avatars", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      data: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      height: {
        type: Sequelize.FLOAT,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      gender: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      material_id: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      inventoryID: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      postId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      thumbnail: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      online: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      lastSeen: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      bones: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      blendShapes: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      slots: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      currentRoom: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "",
      },
      uid: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
    });

    await queryInterface.createTable("shop_containers", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      onnerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      model: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: "container",
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
      },
      price: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
      },
      thumb: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
      },
      sales: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
      },
    });

    await queryInterface.createTable("item_resources", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
      },
      containerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
      },
      model: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
      },
      slot: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
      },
      shader: {
        type: Sequelize.STRING,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
      },
      values: {
        type: Sequelize.JSON,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      colors: {
        type: Sequelize.JSON,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      ints: {
        type: Sequelize.JSON,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      bools: {
        type: Sequelize.JSON,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      strings: {
        type: Sequelize.JSON,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      vectors: {
        type: Sequelize.JSON,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      textures_paths: {
        type: Sequelize.JSON,
        allowNull: true,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: {},
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("item_resources");

    await queryInterface.dropTable("shop_containers");

    await queryInterface.dropTable("avatars");

    await queryInterface.dropTable("currency_register");

    await queryInterface.dropTable("prefabs");

    await queryInterface.dropTable("room_layouts");

    await queryInterface.dropTable("rooms");

    await queryInterface.dropTable("terrains");

    await queryInterface.dropTable("room_objects");

    await queryInterface.dropTable("materiais");

    await queryInterface.dropTable("textures");

    await queryInterface.dropTable("servers");

    await queryInterface.dropTable("currencies");

    await queryInterface.dropTable("outfit_items");

    await queryInterface.dropTable("outfits");

    await queryInterface.dropTable("clothes");

    await queryInterface.dropTable("file_infos");

    await queryInterface.dropTable("follows");

    await queryInterface.dropTable("ignores");

    await queryInterface.dropTable("friends");

    await queryInterface.dropTable("match_profiles");

    await queryInterface.dropTable("chat_messages");

    await queryInterface.dropTable("chat_rooms");

    await queryInterface.dropTable("comments");

    await queryInterface.dropTable("photos");

    await queryInterface.dropTable("posts");

    await queryInterface.dropTable("likes");

    await queryInterface.dropTable("profiles");

    await queryInterface.dropTable("users");
  },
};
