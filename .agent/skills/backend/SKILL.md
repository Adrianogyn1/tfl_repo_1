---
name: backend
description: Especialista exclusivo em engenharia backend do The Fantasy Life (TFL). Focado em arquitetura mobile-first adaptativa, Server-Driven UI (SDUI), engenharia de redes sociais (feeds, stories/reels 24h, sentimentos 6h, DMs, comentários recursivos, reações, match) e mundos virtuais/games 3D (slots anatômicos, manifestos PBR/Godot/Babylon.js, servidores dedicados, presença volátil em RAM e ledger contábil).
---

# TFL Backend Engineering — Mobile-First, Server-Driven UI, Social & Games Engine

Este documento define os padrões arquiteturais, técnicos e de domínio exclusivos para a engenharia de backend do **The Fantasy Life (TFL)**. O backend do TFL é o cérebro que orquestra a **UI Adaptativa Mobile-First (SDUI)**, a **Rede Social de Avatares** e o **Mundo Virtual 3D**.

---

## 1. Princípios de Engenharia Mobile-First no Backend

A experiência de usuário é primariamente mobile. O backend deve ser projetado para redes celulares instáveis, baixa latência, economia de bateria e telas sensíveis ao toque.

### 1.1 Payloads Compactos e Normalizados
- **Strip de campos desnecessários:** Nunca envie objetos de modelo brutos do Sequelize (`user.toJSON()` com campos como `passwordHash`, `twoFactorSecret` ou metadados de auditoria pesados). Projete projeções explícitas (`attributes: [...]`).
- **Resoluções Adaptativas de Mídia:** Servir URLs de imagens otimizadas com base no header `X-Client-Density` ou no contexto de tela:
  - `thumb`: 150x150 (avatares no feed, chat drawer, lista de amigos).
  - `medium`: 600x600 (cards de fotos, posts do feed em dispositivos móveis).
  - `full`: 1920x1080 (visualizador em lightbox ou capas de perfil).

### 1.2 Paginação Obrigatória por Cursor (Keyset Pagination)
- **Fim do `OFFSET` em Feeds e Listas Móveis:** Consultas com `OFFSET 1000` degradam o banco e causam itens duplicados ou pulados quando novos posts chegam enquanto o usuário rola o feed no celular.
- **Padrão de Cursor:**
  ```javascript
  // Buscar próxima página de posts
  const whereClause = {
    avatarId,
    ...(cursor ? { id: { [Op.lt]: cursor } } : {}) // Id decrescente como cursor temporal
  };
  const posts = await Post.findAll({
    where: whereClause,
    order: [["id", "DESC"]],
    limit: 20
  });
  const nextCursor = posts.length === 20 ? posts[posts.length - 1].id : null;
  ```

### 1.3 Adaptação Contextual por Headers
O backend inspeciona os seguintes headers para adaptar a resposta:
- `X-Client-Platform`: `mobile-web` | `desktop-web` | `game-mobile` | `game-desktop`.
- `X-Client-Version`: Permite compatibilidade regressiva de esquemas SDUI.
- `Accept-Language`: Seleção de strings traduzidas no backend antes da entrega da UI.

---

## 2. Server-Driven UI (SDUI) & Orquestração de Interface no Backend

O backend do TFL não apenas distribui dados: **ele governa a interface do usuário**, ditando o layout, componentes e ações tanto para a web responsiva quanto para clientes móveis e 3D.

### 2.1 Renderização de Parciais SSR/SPA (`/profile/partial/:section`)
Para transições instantâneas estilo SPA no mobile sem recarregar o navegador, o backend provê rotas parciais que renderizam componentes atômicos em EJS:
- **Seções suportadas:** `feed`, `photos`, `diary`, `friends`, `rooms`, `wallet`, `vip`, `settings`.
- **Comportamento do Controller:**
  - Valida a privacidade da seção do avatar alvo (`public`, `friends_only`, `private`).
  - Coleta os dados essenciais da seção com cache quando aplicável.
  - Renderiza exclusivamente o template parcial correspondente (`src/views/profile/partials/<section>.ejs`).
  - Se a requisição for negada por privacidade, o backend devolve o componente de "Acesso Restrito" estilizado para mobile.

