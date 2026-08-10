const path = require('path');
const fs = require('fs');
const db = require('./repository.js');

async function updateDatabaseSchema() {
    const queryInterface = db.sequelize.getQueryInterface();
    const models = db.sequelize.models;

    for (const modelName of Object.keys(models)) {
        const Model = models[modelName];
        const tableName = Model.getTableName();
        
        // Pega as colunas que já existem no SQLite
        const tableDefinition = await queryInterface.describeTable(tableName);
        const attributes = Model.rawAttributes;

        for (const attr in attributes) {
            // Se o atributo do modelo não existe na tabela do banco, adiciona
            if (!tableDefinition[attr]) {
                const col = attributes[attr];
                console.log(`➕ Adicionando coluna '${attr}' na tabela '${tableName}'...`);

                await queryInterface.addColumn(tableName, attr, {
                    type: col.type,
                    allowNull: col.allowNull !== undefined ? col.allowNull : true,
                    defaultValue: col.defaultValue !== undefined ? col.defaultValue : undefined
                });
            }
        }
    }

    console.log('✅ Estrutura do banco de dados atualizada com sucesso!');
    process.exit(0);
}

updateDatabaseSchema().catch(err => {
    console.error('❌ Erro ao atualizar estrutura do banco:', err);
    process.exit(1);
});