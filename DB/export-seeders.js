const fs = require('fs');
const path = require('path');
const db = require('../repository.js'); // Importa sua conexão e modelos já exportados

async function generateSeeders() {
    const seedersDir = path.join(__dirname, 'seeders');
    if (!fs.existsSync(seedersDir)) {
        fs.mkdirSync(seedersDir, { recursive: true });
    }

    // Lista de modelos que você deseja exportar
    const modelsToExport = Object.keys(db.sequelize.models);

    for (const modelName of modelsToExport) {
        const Model = db[modelName];
        if (!Model) continue;

        const tableName = Model.getTableName();
        const records = await Model.findAll({ raw: true });

        if (records.length === 0) continue;

        const fileContent = `'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('${tableName}', ${JSON.stringify(records, null, 2)}, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('${tableName}', null, {});
  }
};
`;

        const timestamp = new Date().toISOString().replace(/[-:T output.Z]/g, '').slice(0, 14);
        const fileName = `${timestamp}-seed-${tableName}.js`;
        fs.writeFileSync(path.join(seedersDir, fileName), fileContent);

        console.log(`✅ Seeder gerado para a tabela '${tableName}': ${fileName}`);
    }

    process.exit(0);
}

generateSeeders().catch((err) => {
    console.error('❌ Erro ao gerar seeders:', err);
    process.exit(1);
});