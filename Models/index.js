const UserFactory = require("./social/User");
const ProfileFactory = require("./game/AvatarModel");
const LikeFactory = require("./social/Like");
const PostFactory = require("./social/Post");
const PhotoFactory = require("./social/Photo");
const CommentFactory = require("./social/Comment");
const ChatRoomFactory = require("./social/ChatRoom");
const ChatMessageFactory = require("./social/ChatMessage");
const MatchProfileFactory = require("./social/MatchProfile");
const FriendFactory = require("./social/Friend");
const IgnoreFactory = require("./social/Ignore");
const FollowFactory = require("./social/Follow");
const FileInfoFactory = require("./social/FileInfo");
// Importa a factory do game aqui fora
const GameModelsFactory = require("./game/index");

module.exports = (sequelize) => {
  const User = UserFactory(sequelize); //usuario
  const RoomModel = require("./game/RoomModel")(sequelize);
  const Profile = ProfileFactory(sequelize); //relação um usuario pode ter varios perfis
  const Like = LikeFactory(sequelize); //relação todos esses pode receber like [user, perfil, post, photo, comment]
  const Post = PostFactory(sequelize); //relação um perfil pode ter varios postes
  const Photo = PhotoFactory(sequelize); //relação perfil e post pode ter varias fotos [perfil,post]
  const Comment = CommentFactory(sequelize); //relação todos esses recebe comentarios [user,post,comment,photo,perfil]
  const ChatRoom = ChatRoomFactory(sequelize); //relação containes de chat, relaciona com perfil
  const ChatMessage = ChatMessageFactory(sequelize); //relação histórico de mensagens
  const MatchProfile = MatchProfileFactory(sequelize); //relação o perfil pode ter varios matches
  const Friend = FriendFactory(sequelize); //relação o perfil pode ter varios amigos
  const Ignore = IgnoreFactory(sequelize); //relação o perfil pode ter varios ignorados
  const Follow = FollowFactory(sequelize); //relação o perfil pode ter varios seguidores

  const FileInfo = FileInfoFactory(sequelize); //app controller

  // Executa a factory passando o sequelize para gerar os modelos do jogo
  const GameModels = GameModelsFactory(sequelize);

  /*=====================================
    Relacionamentos
  =======================================*/


  Post.hasMany(Like, { as: "likes", foreignKey: "postId", onDelete: "CASCADE", hooks: true });
  Post.hasMany(Photo, { as: "photos", foreignKey: "postId", onDelete: "CASCADE", hooks: true });
  Post.hasMany(Comment, { as: "comments", foreignKey: "postId", onDelete: "CASCADE", hooks: true });
  //Post.belongsTo(User, { as: "user", foreignKey: "userId", onDelete: "CASCADE", hooks: true });
  Post.belongsTo(Profile, { as: "profile", foreignKey: "profileId", onDelete: "CASCADE", hooks: true });

  //Like.belongsTo(User, { as: "user", foreignKey: "userId", onDelete: "CASCADE", hooks: true });
  Like.belongsTo(Post, { as: "post", foreignKey: "postId", onDelete: "CASCADE", hooks: true });
  Like.belongsTo(Photo, { as: "photo", foreignKey: "photoId", onDelete: "CASCADE", hooks: true });
  Like.belongsTo(Comment, { as: "comment", foreignKey: "commentId", onDelete: "CASCADE", hooks: true });
  Like.belongsTo(Profile, { as: "profile", foreignKey: "profileId", onDelete: "CASCADE", hooks: true });
  Like.belongsTo(RoomModel, { as: "room", foreignKey: "roomId", onDelete: "CASCADE", hooks: true });
  //Comment.belongsTo(User, { as: "user", foreignKey: "userId", onDelete: "CASCADE", hooks: true });
  Comment.belongsTo(Post, { as: "post", foreignKey: "postId", onDelete: "CASCADE", hooks: true });
  Comment.belongsTo(Photo, { as: "photo", foreignKey: "photoId", onDelete: "CASCADE", hooks: true });
  Comment.belongsTo(Comment, { as: "comment", foreignKey: "commentId", onDelete: "CASCADE", hooks: true });
  Comment.belongsTo(Profile, { as: "profile", foreignKey: "profileId", onDelete: "CASCADE", hooks: true });

  //Photo.belongsTo(User, { as: "user", foreignKey: "userId", onDelete: "CASCADE", hooks: true });
  Photo.belongsTo(Post, { as: "post", foreignKey: "postId", onDelete: "CASCADE", hooks: true });
  Photo.belongsTo(Comment, { as: "comment", foreignKey: "commentId", onDelete: "CASCADE", hooks: true });
  Photo.belongsTo(Profile, { as: "profile", foreignKey: "profileId", onDelete: "CASCADE", hooks: true });

  ChatRoom.belongsTo(Profile, { as: "profile", foreignKey: "profileId", onDelete: "CASCADE", hooks: true });
  ChatRoom.hasMany(ChatMessage, { as: "messages", foreignKey: "chatRoomId", onDelete: "CASCADE", hooks: true });
  
  ChatMessage.belongsTo(ChatRoom, { as: "chatRoom", foreignKey: "chatRoomId", onDelete: "CASCADE", hooks: true });
  //ChatMessage.belongsTo(Profile, { as: "sender", foreignKey: "profileId", onDelete: "CASCADE", hooks: true });

  //friends
 // Friend.belongsTo(User, { as: "user", foreignKey: "userId", onDelete: "CASCADE", hooks: true });
  Friend.belongsTo(Profile, { as: "profile", foreignKey: "profileId", onDelete: "CASCADE", hooks: true });
 // Ignore.belongsTo(User, { as: "user", foreignKey: "userId", onDelete: "CASCADE", hooks: true });
  Ignore.belongsTo(Profile, { as: "profile", foreignKey: "profileId", onDelete: "CASCADE", hooks: true });
 // Follow.belongsTo(User, { as: "user", foreignKey: "userId", onDelete: "CASCADE", hooks: true });
  Follow.belongsTo(Profile, { as: "profile", foreignKey: "profileId", onDelete: "CASCADE", hooks: true });
  //matchs
  MatchProfile.belongsTo(Profile, { as: "profile", foreignKey: "profileId", onDelete: "CASCADE", hooks: true });
 // MatchProfile.belongsTo(User, { as: "user", foreignKey: "userId", onDelete: "CASCADE", hooks: true });



  return {
    User,
    Like,
    Post,
    Photo,
    Comment,
    ChatRoom,
    ChatMessage,
    MatchProfile,
    Friend,
    Ignore,
    Follow,
    FileInfo,
    ...GameModels,
  };
};