const fs = require('fs');
const path = require('path');
const db = require('../repository.js'); // Importa sua conexão e modelos

async function generateMigrationFromModels() {
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
    }

    const models = db.sequelize.models;
    const timestamp = new Date().toISOString().replace(/[-:T output.Z]/g, '').slice(0, 14);
    const fileName = `${timestamp}-create-all-tables.js`;

    let upTables = [];
    let downTables = [];

    for (const modelName of Object.keys(models)) {
        const Model = models[modelName];
        const tableName = Model.getTableName();
        const attributes = Model.rawAttributes;

        const columns = {};
        for (const attr in attributes) {
            const col = attributes[attr];
            columns[attr] = {
                type: `Sequelize.${col.type.key || 'STRING'}`,
                allowNull: col.allowNull !== undefined ? col.allowNull : true,
                primaryKey: col.primaryKey || false,
                autoIncrement: col.autoIncrement || false,
                defaultValue: col.defaultValue !== undefined ? col.defaultValue : undefined
            };
        }

        upTables.push(`await queryInterface.createTable('${tableName}', ${JSON.stringify(columns, null, 2).replace(/"Sequelize\.(.*?)"/g, 'Sequelize.$1')});`);
        downTables.push(`await queryInterface.dropTable('${tableName}');`);
    }

    const fileContent = `'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    ${upTables.join('\n\n    ')}
  },

  async down (queryInterface, Sequelize) {
    ${downTables.reverse().join('\n\n    ')}
  }
};
`;

    fs.writeFileSync(path.join(migrationsDir, fileName), fileContent);
    console.log(`✅ Migration gerada com sucesso: ${fileName}`);
    process.exit(0);
}

generateMigrationFromModels().catch(err => {
    console.error('❌ Erro ao gerar migration:', err);
    process.exit(1);
});