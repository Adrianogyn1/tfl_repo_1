const { Op } = require('sequelize');
const crypto = require('crypto');

class ModelBase {
    // Mantém o gerador de token utilitário que seus modelos ou serviços usavam
    static newToken() {
        return crypto.randomBytes(16).toString('hex');
    }
}

module.exports = { ModelBase, Op };