const { Op } = require('sequelize');
const repo = require('../repository.js'); // Ajuste o caminho se necessário
const axios = require('axios');

async function seedDatabase() {
    var userCount = await repo.User.count();
    if(userCount > 0){
        return;
    }
    try {
        console.log('⏳ Sincronizando banco de dados...');
        await repo.sequelize.sync({ alter: true });

        console.log('🌐 Buscando usuários da DummyJSON...');
        const response = await fetch('https://dummyjson.com/users?limit=500');
        const data = await response.json();

        if (!data.users || data.users.length === 0) {
            throw new Error('Nenhum usuário retornado da API.');
        }

        console.log(`🤖 Tratando ${data.users.length} usuários para o formato do sistema...`);
        
        const placeholders = data.users.map(dummyUser => {
            return {
                userName: `${dummyUser.firstName} ${dummyUser.lastName}`,
                avatar: dummyUser.image,
                online: Math.random() > 0.5,
                login: dummyUser.username,
                password: dummyUser.password,
                age: String(dummyUser.age),
                token: repo.User.newToken(),
                email: dummyUser.email,
                roomId: '',
                avatarId: '',
                currencyId: ''
            };
        });

        console.log('💾 Salvando placeholders no banco...');
        await repo.User.bulkCreate(placeholders);
        console.log('✅ Usuários populados com sucesso!');
    
    } catch (error) {
        console.error('❌ Erro ao rodar o seed de usuários:', error);
    }
}

async function CreateRooms() {
    var roomCount = await repo.RoomModel.count();
    if(roomCount > 0){
        return;
    }
    var users = await repo.User.findAll();
    var scenes =[
        "Main",
        "Empty",
    ];

    console.log('🌱 Criando salas para os usuários...');
    for (let i = 0; i < users.length; i++) {
        await repo.RoomModel.create({
            name: `Sala de ${users[i].userName}`,
            owner: users[i].id,
            password: '',
            description: '',
            userId: users[i].id,
            maxPlayers: 30,
            playersCount: 0,
            scene: scenes[Math.floor(Math.random() * scenes.length)],
            isPrivate: false,
            visits: 0,
            entryValue: 0,
            thumbnail: '',
            ownnerID: users[i].id,
            layoutID: '',
            inventoryID: ''
        });
    }
    console.log('✅ Salas criadas com sucesso!');
}

const QUANTIDADE_REGISTROS = 300; 

async function popularTabelaSeVazia() {
    try {
        const totalPerfis = await repo.MatchProfile.count();
        if (totalPerfis === 0) {
            console.log(`📥 Tabela 'MatchProfile' vazia. Buscando ${QUANTIDADE_REGISTROS} usuários do DummyJSON...`);
            const usersRes = await axios.get(`https://dummyjson.com/users?limit=${QUANTIDADE_REGISTROS}`);
            const dummyUsers = usersRes.data.users;

            for (let i = 0; i < dummyUsers.length; i++) {
                const user = dummyUsers[i];
                const userIdString = String(user.id);

                await repo.MatchProfile.create({
                    userid: userIdString,
                    name: `${user.firstName} ${user.lastName}`,
                    age: user.age,
                    bio: `Trabalho como ${user.company?.title || 'Aventureiro'} em ${user.address?.city || 'Mundo'}.`,
                    avatar: user.image,
                    location: user.address?.city || 'Desconhecido',
                    photos: [user.image]
                });

                if (i > 0) {
                    await repo.Friend.create({
                        userid: String(dummyUsers[i - 1].id),
                        targetid: userIdString,
                        status: i % 2 === 0 ? 'accepted' : 'pending'
                    });
                }

                if (i % 3 === 0 && i > 0) {
                    await repo.Ignore.create({
                        userid: String(dummyUsers[0].id),
                        targetid: userIdString
                    });
                }
            }
            console.log("✅ Perfis, Amizades e Ignores adicionados.");
        } else {
            console.log("⏩ Tabela 'MatchProfile' já possui dados. Pulando...");
        }

        const totalPosts = await repo.Post.count();
        if (totalPosts === 0) {
            console.log(`📥 Tabela 'Post' vazia. Buscando ${QUANTIDADE_REGISTROS} posts do DummyJSON...`);
            const postsRes = await axios.get(`https://dummyjson.com/posts?limit=${QUANTIDADE_REGISTROS}`);
            const dummyPosts = postsRes.data.posts;

            const tiposReacao = ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'];

            for (const post of dummyPosts) {
                const novoPost = await repo.Post.create({
                    userId: String(post.userId),
                    title: post.title,
                    text: post.body
                });

                await repo.Photo.create({
                    userId: String(post.userId),
                    postId: novoPost.id,
                    url: `https://picsum.photos/id/${post.id + 10}/600/400`,
                    description: `Foto do post: ${post.title}`,
                    isDefault: true
                });

                await repo.Like.create({
                    postId: novoPost.id,
                    userId: Math.floor(Math.random() * 10) + 1,
                    type: tiposReacao[Math.floor(Math.random() * tiposReacao.length)]
                });
            }
            console.log("✅ Posts, Fotos e Likes adicionados.");
        } else {
            console.log("⏩ Tabela 'Post' já possui dados. Pulando...");
        }

        const totalComentarios = await repo.Comment.count();
        if (totalComentarios === 0) {
            console.log(`📥 Tabela 'Comment' vazia. Buscando ${QUANTIDADE_REGISTROS} comentários do DummyJSON...`);
            const commentsRes = await axios.get(`https://dummyjson.com/comments?limit=${QUANTIDADE_REGISTROS}`);
            const dummyComments = commentsRes.data.comments;

            for (const comment of dummyComments) {
                await repo.Comment.create({
                    userId: String(comment.user.id),
                    postId: String(comment.postId),
                    text: comment.body
                });
            }
            console.log("✅ Comentários adicionados.");
        } else {
            console.log("⏩ Tabela 'Comment' já possui dados. Pulando...");
        }

        const totalSalas = await repo.ChatRoom.count();
        if (totalSalas === 0) {
            console.log("📥 Tabela 'ChatRoom' vazia. Gerando chat de teste...");
            const salaChat = await repo.ChatRoom.create({
                name: "Sala de Suporte Geral",
                istyping: false,
                users: ["1", "2"],
                messages: []
            });

            await repo.ChatMessage.create({
                userid: "1",
                roomid: String(salaChat.id),
                text: "Olá! Alguém online no sistema de testes?",
                seen: true
            });

            await repo.ChatMessage.create({
                userid: "2",
                roomid: String(salaChat.id),
                text: "Tudo funcionando por aqui de forma isolada!",
                hasfile: false
            });
            console.log("✅ Salas de Chat e Mensagens adicionadas.");
        } else {
            console.log("⏩ Tabela 'ChatRoom' já possui dados. Pulando...");
        }

    } catch (error) {
        console.error("❌ Erro ao rodar a população condicional:", error.message);
    }}
// Substitua o bloco antigo de encadeamento por este:

async function iniciarSeed() {
    try {
        await repo.sequelize.sync();

        // 1. Executa o seed de usuários e aguarda finalizar completamente
        await seedDatabase();
        
        // 2. Executa a criação de salas baseada nos usuários e aguarda finalizar
        await CreateRooms();
        
        // 3. Executa a população das tabelas extras (Match, Posts, Comments, Chats)
        await popularTabelaSeVazia();
        
        console.log("🏁 Todo o banco de dados foi verificado e populado com sucesso!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Erro crítico durante a execução do seed:", error.message);
        process.exit(1);
    }
}

// Inicia o processo de forma segura
//iniciarSeed();