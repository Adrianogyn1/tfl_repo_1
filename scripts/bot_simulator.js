#!/usr/bin/env node
/**
 * ============================================================================
 * THE FANTASY LIFE — SIMULADOR DE BOTS 100% VIA API (REST + WEBSOCKET)
 * ============================================================================
 * Simula N usuários autônomos interagindo com todo o ecossistema do site
 * exclusivamente através das rotas da API (/api/auth/*, /api/v1/*) e do
 * WebSocket em tempo real (/ws/chat), exatamente como clientes Web e Godot.
 *
 * Ações executadas por cada Bot:
 *  1. Cria conta (POST /api/auth/signup) ou autentica (POST /api/auth/signin)
 *  2. Cria avatar (POST /api/v1/game/avatar/create) com foto, capa e privacidade
 *  3. Seleciona avatar ativo (POST /api/v1/game/switch-avatar) e edita perfil/capa
 *  4. Cria e atualiza Sala 3D (POST /api/v1/game/room/create & /room/update)
 *  5. Publica fotos na Galeria (POST /api/v1/social/gallery)
 *  6. Publica Sentimento 6h e Mini Reel 24h (POST /api/v1/social/reels)
 *  7. Cria Posts no Feed Social com texto, foto e Sala 3D (POST /api/v1/social/posts)
 *  8. Reage (like, love, care, haha, wow, sad, angry) a:
 *     - Publicações (post), Fotos (photo), Perfis (profile),
 *     - Salas 3D (room), Mini Reels (reel) e Comentários (comment)
 *  9. Comenta em Posts, Fotos, Mini Reels e responde Comentários recursivamente!
 * 10. Compartilha publicações de outros usuários (POST /api/v1/social/posts/:id/share)
 * 11. Segue avatares (POST /api/v1/social/follow) e dá Match/Crush (POST /api/v1/social/match)
 * 12. Envia e aceita pedidos de Amizade (POST /api/v1/social/friends/request & /accept)
 * 13. Conecta via WebSocket (/ws/chat) e interage no Chat Global, DMs e Grupos
 * 14. Opera o Conversor de Moedas na Carteira (POST /api/v1/bank/market/convert)
 *
 * Como usar no terminal:
 *   node scripts/bot_simulator.js
 *   node scripts/bot_simulator.js --bots=10 --rounds=3 --delay=150
 *   node scripts/bot_simulator.js --bots=6 --continuous
 * ============================================================================
 */

const axios = require("axios");
const WebSocket = require("ws");

// ----------------------------------------------------------------------------
// Dados realistas para geração dos Bots
// ----------------------------------------------------------------------------
const BOT_ARCHETYPES = [
  { name: "Luna Starlight", gender: 2, bio: "Exploradora de mundos virtuais, colecionadora de arte 3D e fã de música eletrônica ✨🌌" },
  { name: "Kael Vortex", gender: 1, bio: "Construtor de salas cyberpunk e trader na bolsa de Coins do TFL 🚀💹" },
  { name: "Maya Solis", gender: 2, bio: "Fotógrafa do metaverso! Amo registrar momentos com a galera 📸🌸" },
  { name: "Drake Sterling", gender: 1, bio: "DJ nas festas de sexta-feira nas salas VIP. Chega mais! 🎧🔥" },
  { name: "Ayla Neon", gender: 2, bio: "Criadora de avatares e apaixonada por estética futurista 💜⚡" },
  { name: "Zane Horizon", gender: 1, bio: "Sempre online no Chat Global trocando ideia e fazendo novos amigos 🤝🌍" },
  { name: "Chloe Velvet", gender: 2, bio: "Decoradora de mansões 3D e caçadora de conquistas raras 🏆🏡" },
  { name: "Liam Striker", gender: 1, bio: "Competidor nos mini-games e colecionador de itens lendários 🎮⚔️" },
  { name: "Sofia Aurora", gender: 2, bio: "Amante de pores do sol digitais, boas conversas e cafés virtuais ☕🌅" },
  { name: "Noah Quantum", gender: 1, bio: "Desenvolvedor de experiências interativas e entusiasta de Godot Engine 🤖🕹️" },
  { name: "Valentina Luxe", gender: 2, bio: "Organizadora de desfiles e eventos sociais no The Fantasy Life 👑💎" },
  { name: "Lucas Mirage", gender: 1, bio: "Viajante entre salas públicas, curtindo cada canto do universo TFL 🌟🛸" },
];

const SAMPLE_PHOTOS = [
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80",
];

const SAMPLE_COVERS = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80",
];

const SAMPLE_FEELINGS = [
  { emoji: "🤩", label: "Empolgado", text: "Testando todas as novidades do portal e do Godot!" },
  { emoji: "🔥", label: "Focado", text: "Construindo a sala mais insana do servidor!" },
  { emoji: "😎", label: "Relaxando", text: "Curtindo uma música na cobertura virtual." },
  { emoji: "🎮", label: "Jogando", text: "Bora entrar no mapa principal galera!" },
  { emoji: "💜", label: "Apaixonado", text: "Esse visual novo com ícones ficou perfeito demais!" },
  { emoji: "🚀", label: "Produtivo", text: "Negociando lotes de Coins na bolsa de valores!" },
  { emoji: "🎉", label: "Festejando", text: "Festa aberta na minha sala 3D agora mesmo!" },
];