### 2.2 Estrutura de Contrato SDUI (Server-Driven Components)
Quando a interface é consumida por clientes dinâmicos ou drawers, o backend envia contratos declarativos:
```json
{
  "screen": "avatar_profile_mobile",
  "components": [
    {
      "type": "story_tray",
      "items": [
        { "id": 101, "avatarUrl": "/...", "hasUnseen": true, "action": { "type": "OPEN_REEL", "payload": { "reelId": 101 } } }
      ]
    },
    {
      "type": "feed_card",
      "id": 542,
      "author": { "name": "Luna", "badge": "VIP_PLATINUM", "frameUrl": "/frames/vip.png" },
      "content": "Aproveitando o pôr do sol na sala de dança!",
      "media": [{ "type": "image", "url": "/photos/542.webp", "aspectRatio": "4:3" }],
      "reactions": { "counts": { "like": 14, "fire": 8 }, "myReaction": "fire" },
      "actions": [
        { "type": "REACT", "endpoint": "/api/v1/posts/542/react" },
        { "type": "OPEN_COMMENTS_BOTTOM_SHEET", "endpoint": "/api/v1/posts/542/comments" }
      ]
    }
  ]
}
```

### 2.3 Componentes Móveis Governados pelo Backend
1. **Drawer de Chat Flutuante (`#tflFloatingChatBubble`):** O backend alimenta a lista de conversas, badge com contagem de não lidas e a cota diária de envio remanescente.
2. **Bottom Sheets de Comentários e Compartilhamento:** O backend formata o payload em árvore pronta para renderização em painéis deslizantes (gavetas de baixo para cima).
3. **Diário / Scrapbook com Timers Ativos:** O backend controla o tempo mínimo de leitura (`active_reading_seconds`) para desbloqueio de recompensas de engajamento e valida a posição dos selos decorativos na página do diário.

---

## 3. Arquitetura de Rede Social

O TFL é uma rede social viva focada em avatares. O backend implementa estruturas especializadas de relacionamento e conteúdo efêmero.

### 3.1 Conteúdo Efêmero e Políticas de TTL
- **Sentimentos do Avatar (Status Rápido):**
  - TTL estrito de **6 horas** (`expiresAt = createdAt + 6 * 3600 * 1000`).
  - Filtro automático em consultas públicas: `where: { expiresAt: { [Op.gt]: new Date() } }`.
- **Mini Reels (Vídeos / Fotos Rápidas):**
  - TTL estrito de **24 horas** (`expiresAt = createdAt + 24 * 3600 * 1000`).
  - Ordenação no anel de stories: Avatares com reels não visualizados pelo usuário aparecem primeiro.
  - Registro atômico de visualizações únicas (`reel_views`).

### 3.2 Comentários Recursivos em Árvore Infinita
- Comentários suportam respostas aninhadas (`parentId`).
- Para evitar problemas de $N+1$ em dispositivos móveis, as buscas devem ser realizadas em lote e montadas em estrutura hierárquica no backend antes do envio:
  ```javascript
  // Buscar comentários do post ordenados por ancestral e data
  const comments = await Comment.findAll({
    where: { postId },
    order: [["createdAt", "ASC"]],
    include: [{ model: Avatar, as: "author", attributes: ["id", "name", "avatarUrl"] }]
  });
  // O backend transforma a lista plana em árvore aninhada
  const commentTree = buildCommentHierarchy(comments);
  ```

### 3.3 Sistema de Reações Polimórficas (7 Emojis Canônicos)
- Tipos aceitos: `like`, `love`, `haha`, `wow`, `sad`, `angry`, `fire`.
- Um avatar pode ter no máximo 1 reação por alvo (post ou foto).
- Ao reagir, o backend realiza atualização atômica no contador de reações do post e dispara notificação em segundo plano se o autor for diferente do reagente.

