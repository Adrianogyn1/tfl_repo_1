# The Fantasy Life (TFL) — Documentação Completa da Arquitetura, Banco de Dados & API

---

## 1. Visão Geral da Arquitetura do Sistema

**The Fantasy Life (TFL)** é uma plataforma integrada de:
1. **Rede Social de Avatares**: Múltiplos avatares (`Avatar`) por conta (`User`), perfis individuais, amigos, match/crush, publicações, galeria de fotos, Mini Reels (24h) e Sentimentos (6h).
2. **Diário Secreto & Cantinho de Desabafo Anônimo**: Escrita em folha de caderno real, anonimato blindado para confissões públicas, selos postais de sentimentos e sistema de leitura premiada em `Coins` com prevenção contra auto-farm.
3. **Mundo Virtual 3D & Cluster de Servidores**: Salas virtuais 3D (`RoomModel`) com instâncias de servidores dedicados na tabela `servers`. Auto-replicação automática de portas e servidores à medida que as salas lotam (`playersCount >= maxPlayers`).
4. **Economia Virtual Fechada & Bolsa P2P**: Três moedas virtuais (`Cash`, `Coins`, `Chips`), Livro-Razão (`wallet_ledger`), transferências P2P de moedas do jogo com taxa baixa configurável, compra via Pix dinâmico e saque Pix.
5. **Clube VIP**: Planos de 1 semana, 1 mês e 3 meses em Cash com cotas expandidas de chat de voz/imagem e selo distintivo.
6. **Loja 3D & Guarda-Roupa Modular**: Slots anatômicos padronizados (`hair`, `head`, `eyes`, `top`, `bottom`, `feet`, `accessory`, `hand`) com prefabs e materiais prontos para consumo da Godot Engine e Babylon.js.
7. **Central de Comando Administrativo (`/admin`)**: Gestão de contas, saldo com auditoria no livro-razão, controle de servidores de jogo, moderação de conteúdo e regras econômicas.

---

## 2. Banco de Dados, Modelos e Relacionamentos (Sequelize / PostgreSQL)

### 2.1 Principais Entidades e Atributos