const SAMPLE_REEL_BG = [
  "from-blue-700 via-indigo-800 to-purple-900",
  "from-pink-600 via-rose-700 to-purple-900",
  "from-emerald-600 via-teal-800 to-slate-900",
  "from-amber-600 via-orange-700 to-red-900",
];

const SAMPLE_POST_TEXTS = [
  "Acabei de inaugurar minha nova Sala 3D! Quem quiser visitar e trocar uma ideia, está aberta para todos! 🏡✨",
  "Olhem essa captura que tirei hoje no metaverso! A iluminação está incrível 📸🌌",
  "Alguém acompanhando a cotação dos Coins hoje? Acabei de converter meus Chips na carteira! 💹💰",
  "Adicionando amigos novos para a festa de hoje à noite no lobby! Mandem convite 🤝🎧",
  "Testando a integração da API v1 com o cliente Godot Engine — velocidade absurda! 🚀🕹️",
  "Qual é a boa de hoje no Chat Global, pessoal? Bora interagir! 💬🔥",
];

const SAMPLE_COMMENTS = [
  "Ficou sensacional demais!! 🔥👏",
  "Eu quero visitar! Já estou entrando pela sala 3D!",
  "Que foto incrível, parabéns pelo estilo! 😍✨",
  "Concordo 100%, o sistema está muito rápido!",
  "Me adiciona lá na lista de amigos pra gente jogar junto! 🤝",
  "Hahaha muito bom! Melhor comunidade! 💜🚀",
];

const SAMPLE_REPLIES = [
  "Valeu demais pelo apoio! Tamo junto! 🙌✨",
  "Com certeza! Já te mandei solicitação de amizade lá!",
  "Bora lá no Chat Global combinar o próximo evento! 🎉",
  "Obrigado!! Depois dá uma olhada na minha galeria de fotos também! 📸",
];

const SAMPLE_GLOBAL_CHAT_MESSAGES = [
  "Salve galera do Chat Global! Quem está online agora? 👋🌍",
  "Pessoal, acabei de postar fotos novas na galeria e abrir minha sala 3D! 🏡✨",
  "Alguém quer trocar ideia ou fechar grupo pra explorar os mapas? 🎮🚀",
  "O sistema de Match e de Mini Reels de 24h ficou muito top! 😍🔥",
  "Passando pra desejar um ótimo jogo a todos no The Fantasy Life! 💜🌟",
  "Quem quiser fazer amizade, só clicar no meu perfil e mandar convite! 🤝",
];

const REACTION_TYPES = ["like", "love", "care", "haha", "wow", "sad", "angry"];

const BOT_REGIONS = [
  "Brasil — Sudeste (SP/RJ/MG)",
  "Brasil — Sul (PR/SC/RS)",
  "Brasil — Nordeste (BA/PE/CE)",
  "Brasil — Centro-Oeste (DF/GO)",
  "Brasil — Norte (AM/PA)",
  "Portugal — Lisboa / Porto",
  "Estados Unidos — Costa Leste",
  "Espanha — Madrid / Barcelona",
  "Argentina — Buenos Aires",
];

// ----------------------------------------------------------------------------
// Utilitários
// ----------------------------------------------------------------------------
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function parseCliArgs(argv) {
  const opts = {
    baseUrl: process.env.BOT_BASE_URL || `http://localhost:${process.env.PORT || 5000}`,
    botsCount: Number(process.env.BOTS || 6),
    rounds: Number(process.env.ROUNDS || 2),
    delayMs: Number(process.env.DELAY_MS || 120),
    continuous: false,
    verbose: true,
  };

  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--bots=")) opts.botsCount = Math.max(1, Number(arg.split("=")[1]) || 6);
    else if (arg.startsWith("--rounds=")) opts.rounds = Math.max(1, Number(arg.split("=")[1]) || 2);
    else if (arg.startsWith("--delay=")) opts.delayMs = Math.max(10, Number(arg.split("=")[1]) || 120);
    else if (arg.startsWith("--url=")) opts.baseUrl = arg.split("=")[1];
    else if (arg === "--continuous") opts.continuous = true;
    else if (arg === "--quiet") opts.verbose = false;
  }
  return opts;
}

