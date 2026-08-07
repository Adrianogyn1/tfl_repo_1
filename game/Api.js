const repo = require("../repository.js");

async function API(req, res) {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const allTables = repo.sequelize.models;
    const databaseSummary = {};
   

    // 1. Busca o primeiro token disponível na tabela User para injetar nos links de teste
    let testToken = "SEU_TOKEN_AQUI";
    if (repo.User) {
      const firstUser = await repo.User.findOne({
        attributes: ['token'],
        where: repo.sequelize.literal("token IS NOT NULL AND token != ''")
      });
      if (firstUser && firstUser.token) {
        testToken = firstUser.token;
      }
    }

    // 2. Mapeia os dados do Banco de Dados
    const qtd = parseInt(req.query?.qtd || req.body?.qtd, 10);
    for (const modelName in allTables) {
      const model = allTables[modelName];      
      const firstItems = await model.findAll({ limit: qtd || 1, offset: 0 });
      const count = await model.count();
      
      databaseSummary[modelName] = {
        total_records: count,
        ...(qtd ? { sample: firstItems } : {})
      };
    }
    
function renderOptins(obj, template_help){

}
    // 3. Renderiza o HTML de documentação amigável
    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Painel de Ajuda da API - Game Server</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f9; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        header { background: #2c3e50; color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        header h1 { margin: 0; font-size: 24px; }
        header p { margin: 5px 0 0 0; color: #bdc3c7; }
        .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        @media(max-width: 768px) { .grid { grid-template-columns: 1fr; } }
        .card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 20px; }
        .card h2 { margin-top: 0; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px; color: #2c3e50; font-size: 18px; }
        .endpoint { background: #fdfdfd; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-bottom: 25px; }
        .endpoint h3 { margin: 0 0 10px 0; font-size: 16px; color: #2980b9; }
        
        /* Estilos do Formulário Interativo */
        .form-row { display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0; align-items: center; background: #f8fafc; padding: 10px; border-radius: 6px; border-left: 4px solid #cbd5e1; }
        .form-row.row-post { border-left-color: #f1c40f; }
        .form-row.row-put { border-left-color: #3498db; }
        .form-row.row-delete { border-left-color: #e74c3c; }
        
        .method-tag { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; color: white; min-width: 55px; text-align: center; text-transform: uppercase; }
        .get { background-color: #2ecc71; }
        .post { background-color: #f1c40f; color: #333; }
        .put { background-color: #3498db; }
        .delete { background-color: #e74c3c; }
        
        .input-id { width: 60px; padding: 5px; border: 1px solid #ccc; border-radius: 4px; text-align: center; }
        .input-json { flex: 1; min-width: 200px; padding: 5px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace; font-size: 12px; }
        .btn-submit { background: #2c3e50; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; transition: opacity 0.2s; }
        .btn-submit:hover { opacity: 0.9; }
        
        .url-box { background: #edf2f7; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 13px; word-break: break-all; margin: 5px 0; }
        .token-info { display: block; background: #e2f0d9; color: #385723; padding: 8px; border-radius: 4px; font-size: 12px; margin-bottom: 15px; word-break: break-all; font-family: monospace; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 10px; border-bottom: 1px solid #edf2f7; font-size: 14px; }
        th { background: #f8fafc; color: #64748b; }
        
        /* Modal flutuante para resposta */
        #response-console { position: fixed; bottom: 20px; right: 20px; width: 400px; max-height: 300px; background: #2d3748; color: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); padding: 15px; display: none; flex-direction: column; z-index: 9999; }
        #response-console header { background: transparent; padding: 0 0 10px 0; border-bottom: 1px solid #4a5568; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; box-shadow: none; }
        #response-console h4 { margin: 0; color: #63b3ed; }
        #response-console pre { margin: 0; overflow-y: auto; flex: 1; font-size: 12px; }
        .close-console { color: #a0aec0; cursor: pointer; background: none; border: none; font-size: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>Documentação & Painel de Ajuda da API</h1>
          <p>Versão da API: 2026.1 | Base URL: ${baseUrl}</p>
        </header>

        <div class="grid">
          <div>
            <div class="card">
              <h2>Endpoints do Jogo (/game/*)</h2>
              <div class="token-info">🔑 <strong>Token de Teste Atual (User):</strong> ${testToken}</div>
              
<!-- Avatars -->
<div class="endpoint">
  <h3>Avatars (Avatares)</h3>
  <div class="url-box">${baseUrl}/game/avatars</div>
  
  <form class="api-form" data-route="/game/avatars" data-method="GET">
    <div class="form-row">
      <span class="method-tag get">GET</span>
      <input type="text" class="input-json" name="query" value="limit=10&offset=0" placeholder="Query params">
      <button type="submit" class="btn-submit">Listar</button>
    </div>
  </form>

  <form class="api-form" data-route="/game/avatars" data-method="POST">
    <div class="form-row row-post">
      <span class="method-tag post">POST</span>
      <input type="text" class="input-json" name="body" value='{ "name": "Avatar Exemplo", "gender": "male" }'>
      <button type="submit" class="btn-submit">Criar</button>
    </div>
  </form>

  <form class="api-form" data-route="/game/avatars" data-method="PUT" data-need-id="true">
    <div class="form-row row-put">
      <span class="method-tag put">PUT</span>
      <input type="number" class="input-id" placeholder="ID" value="1" required>
      <input type="text" class="input-json" name="body" value='{ "name": "Avatar Editado" }'>
      <button type="submit" class="btn-submit">Atualizar</button>
    </div>
  </form>

  <form class="api-form" data-route="/game/avatars" data-method="DELETE" data-need-id="true">
    <div class="form-row row-delete">
      <span class="method-tag delete">DELETE</span>
      <input type="number" class="input-id" placeholder="ID" value="1" required>
      <button type="submit" class="btn-submit">Deletar</button>
    </div>
  </form>
</div>

              <!-- Rooms -->
              <div class="endpoint">
                <h3>Rooms (Salas)</h3>
                <div class="url-box">${baseUrl}/game/rooms</div>
                
                <form class="api-form" data-route="/game/rooms" data-method="GET">
                  <div class="form-row">
                    <span class="method-tag get">GET</span>
                    <span>Query:</span>
                    <input type="text" class="input-json" name="query" value="limit=50&offset=0" placeholder="Parametros de Busca">
                    <button type="submit" class="btn-submit">Listar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/rooms" data-method="POST">
                  <div class="form-row row-post">
                    <span class="method-tag post">POST</span>
                    <input type="text" class="input-json" name="body" value='{ "name": "Sala Principal", "description": "Lobby Principal", "scene": "Lobby" }'>
                    <button type="submit" class="btn-submit">Criar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/rooms" data-method="PUT" data-need-id="true">
                  <div class="form-row row-put">
                    <span class="method-tag put">PUT</span>
                    <input type="number" class="input-id" placeholder="ID" value="1" required>
                    <input type="text" class="input-json" name="body" value='{ "name": "Sala Alterada", "description": "Lobby Modificado", "scene": "Lobby" }'>
                    <button type="submit" class="btn-submit">Atualizar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/rooms" data-method="DELETE" data-need-id="true">
                  <div class="form-row row-delete">
                    <span class="method-tag delete">DELETE</span>
                    <input type="number" class="input-id" placeholder="ID" value="1" required>
                    <span style="flex:1; font-size:12px; color:#e74c3c;">Deletará permanentemente o ID especificado.</span>
                    <button type="submit" class="btn-submit">Deletar</button>
                  </div>
                </form>
              </div>

              <!-- Objects -->
              <div class="endpoint">
                <h3>Objects (Objetos)</h3>
                <div class="url-box">${baseUrl}/game/objects</div>
                
                <form class="api-form" data-route="/game/objects" data-method="GET">
                  <div class="form-row">
                    <span class="method-tag get">GET</span>
                    <input type="text" class="input-json" name="query" value="limit=10&offset=0" placeholder="Query params">
                    <button type="submit" class="btn-submit">Listar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/objects" data-method="POST">
                  <div class="form-row row-post">
                    <span class="method-tag post">POST</span>
                    <input type="text" class="input-json" name="body" value='{ "data": "{}", "ownnerId": 1, "roomId": 1 }'>
                    <button type="submit" class="btn-submit">Criar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/objects" data-method="PUT" data-need-id="true">
                  <div class="form-row row-put">
                    <span class="method-tag put">PUT</span>
                    <input type="number" class="input-id" placeholder="ID" value="1" required>
                    <input type="text" class="input-json" name="body" value='{ "data": "{\\"power\\": 50}", "ownnerId": 1, "roomId": 1 }'>
                    <button type="submit" class="btn-submit">Atualizar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/objects" data-method="DELETE" data-need-id="true">
                  <div class="form-row row-delete">
                    <span class="method-tag delete">DELETE</span>
                    <input type="number" class="input-id" placeholder="ID" value="1" required>
                    <button type="submit" class="btn-submit">Deletar</button>
                  </div>
                </form>
              </div>

              <!-- Clothes -->
              <div class="endpoint">
                <h3>Clothes (Roupas)</h3>
                <div class="url-box">${baseUrl}/game/clothes</div>
                
                <form class="api-form" data-route="/game/clothes" data-method="GET">
                  <div class="form-row">
                    <span class="method-tag get">GET</span>
                    <button type="submit" class="btn-submit">Listar Todas</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/clothes" data-method="POST">
                  <div class="form-row row-post">
                    <span class="method-tag post">POST</span>
                    <input type="text" class="input-json" name="body" value='{ "name": "Camiseta Azul", "objectId": "O1", "path": "clothes/shirt_blue.png" }'>
                    <button type="submit" class="btn-submit">Criar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/clothes" data-method="PUT" data-need-id="true">
                  <div class="form-row row-put">
                    <span class="method-tag put">PUT</span>
                    <input type="number" class="input-id" placeholder="ID" value="1" required>
                    <input type="text" class="input-json" name="body" value='{ "name": "Camiseta Verde", "objectId": "O1", "path": "clothes/shirt_green.png" }'>
                    <button type="submit" class="btn-submit">Atualizar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/clothes" data-method="DELETE" data-need-id="true">
                  <div class="form-row row-delete">
                    <span class="method-tag delete">DELETE</span>
                    <input type="number" class="input-id" placeholder="ID" value="1" required>
                    <button type="submit" class="btn-submit">Deletar</button>
                  </div>
                </form>
              </div>

              <!-- Currencies -->
              <div class="endpoint">
                <h3>Currencies (Moedas)</h3>
                <div class="url-box">${baseUrl}/game/currencies</div>
                
                <form class="api-form" data-route="/game/currencies" data-method="GET">
                  <div class="form-row">
                    <span class="method-tag get">GET</span>
                    <button type="submit" class="btn-submit">Listar Todas</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/currencies" data-method="POST">
                  <div class="form-row row-post">
                    <span class="method-tag post">POST</span>
                    <input type="text" class="input-json" name="body" value='{ "value": 500, "userId": 1 }'>
                    <button type="submit" class="btn-submit">Criar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/currencies" data-method="PUT" data-need-id="true">
                  <div class="form-row row-put">
                    <span class="method-tag put">PUT</span>
                    <input type="number" class="input-id" placeholder="ID" value="1" required>
                    <input type="text" class="input-json" name="body" value='{ "value": 750, "userId": 1 }'>
                    <button type="submit" class="btn-submit">Atualizar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/currencies" data-method="DELETE" data-need-id="true">
                  <div class="form-row row-delete">
                    <span class="method-tag delete">DELETE</span>
                    <input type="number" class="input-id" placeholder="ID" value="1" required>
                    <button type="submit" class="btn-submit">Deletar</button>
                  </div>
                </form>
              </div>

              <!-- Currency Registers -->
              <div class="endpoint">
                <h3>Currency Registers (Histórico)</h3>
                <div class="url-box">${baseUrl}/game/currency-registers</div>
                
                <form class="api-form" data-route="/game/currency-registers" data-method="GET">
                  <div class="form-row">
                    <span class="method-tag get">GET</span>
                    <button type="submit" class="btn-submit">Listar Histórico</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/currency-registers" data-method="POST">
                  <div class="form-row row-post">
                    <span class="method-tag post">POST</span>
                    <input type="text" class="input-json" name="body" value='{ "userId": 1, "type": "ADD", "value": 100, "description": "Recompensa Missão" }'>
                    <button type="submit" class="btn-submit">Criar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/currency-registers" data-method="PUT" data-need-id="true">
                  <div class="form-row row-put">
                    <span class="method-tag put">PUT</span>
                    <input type="number" class="input-id" placeholder="ID" value="1" required>
                    <input type="text" class="input-json" name="body" value='{ "userId": 1, "type": "SUB", "value": 50, "description": "Compra Item" }'>
                    <button type="submit" class="btn-submit">Atualizar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/currency-registers" data-method="DELETE" data-need-id="true">
                  <div class="form-row row-delete">
                    <span class="method-tag delete">DELETE</span>
                    <input type="number" class="input-id" placeholder="ID" value="1" required>
                    <button type="submit" class="btn-submit">Deletar</button>
                  </div>
                </form>
              </div>

              <!-- Outfits -->
              <div class="endpoint">
                <h3>Outfits (Visuais)</h3>
                <div class="url-box">${baseUrl}/game/outfits</div>
                
                <form class="api-form" data-route="/game/outfits" data-method="GET">
                  <div class="form-row">
                    <span class="method-tag get">GET</span>
                    <button type="submit" class="btn-submit">Listar Todos</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/outfits" data-method="POST">
                  <div class="form-row row-post">
                    <span class="method-tag post">POST</span>
                    <input type="text" class="input-json" name="body" value='{ "name": "Traje Guardião", "description": "Armadura Pesada", "thumbnail": "thumb.png", "price": 150.0, "tags": "epic,armor", "inventoryID": 0 }'>
                    <button type="submit" class="btn-submit">Criar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/outfits" data-method="PUT" data-need-id="true">
                  <div class="form-row row-put">
                    <span class="method-tag put">PUT</span>
                    <input type="number" class="input-id" placeholder="ID" value="1" required>
                    <input type="text" class="input-json" name="body" value='{ "name": "Traje Lendário", "description": "Armadura Modificada", "thumbnail": "thumb_up.png", "price": 200.0, "tags": "legendary", "inventoryID": 0 }'>
                    <button type="submit" class="btn-submit">Atualizar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/outfits" data-method="DELETE" data-need-id="true">
                  <div class="form-row row-delete">
                    <span class="method-tag delete">DELETE</span>
                    <input type="number" class="input-id" placeholder="ID" value="1" required>
                    <button type="submit" class="btn-submit">Deletar</button>
                  </div>
                </form>
              </div>

              <!-- Prefabs -->
              <div class="endpoint">
                <h3>Prefabs</h3>
                <div class="url-box">${baseUrl}/game/prefabs</div>
                
                <form class="api-form" data-route="/game/prefabs" data-method="GET">
                  <div class="form-row">
                    <span class="method-tag get">GET</span>
                    <button type="submit" class="btn-submit">Listar Todos</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/prefabs" data-method="POST">
                  <div class="form-row row-post">
                    <span class="method-tag post">POST</span>
                    <input type="text" class="input-json" name="body" value='{ "name": "Chest_Gold", "addressable": "Assets/Prefabs/ChestGold.prefab" }'>
                    <button type="submit" class="btn-submit">Criar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/prefabs" data-method="PUT" data-need-id="true">
                  <div class="form-row row-put">
                    <span class="method-tag put">PUT</span>
                    <input type="number" class="input-id" placeholder="ID" value="1" required>
                    <input type="text" class="input-json" name="body" value='{ "name": "Chest_Gold_v2", "addressable": "Assets/Prefabs/ChestGoldV2.prefab" }'>
                    <button type="submit" class="btn-submit">Atualizar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/prefabs" data-method="DELETE" data-need-id="true">
                  <div class="form-row row-delete">
                    <span class="method-tag delete">DELETE</span>
                    <input type="number" class="input-id" placeholder="ID" value="1" required>
                    <button type="submit" class="btn-submit">Deletar</button>
                  </div>
                </form>
              </div>

              <!-- Servers -->
              <div class="endpoint">
                <h3>Servers (Servidores)</h3>
                <div class="url-box">${baseUrl}/game/servers</div>
                
                <form class="api-form" data-route="/game/servers" data-method="GET">
                  <div class="form-row">
                    <span class="method-tag get">GET</span>
                    <button type="submit" class="btn-submit">Listar Todos</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/servers" data-method="POST">
                  <div class="form-row row-post">
                    <span class="method-tag post">POST</span>
                    <input type="text" class="input-json" name="body" value='{ "roomId": "1", "scene": "Map_01", "language": "pt-BR" }'>
                    <button type="submit" class="btn-submit">Criar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/servers" data-method="PUT" data-need-id="true">
                  <div class="form-row row-put">
                    <span class="method-tag put">PUT</span>
                    <input type="number" class="input-id" placeholder="ID" value="1" required>
                    <input type="text" class="input-json" name="body" value='{ "roomId": "1", "scene": "Map_01_Updated", "language": "en-US" }'>
                    <button type="submit" class="btn-submit">Atualizar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/servers" data-method="DELETE" data-need-id="true">
                  <div class="form-row row-delete">
                    <span class="method-tag delete">DELETE</span>
                    <input type="number" class="input-id" placeholder="ID" value="1" required>
                    <button type="submit" class="btn-submit">Deletar</button>
                  </div>
                </form>
              </div>

              <!-- Textures -->
              <div class="endpoint">
                <h3>Textures (Texturas)</h3>
                <div class="url-box">${baseUrl}/game/textures</div>
                
                <form class="api-form" data-route="/game/textures" data-method="GET">
                  <div class="form-row">
                    <span class="method-tag get">GET</span>
                    <button type="submit" class="btn-submit">Listar Todas</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/textures" data-method="POST">
                  <div class="form-row row-post">
                    <span class="method-tag post">POST</span>
                    <input type="text" class="input-json" name="body" value='{ "name": "Wood_Floor", "path": "textures/wood.png" }'>
                    <button type="submit" class="btn-submit">Criar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/textures" data-method="PUT" data-need-id="true">
                  <div class="form-row row-put">
                    <span class="method-tag put">PUT</span>
                    <input type="number" class="input-id" placeholder="ID" value="1" required>
                    <input type="text" class="input-json" name="body" value='{ "name": "Wood_Floor_Dark", "path": "textures/wood_dark.png" }'>
                    <button type="submit" class="btn-submit">Atualizar</button>
                  </div>
                </form>

                <form class="api-form" data-route="/game/textures" data-method="DELETE" data-need-id="true">
                  <div class="form-row row-delete">
                    <span class="method-tag delete">DELETE</span>
                    <input type="number" class="input-id" placeholder="ID" value="1" required>
                    <button type="submit" class="btn-submit">Deletar</button>
                  </div>
                </form>
              </div>

            </div>
          </div>

          <!-- Coluna do Status do Banco de Dados -->
          <div>
            <div class="card">
              <h2>Status do Banco de Dados</h2>
              <table>
                <thead>
                  <tr>
                    <th>Tabela / Modelo</th>
                    <th>Registros</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.keys(databaseSummary).map(modelName => `
                    <tr>
                      <td><strong>${modelName}</strong></td>
                      <td>${databaseSummary[modelName].total_records}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Console Flutuante Interativo de Resposta -->
      <div id="response-console">
        <header>
          <h4>Resposta da API</h4>
          <button class="close-console" onclick="document.getElementById('response-console').style.display='none'">✕</button>
        </header>
        <pre id="response-content">Selecione uma rota para testar...</pre>
      </div>

      <script>
        document.querySelectorAll('.api-form').forEach(form => {
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const consoleBox = document.getElementById('response-console');
            const consoleContent = document.getElementById('response-content');
            consoleBox.style.display = 'flex';
            consoleContent.textContent = 'Enviando requisição...';

            let route = form.getAttribute('data-route') || '';
            const method = form.getAttribute('data-method');
            const needId = form.getAttribute('data-need-id') === 'true';
            
            // Adiciona ID se a rota precisar (PUT / DELETE)
            if (needId) {
              const idVal = form.querySelector('.input-id').value;
              route += '/' + idVal;
            }

            // Injeta o Token automaticamente na URL
            let url = route + '?token=${testToken}';
            
            const options = {
              method: method,
              headers: { 'Content-Type': 'application/json' }
            };

            // Adiciona Query params no GET ou Body nos métodos POST/PUT
            if (method === 'GET') {
              const queryInput = form.querySelector('input[name="query"]');
              if (queryInput && queryInput.value) {
                url += '&' + queryInput.value;
              }
            } else if (method === 'POST' || method === 'PUT') {
              const bodyInput = form.querySelector('input[name="body"]');
              if (bodyInput) {
                try {
                  options.body = JSON.stringify(JSON.parse(bodyInput.value));
                } catch(err) {
                  consoleContent.textContent = 'Erro de sintaxe no JSON fornecido.\\nVerifique as aspas.';
                  return;
                }
              }
            }
              console.log("enviar", url, options);

            try {
              const response = await fetch(url, options);
              const data = await response.json();
              consoleContent.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
              consoleContent.textContent = 'Erro ao conectar com o Servidor:\\n' + error.message;
            }
          });
        });
      </script>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { API };