| Modelo | Tabela | Descrição e Chaves |
|---|---|---|
| `User` | `users` | Conta global do jogador. Campos: `id`, `login`, `password`, `email`, `token`, `role` (`player`, `moderador`, `desenvolvedor`, `ownner`, `admin`). |
| `Avatar` | `avatars` | Identidade e personagem no mundo virtual. Campos: `id`, `userId` (FK), `name`, `gender`, `bio`, `vip`, `isVip`, `vipPlan`, `vipExpiresAt`, `thumbnail`, `coverUrl`, privacidades granulares (`privacyPosts`, `privacyPhotos`, `privacyRooms`, `privacyFriends`, `privacyFollowers`). |
| `Currency` | `currencies` | Carteira financeira do avatar. Campos: `id`, `avatarId` (FK), `userId`, `cash`, `coins`, `chips`, `pixKey`, `pin`. |
| `CurrencyRegister` | `currency_register` | Registro histórico de movimentações. Campos: `id`, `currencyId` (FK), `userId`, `type`, `transactionType`, `value`, `description`. |
| `WalletLedger` | `wallet_ledger` | Livro-razão contábil com dupla entrada e auditoria. |
| `CoinOrder` | `coin_orders` | Ordens de compra/venda na Bolsa P2P com pote FIFO de liquidez. |
| `EconomyRule` | `economy_rules` | Regras globais de spread, cotações, taxas P2P, cassino e leitura premiada. |
| `RoomModel` | `rooms` | Salas virtuais 3D. Campos: `id`, `avatarId` (FK), `name`, `description`, `maxPlayers`, `entryValue`, `entryFeeCoins`, `featuredUntil`, `scene`, `isPrivate`. |
| `ServerModel` | `servers` | Instâncias de servidores dedicados online. Campos: `id`, `roomId` (FK), `ip`, `port`, `publicPort`, `playersCount`, `maxPlayers`, `status`, `isClosed`, `region`. |
| `ObjectModel` | `room_objects` | Objetos e decorações instanciados na sala 3D (`position`, `rotation`, `scale`, `addressable`). |
| `Terrain` | `terrains` | Terreno 3D associado à sala. Campos: `id`, `roomId` (FK), `path`, `hash`, `materials`, `trees`. |
| `ShopContainer` | `shop_containers` | Produtos 3D da loja oficial e catálogo. Campos: `id`, `avatarId` (FK), `title`, `itemName`, `slot`, `model`, `prefabPath`, `price`, `currencyType`. |
| `Inventory` | `avatar_inventory` | Itens 3D adquiridos pelo avatar. Campos: `id`, `avatarId` (FK), `itemId` (FK `ShopContainer`), `slot`, `isEquipped`, `customColors`. |
| `AvatarOutfit` | `avatar_outfits` | Registro de vestimentas ativas no esqueleto 3D. |
| `AvatarOutfitStyle` | `avatar_outfit_styles` | Predefinições de trajes salvas pelo jogador. |
| `Post` | `posts` | Publicações do mural social. |
| `Photo` | `photos` | Fotos da galeria do avatar. |
| `Comment` | `comments` | Comentários hierárquicos e recursivos em posts, fotos e reels. |
| `Like` | `likes` | Reações empáticas (`like`, `love`, `care`, `haha`, `wow`, `sad`, `angry`). |
| `MiniReel` | `mini_reels` | Mini Reels temporários (24h) e Sentimentos com emojis (6h). |
| `Friend` | `friends` | Vínculos de amizade (`profileId`, `targetProfileId`, `status`). |
| `MatchProfile` | `match_profiles` | Interações de Crush / Match 💘. |
| `Follow` | `follows` | Seguidores entre avatares. |
| `ChatRoom` | `chats` | Salas de chat (`private`, `group`, `global`). |
| `ChatMessage` | `chat_messages` | Mensagens de texto, áudio, fotos e cartões de sala 3D. |
| `ChatParticipant` | `chat_participants` | Participação de avatares nas salas de bate-papo. |
| `DiaryPage` | `diary_pages` | Páginas de diário (privadas ou desabafo público anônimo). |
| `DiaryReaction` | `diary_reactions` | Reações anônimas em páginas do diário. |
| `DiaryComment` | `diary_comments` | Comentários anônimos e empáticos. |
| `DiaryReadingSession`| `diary_reading_sessions` | Sessões de leitura com tempo acumulado e recompensa anti-farm. |

---

## 3. Árvore de Interação do Sistema