// ----------------------------------------------------------------------------
// Classe BotAgent — Representa 1 Usuário Virtual operando 100% via API + WS
// ----------------------------------------------------------------------------
class BotAgent {
  constructor(index, baseUrl, metrics, logFn) {
    this.index = index;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.wsUrl = this.baseUrl.replace(/^http/i, "ws") + "/ws/chat";
    this.metrics = metrics;
    this.log = logFn;

    const archetype = BOT_ARCHETYPES[(index - 1) % BOT_ARCHETYPES.length];
    const suffix = index > BOT_ARCHETYPES.length ? ` #${index}` : "";
    this.displayName = `${archetype.name}${suffix}`;
    this.gender = archetype.gender;
    this.bio = archetype.bio;
    this.region = BOT_REGIONS[(index - 1) % BOT_REGIONS.length];
    this.login = `tfl_bot_${index}`;
    this.password = `BotPass@${index}_2026`;
    this.email = `bot${index}@thefantasylife.bot`;

    this.token = null;
    this.userId = null;
    this.avatarId = null;
    this.roomId = null;
    this.ws = null;
    this.globalRoomUid = null;

    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      validateStatus: () => true,
      headers: {
        "x-visitor-region": this.region,
      },
    });
  }

  setAuth(token, avatarId = null) {
    this.token = token;
    if (avatarId) this.avatarId = Number(avatarId);

    this.api.defaults.headers.common["tfl-token"] = token;
    this.api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    if (this.avatarId) {
      this.api.defaults.headers.common["x-profile-id"] = String(this.avatarId);
    }
  }

  recordMetric(key, ok = true) {
    if (!this.metrics.actions[key]) {
      this.metrics.actions[key] = { ok: 0, fail: 0 };
    }
    if (ok) {
      this.metrics.actions[key].ok += 1;
      this.metrics.totalSuccess += 1;
    } else {
      this.metrics.actions[key].fail += 1;
      this.metrics.totalErrors += 1;
    }
  }

  // 1. Cria conta ou faz login via /api/auth
  async authenticate() {
    let res = await this.api.post("/api/auth/signup", {
      login: this.login,
      password: this.password,
      userName: this.displayName,
      email: this.email,
      age: randInt(19, 32),
    });

    if (res.status === 201 && res.data?.token) {
      this.userId = res.data.user?.id || res.data.data?.id;
      this.setAuth(res.data.token);
      this.recordMetric("auth_signup", true);
      this.log(`🤖 [Bot #${this.index}] Conta criada via API: ${this.login} (userId=${this.userId})`);
      return true;
    }

    // Se já existe (409), faz login em /api/auth/signin
    res = await this.api.post("/api/auth/signin", {
      login: this.login,
      password: this.password,
    });

    if (res.status === 200 && res.data?.token) {
      this.userId = res.data.user?.id || res.data.data?.id;
      this.setAuth(res.data.token);
      this.recordMetric("auth_signin", true);
      this.log(`🔑 [Bot #${this.index}] Login realizado via API: ${this.login} (userId=${this.userId})`);
      return true;
    }

    this.recordMetric("auth_signin", false);
    this.log(`❌ [Bot #${this.index}] Falha ao autenticar (${res.status}): ${JSON.stringify(res.data)}`);
    return false;
  }

  // 2. Garante avatar criado, selecionado e customizado (foto, capa, privacidade)
  async setupAvatarAndRoom() {
    const overviewRes = await this.api.get("/api/v1/social/overview");
    const existingAvatars = overviewRes.data?.avatars || [];

    const avatarThumb = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(this.displayName)}&backgroundColor=0284c7,7c3aed,db2777`;
    const coverUrl = SAMPLE_COVERS[(this.index - 1) % SAMPLE_COVERS.length];

    if (existingAvatars.length === 0) {
      const createRes = await this.api.post("/api/v1/game/avatar/create", {
        name: this.displayName,
        bio: this.bio,
        gender: this.gender,
        thumbnail: avatarThumb,
        coverUrl,
        privacyPosts: "public",
        privacyPhotos: "public",
        privacyRooms: "public",
        privacyFriends: "public",
        privacyFollowers: "public",
      });

      if (createRes.data?.success && createRes.data?.avatar?.id) {
        this.setAuth(this.token, createRes.data.avatar.id);
        this.recordMetric("avatar_create", true);
        this.log(`🎭 [Bot #${this.index}] Avatar criado: "${this.displayName}" (avatarId=${this.avatarId})`);
      } else {
        this.recordMetric("avatar_create", false);
      }
    } else {
      const chosen = existingAvatars.find((a) => a.selected) || existingAvatars[0];
      this.setAuth(this.token, chosen.id);
    }

    if (!this.avatarId) return false;

    // Seleciona o avatar como ativo
    const switchRes = await this.api.post("/api/v1/game/switch-avatar", {
      avatarId: this.avatarId,
    });
    this.recordMetric("avatar_switch", !!switchRes.data?.success);

    // Atualiza / Customiza capa e privacidade via API
    const custRes = await this.api.post("/api/v1/game/avatar/customize", {
      avatarId: this.avatarId,
      coverUrl,
      privacyPosts: "public",
      privacyPhotos: "public",
      privacyRooms: "public",
      privacyFriends: "public",
      privacyFollowers: "public",
    });
    this.recordMetric("avatar_customize_cover_privacy", !!custRes.data?.success);

    // Atualiza bio e foto de perfil do avatar
    const updRes = await this.api.post("/api/v1/game/avatar/update", {
      avatarId: this.avatarId,
      name: this.displayName,
      bio: this.bio,
      gender: this.gender,
      thumbnail: avatarThumb,
      coverUrl,
    });
    this.recordMetric("avatar_update_profile", !!updRes.data?.success);

    // Cria ou seleciona Sala 3D do bot
    const roomsRes = await this.api.get(`/api/v1/game/rooms?avatarId=${this.avatarId}`);
    const existingRooms = roomsRes.data?.rooms || [];
    if (existingRooms.length === 0) {
      const roomRes = await this.api.post("/api/v1/game/room/create", {
        avatarId: this.avatarId,
        name: `Lounge 3D de ${this.displayName}`,
        description: `Espaço interativo de ${this.displayName} aberto para festas, bate-papo e amigos!`,
        maxPlayers: randInt(25, 60),
        isPrivate: false,
      });
      if (roomRes.data?.success && roomRes.data?.room?.id) {
        this.roomId = roomRes.data.room.id;
        this.recordMetric("room_create", true);
      } else {
        this.recordMetric("room_create", false);
      }
    } else {
      this.roomId = existingRooms[0].id;
      const roomUpd = await this.api.post("/api/v1/game/room/update", {
        roomId: this.roomId,
        name: `Lounge VIP de ${this.displayName}`,
        description: `Sala 3D atualizada via API por ${this.displayName} (${new Date().toLocaleTimeString()})`,
        maxPlayers: randInt(30, 80),
        isPrivate: false,
      });
      this.recordMetric("room_update", !!roomUpd.data?.success);
    }

    return true;
  }

  // 3. Conecta ao WebSocket do Chat em Tempo Real (/ws/chat?profileId=...)
  async connectWebSocket() {
    if (!this.avatarId) return;
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(`${this.wsUrl}?profileId=${this.avatarId}`, {
          headers: {
            "tfl-token": this.token,
            Authorization: `Bearer ${this.token}`,
          },
        });

        const timeout = setTimeout(() => {
          resolve(false);
        }, 3000);

        ws.on("open", () => {
          this.ws = ws;
          this.recordMetric("ws_connect", true);
          // Pede lista de salas pelo WS
          ws.send(JSON.stringify({ type: "chat:room:list", data: {} }));
          clearTimeout(timeout);
          resolve(true);
        });

        ws.on("message", (raw) => {
          try {
            const msg = JSON.parse(raw.toString());
            if (msg.event === "chat:room:list" && Array.isArray(msg.data?.rooms)) {
              const globalRoom = msg.data.rooms.find((r) => r.type === "global");
              if (globalRoom) this.globalRoomUid = globalRoom.uid;
            }
          } catch (_) {}
        });

        ws.on("error", () => {
          clearTimeout(timeout);
          resolve(false);
        });
      } catch (_) {
        resolve(false);
      }
    });
  }

  // 4. Publica Conteúdo Autoral: Foto na Galeria, Sentimento (6h), Mini Reel (24h) e Post no Mural
  async publishInitialContent() {
    // Registra visita ao site com a região do bot para o painel de estatísticas Admin
    await this.api.post("/api/visit-beacon", {
      path: "/profile",
      region: this.region,
    });

    const photoUrl = pick(SAMPLE_PHOTOS);

    // 4.1. Adiciona foto na Galeria de Fotos
    const galRes = await this.api.post("/api/v1/social/gallery", {
      avatarId: this.avatarId,
      imageUrl: photoUrl,
      description: `Registro especial no metaverso por ${this.displayName} 📸✨`,
      shareOnFeed: false,
    });
    this.recordMetric("gallery_upload_photo", !!galRes.data?.success);

    // 4.2. Define Sentimento do Momento (duração de 6 horas)
    const feeling = pick(SAMPLE_FEELINGS);
    const feelRes = await this.api.post("/api/v1/social/reels", {
      avatarId: this.avatarId,
      type: "feeling",
      feelingEmoji: feeling.emoji,
      feelingLabel: feeling.label,
      text: feeling.text,
      bgStyle: pick(SAMPLE_REEL_BG),
    });
    this.recordMetric("reel_create_feeling_6h", !!feelRes.data?.success);

    // 4.3. Cria Mini Reel de Foto ou Texto (duração de 24 horas)
    const isPhotoReel = Math.random() > 0.35;
    const reelRes = await this.api.post("/api/v1/social/reels", {
      avatarId: this.avatarId,
      type: isPhotoReel ? "photo" : "text",
      imageUrl: isPhotoReel ? pick(SAMPLE_PHOTOS) : "",
      text: `${this.displayName}: Curtindo cada segundo no The Fantasy Life! 🌟`,
      feelingEmoji: feeling.emoji,
      feelingLabel: feeling.label,
      bgStyle: pick(SAMPLE_REEL_BG),
      saveToGallery: true,
    });
    this.recordMetric("reel_create_story_24h", !!reelRes.data?.success);

    // 4.4. Cria Publicação no Feed Social (com foto e/ou Sala 3D anexada!)
    const attachRoom = this.roomId && Math.random() > 0.4;
    const attachPhoto = Math.random() > 0.25;
    const postRes = await this.api.post("/api/v1/social/posts", {
      avatarId: this.avatarId,
      title: `Post de ${this.displayName}`,
      text: pick(SAMPLE_POST_TEXTS),
      imageUrl: attachPhoto ? pick(SAMPLE_PHOTOS) : "",
      roomId: attachRoom ? this.roomId : null,
    });
    this.recordMetric("post_create", !!postRes.data?.success);
  }

  // 5. Executa uma rodada completa de interações sociais, chat e carteira via API
  async runInteractionRound(allBots, roundNumber) {
    // 5.1. Carrega Feed Social, Galeria de Fotos e Mini Reels
    const [feedRes, galleryRes, reelsRes] = await Promise.all([
      this.api.get(`/api/v1/social/feed?avatarId=${this.avatarId}&filter=all`),
      this.api.get(`/api/v1/social/gallery?avatarId=${this.avatarId}&filter=all`),
      this.api.get(`/api/v1/social/reels?avatarId=${this.avatarId}`),
    ]);

    const posts = feedRes.data?.posts || [];
    const photos = galleryRes.data?.photos || [];
    const reels = reelsRes.data?.reels || [];

    // 5.2. Reage e Comenta em Publicações (e Responde Comentários Recursivamente!)
    if (posts.length > 0) {
      const targetPost = pick(posts);
      const reactionType = pick(REACTION_TYPES);

      // Reage ao Post
      const reactPostRes = await this.api.post("/api/v1/social/react", {
        avatarId: this.avatarId,
        targetType: "post",
        targetId: targetPost.id,
        reactionType,
        forceReaction: true,
      });
      this.recordMetric("react_post", !!reactPostRes.data?.success);

      // Se o Post tiver uma Sala 3D anexada, reage à Sala 3D também!
      if (targetPost.room?.id) {
        const reactRoomRes = await this.api.post("/api/v1/social/react", {
          avatarId: this.avatarId,
          targetType: "room",
          targetId: targetPost.room.id,
          reactionType: pick(REACTION_TYPES),
          forceReaction: true,
        });
        this.recordMetric("react_room", !!reactRoomRes.data?.success);
      }

      // Comenta no Post
      const commentRes = await this.api.post("/api/v1/social/comment", {
        avatarId: this.avatarId,
        postId: targetPost.id,
        text: pick(SAMPLE_COMMENTS),
      });
      this.recordMetric("comment_post", !!commentRes.data?.success);

      // Se o Post já tiver comentários, reage a um comentário e responde recursivamente!
      const existingComments = Array.isArray(targetPost.comments) ? targetPost.comments : [];
      if (existingComments.length > 0) {
        const parentComment = pick(existingComments);
        // Se o comentário tiver sub-respostas, às vezes responde ao nível 2 para criar árvore profunda!
        const targetComment =
          Array.isArray(parentComment.replies) && parentComment.replies.length > 0 && Math.random() > 0.5
            ? pick(parentComment.replies)
            : parentComment;

        // Reage ao comentário
        const reactCommRes = await this.api.post("/api/v1/social/react", {
          avatarId: this.avatarId,
          targetType: "comment",
          targetId: targetComment.id,
          reactionType: pick(REACTION_TYPES),
          forceReaction: true,
        });
        this.recordMetric("react_comment", !!reactCommRes.data?.success);

        // Responde recursivamente ao comentário
        const replyRes = await this.api.post("/api/v1/social/comment", {
          avatarId: this.avatarId,
          postId: targetPost.id,
          commentId: targetComment.id,
          text: `@${targetComment.profile?.name || "Amigo"} ${pick(SAMPLE_REPLIES)}`,
        });
        this.recordMetric("comment_recursive_reply", !!replyRes.data?.success);
      }

      // Compartilha um Post de outro usuário no próprio mural (35% de chance na rodada)
      const otherPosts = posts.filter((p) => Number(p.profileId) !== Number(this.avatarId));
      if (otherPosts.length > 0 && Math.random() < 0.35) {
        const postToShare = pick(otherPosts);
        const shareRes = await this.api.post(`/api/v1/social/posts/${postToShare.id}/share`, {
          avatarId: this.avatarId,
          text: `Compartilhando esse post incrível de ${postToShare.profile?.name || "um amigo"}! 🔁✨`,
        });
        this.recordMetric("post_share", !!shareRes.data?.success);
      }
    }

    // 5.3. Reage e Comenta em Fotos da Galeria
    if (photos.length > 0) {
      const targetPhoto = pick(photos);
      const reactPhotoRes = await this.api.post("/api/v1/social/react", {
        avatarId: this.avatarId,
        targetType: "photo",
        targetId: targetPhoto.id,
        reactionType: pick(REACTION_TYPES),
        forceReaction: true,
      });
      this.recordMetric("react_photo", !!reactPhotoRes.data?.success);

      const commentPhotoRes = await this.api.post("/api/v1/social/comment", {
        avatarId: this.avatarId,
        photoId: targetPhoto.id,
        text: `Foto sensacional! 📸 (${pick(SAMPLE_COMMENTS)})`,
      });
      this.recordMetric("comment_photo", !!commentPhotoRes.data?.success);

      // Consulta detalhes da foto (modal de foto) e responde a um comentário da foto se houver
      const photoDetailRes = await this.api.get(`/api/v1/social/photos/${targetPhoto.id}?viewerId=${this.avatarId}`);
      const photoComments = photoDetailRes.data?.photo?.comments || [];
      if (photoComments.length > 0 && Math.random() > 0.5) {
        const parentPhotoComm = pick(photoComments);
        const replyPhotoComm = await this.api.post("/api/v1/social/comment", {
          avatarId: this.avatarId,
          photoId: targetPhoto.id,
          commentId: parentPhotoComm.id,
          text: pick(SAMPLE_REPLIES),
        });
        this.recordMetric("comment_photo_recursive_reply", !!replyPhotoComm.data?.success);
      }
    }

    // 5.4. Reage e Comenta em Mini Reels / Sentimentos
    if (reels.length > 0) {
      const targetReel = pick(reels);
      const reactReelRes = await this.api.post("/api/v1/social/react", {
        avatarId: this.avatarId,
        targetType: "reel",
        targetId: targetReel.id,
        reactionType: pick(REACTION_TYPES),
        forceReaction: true,
      });
      this.recordMetric("react_reel", !!reactReelRes.data?.success);

      const commReelRes = await this.api.post("/api/v1/social/comment", {
        avatarId: this.avatarId,
        reelId: targetReel.id,
        text: `Amei esse Mini Reel! 🔥 ${pick(SAMPLE_COMMENTS)}`,
      });
      this.recordMetric("comment_reel", !!commReelRes.data?.success);
    }

    // 5.5. Interage com outros Perfis: Visita Perfil, Curte Perfil, Segue, Dá Match/Crush e Solicita/Aceita Amizade
    const searchRes = await this.api.get(`/api/v1/social/friends/search?avatarId=${this.avatarId}&q=`);
    const candidateAvatars = (searchRes.data?.results || []).filter((a) => Number(a.id) !== Number(this.avatarId));

    if (candidateAvatars.length > 0) {
      const targetAvatar = pick(candidateAvatars);

      // Visita o perfil completo do outro avatar
      const profileViewRes = await this.api.get(`/api/v1/social/avatar/${targetAvatar.id}?viewerId=${this.avatarId}`);
      this.recordMetric("profile_view", !!profileViewRes.data?.success);

      // Reage ao Perfil do outro avatar
      const reactProfileRes = await this.api.post("/api/v1/social/react", {
        avatarId: this.avatarId,
        targetType: "profile",
        targetId: targetAvatar.id,
        reactionType: pick(REACTION_TYPES),
        forceReaction: true,
      });
      this.recordMetric("react_profile", !!reactProfileRes.data?.success);

      // Segue o avatar (se ainda não estiver seguindo)
      if (!profileViewRes.data?.relation?.isFollowing) {
        const followRes = await this.api.post("/api/v1/social/follow", {
          avatarId: this.avatarId,
          targetProfileId: targetAvatar.id,
        });
        this.recordMetric("social_follow", !!followRes.data?.success);
      }

      // Envia Crush / Match (se ainda não deu match/crush nesse alvo)
      const currentMatchStatus = profileViewRes.data?.relation?.matchStatus || "none";
      if (currentMatchStatus === "none" || currentMatchStatus === "crush_received") {
        const matchRes = await this.api.post("/api/v1/social/match", {
          avatarId: this.avatarId,
          targetProfileId: targetAvatar.id,
        });
        this.recordMetric("social_match_crush", !!matchRes.data?.success);
        if (matchRes.data?.isMutual) {
          this.metrics.mutualMatches += 1;
          this.log(`💘 [MATCH MÚTUO!] ${this.displayName} deu Match recíproco com ${targetAvatar.name}!`);
        }
      }

      // Envia solicitação de amizade se ainda não forem amigos
      if (targetAvatar.relationStatus === "none") {
        const freqRes = await this.api.post("/api/v1/social/friends/request", {
          avatarId: this.avatarId,
          targetProfileId: targetAvatar.id,
        });
        this.recordMetric("friend_request", !!freqRes.data?.success);
      }
    }

    // Verifica e aceita solicitações de amizade pendentes recebidas
    const friendsListRes = await this.api.get(`/api/v1/social/friends/list?avatarId=${this.avatarId}`);
    const pendingReceived = friendsListRes.data?.pendingReceived || [];
    for (const pending of pendingReceived) {
      const accRes = await this.api.post("/api/v1/social/friends/accept", {
        avatarId: this.avatarId,
        friendshipId: pending.friendshipId,
      });
      this.recordMetric("friend_accept", !!accRes.data?.success);
    }

    // 5.6. Interage no Chat Global e no Chat Privado (DM) via API REST + WebSocket
    await this.interactWithChats(candidateAvatars, roundNumber);

    // 5.7. Opera a Carteira & Conversor de Moedas na primeira rodada
    if (roundNumber === 1) {
      await this.interactWithWalletAndMarket();
    }
  }

  // 6. Chat Global (WebSocket + HTTP REST), DM Privada e Grupo
  async interactWithChats(candidateAvatars, roundNumber) {
    const chatsRes = await this.api.get("/api/v1/social/chats");
    const rooms = Array.isArray(chatsRes.data) ? chatsRes.data : [];
    const globalRoom = rooms.find((r) => r.type === "global");

    if (globalRoom?.uid) {
      this.globalRoomUid = globalRoom.uid;
      const chatText = `[Rodada ${roundNumber}] ${pick(SAMPLE_GLOBAL_CHAT_MESSAGES)}`;

      // Se o WebSocket estiver aberto, simula digitação e envia mensagem via WebSocket!
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: "chat:typing",
            data: { roomUid: globalRoom.uid, isTyping: true },
          })
        );
        await sleep(40);
        this.ws.send(
          JSON.stringify({
            type: "chat:message:send",
            data: { roomUid: globalRoom.uid, text: chatText },
          })
        );
        this.ws.send(
          JSON.stringify({
            type: "chat:read",
            data: { roomUid: globalRoom.uid },
          })
        );
        this.recordMetric("chat_global_ws_message", true);
      } else {
        // Fallback / complemento via HTTP REST POST /api/v1/social/chats/:uid/messages
        const msgRes = await this.api.post(`/api/v1/social/chats/${globalRoom.uid}/messages`, {
          text: chatText,
        });
        this.recordMetric("chat_global_http_message", msgRes.status === 201);
      }

      // Consulta histórico de mensagens do Chat Global via HTTP
      const histRes = await this.api.get(`/api/v1/social/chats/${globalRoom.uid}/messages?limit=15`);
      this.recordMetric("chat_global_history", Array.isArray(histRes.data?.messages));
    }

    // Abre DM privada com outro avatar e envia uma mensagem direta
    if (candidateAvatars.length > 0 && Math.random() > 0.35) {
      const partner = pick(candidateAvatars);
      const dmRes = await this.api.post("/api/v1/social/chats/direct", {
        profileId: partner.id,
      });
      if (dmRes.data?.uid) {
        const sendDmRes = await this.api.post(`/api/v1/social/chats/${dmRes.data.uid}/messages`, {
          text: `Oi ${partner.name}! Tudo bem? Passando pra dar um alô aqui pelo chat privado! 💬✨`,
        });
        this.recordMetric("chat_dm_message", sendDmRes.status === 201);
      }
    }
  }

  // 7. Interação com Carteira e Conversor de Moedas (/api/v1/bank/...)
  async interactWithWalletAndMarket() {
    const walletRes = await this.api.get("/api/v1/bank/wallet");
    const wallet = walletRes.data?.wallet;
    this.recordMetric("bank_wallet_check", !!walletRes.data?.success);

    if (wallet && Number(wallet.chips) >= 20) {
      // Converte 20 Chips iniciais em 2 Coins
      const convCoins = await this.api.post("/api/v1/bank/market/convert", {
        avatarId: this.avatarId,
        direction: "CHIPS_TO_COINS",
        amount: 20,
      });
      this.recordMetric("bank_convert_chips_to_coins", !!convCoins.data?.success);

      // Converte 1 Coin de volta para 10 Chips para movimentar o livro contábil
      const convChips = await this.api.post("/api/v1/bank/market/convert", {
        avatarId: this.avatarId,
        direction: "COINS_TO_CHIPS",
        amount: 1,
      });
      this.recordMetric("bank_convert_coins_to_chips", !!convChips.data?.success);
    }
  }

  disconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }
  }
}

