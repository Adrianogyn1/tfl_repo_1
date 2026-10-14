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
const MiniReelFactory = require("./social/MiniReel");
const GameModelsFactory = require("./game/index");

//pagamento

const {PaymentBankModel, PaymentWebHookModel, associatePaymentModels} = require("./bank/Payment_Bank");
const PlatformOperationalExpenseFactory = require("./bank/PlatformOperationalExpense");

module.exports = (sequelize) => {
  const PaymentBank = PaymentBankModel(sequelize);
  const PaymentWebHook = PaymentWebHookModel(sequelize);
  const PlatformOperationalExpense = PlatformOperationalExpenseFactory(sequelize);
  const User = UserFactory(sequelize);
  const RoomModel = require("./game/RoomModel")(sequelize);
  const Profile = ProfileFactory(sequelize);
  const Like = LikeFactory(sequelize);
  const Post = PostFactory(sequelize);
  const Photo = PhotoFactory(sequelize);
  const Comment = CommentFactory(sequelize);
  const MiniReel = MiniReelFactory(sequelize);

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

  Post.hasMany(Like, { as: "likes", foreignKey: "postId", constraints: false });
  Post.hasMany(Photo, { as: "photos", foreignKey: "postId", constraints: false });
  Post.hasMany(Comment, { as: "comments", foreignKey: "postId", constraints: false });
  Post.belongsTo(Profile, { as: "profile", foreignKey: "profileId", constraints: false });
  Post.belongsTo(RoomModel, { as: "room", foreignKey: "roomId", constraints: false });
  Post.belongsTo(Post, { as: "sharedPost", foreignKey: "sharedPostId", constraints: false });

  Like.belongsTo(Post, { as: "post", foreignKey: "postId", constraints: false });
  Like.belongsTo(Photo, { as: "photo", foreignKey: "photoId", constraints: false });
  Like.belongsTo(Comment, { as: "comment", foreignKey: "commentId", constraints: false });
  Like.belongsTo(Profile, { as: "profile", foreignKey: "profileId", constraints: false });
  Like.belongsTo(Profile, { as: "targetProfile", foreignKey: "targetProfileId", constraints: false });
  Like.belongsTo(RoomModel, { as: "room", foreignKey: "roomId", constraints: false });
  Like.belongsTo(MiniReel, { as: "reel", foreignKey: "reelId", constraints: false });

  Comment.belongsTo(Post, { as: "post", foreignKey: "postId", constraints: false });
  Comment.belongsTo(Photo, { as: "photo", foreignKey: "photoId", constraints: false });
  Comment.belongsTo(Comment, { as: "comment", foreignKey: "commentId", constraints: false });
  Comment.belongsTo(MiniReel, { as: "reel", foreignKey: "reelId", constraints: false });
  Comment.hasMany(Comment, { as: "replies", foreignKey: "commentId", constraints: false });
  Comment.hasMany(Like, { as: "likes", foreignKey: "commentId", constraints: false });
  Comment.belongsTo(Profile, { as: "profile", foreignKey: "profileId", constraints: false });

  Photo.belongsTo(Post, { as: "post", foreignKey: "postId", constraints: false });
  Photo.belongsTo(Comment, { as: "comment", foreignKey: "commentId", constraints: false });
  Photo.belongsTo(Profile, { as: "profile", foreignKey: "profileId", constraints: false });
  Photo.hasMany(Like, { as: "likes", foreignKey: "photoId", constraints: false });
  Photo.hasMany(Comment, { as: "comments", foreignKey: "photoId", constraints: false });

  MiniReel.belongsTo(Profile, { as: "profile", foreignKey: "profileId", constraints: false });
  MiniReel.hasMany(Like, { as: "likes", foreignKey: "reelId", constraints: false });
  MiniReel.hasMany(Comment, { as: "comments", foreignKey: "reelId", constraints: false });

  Friend.belongsTo(Profile, { as: "profile", foreignKey: "profileId", constraints: false });
  Friend.belongsTo(Profile, { as: "targetProfile", foreignKey: "targetProfileId", constraints: false });
  Ignore.belongsTo(Profile, { as: "profile", foreignKey: "profileId", constraints: false });
  Follow.belongsTo(Profile, { as: "profile", foreignKey: "profileId", constraints: false });
  Follow.belongsTo(Profile, { as: "targetProfile", foreignKey: "targetProfileId", constraints: false });

  MatchProfile.belongsTo(Profile, { as: "profile", foreignKey: "profileId", constraints: false });
  MatchProfile.belongsTo(Profile, { as: "targetProfile", foreignKey: "targetProfileId", constraints: false });

  // associações de chat — precisa vir depois de Profile/ChatRoom/ChatMessage/ChatParticipant/SystemAnnouncement existirem
  chatAssociations({ Profile, ChatRoom, ChatMessage, ChatParticipant, SystemAnnouncement });

  return {
    PaymentBank,
    PaymentWebHook,
    PlatformOperationalExpense,
    User,
    Profile,
    Like,
    Post,
    Photo,
    Comment,
    MiniReel,
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