```mermaid
graph TD
    subgraph Clientes Externos & Frontends
        WEB["🌐 Navegador Web (EJS + Tailwind + Vanilla JS)"]
        GODOT_C["🎮 Godot Client (Mundo 3D + Menus Mobile)"]
        GODOT_S["🖥️ Godot Dedicated Server (Instâncias servers)"]
        BABYLON["🔮 Babylon.js (Visualizador 3D no Navegador)"]
    end

    subgraph Camada de Autenticação & Entrada
        MIDDLEWARE["🛡️ Token & Session Middleware\n(tfl-token / Bearer Token / x-server-token)"]
    end

    subgraph Roteamento Central (/api/v1 & /profile)
        API_AUTH["🔐 Auth API (/api/auth)"]
        API_SOCIAL["👥 Social API (/api/v1/social)"]
        API_CHAT["💬 Chat API & WS (/api/chats & /ws/chat)"]
        API_BANK["💰 Economia & Carteira (/api/v1/bank)"]
        API_ROOMS["🏠 Salas 3D & Servidores (/api/v1/game & /room)"]
        API_SHOP["👗 Loja 3D & Guarda-Roupa (/api/v1/shop)"]
        API_CASINO["🎰 Cassino TFL (/api/v1/casino)"]
        API_DIARY["📖 Diário & Desabafo Anônimo (/api/v1/diary)"]
        API_VIP["👑 Clube VIP (/api/v1/vip)"]
        ADMIN_API["⚙️ Central Admin Protegida (/admin/api)"]
    end

    subgraph Serviços de Domínio
        SRV_MARKET["coinMarket.service.js\n(Bolsa FIFO, P2P, Replicação Servidores)"]
        SRV_DIARY["diary.service.js\n(Anonimato Blindado, Recompensa Leitura)"]
        SRV_SHOP["shop3d.service.js\n(Catálogo, Guarda-Roupa, Estilos)"]
        SRV_STATS["stats.service.js\n(Métricas, Telemetria, Limpeza)"]
    end

    subgraph Banco de Dados (PostgreSQL + Sequelize)
        DB_USERS[(users / avatars)]
        DB_WALLETS[(currencies / wallet_ledger / coin_orders)]
        DB_ROOMS[(rooms / servers / room_objects / terrains)]
        DB_SOCIAL[(posts / photos / mini_reels / friends / chats)]
        DB_DIARY[(diary_pages / diary_reading_sessions)]
        DB_SHOP[(shop_containers / avatar_inventory / avatar_outfits)]
    end

    WEB --> MIDDLEWARE
    GODOT_C --> MIDDLEWARE
    GODOT_S --> MIDDLEWARE
    BABYLON --> MIDDLEWARE

    MIDDLEWARE --> API_AUTH
    MIDDLEWARE --> API_SOCIAL
    MIDDLEWARE --> API_CHAT
    MIDDLEWARE --> API_BANK
    MIDDLEWARE --> API_ROOMS
    MIDDLEWARE --> API_SHOP
    MIDDLEWARE --> API_CASINO
    MIDDLEWARE --> API_DIARY
    MIDDLEWARE --> API_VIP
    MIDDLEWARE --> ADMIN_API

    API_BANK --> SRV_MARKET
    API_ROOMS --> SRV_MARKET
    API_DIARY --> SRV_DIARY
    API_SHOP --> SRV_SHOP
    ADMIN_API --> SRV_STATS

    SRV_MARKET --> DB_WALLETS
    SRV_MARKET --> DB_ROOMS
    SRV_DIARY --> DB_DIARY
    SRV_DIARY --> DB_WALLETS
    SRV_SHOP --> DB_SHOP
    API_SOCIAL --> DB_SOCIAL
    API_AUTH --> DB_USERS
```

---

## 4. Fluxo de Vida e Interações Chave

### 4.1 Autenticação e Alternância de Avatares
1. Cliente envia `POST /api/auth/signin` com `{ login, password }`.
2. Servidor valida credenciais, retorna `token`, dados do usuário e lista de avatares vinculados.
3. Requisições subsequentes utilizam o header `Authorization: Bearer <token>` ou `tfl-token: <token>`.
4. Para definir qual avatar está em uso, utiliza-se `POST /api/v1/account/switch-avatar` ou o header `x-profile-id: <avatarId>`. Se omitido, o avatar marcado com `selected = true` é adotado automaticamente.

### 4.2 Auto-Replicação de Salas Cheias (`servers`)
1. Jogador solicita entrada em uma sala 3D via `POST /api/v1/game/room/:id/enter`.
2. O serviço `coinMarket.service.js` verifica a capacidade das instâncias ativas na tabela `servers`.
3. Se todas as instâncias estiverem cheias (`playersCount >= maxPlayers`), o sistema aloca automaticamente uma nova réplica (`Instância #2`, `Instância #3`...) com porta dedicada (`port` / `publicPort`).
4. O cliente Godot ou Babylon recebe as credenciais de conexão direta (`ip`, `publicPort`, `scene`).

