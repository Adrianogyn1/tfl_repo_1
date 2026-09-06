const db = require("../repository.js");

async function updateDatabaseSchema() {
  const queryInterface = db.sequelize.getQueryInterface();
  const models = db.sequelize.models;

  for (const modelName of Object.keys(models)) {
    const Model = models[modelName];
    const tableName = Model.getTableName();

    // Pega as colunas como estão no banco de dados
    const tableDefinition = await queryInterface.describeTable(tableName);
    const existingColumns = Object.keys(tableDefinition);
    const attributes = Model.rawAttributes;

    for (const attr in attributes) {
      const col = attributes[attr];
      const targetFieldName = col.field || attr;

      // Busca se já existe uma coluna no banco com esse nome (independente de case)
      const exists = existingColumns.some(
        (existingCol) =>
          existingCol.toLowerCase() === targetFieldName.toLowerCase(),
      );

      if (!exists) {
        console.log(
          `➕ Adicionando coluna '${targetFieldName}' na tabela '${tableName}'...`,
        );

        await queryInterface.addColumn(tableName, targetFieldName, {
          type: col.type,
          allowNull: col.allowNull !== undefined ? col.allowNull : true,
          defaultValue:
            col.defaultValue !== undefined ? col.defaultValue : undefined,
        });
      }
    }
  }

  console.log("✅ Estrutura sincronizada com sucesso!");
  process.exit(0);
}

updateDatabaseSchema().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
