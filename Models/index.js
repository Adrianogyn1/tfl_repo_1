const UserFactory = require('./User');
const ProfileFactory = require('./social/Profile');
const LikeFactory = require('./social/Like');
const PostFactory = require('./social/Post');
const PhotoFactory = require('./social/Photo');
const CommentFactory = require('./social/Comment');
const ChatRoomFactory = require('./social/ChatRoom');
const ChatMessageFactory = require('./social/ChatMessage');
const MatchProfileFactory = require('./social/MatchProfile');
const FriendFactory = require('./social/Friend');
const IgnoreFactory = require('./social/Ignore');
const FollowFactory = require('./Follow');
const FileInfoFactory = require('./social/FileInfo');
// Importa a factory do game aqui fora
const GameModelsFactory = require('./game/index');

module.exports = (sequelize) => {
    const User = UserFactory(sequelize);
    const Profile = ProfileFactory(sequelize);
    const Like = LikeFactory(sequelize);
    const Post = PostFactory(sequelize);
    const Photo = PhotoFactory(sequelize);
    const Comment = CommentFactory(sequelize);
    const ChatRoom = ChatRoomFactory(sequelize);
    const ChatMessage = ChatMessageFactory(sequelize);
    const MatchProfile = MatchProfileFactory(sequelize);
    const Friend = FriendFactory(sequelize);
    const Ignore = IgnoreFactory(sequelize);
    const Follow = FollowFactory(sequelize);
    const FileInfo = FileInfoFactory(sequelize);
    
    // Executa a factory passando o sequelize para gerar os modelos do jogo
    const GameModels = GameModelsFactory(sequelize);
  
    return {
        User,
        Profile,
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
        ...GameModels // Agora sim, espalha os modelos gerados
    };
};