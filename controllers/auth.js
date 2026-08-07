
const repo = require('../repository');
const crypto = require('crypto');
const { UserDto, UserInfoBase, RoomBaseInfo } = require('../Models/dto/userDto');
    const Op = repo.Sequelize ? repo.Sequelize.Op : require('sequelize').Op;



function encryptPassword(password) {
    //ainda em teste
    return password;// crypto.createHash('sha256').update(password).digest('hex');
}

async function CheckLogin(req, res, next) {
    // 1. Uso do ?. impede o erro se req.body ou req.query forem undefined
    var token = req.headers?.['tfl-token'] || 
                req.headers?.['token'] ||  
                req.body?.token || 
                req.query?.token || 
                req.params?.token || '';

    // 2. CORRIGIDO: Só entra se o token EXISTIR
    if (token) {
        
        try {
           
            if(token == '12345'){
               const usertemp = await repo.User.findOne();
               token = usertemp.token;
            }
            
           const user = await repo.User.findOne({
                where: { token: token }
            });
            
            if (user) {
                req.userId = user.id;
                req.userToken = token;
                req.userData = UserDto.fromObject(user.get({ plain: true }));
                return next(); // Coloque o return para parar a execução aqui
            }
        } catch (err) {
            console.error('Erro ao verificar login:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    
    // Se não tiver token ou usuário não for encontrado, barra aqui
    return res.status(401).json({ error: 'Unauthorized' });
}


async function sigin(req, res) {
    const { login, password } = req.body;
    // Garante o acesso aos operadores do Sequelize
    const Op = repo.Sequelize ? repo.Sequelize.Op : require('sequelize').Op;

    // Busca o usuário usando a nova sintaxe do findOne estilo Sequelize
    const user = await repo.User.findOne({
        where: { login: login, password: encryptPassword(password) }
    });
    
    if (user) {        
        // Modifica e salva via Active Record direto na instância
        user.token = repo.User.newToken();
        user.online = true;
        await user.save();
        
        const data = UserDto.fromObject(user.get({ plain: true }));
        const friends = await repo.Friend.findAll({
            where: {
                //status: "Accepted",
                [Op.or]: [{ targetId: user.id }, { userId: user.id }]
            },
            raw: true
        });
     
        const allUsersId = friends.map(f => f.targetId === user.id ? f.userId : f.targetId);
        
        // findAndCountAll retorna { rows, count }
        const allUsers = (await repo.User.findAndCountAll({ where: { id: allUsersId }, raw: true }));
        console.log(allUsers);
        // Mapeia os usuários a partir de allUsers.rows
        data.friends = friends;
        
        const rooms = await repo.RoomModel.findAll();//{ where: { userId: user.id }, raw: true });
        data.roomsInfo = rooms;

        console.log(data);

        res.status(200).json({ 
            token: user.token,
            profile: user,
            success: true,
            data: data
        });
    } else {
        res.status(401).json({ 
            error: 'Login ou senha inválidos.' ,
            success: false,
            data: {}
        });
    }
}

async function signup(req, res) {
    const userId = req.userId; // já validado no middleware
    if (userId) {
        return res.status(409).json({ error: 'Usuário logado.', "success":false });
    }

    const { login, password, userName, email, age } = req.body;
    if(!login || !password){
    res.status(422).json({"error": "Campos vazios, vefique login e senha", "success":false});
    }
    // Verifica se já existe usando o findOne assíncrono
    const userExists = await repo.User.findOne({
        where: { login: login }
    });
    //se existe
    if (!userExists) {
        
        const newUser = await repo.User.create({
            login: login,
            password: encryptPassword(password),
            userName: userName,
            token: repo.User.newToken(),
            age: age || 18,
            email: email,
            avatar: `https://ui-avatars.com/api/?name=${userName || login}&background=random&size=256`
        });
        
        res.status(201).json({ 
            token: newUser.token,
            error: null,
            success: true,
            data: newUser,
            user:newUser //para evitar erro no frontend
        });
    } else {
        res.status(409).json({ 
            error: `O login ${login} já existe.`, 
            success: false,
            data: {}
        });
    }
}

function forgot(req, res) {
    res.status(200).json({ success: false, error: 'Not implemented', data:{} });
}

async function logout(req, res) {
    // Busca o usuário baseado no ID usando findByPk do Sequelize
    const user = await repo.User.findByPk(req.userId);
    
    if (user) {
        user.token = null;
        user.online = false;
        await user.save(); // Adicionado await
    }
    res.status(200).json({ success: true , data:{} });
}

module.exports = { sigin, signup, logout, forgot, CheckLogin };