### 4.3 Cantinho de Desabafo Anônimo & Leitura Premiada
1. Autor escreve sua folha de caderno via `POST /api/v1/diary/page/save`. Se marcar `isPublicAnonymous = true`, o backend oculta `userId` e `avatarId`, gerando pseudônimos líricos (ex: *"Coração de Papel #308"*).
2. Leitores acessam o mural via `GET /api/v1/diary/overview` e realizam a leitura acompanhados pelo cronômetro imersivo.
3. Ao atingir o tempo mínimo configurado (`diaryMinReadSeconds`, padrão 30s), o cliente envia `POST /api/v1/diary/page/:id/read-reward`.
4. O backend registra a leitura em `diary_reading_sessions` com restrição de idempotência (`UNIQUE(pageId, readerUserId, monthKey)`), credita `Coins` na carteira do leitor e do autor anônimo e registra no `wallet_ledger`.

---

## 5. Referência Completa de Endpoints da API REST (`/api/v1/*`)

Todas as rotas da API aceitam os headers:
- `Authorization: Bearer <token>` ou `tfl-token: <token>`
- `x-profile-id: <avatarId>` (opcional)
- `x-server-token: <serverMasterKey>` (para servidores dedicados de jogo)

### 5.1 Autenticação & Avatares
- `POST /api/auth/signin` — Login e geração de token.
- `POST /api/auth/signup` — Registro de nova conta.
- `GET /api/v1/account/overview` — Visão completa de avatares, saldos e notificações.
- `POST /api/v1/account/switch-avatar` — Alterna o avatar ativo da conta.
- `POST /api/v1/account/avatar/create` — Criação de novo avatar.
- `POST /api/v1/account/avatar/update` — Atualiza nome, bio, thumbnail e gênero.
- `POST /api/v1/account/avatar/customize` — Atualiza capa e privacidades granulares.

### 5.2 Social, Amigos & Match
- `GET /api/v1/social/feed?filter=all|friends|mine` — Feed social respeitando privacidade.
- `POST /api/v1/social/posts` — Publica texto, imagem ou endereço de sala 3D.
- `POST /api/v1/social/posts/:id/share` — Compartilha publicação.
- `POST /api/v1/social/posts/:id/delete` — Exclui publicação.
- `POST /api/v1/social/react` — Reage a post, foto, comentário ou sala.
- `POST /api/v1/social/comment` — Comentário e resposta recursiva.
- `GET /api/v1/social/gallery` — Galeria de fotos paginada (20/página).
- `POST /api/v1/social/gallery` — Envia nova foto para a galeria.
- `GET /api/v1/social/reels` — Retorna Mini Reels (24h) e Sentimentos com emojis (6h).
- `POST /api/v1/social/reels` — Publica Mini Reel ou Sentimento.
- `POST /api/v1/social/follow` — Seguir / Deixar de seguir avatar.
- `POST /api/v1/social/match` — Envia Crush / Match (abre DM mútua).
- `GET /api/v1/social/friends/list` — Lista de amigos aceitos, pendentes e sugestões.
- `POST /api/v1/social/friends/request` — Envia solicitação de amizade.
- `POST /api/v1/social/friends/accept` — Aceita amizade e inicializa DM privada.

### 5.3 Diário & Desabafo Anônimo
- `GET /api/v1/diary/overview` — Páginas anônimas do mural e páginas do diário privado.
- `POST /api/v1/diary/page/save` — Salva folha de caderno com selo de sentimento.
- `POST /api/v1/diary/page/:id/visibility` — Alterna entre privado e público anônimo.
- `POST /api/v1/diary/page/:id/delete` — Remove página do diário.
- `POST /api/v1/diary/page/:id/react` — Reage anonimamente com carinho/apoio.
- `POST /api/v1/diary/page/:id/comment` — Comenta anonimamente na página.
- `POST /api/v1/diary/page/:id/read-reward` — Submete progresso de leitura premiada em Coins.

