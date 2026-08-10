const fs = require('fs');
const path = require('path');
const db = require('../repository.js');

async function runSeeds() {
    const seedersDir = path.join(__dirname, 'seeders');
    const files = fs.readdirSync(seedersDir).filter(file => file.endsWith('.js'));

    const queryInterface = db.sequelize.getQueryInterface();

    for (const file of files) {
        console.log(`⏳ Rodando seeder: ${file}`);
        const seeder = require(path.join(seedersDir, file));
        try {
            await seeder.up(queryInterface, db.Sequelize);
            console.log(`✅ ${file} aplicado com sucesso!`);
        } catch (err) {
            console.error(`❌ Erro no seeder ${file}:`, err.message);
            if (err.errors) {
                err.errors.forEach(e => console.error(`  -> Detalhes: ${e.message} no campo '${e.path}'`));
            }
        }
    }
    process.exit(0);
}

runSeeds();