### 3.4 Relacionamentos Sociais: Amizades vs Seguidores
- **Amizades (Bidirecional):** Requer ciclo `pending` -> `accepted`. Avatares amigos têm acesso a posts com privacidade `friends_only` e prioridade nas salas virtuais.
- **Seguidores (Unidirecional):** Seguir um avatar permite receber seus posts públicos no feed inicial sem necessidade de aprovação recíproca.
- **Matchmaking Social / Crush 💘:**
  - Mecanismo de crush secreto.
  - O avatar marca um crush unidirecional no perfil do outro.
  - O backend verifica silenciosamente se há reciprocidade (`A -> B` e `B -> A`).
  - Se houver reciprocidade mútua, cria o status `MATCHED` e envia notificação simultânea em tempo real via WebSocket.

### 3.5 Cotas Diárias de Chat e Prevenção de Abuso (`chat_daily_quotas`)
- Para evitar spam em redes móveis e proteger a infraestrutura:
  - Jogadores gratuitos possuem cota máxima de mídias/mensagens por dia no chat global e DMs.
  - Assinantes VIP recebem cotas ampliadas ou ilimitadas conforme o tier.
  - O backend checa e decrementa a cota antes de aceitar payloads de mensagens no WebSocket ou na rota `/api/v1/chat/send`.

---

## 4. Engenharia de Games e Mundos Virtuais 3D

O backend atua como servidor mestre de autoridade para o mundo virtual 3D, coordenando a aparência dos avatares, as instâncias de salas e o estado financeiro.

### 4.1 Anatomia Esquelética e 10 Slots de Vestuário
O sistema visual do avatar é governado por 10 slots estritos:
1. `hair` (Cabelo)
2. `head` (Cabeça / Acessórios de cabeça)
3. `eyes` (Olhos / Lentes / Óculos)
4. `top` (Parte superior / Camisas / Jaquetas)
5. `bottom` (Parte inferior / Calças / Saias)
6. `fullbody` (Vestido completo / Macacão / Fantasia integral)
7. `shoes` (Calçados / Botas / Tênis)
8. `accessory` (Colares, brincos, asas, mochilas)
9. `skin` (Textura de pele / Tatuagens / Maquiagens)
10. `animation` (Pacote de animação idle / walk / dance)

#### Matriz de Conflitos e Desequipamento Automático
O backend aplica regras determinísticas na rota de equipar item:
- Se o item for do slot `fullbody`, o backend desequipa automaticamente qualquer item equipado nos slots `top` e `bottom`.
- Se o usuário equipar um item `top` ou `bottom`, qualquer item no slot `fullbody` é desequipado automaticamente.
- O slot `skin` nunca pode ficar vazio; se desequipado, o backend restaura a textura padrão `default_skin`.

### 4.2 Provedor de Manifestos 3D (Godot & Babylon.js)
O backend entrega esquemas completos de renderização na rota `/api/v1/avatars/:id/manifest` e `/api/v1/shop/app-data`:
- **Blendshapes / Morph Targets:** Valores normalizados de 0.0 a 1.0 para altura, peso, formato do rosto, tamanho dos olhos e lábios.
- **Materiais PBR:** Mapas de textura, valores de rugosidade (`roughness`), metálico (`metallic`) e cores hexadecimais de tintura.
- **Nodes de Animação:** IDs de animações compatíveis com o esqueleto base.

### 4.3 Orquestração de Servidores Dedicados de Salas (`servers`)
- As salas 3D rodam como processos dedicados independentes.
- **Auto-Replicação por Lotação:** Quando `playersCount >= maxPlayers` em uma instância, o backend aloca automaticamente uma nova réplica (`Instância #N`) no banco com porta livre (`port` / `publicPort`).
- **Teleporte e Deep Links:** O backend gera URIs de teleporte com autenticação prévia: `tfl://join?room=<id>&server=<serverId>&token=<one_time_ticket>`.
- **Cartões de Sala no Chat:** Ao compartilhar uma sala no chat, o backend anexa o snapshot em tempo real da sala (nome, thumbnail, lotação atual e status de réplica).

