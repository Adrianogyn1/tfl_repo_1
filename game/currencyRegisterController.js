const { Op } = require('sequelize');
const repo = require('../repository');

function checkData(registerData) {
    let error = "";
    try {
        if (!registerData)
            throw new Error("Dados do registro de moeda são obrigatórios.");

        if (!registerData.userId)
            throw new Error("O userId é obrigatório.");

        if (!registerData.type)
            throw new Error("O tipo de transação (type) é obrigatório.");

        if (registerData.value === undefined || registerData.value === null)
            throw new Error("O valor (value) é obrigatório.");
            
    } catch (e) {
        error = e.message;
    }
    return error;
}

async function getAll(req, res) {
    try {
        // Obtém a query string do request
        const queryStr = req.query?.q || req.body?.q || '';
        
        // Converte a string para condições do Sequelize
        const whereCondition = repo.parseQueryStringToWhere(queryStr);
        const orderCondition = repo.parseOrderByString(queryStr);

        const limit = parseInt(req.query?.limit || req.body?.limit || req.body?.take) || 50;
        const offset = parseInt(req.query?.offset || req.body?.skip || req.body?.offset) || 0;

        let registers = await repo.CurrencyRegister.findAndCountAll({
            where: whereCondition,
            order: orderCondition,
            limit: limit,
            offset: offset
        });
        //vamos limpar os  registros que no sao desse user
        registers.rows = registers.rows.filter(register => register.userId === req.userId);
        //atualizar o count
        registers.count = registers.rows.length;

        return res.json({
            success: true,
            data: registers?.rows || [],
            count: registers?.count || 0,
            skip: offset,
            limit: limit,
            nextPage: registers?.count <= (offset + limit) ? 0 : Math.ceil((offset + limit) / limit) + 1,
        });
    } catch (err) {
        return res.status(500).json({ success: false, data: [], error: err.message });
    }
}

async function getById(req, res) {
    try {
        const register = await repo.CurrencyRegister.findByPk(req.params.id);
        if (!register) {
            return res.status(404).json({ error: "Currency register not found", success: false });
        }
        return res.json({ success: true, data: register });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}


async function create(req, res) {
    try {
        const registerData = req.body;
        const error = checkData(registerData);
        if (error) {
            return res.status(400).json({ error: error, success: false });
        }

        const register = await CreateCurrencyRegister(registerData, req.userId);
        return res.json({ success: true, data: register });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function update(req, res) {
    try {
        throw new Error('not authorized');
        return res.json({ success: true, data: register });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function remove(req, res) {
    try {
        //os registro nunca podem ser deletados
        throw new Error('not authorized');
        //vamos limpar os dados id >0
        await repo.CurrencyRegister.destroy({ where: { id: { [Op.gt]: 0 } } });
        console.log("os registro nunca podem ser deletados");
        const register = await repo.CurrencyRegister.findByPk(req.params.id);
        if (!register) {
            return res.status(404).json({ error: "Currency register not found", success: false });
        }

        await repo.CurrencyRegister.destroy({ where: { id: req.params.id } });
        return res.json({ success: true, message: "Currency register deleted successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

async function UpdateCurrencyRegister(registerData, userId, transaction = null) {
    try{
       
        throw new Error('not authorized');
    }
    catch(err){
        return  { error: err.message, success: false };
    }
}

async function CreateCurrencyRegister(registerData, userId, transaction = null) {
    try{
        const valid = checkData(registerData);
        if (valid) {
            throw new Error(valid);
        }
        const roleVals = ['admin', 'ownner'];
        const user = await repo.User.findByPk(userId);
        if(!user) throw new Error("User not found");

        const role = user.role;
        if (!roleVals.includes(role)) {
            throw new Error("User must be admin or ownner");
        }
        let register = null;
       if(transaction === null)
            register = await repo.CurrencyRegister.create(registerData);
       else  
         register = await repo.CurrencyRegister.create(registerData, { transaction: transaction });

        if(!register || register.length === 0) throw new Error("Currency register not created");
        return { success: true, data: register };
    }
    catch(err){
        return  { error: err.message, success: false };
    }
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    CreateCurrencyRegister,
    UpdateCurrencyRegister
};