### 5.4 Salas Virtuais 3D & Cluster de Servidores
- `GET /api/v1/game/rooms` — Lista salas do avatar.
- `GET /api/v1/game/rooms/explore` — Explorador público com ranking de visitas mensais.
- `POST /api/v1/game/room/create` — Cria nova sala 3D.
- `POST /api/v1/game/room/:id/enter` — Entra na sala (valida passe 24h e aloca réplica).
- `POST /api/v1/game/room/:id/boost` — Impulsiona sala 3D no topo por 24h.
- `GET /api/v1/game/room/:id/details` — Retorna dados para renderização 3D (objetos e terreno).
- `GET /api/v1/room/:id/servers` — Lista instâncias ativas na tabela `servers`.
- `POST /api/v1/room/:id/replicate` — Força alocação de réplica dedicada.

### 5.5 Loja 3D & Guarda-Roupa
- `GET /api/v1/shop/catalog` — Catálogo oficial de itens 3D com preços e slots.
- `GET /api/v1/shop/wardrobe` — Guarda-roupa do avatar e itens equipados.
- `POST /api/v1/shop/equip` — Equipa ou desequipa item em slot específico.
- `POST /api/v1/shop/buy` — Compra item 3D com Coins ou Cash.
- `GET /api/v1/shop/app-data` — Retorna manifesto 3D estruturado para Babylon/Godot.
- `POST /api/v1/game/shop/gift` — Envia item 3D de presente para outro jogador.

### 5.6 Carteira & Economia P2P
- `GET /api/v1/bank/wallet` — Saldos em Cash, Coins e Chips.
- `GET /api/v1/wallet/paginated?type=ledger|orders|transactions&page=1` — Extrato paginado (20/pág).
- `POST /api/v1/bank/transfer-coins` — Transfere moedas do jogo (Coins) com taxa configurada.
- `GET /api/v1/bank/market/stats` — Cotações, taxa de spread e ordens ativas na Bolsa.
- `POST /api/v1/bank/market/buy` — Compra Coins consumindo o livro FIFO.
- `POST /api/v1/bank/market/sell` — Cria ordem de venda de Coins.
- `POST /api/v1/bank/market/cancel` — Cancela ordem de venda e estorna saldo.
- `POST /api/v1/bank/market/convert` — Conversor instantâneo de moedas.
- `POST /api/v1/bank/market/pix/create` — Gera cobrança Pix para recarga de Cash.
- `POST /api/v1/bank/market/withdraw` — Solicita saque Pix de Cash.

### 5.7 Clube VIP
- `GET /api/v1/vip/status` — Status VIP, selo ativo e cotas diárias de envio de voz/mídia.
- `POST /api/v1/vip/subscribe` — Assina plano VIP (`1_WEEK`, `1_MONTH`, `3_MONTHS`) com Cash.

### 5.8 Cassino TFL
- `GET /api/v1/casino/status` — Fichas disponíveis, jogos suportados (`slots`, `roulette`, `dice`) e limites de aposta.
- `POST /api/v1/casino/play` — Executa jogada com débito/crédito em Chips.

### 5.9 Chat & Comunicação em Tempo Real
- `GET /api/chats` — Lista conversas ativas.
- `GET /api/chats/vip-quota` — Cotas de áudio e imagem para membro Básico vs VIP.
- `POST /api/chats/direct` — Abre conversa direta com amigo.
- `POST /api/chats/group` — Cria sala de grupo com múltiplos amigos.
- `GET /api/chats/:uid/messages` — Histórico de mensagens paginado.
- `POST /api/chats/:uid/messages` — Envia mensagem de texto.
- `POST /api/chats/:uid/messages/media` — Envia áudio ou imagem.
- `POST /api/chats/:uid/messages/room-invite` — Compartilha convite para Sala 3D com status do servidor.
- `WS /ws/chat?profileId=<avatarId>` — Conexão WebSocket para eventos em tempo real.