// ----------------------------------------------------------------------------
// Orquestrador Principal da Simulação
// ----------------------------------------------------------------------------
async function runBotSimulation(customOptions = {}) {
  const opts = {
    ...parseCliArgs(process.argv),
    ...customOptions,
  };

  const log = (...args) => {
    if (opts.verbose) console.log(...args);
  };

  const metrics = {
    startedAt: new Date().toISOString(),
    finishedAt: null,
    durationMs: 0,
    botsCount: opts.botsCount,
    rounds: opts.rounds,
    totalSuccess: 0,
    totalErrors: 0,
    mutualMatches: 0,
    actions: {},
    beforeStats: null,
    afterStats: null,
  };

  const startTime = Date.now();
  log("\n============================================================================");
  log(`🚀 INICIANDO SIMULADOR DE BOTS TFL (100% API REST + WEBSOCKET)`);
  log(`🌐 Servidor Alvo : ${opts.baseUrl}`);
  log(`🤖 Quantidade    : ${opts.botsCount} Bots simultâneos`);
  log(`🔄 Rodadas       : ${opts.continuous ? "CONTÍNUO (Ctrl+C para parar)" : opts.rounds}`);
  log("============================================================================\n");

  // Captura estatísticas da plataforma ANTES da simulação
  try {
    const stBefore = await axios.get(`${opts.baseUrl}/api/v1/stats`, { timeout: 8000 });
    metrics.beforeStats = stBefore.data?.stats || null;
  } catch (err) {
    throw new Error(
      `Não foi possível conectar ao servidor em ${opts.baseUrl}/api/v1/stats (${err.message}). Certifique-se de que o servidor está rodando!`
    );
  }

  // Instancia e prepara os N bots
  const bots = [];
  for (let i = 1; i <= opts.botsCount; i++) {
    bots.push(new BotAgent(i, opts.baseUrl, metrics, log));
  }

  log("📦 [Fase 1/3] Criando contas, avatares, capas, salas 3D e conexões WebSocket...");
  const activeBots = [];
  for (const bot of bots) {
    const authed = await bot.authenticate();
    if (!authed) continue;
    const ready = await bot.setupAvatarAndRoom();
    if (!ready) continue;
    await bot.connectWebSocket();
    activeBots.push(bot);
    await sleep(Math.min(opts.delayMs, 100));
  }

  log(`\n🎨 [Fase 2/3] ${activeBots.length} Bots publicando Fotos, Sentimentos (6h), Mini Reels (24h) e Posts no Mural...`);
  for (const bot of activeBots) {
    await bot.publishInitialContent();
    await sleep(opts.delayMs);
  }

  log(`\n⚡ [Fase 3/3] Iniciando rodadas de interações cruzadas (Reações, Comentários Recursivos, Match, Amizades, Chat Global e Carteira)...`);
  let currentRound = 1;
  while (opts.continuous || currentRound <= opts.rounds) {
    log(`   ↳ Rodada #${currentRound} em andamento com ${activeBots.length} bots...`);
    for (const bot of activeBots) {
      await bot.runInteractionRound(activeBots, currentRound);
      await sleep(opts.delayMs);
    }
    currentRound += 1;
  }

  // Encerra conexões WebSocket dos bots
  for (const bot of activeBots) {
    bot.disconnect();
  }

  // Captura estatísticas da plataforma DEPOIS da simulação
  try {
    const stAfter = await axios.get(`${opts.baseUrl}/api/v1/stats`, { timeout: 8000 });
    metrics.afterStats = stAfter.data?.stats || null;
  } catch (_) {}

  metrics.finishedAt = new Date().toISOString();
  metrics.durationMs = Date.now() - startTime;

  if (opts.verbose) {
    printSimulationReport(metrics);
  }

  return metrics;
}

