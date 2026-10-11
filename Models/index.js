// models/index.js  (trecho relevante — o resto do arquivo continua igual)

const UserFactory = require("./social/User");
const ProfileFactory = require("./game/AvatarModel");
const LikeFactory = require("./social/Like");
const PostFactory = require("./social/Post");
const PhotoFactory = require("./social/Photo");
const CommentFactory = require("./social/Comment");
const ChatRoomFactory = require("./social/Chat");
const ChatMessageFactory = require("./social/ChatMessage");
const ChatParticipantFactory = require("./social/ChatParticipant");
const SystemAnnouncementFactory = require("./social/SystemAnnouncement");
const chatAssociations = require("./social/chatModels"); // <-- agora só associações, não recria models
const MatchProfileFactory = require("./social/MatchProfile");
const FriendFactory = require("./social/Friend");
const IgnoreFactory = require("./social/Ignore");
const FollowFactory = require("./social/Follow");
const FileInfoFactory = require("./social/FileInfo");
const GameModelsFactory = require("./game/index");

//pagamento

const {PaymentBankModel, PaymentWebHookModel, associatePaymentModels} = require("./bank/Payment_Bank");

module.exports = (sequelize) => {
  const PaymentBank = PaymentBankModel(sequelize);
  const PaymentWebHook = PaymentWebHookModel(sequelize);
  const User = UserFactory(sequelize);
  const RoomModel = require("./game/RoomModel")(sequelize);
  const Profile = ProfileFactory(sequelize);
  const Like = LikeFactory(sequelize);
  const Post = PostFactory(sequelize);
  const Photo = PhotoFactory(sequelize);
  const Comment = CommentFactory(sequelize);

  const ChatRoom = ChatRoomFactory(sequelize);
  const ChatMessage = ChatMessageFactory(sequelize);
  const ChatParticipant = ChatParticipantFactory(sequelize);
  const SystemAnnouncement = SystemAnnouncementFactory(sequelize);

  const MatchProfile = MatchProfileFactory(sequelize);
  const Friend = FriendFactory(sequelize);
  const Ignore = IgnoreFactory(sequelize);
  const Follow = FollowFactory(sequelize);
  const FileInfo = FileInfoFactory(sequelize);

  const GameModels = GameModelsFactory(sequelize);

  /*=====================================
    Relacionamentos
  =======================================*/
  associatePaymentModels(PaymentBank, PaymentWebHook);

  Post.hasMany(Like, { as: "likes", foreignKey: "postId", onDelete: "CASCADE", hooks: true });
  Post.hasMany(Photo, { as: "photos", foreignKey: "postId", onDelete: "CASCADE", hooks: true });
  Post.hasMany(Comment, { as: "comments", foreignKey: "postId", onDelete: "CASCADE", hooks: true });
  Post.belongsTo(Profile, { as: "profile", foreignKey: "profileId", onDelete: "CASCADE", hooks: true });

  Like.belongsTo(Post, { as: "post", foreignKey: "postId", onDelete: "CASCADE", hooks: true });
  Like.belongsTo(Photo, { as: "photo", foreignKey: "photoId", onDelete: "CASCADE", hooks: true });
  Like.belongsTo(Comment, { as: "comment", foreignKey: "commentId", onDelete: "CASCADE", hooks: true });
  Like.belongsTo(Profile, { as: "profile", foreignKey: "profileId", onDelete: "CASCADE", hooks: true });
  Like.belongsTo(RoomModel, { as: "room", foreignKey: "roomId", onDelete: "CASCADE", hooks: true });

  Comment.belongsTo(Post, { as: "post", foreignKey: "postId", onDelete: "CASCADE", hooks: true });
  Comment.belongsTo(Photo, { as: "photo", foreignKey: "photoId", onDelete: "CASCADE", hooks: true });
  Comment.belongsTo(Comment, { as: "comment", foreignKey: "commentId", onDelete: "CASCADE", hooks: true });
  Comment.belongsTo(Profile, { as: "profile", foreignKey: "profileId", onDelete: "CASCADE", hooks: true });

  Photo.belongsTo(Post, { as: "post", foreignKey: "postId", onDelete: "CASCADE", hooks: true });
  Photo.belongsTo(Comment, { as: "comment", foreignKey: "commentId", onDelete: "CASCADE", hooks: true });
  Photo.belongsTo(Profile, { as: "profile", foreignKey: "profileId", onDelete: "CASCADE", hooks: true });

  Friend.belongsTo(Profile, { as: "profile", foreignKey: "profileId", onDelete: "CASCADE", hooks: true });
  Ignore.belongsTo(Profile, { as: "profile", foreignKey: "profileId", onDelete: "CASCADE", hooks: true });
  Follow.belongsTo(Profile, { as: "profile", foreignKey: "profileId", onDelete: "CASCADE", hooks: true });

  MatchProfile.belongsTo(Profile, { as: "profile", foreignKey: "profileId", onDelete: "CASCADE", hooks: true });

  // associações de chat — precisa vir depois de Profile/ChatRoom/ChatMessage/ChatParticipant/SystemAnnouncement existirem
  chatAssociations({ Profile, ChatRoom, ChatMessage, ChatParticipant, SystemAnnouncement });

  return {
    PaymentBank,
    PaymentWebHook,
    User,
    Like,
    Post,
    Photo,
    Comment,
    ChatRoom,
    ChatMessage,
    ChatParticipant,
    SystemAnnouncement,
    MatchProfile,
    Friend,
    Ignore,
    Follow,
    FileInfo,
    ...GameModels,
  };
};