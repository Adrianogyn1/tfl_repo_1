// models/social/chatModels.js
//
// Diferente dos outros arquivos de "Factory", este NÃO cria um model novo.
// Ele recebe os models de chat já instanciados (pelo próprio index.js) e o
// Profile já existente, e só declara as associações entre eles.
//
// Chame isso no index.js DEPOIS de já ter criado ChatRoom, ChatMessage,
// ChatParticipant e SystemAnnouncement — veja o trecho de index.js sugerido
// junto com este arquivo.

module.exports = ({ Profile, ChatRoom, ChatMessage, ChatParticipant, SystemAnnouncement }) => {
  // ChatRoom 1---N ChatMessage
  ChatRoom.hasMany(ChatMessage, { as: "messages", foreignKey: "chatId", onDelete: "CASCADE", hooks: true });
  ChatMessage.belongsTo(ChatRoom, { as: "chat", foreignKey: "chatId" });

  // ChatRoom 1---N ChatParticipant
  ChatRoom.hasMany(ChatParticipant, { as: "participants", foreignKey: "chatId", onDelete: "CASCADE", hooks: true });
  ChatParticipant.belongsTo(ChatRoom, { as: "chat", foreignKey: "chatId" });

  // Profile 1---N ChatParticipant (um profile participa de vários chats)
  Profile.hasMany(ChatParticipant, { as: "chatParticipations", foreignKey: "profileId", constraints: false });
  ChatParticipant.belongsTo(Profile, { as: "profile", foreignKey: "profileId", constraints: false });

  // Profile 1---N ChatMessage (um profile envia várias mensagens)
  Profile.hasMany(ChatMessage, { as: "chatMessages", foreignKey: "profileId", constraints: false });
  ChatMessage.belongsTo(Profile, { as: "sender", foreignKey: "profileId", constraints: false });

  // ChatRoom N---N Profile via ChatParticipant (atalho: chat.getProfiles() / profile.getChats())
  ChatRoom.belongsToMany(Profile, { through: ChatParticipant, as: "profiles", foreignKey: "chatId", otherKey: "profileId", constraints: false });
  Profile.belongsToMany(ChatRoom, { through: ChatParticipant, as: "chats", foreignKey: "profileId", otherKey: "chatId", constraints: false });

  // SystemAnnouncement pode opcionalmente pertencer a um ChatRoom (scope='chat')
  ChatRoom.hasMany(SystemAnnouncement, { as: "announcements", foreignKey: "chatId" });
  SystemAnnouncement.belongsTo(ChatRoom, { as: "chat", foreignKey: "chatId" });

  // Profile pode ser autor de um anúncio (createdBy)
  Profile.hasMany(SystemAnnouncement, { as: "createdAnnouncements", foreignKey: "createdBy", constraints: false });
  SystemAnnouncement.belongsTo(Profile, { as: "creator", foreignKey: "createdBy", constraints: false });
};