### 4.4 Presença em Tempo Real Volátil em RAM
- **Zero Disk I/O para Heartbeats:** Posições, batimentos de presença de avatares e contagem em salas residem exclusivamente em memória RAM com TTL de 45 segundos.
- Se um heartbeat não for recebido em 45 segundos, a presença é invalidada e o evento de desconexão é propagado no WebSocket.

---

## 5. Economia Fechada e Ledger Contábil Imutável

A integridade econômica do jogo e da rede social depende de regras matemáticas estritas no backend.

### 5.1 Tri-Moeda e Suas Fronteiras
- **`Cash`:** Moeda fiduciária interna lastreada em Reais. Entra por Pix dinâmico e sai por Saque Pix aprovado pela administração. **Estritamente intransferível entre jogadores.**
- **`Coins`:** Moeda virtual do jogo. Obtida por conversão de Cash, recompensas, vendas no mercado e a **única moeda permitida para doações e transferências P2P entre avatares**.
- **`Chips`:** Moeda fechada de cassino e apostas. Utilizada exclusivamente em jogos de sorte/habilidade. Não transferível entre jogadores.

### 5.2 Ledger Contábil com Locking Atômico
- Nenhuma operação altera saldo com simples `wallet.cash += amount`.
- Toda alteração exige transação com bloqueio pessimista (`t.LOCK.UPDATE`) e inserção simultânea no `wallet_ledger`:
  ```javascript
  await sequelize.transaction(async (t) => {
    const wallet = await Currency.findOne({
      where: { avatarId },
      lock: t.LOCK.UPDATE,
      transaction: t
    });
    if (wallet.coins < price) throw new Error("Saldo insuficiente em Coins");
    
    const balanceBefore = wallet.coins;
    wallet.coins -= price;
    const balanceAfter = wallet.coins;
    await wallet.save({ transaction: t });

    await WalletLedger.create({
      avatarId,
      currencyType: "Coins",
      type: "ITEM_PURCHASE",
      amount: -price,
      balanceBefore,
      balanceAfter,
      metadata: { itemId }
    }, { transaction: t });
  });
  ```
- **Imutabilidade do `wallet_ledger`:** Somente operações `INSERT`. É proibido atualizar ou deletar linhas de extrato contábil.

---

## 6. Blindagem de Banco de Dados (PostgreSQL + Sequelize)

### 6.1 Proibição de `unique: true` com `defaultValue` no Atributo
- O Sequelize gera sintaxe incompatível no PostgreSQL: `ALTER COLUMN "col" SET DEFAULT 'val' UNIQUE;`.
- **REGRA INVIOLÁVEL:** Defina índices e unicidades unicamente no array `options.indexes`:
  ```javascript
  // CERTO:
  sequelize.define("PostReaction", {
    type: { type: DataTypes.STRING, defaultValue: "like" }
  }, {
    indexes: [
      { unique: true, fields: ["postId", "avatarId"] }
    ]
  });
  ```

### 6.2 Cache em Memória com TTL de 60s
- Endpoints com agregação pesada (contagem de visitantes, total de curtidas do perfil, rankings de salões) devem usar cache em memória com TTL mínimo de 60 segundos (`STATS_CACHE_TTL_MS = 60000`).

---

## 7. Regras de Segurança e Isolamento Estrito

1. **Nunca expor nomes de engines ("Godot"), APIs internas ou endpoints privados em páginas ou rotas públicas.**
2. **Separação de Rotas:**
   - Rotas públicas/jogador: `/`, `/profile`, `/tutorial`, `/market`.
   - Rotas parciais de interface: `/profile/partial/:section`.
   - APIs internas: `/api/v1/*` (protegidas por tokens `Authorization: Bearer`, `tfl-token`, `x-profile-id`).
   - Painel administrativo: `/admin/*` (protegidas por `requireAdminAuth`).
3. **Senhas:** Usar `encryptPassword` de `src/controllers/auth.js`.
4. **Registro Obrigatório de Memória:** Toda alteração de endpoints, modelos, schemas SDUI ou regras de negócio exige adicionar uma nova entrada `[LOG #XX]` no arquivo `/media/not/Projetos/WebSite/PROJECT_MEMORY_LOG.txt`.