function printSimulationReport(metrics) {
  console.log("\n============================================================================");
  console.log("✅ RELATÓRIO FINAL DA SIMULAÇÃO DE BOTS (API v1 + WEBSOCKET)");
  console.log("============================================================================");
  console.log(`⏱️  Tempo Total        : ${(metrics.durationMs / 1000).toFixed(2)}s`);
  console.log(`🤖 Bots Ativos        : ${metrics.botsCount}`);
  console.log(`✔️  Ações com Sucesso  : ${metrics.totalSuccess}`);
  console.log(`❌ Falhas             : ${metrics.totalErrors}`);
  console.log(`💘 Matches Mútuos     : ${metrics.mutualMatches}`);
  console.log("----------------------------------------------------------------------------");
  console.log("📊 DETALHAMENTO DE AÇÕES EXECUTADAS VIA API:");
  for (const [actionName, counts] of Object.entries(metrics.actions)) {
    console.log(
      `   • ${actionName.padEnd(32, " ")} : ${String(counts.ok).padStart(4, " ")} OK | ${counts.fail} falhas`
    );
  }

  if (metrics.beforeStats && metrics.afterStats) {
    const b = metrics.beforeStats;
    const a = metrics.afterStats;
    const diff = (v1, v2) => {
      const d = Number(v2 || 0) - Number(v1 || 0);
      return d >= 0 ? `+${d}` : `${d}`;
    };

    console.log("----------------------------------------------------------------------------");
    console.log("📈 IMPACTO REAL NO BANCO DE DADOS (ANTES -> DEPOIS):");
    console.log(`   • Contas (Users)         : ${b.community?.usersCount ?? 0} -> ${a.community?.usersCount ?? 0} (${diff(b.community?.usersCount, a.community?.usersCount)})`);
    console.log(`   • Avatares               : ${b.community?.avatarsCount ?? 0} -> ${a.community?.avatarsCount ?? 0} (${diff(b.community?.avatarsCount, a.community?.avatarsCount)})`);
    console.log(`   • Publicações (Posts)    : ${b.social?.postsCount ?? 0} -> ${a.social?.postsCount ?? 0} (${diff(b.social?.postsCount, a.social?.postsCount)})`);
    console.log(`   • Fotos na Galeria       : ${b.social?.photosCount ?? 0} -> ${a.social?.photosCount ?? 0} (${diff(b.social?.photosCount, a.social?.photosCount)})`);
    console.log(`   • Mini Reels & Sentim.   : ${b.social?.activeReelsCount ?? 0} -> ${a.social?.activeReelsCount ?? 0} (${diff(b.social?.activeReelsCount, a.social?.activeReelsCount)})`);
    console.log(`   • Curtidas / Reações     : ${b.social?.likesCount ?? 0} -> ${a.social?.likesCount ?? 0} (${diff(b.social?.likesCount, a.social?.likesCount)})`);
    console.log(`   • Comentários Recursivos : ${b.social?.commentsCount ?? 0} -> ${a.social?.commentsCount ?? 0} (${diff(b.social?.commentsCount, a.social?.commentsCount)})`);
    console.log(`   • Amizades Aceitas       : ${b.community?.friendsAcceptedCount ?? 0} -> ${a.community?.friendsAcceptedCount ?? 0} (${diff(b.community?.friendsAcceptedCount, a.community?.friendsAcceptedCount)})`);
    console.log(`   • Seguidores (Follows)   : ${b.community?.followsCount ?? 0} -> ${a.community?.followsCount ?? 0} (${diff(b.community?.followsCount, a.community?.followsCount)})`);
    console.log(`   • Matches Mútuos         : ${b.community?.matchesMutualCount ?? 0} -> ${a.community?.matchesMutualCount ?? 0} (${diff(b.community?.matchesMutualCount, a.community?.matchesMutualCount)})`);
    console.log(`   • Salas 3D               : ${b.metaverse?.roomsCount ?? 0} -> ${a.metaverse?.roomsCount ?? 0} (${diff(b.metaverse?.roomsCount, a.metaverse?.roomsCount)})`);
    console.log(`   • Mensagens no Chat      : ${b.metaverse?.chatMessagesCount ?? 0} -> ${a.metaverse?.chatMessagesCount ?? 0} (${diff(b.metaverse?.chatMessagesCount, a.metaverse?.chatMessagesCount)})`);
  }
  console.log("============================================================================\n");
}

if (require.main === module) {
  runBotSimulation().catch((err) => {
    console.error("\n❌ Erro fatal na simulação de bots:", err.message);
    process.exit(1);
  });
}

module.exports = { runBotSimulation, BotAgent };
