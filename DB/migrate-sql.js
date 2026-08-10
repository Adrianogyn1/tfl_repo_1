const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let DB_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DB_URL) {
    console.error('❌ ERRO CRÍTICO: DATABASE_URL não definida.');
    process.exit(1);
}

DB_URL = DB_URL.trim().replace(/^['"]|['"]$/g, '');
const sqlitePath = path.resolve(__dirname, '../nodedata.sqlite');

const sqliteSequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqlitePath,
    logging: false
});

const pgSequelize = new Sequelize(DB_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        family: 4
    }
});

const sqliteModels = require('../Models/index.js')(sqliteSequelize);
const pgModels = require('../Models/index.js')(pgSequelize);

Object.keys(pgModels).forEach(modelName => {
    if (typeof pgModels[modelName].associate === 'function') {
        pgModels[modelName].associate(pgModels);
    }
});

// Sobrescreve validação rígida de UUID no mapeamento do Sequelize para aceitar strings arbitrárias
Object.keys(pgModels).forEach(modelName => {
    const attributes = pgModels[modelName].rawAttributes;
    for (const key in attributes) {
        if (attributes[key].type.key === 'UUID') {
            attributes[key].type = Sequelize.STRING;
        }
    }
});

async function runMigration() {
    const errorLogs = [];

    try {
        console.log('🔄 Conectando aos bancos de dados...');
        await sqliteSequelize.authenticate();
        await pgSequelize.authenticate();

        console.log('⚡ Conectado ao PostgreSQL (sem alterar estrutura das colunas)...');
        await pgSequelize.sync({ alter: false });

        const modelsOrder = Object.keys(sqliteModels);

        for (const modelName of modelsOrder) {
            const SqliteModel = sqliteModels[modelName];
            const PgModel = pgModels[modelName];

            if (!SqliteModel || typeof SqliteModel.findAll !== 'function') {
                console.warn(`⚠️ Modelo ${modelName} ignorado (findAll indisponível).`);
                continue;
            }

            console.log(`📦 Processando modelo: ${modelName}...`);

            try {
                const records = await SqliteModel.findAll({ raw: true });

                if (!records || records.length === 0) {
                    console.log(`ℹ️ Nenhum registro encontrado para ${modelName}.`);
                    continue;
                }

                let successCount = 0;
                let failCount = 0;

                for (const record of records) {
                    try {
                        await PgModel.upsert(record);
                        successCount++;
                    } catch (itemErr) {
                        failCount++;
                        errorLogs.push({
                            model: modelName,
                            id: record.id || 'Sem ID',
                            error: itemErr.message
                        });
                    }
                }

                console.log(`✅ ${modelName}: ${successCount} salvos/atualizados | ⚠️ ${failCount} com erro.`);

                const tableName = PgModel.getTableName();
                const formattedTableName = typeof tableName === 'object' ? tableName.tableName : tableName;

                await pgSequelize.query(
                    `SELECT setval(pg_get_serial_sequence('${formattedTableName}', 'id'), COALESCE(MAX(id), 1)) FROM "${formattedTableName}";`
                ).catch(() => {});

            } catch (modelErr) {
                console.warn(`⚠️ Erro ao ler tabela SQLite de ${modelName}:`, modelErr.message);
            }
        }

        console.log('\n🚀 Processo de migração finalizado!');

        if (errorLogs.length > 0) {
            console.log(`\n🔴 Detalhes dos ${errorLogs.length} erros encontrados:`);
            errorLogs.forEach(log => {
                console.log(`• [${log.model}] ID ${log.id} -> ${log.error}`);
            });
        } else {
            console.log('🎉 Todos os registros foram migrados com sucesso!');
        }

    } catch (err) {
        console.error('❌ Erro crítico no processo:', err);
    } finally {
        await sqliteSequelize.close();
        await pgSequelize.close();
    }
}

runMigration();