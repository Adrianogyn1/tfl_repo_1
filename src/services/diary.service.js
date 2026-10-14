const repo = require("../repositories/repository");
const { Op, QueryTypes } = require("sequelize");
const {
  getEconomyRules,
  recordLedgerEntry,
  createNotification,
} = require("./coinMarket.service");

let _diaryTablesEnsured = false;

const DIARY_MOODS = {
  desabafo: { key: "desabafo", emoji: "😔", label: "Desabafo", badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  reflexivo: { key: "reflexivo", emoji: "💭", label: "Reflexivo", badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  feliz: { key: "feliz", emoji: "😊", label: "Feliz & Grato", badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  apaixonado: { key: "apaixonado", emoji: "❤️", label: "Coração & Amor", badgeClass: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  melancolico: { key: "melancolico", emoji: "🌧️", label: "Melancólico", badgeClass: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
  motivado: { key: "motivado", emoji: "🔥", label: "Superação", badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  segredo: { key: "segredo", emoji: "🤫", label: "Segredo / Confissão", badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
};

const DIARY_CATEGORIES = [
  "Desabafo",
  "Cotidiano",
  "Amor & Relacionamentos",
  "Sonhos & Metas",
  "Confissão",
  "Crônica & História",
];

const DIARY_REACTIONS = {
  hug: { key: "hug", emoji: "🫂", label: "Abraço" },
  like: { key: "like", emoji: "❤️", label: "Acolher" },
  feel_you: { key: "feel_you", emoji: "🤝", label: "Te entendo" },
  strength: { key: "strength", emoji: "🌟", label: "Força" },
  peace: { key: "peace", emoji: "🕯️", label: "Paz" },
};

const POETIC_AUTHOR_PREFIXES = [
  "Viajante Noturno",
  "Alma Silenciosa",
  "Coração de Papel",
  "Estrela Solitária",
  "Brisa de Outono",
  "Poeta Anônimo",
  "Maré Calma",
  "Luz da Meia-Noite",
  "Guardião de Segredos",
  "Horizonte Sereno",
];

const POETIC_READER_PREFIXES = [
  "Ouvinte Amigo",
  "Voz Acolhedora",
  "Abraço Anônimo",
  "Luz Amiga",
  "Alma Empática",
  "Coração Presente",
  "Vento Amigo",
  "Estrela Guia",
];

function generateAuthorAnonymousAlias(seedNum = 0) {
  const n = Math.abs(Number(seedNum) || Math.floor(Math.random() * 9000) + 100);
  const prefix = POETIC_AUTHOR_PREFIXES[n % POETIC_AUTHOR_PREFIXES.length];
  const code = ((n * 137) % 899) + 100;
  return `${prefix} #${code}`;
}

function generateReaderAnonymousAlias(pageId, userId) {
  const hash = Math.abs(Number(pageId || 1) * 31 + Number(userId || 1) * 97);
  const prefix = POETIC_READER_PREFIXES[hash % POETIC_READER_PREFIXES.length];
  const code = (hash % 899) + 100;
  return `${prefix} #${code}`;
}

function getMonthKey(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getDayKey(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function computeReadingMetrics(content = "", minReadRuleSeconds = 20) {
  const clean = String(content || "").trim();
  const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  // ~180 palavras por minuto = 3 palavras por segundo, limitado entre 15s e 60s para uma UX fluida
  const rawSeconds = Math.ceil(words / 3);
  const baseMin = Math.max(10, Math.min(45, Number(minReadRuleSeconds || 20)));
  const estimatedReadSeconds = Math.max(baseMin, Math.min(90, rawSeconds));
  return { wordCount: words, estimatedReadSeconds };
}

async function ensureDiaryTables() {
  if (_diaryTablesEnsured) return;
  try {
    await repo.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "diary_pages" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "avatarId" INTEGER NOT NULL DEFAULT 0,
        "title" VARCHAR(160) NOT NULL,
        "content" TEXT NOT NULL,
        "mood" VARCHAR(32) NOT NULL DEFAULT 'reflexivo',
        "category" VARCHAR(48) NOT NULL DEFAULT 'Desabafo',
        "isPublicAnonymous" BOOLEAN NOT NULL DEFAULT FALSE,
        "anonymousAlias" VARCHAR(80) NOT NULL DEFAULT 'Viajante Noturno #101',
        "wordCount" INTEGER NOT NULL DEFAULT 0,
        "estimatedReadSeconds" INTEGER NOT NULL DEFAULT 20,
        "totalReadsCount" INTEGER NOT NULL DEFAULT 0,
        "totalReadingSeconds" INTEGER NOT NULL DEFAULT 0,
        "paid10MinMilestones" INTEGER NOT NULL DEFAULT 0,
        "totalCoinsEarned" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        "likesCount" INTEGER NOT NULL DEFAULT 0,
        "commentsCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "diary_reactions" (
        "id" SERIAL PRIMARY KEY,
        "pageId" INTEGER NOT NULL,
        "reactorUserId" INTEGER NOT NULL,
        "reactorAvatarId" INTEGER NOT NULL DEFAULT 0,
        "reactionType" VARCHAR(24) NOT NULL DEFAULT 'hug',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("pageId", "reactorUserId")
      );

      CREATE TABLE IF NOT EXISTS "diary_comments" (
        "id" SERIAL PRIMARY KEY,
        "pageId" INTEGER NOT NULL,
        "commenterUserId" INTEGER NOT NULL,
        "commenterAvatarId" INTEGER NOT NULL DEFAULT 0,
        "anonymousAlias" VARCHAR(80) NOT NULL,
        "isPageAuthor" BOOLEAN NOT NULL DEFAULT FALSE,
        "text" TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "diary_reading_sessions" (
        "id" SERIAL PRIMARY KEY,
        "pageId" INTEGER NOT NULL,
        "readerUserId" INTEGER NOT NULL,
        "readerAvatarId" INTEGER NOT NULL DEFAULT 0,
        "authorUserId" INTEGER NOT NULL DEFAULT 0,
        "authorAvatarId" INTEGER NOT NULL DEFAULT 0,
        "monthKey" VARCHAR(16) NOT NULL,
        "dayKey" VARCHAR(16) NOT NULL,
        "secondsRead" INTEGER NOT NULL DEFAULT 0,
        "rewarded" BOOLEAN NOT NULL DEFAULT FALSE,
        "readerRewardCoins" NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
        "authorRewardCoins" NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("pageId", "readerUserId", "monthKey")
      );

      -- ================= ÍNDICES CRÍTICOS POSTGRESQL (BLINDAGEM I/O) =================
      CREATE INDEX IF NOT EXISTS "idx_diary_reading_sessions_page_id" ON "diary_reading_sessions" ("pageId");
      CREATE INDEX IF NOT EXISTS "idx_diary_reading_sessions_reader_user" ON "diary_reading_sessions" ("readerUserId");
      CREATE INDEX IF NOT EXISTS "idx_diary_reading_sessions_month_key" ON "diary_reading_sessions" ("monthKey");
      CREATE INDEX IF NOT EXISTS "idx_diary_reading_sessions_day_key" ON "diary_reading_sessions" ("dayKey");
    `);

    // Seed inicial de páginas públicas anônimas acolhedoras caso o mural esteja vazio
    const existingPublic = await repo.sequelize.query(
      `SELECT COUNT(*)::int AS cnt FROM "diary_pages" WHERE "isPublicAnonymous" = TRUE`,
      { type: QueryTypes.SELECT }
    );
    const countPublic = Number(existingPublic[0]?.cnt || 0);

    if (countPublic === 0) {
      const starterPages = [
        {
          userId: 0,
          avatarId: 0,
          title: "Às vezes só precisamos de um lugar silencioso para respirar",
          content:
            "Hoje o dia correu mais rápido do que eu conseguia acompanhar. No meio de tantas cobranças e barulho lá fora, percebi que tudo o que eu queria era alguns minutos de paz, ouvir uma música calma e lembrar que não preciso resolver a vida inteira em uma única tarde.\n\nSe você também está lendo isso depois de um dia cansativo: respira fundo. Cada pequeno passo conta, mesmo aqueles que ninguém vê.",
          mood: "desabafo",
          category: "Desabafo",
          alias: "Viajante Noturno #412",
          reads: 18,
          seconds: 540,
        },
        {
          userId: 0,
          avatarId: 0,
          title: "O que eu aprendi recomeçando do zero",
          content:
            "Por muito tempo tive medo de mudar de rota achando que seria perder tempo. Mas quando finalmente tive coragem de fechar ciclos que já não faziam sentido, senti um alívio que não sentia há anos.\n\nRecomeçar não é fracassar; é ter a sabedoria de usar tudo o que você viveu para construir algo muito mais verdadeiro agora.",
          mood: "motivado",
          category: "Sonhos & Metas",
          alias: "Estrela Solitária #729",
          reads: 24,
          seconds: 710,
        },
        {
          userId: 0,
          avatarId: 0,
          title: "Carta não enviada para alguém especial",
          content:
            "Ainda guardo na memória aquelas conversas que varavam a madrugada sem a gente perceber a hora passar. Mesmo que a vida tenha levado cada um para um caminho diferente, sou grato por ter conhecido alguém que me fez sorrir de um jeito tão sincero.\n\nDesejo em silêncio que onde quer que você esteja, seus dias sejam leves.",
          mood: "apaixonado",
          category: "Amor & Relacionamentos",
          alias: "Coração de Papel #308",
          reads: 31,
          seconds: 890,
        },
        {
          userId: 0,
          avatarId: 0,
          title: "Pequenas alegrias que ninguém nota",
          content:
            "O cheiro de café fresco de manhã, a chuva batendo na janela enquanto estamos seguros em casa, uma risada inesperada no meio do caos... Hoje decidi anotar no meu diário apenas as coisas simples que salvaram o meu humor.",
          mood: "feliz",
          category: "Cotidiano",
          alias: "Brisa de Outono #519",
          reads: 14,
          seconds: 420,
        },
      ];

      for (const sp of starterPages) {
        const metrics = computeReadingMetrics(sp.content, 20);
        await repo.sequelize.query(
          `INSERT INTO "diary_pages"
            ("userId", "avatarId", "title", "content", "mood", "category", "isPublicAnonymous", "anonymousAlias", "wordCount", "estimatedReadSeconds", "totalReadsCount", "totalReadingSeconds", "likesCount", "commentsCount")
           VALUES (:userId, :avatarId, :title, :content, :mood, :category, TRUE, :alias, :wordCount, :estimatedReadSeconds, :reads, :seconds, 5, 1)`,
          {
            replacements: {
              userId: sp.userId,
              avatarId: sp.avatarId,
              title: sp.title,
              content: sp.content,
              mood: sp.mood,
              category: sp.category,
              alias: sp.alias,
              wordCount: metrics.wordCount,
              estimatedReadSeconds: metrics.estimatedReadSeconds,
              reads: sp.reads,
              seconds: sp.seconds,
            },
          }
        );
      }

      // Comentário inicial acolhedor na primeira página
      const firstPage = await repo.sequelize.query(
        `SELECT "id" FROM "diary_pages" WHERE "isPublicAnonymous" = TRUE ORDER BY "id" ASC LIMIT 1`,
        { type: QueryTypes.SELECT }
      );
      if (firstPage[0]?.id) {
        await repo.sequelize.query(
          `INSERT INTO "diary_comments" ("pageId", "commenterUserId", "commenterAvatarId", "anonymousAlias", "isPageAuthor", "text")
           VALUES (:pageId, 0, 0, 'Ouvinte Amigo #204', FALSE, 'Obrigado por escrever isso. Era exatamente o que eu precisava ler hoje. Receba um abraço apertado! 🫂')`,
          { replacements: { pageId: firstPage[0].id } }
        );
      }
    }

    _diaryTablesEnsured = true;
  } catch (err) {
    console.warn("[ensureDiaryTables]", err.message);
  }
}

async function enrichPublicPagesForViewer(rows, viewerUserId, minReadRuleSeconds = 20) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const pageIds = rows.map((r) => Number(r.id));
  const monthKey = getMonthKey();

  const [reactionsRows, commentsRows, readSessionsRows] = await Promise.all([
    repo.sequelize.query(
      `SELECT "pageId", "reactorUserId", "reactionType" FROM "diary_reactions" WHERE "pageId" IN (:pageIds)`,
      { replacements: { pageIds }, type: QueryTypes.SELECT }
    ),
    repo.sequelize.query(
      `SELECT "id", "pageId", "commenterUserId", "anonymousAlias", "isPageAuthor", "text", "createdAt"
       FROM "diary_comments"
       WHERE "pageId" IN (:pageIds)
       ORDER BY "createdAt" ASC, "id" ASC`,
      { replacements: { pageIds }, type: QueryTypes.SELECT }
    ),
    viewerUserId
      ? repo.sequelize.query(
          `SELECT "pageId", "secondsRead", "rewarded", "readerRewardCoins"
           FROM "diary_reading_sessions"
           WHERE "pageId" IN (:pageIds) AND "readerUserId" = :viewerUserId AND "monthKey" = :monthKey`,
          { replacements: { pageIds, viewerUserId: Number(viewerUserId), monthKey }, type: QueryTypes.SELECT }
        )
      : [],
  ]);

  const reactionsByPage = new Map();
  const myReactionByPage = new Map();
  for (const r of reactionsRows) {
    const pid = Number(r.pageId);
    if (!reactionsByPage.has(pid)) {
      reactionsByPage.set(pid, { hug: 0, like: 0, feel_you: 0, strength: 0, peace: 0, total: 0 });
    }
    const summary = reactionsByPage.get(pid);
    const type = DIARY_REACTIONS[r.reactionType] ? r.reactionType : "hug";
    summary[type] = (summary[type] || 0) + 1;
    summary.total += 1;

    if (viewerUserId && Number(r.reactorUserId) === Number(viewerUserId)) {
      myReactionByPage.set(pid, type);
    }
  }

  const commentsByPage = new Map();
  for (const c of commentsRows) {
    const pid = Number(c.pageId);
    if (!commentsByPage.has(pid)) commentsByPage.set(pid, []);
    // NUNCA expõe commenterUserId para terceiros
    commentsByPage.get(pid).push({
      id: Number(c.id),
      pageId: pid,
      anonymousAlias: c.anonymousAlias || "Ouvinte Amigo",
      isPageAuthor: Boolean(c.isPageAuthor),
      isMyComment: Boolean(viewerUserId && Number(c.commenterUserId) === Number(viewerUserId)),
      text: c.text,
      createdAt: c.createdAt,
    });
  }

  const readSessionByPage = new Map();
  for (const s of readSessionsRows) {
    readSessionByPage.set(Number(s.pageId), s);
  }

  return rows.map((row) => {
    const pid = Number(row.id);
    const moodMeta = DIARY_MOODS[row.mood] || DIARY_MOODS.reflexivo;
    const summary = reactionsByPage.get(pid) || { hug: 0, like: 0, feel_you: 0, strength: 0, peace: 0, total: Number(row.likesCount || 0) };
    const comments = commentsByPage.get(pid) || [];
    const mySession = readSessionByPage.get(pid) || null;
    const isMine = Boolean(viewerUserId && Number(row.userId) === Number(viewerUserId) && Number(row.userId) !== 0);
    const reqSeconds = Math.max(10, Math.min(60, Number(row.estimatedReadSeconds || minReadRuleSeconds || 20)));

    // Remove qualquer identificador do autor no retorno público
    return {
      id: pid,
      title: row.title,
      content: row.content,
      mood: moodMeta.key,
      moodEmoji: moodMeta.emoji,
      moodLabel: moodMeta.label,
      moodBadgeClass: moodMeta.badgeClass,
      category: row.category || "Desabafo",
      isPublicAnonymous: Boolean(row.isPublicAnonymous),
      anonymousAlias: row.anonymousAlias || generateAuthorAnonymousAlias(pid),
      wordCount: Number(row.wordCount || 0),
      requiredReadSeconds: reqSeconds,
      totalReadsCount: Number(row.totalReadsCount || 0),
      totalReadingSeconds: Number(row.totalReadingSeconds || 0),
      totalReadingMinutes: Number((Number(row.totalReadingSeconds || 0) / 60).toFixed(1)),
      totalCoinsEarned: Number(row.totalCoinsEarned || 0),
      reactionsSummary: summary,
      likesCount: summary.total,
      myReaction: myReactionByPage.get(pid) || null,
      commentsCount: comments.length,
      comments,
      isMine,
      viewerAlreadyRewarded: Boolean(mySession?.rewarded),
      viewerSecondsRead: Number(mySession?.secondsRead || 0),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  });
}

async function getDiaryOverview({ userId, avatarId, category = "", mood = "", sort = "recent" }) {
  await ensureDiaryTables();
  const rules = await getEconomyRules();
  const minReadSeconds = Math.max(10, Number(rules.diaryMinReadSeconds ?? 30));
  const readerRewardCoins = Number(rules.diaryReaderRewardPerPageCoins ?? 0.25);
  const authorRewardPerReadCoins = Number(rules.diaryAuthorRewardPerReadCoins ?? 0.50);
  const authorBonusPer10MinCoins = Number(rules.diaryAuthorBonusPer10MinCoins ?? 5.00);
  const readerDailyLimitPages = Math.max(1, Number(rules.diaryReaderDailyLimitPages ?? 20));
  const dayKey = getDayKey();

  // 1. Páginas Pessoais do Usuário (Privadas + Públicas)
  const myPagesRaw = userId
    ? await repo.sequelize.query(
        `SELECT * FROM "diary_pages" WHERE "userId" = :userId ORDER BY "createdAt" DESC, "id" DESC`,
        { replacements: { userId: Number(userId) }, type: QueryTypes.SELECT }
      )
    : [];

  const myPagesEnriched = await enrichPublicPagesForViewer(myPagesRaw, userId, minReadSeconds);

  // 2. Mural Público Anônimo ("Cantinho de Desabafo & Leitura")
  let whereSql = `"isPublicAnonymous" = TRUE`;
  const replacements = {};
  if (category && category !== "all") {
    whereSql += ` AND "category" = :category`;
    replacements.category = String(category);
  }
  if (mood && mood !== "all" && DIARY_MOODS[mood]) {
    whereSql += ` AND "mood" = :mood`;
    replacements.mood = String(mood);
  }

  let orderSql = `"createdAt" DESC, "id" DESC`;
  if (sort === "popular") {
    orderSql = `"likesCount" DESC, "totalReadsCount" DESC, "id" DESC`;
  } else if (sort === "most_read") {
    orderSql = `"totalReadingSeconds" DESC, "totalReadsCount" DESC, "id" DESC`;
  }

  const publicRaw = await repo.sequelize.query(
    `SELECT * FROM "diary_pages" WHERE ${whereSql} ORDER BY ${orderSql} LIMIT 50`,
    { replacements, type: QueryTypes.SELECT }
  );

  const publicPages = await enrichPublicPagesForViewer(publicRaw, userId, minReadSeconds);

  // 3. Estatísticas de Leitura e Ganhos do Usuário
  const [todayReadRow, totalReaderEarnedRow] = await Promise.all([
    userId
      ? repo.sequelize.query(
          `SELECT COUNT(*)::int AS cnt
           FROM "diary_reading_sessions"
           WHERE "readerUserId" = :userId AND "dayKey" = :dayKey AND "rewarded" = TRUE`,
          { replacements: { userId: Number(userId), dayKey }, type: QueryTypes.SELECT }
        )
      : [{ cnt: 0 }],
    userId
      ? repo.sequelize.query(
          `SELECT COALESCE(SUM("readerRewardCoins"), 0) AS total
           FROM "diary_reading_sessions"
           WHERE "readerUserId" = :userId AND "rewarded" = TRUE`,
          { replacements: { userId: Number(userId) }, type: QueryTypes.SELECT }
        )
      : [{ total: 0 }],
  ]);

  const privatePagesCount = myPagesEnriched.filter((p) => !p.isPublicAnonymous).length;
  const publicPagesCount = myPagesEnriched.filter((p) => p.isPublicAnonymous).length;
  const totalReadsOnMyPages = myPagesEnriched.reduce((acc, p) => acc + Number(p.totalReadsCount || 0), 0);
  const totalReadingSecondsOnMyPages = myPagesEnriched.reduce((acc, p) => acc + Number(p.totalReadingSeconds || 0), 0);
  const totalReactionsOnMyPages = myPagesEnriched.reduce((acc, p) => acc + Number(p.likesCount || 0), 0);
  const totalCommentsOnMyPages = myPagesEnriched.reduce((acc, p) => acc + Number(p.commentsCount || 0), 0);
  const totalCoinsEarnedAsAuthor = Number(
    myPagesEnriched.reduce((acc, p) => acc + Number(p.totalCoinsEarned || 0), 0).toFixed(2)
  );
  const totalCoinsEarnedAsReader = Number(Number(totalReaderEarnedRow[0]?.total || 0).toFixed(2));

  return {
    myPages: myPagesEnriched,
    publicPages,
    moods: DIARY_MOODS,
    categories: DIARY_CATEGORIES,
    reactionsMeta: DIARY_REACTIONS,
    myStats: {
      totalMyPages: myPagesEnriched.length,
      privatePagesCount,
      publicPagesCount,
      totalReadsOnMyPages,
      totalReadingSecondsOnMyPages,
      totalReadingMinutesOnMyPages: Number((totalReadingSecondsOnMyPages / 60).toFixed(1)),
      totalReactionsOnMyPages,
      totalCommentsOnMyPages,
      totalCoinsEarnedAsAuthor,
      totalCoinsEarnedAsReader,
      pagesRewardedToday: Number(todayReadRow[0]?.cnt || 0),
      readerDailyLimitPages,
    },
    rewardRules: {
      minReadSeconds,
      readerRewardCoins,
      authorRewardPerReadCoins,
      authorBonusPer10MinCoins,
      readerDailyLimitPages,
    },
  };
}

async function saveDiaryPage({
  userId,
  avatarId,
  pageId = null,
  title,
  content,
  mood = "reflexivo",
  category = "Desabafo",
  isPublicAnonymous = false,
}) {
  await ensureDiaryTables();
  if (!userId) throw new Error("Usuário não autenticado.");

  const cleanTitle = String(title || "").trim().slice(0, 160);
  const cleanContent = String(content || "").trim();
  if (!cleanTitle) throw new Error("Informe um título para a página do seu diário.");
  if (!cleanContent || cleanContent.length < 10) {
    throw new Error("Escreva pelo menos 10 caracteres na página do seu diário.");
  }

  const validMood = DIARY_MOODS[mood] ? mood : "reflexivo";
  const validCategory = DIARY_CATEGORIES.includes(category) ? category : "Desabafo";
  const isPub = isPublicAnonymous === true || isPublicAnonymous === "true";

  const rules = await getEconomyRules();
  const minReadSeconds = Math.max(10, Number(rules.diaryMinReadSeconds ?? 30));
  const { wordCount, estimatedReadSeconds } = computeReadingMetrics(cleanContent, minReadSeconds);

  if (pageId) {
    const existing = await repo.sequelize.query(
      `SELECT * FROM "diary_pages" WHERE "id" = :id AND "userId" = :userId LIMIT 1`,
      { replacements: { id: Number(pageId), userId: Number(userId) }, type: QueryTypes.SELECT }
    );
    if (!existing[0]) {
      throw new Error("Página do diário não encontrada ou você não tem permissão para editá-la.");
    }

    await repo.sequelize.query(
      `UPDATE "diary_pages"
       SET "title" = :title,
           "content" = :content,
           "mood" = :mood,
           "category" = :category,
           "isPublicAnonymous" = :isPublicAnonymous,
           "wordCount" = :wordCount,
           "estimatedReadSeconds" = :estimatedReadSeconds,
           "updatedAt" = NOW()
       WHERE "id" = :id AND "userId" = :userId`,
      {
        replacements: {
          id: Number(pageId),
          userId: Number(userId),
          title: cleanTitle,
          content: cleanContent,
          mood: validMood,
          category: validCategory,
          isPublicAnonymous: isPub,
          wordCount,
          estimatedReadSeconds,
        },
      }
    );

    const updated = await repo.sequelize.query(
      `SELECT * FROM "diary_pages" WHERE "id" = :id LIMIT 1`,
      { replacements: { id: Number(pageId) }, type: QueryTypes.SELECT }
    );
    const [enriched] = await enrichPublicPagesForViewer(updated, userId, minReadSeconds);
    return {
      success: true,
      page: enriched,
      message: isPub
        ? "Página atualizada e publicada de forma 100% anônima no Cantinho de Desabafo!"
        : "Página salva no seu Diário Privado (somente você pode ler).",
    };
  }

  const alias = generateAuthorAnonymousAlias(Date.now() + Number(userId));
  const inserted = await repo.sequelize.query(
    `INSERT INTO "diary_pages"
      ("userId", "avatarId", "title", "content", "mood", "category", "isPublicAnonymous", "anonymousAlias", "wordCount", "estimatedReadSeconds")
     VALUES (:userId, :avatarId, :title, :content, :mood, :category, :isPublicAnonymous, :alias, :wordCount, :estimatedReadSeconds)
     RETURNING *`,
    {
      replacements: {
        userId: Number(userId),
        avatarId: Number(avatarId || 0),
        title: cleanTitle,
        content: cleanContent,
        mood: validMood,
        category: validCategory,
        isPublicAnonymous: isPub,
        alias,
        wordCount,
        estimatedReadSeconds,
      },
      type: QueryTypes.SELECT,
    }
  );

  const [enriched] = await enrichPublicPagesForViewer(inserted, userId, minReadSeconds);
  return {
    success: true,
    page: enriched,
    message: isPub
      ? "Página escrita e compartilhada anonimamente no Cantinho de Desabafo!"
      : "Página guardada a sete chaves no seu Diário Privado!",
  };
}

async function toggleDiaryPageVisibility({ userId, pageId, isPublicAnonymous }) {
  await ensureDiaryTables();
  const rows = await repo.sequelize.query(
    `SELECT * FROM "diary_pages" WHERE "id" = :id AND "userId" = :userId LIMIT 1`,
    { replacements: { id: Number(pageId), userId: Number(userId) }, type: QueryTypes.SELECT }
  );
  if (!rows[0]) throw new Error("Página não encontrada no seu diário.");

  const nextVisibility =
    isPublicAnonymous !== undefined
      ? isPublicAnonymous === true || isPublicAnonymous === "true"
      : !rows[0].isPublicAnonymous;

  await repo.sequelize.query(
    `UPDATE "diary_pages" SET "isPublicAnonymous" = :vis, "updatedAt" = NOW() WHERE "id" = :id AND "userId" = :userId`,
    { replacements: { vis: nextVisibility, id: Number(pageId), userId: Number(userId) } }
  );

  return {
    success: true,
    isPublicAnonymous: nextVisibility,
    message: nextVisibility
      ? "🎭 Sua página agora está Pública e 100% Anônima no Cantinho de Desabafo!"
      : "🔒 Sua página voltou a ser 100% Privada (só você pode ver).",
  };
}

async function deleteDiaryPage({ userId, pageId }) {
  await ensureDiaryTables();
  const rows = await repo.sequelize.query(
    `SELECT * FROM "diary_pages" WHERE "id" = :id AND "userId" = :userId LIMIT 1`,
    { replacements: { id: Number(pageId), userId: Number(userId) }, type: QueryTypes.SELECT }
  );
  if (!rows[0]) throw new Error("Página não encontrada ou sem permissão.");

  await repo.sequelize.query(`DELETE FROM "diary_reactions" WHERE "pageId" = :id`, {
    replacements: { id: Number(pageId) },
  });
  await repo.sequelize.query(`DELETE FROM "diary_comments" WHERE "pageId" = :id`, {
    replacements: { id: Number(pageId) },
  });
  await repo.sequelize.query(`DELETE FROM "diary_pages" WHERE "id" = :id AND "userId" = :userId`, {
    replacements: { id: Number(pageId), userId: Number(userId) },
  });

  return { success: true, message: "Página removida do seu diário." };
}

async function reactToDiaryPage({ userId, avatarId, pageId, reactionType = "hug" }) {
  await ensureDiaryTables();
  if (!userId) throw new Error("Faça login para enviar seu acolhimento anônimo.");

  const validReaction = DIARY_REACTIONS[reactionType] ? reactionType : "hug";
  const pageRows = await repo.sequelize.query(
    `SELECT * FROM "diary_pages" WHERE "id" = :id AND ("isPublicAnonymous" = TRUE OR "userId" = :userId) LIMIT 1`,
    { replacements: { id: Number(pageId), userId: Number(userId) }, type: QueryTypes.SELECT }
  );
  const page = pageRows[0];
  if (!page) throw new Error("Página não encontrada.");

  const existing = await repo.sequelize.query(
    `SELECT * FROM "diary_reactions" WHERE "pageId" = :pageId AND "reactorUserId" = :userId LIMIT 1`,
    { replacements: { pageId: Number(pageId), userId: Number(userId) }, type: QueryTypes.SELECT }
  );

  let myReaction = null;
  if (existing[0]) {
    if (existing[0].reactionType === validReaction) {
      // Remove se clicou na mesma reação
      await repo.sequelize.query(
        `DELETE FROM "diary_reactions" WHERE "id" = :id`,
        { replacements: { id: existing[0].id } }
      );
      myReaction = null;
    } else {
      await repo.sequelize.query(
        `UPDATE "diary_reactions" SET "reactionType" = :reactionType WHERE "id" = :id`,
        { replacements: { reactionType: validReaction, id: existing[0].id } }
      );
      myReaction = validReaction;
    }
  } else {
    await repo.sequelize.query(
      `INSERT INTO "diary_reactions" ("pageId", "reactorUserId", "reactorAvatarId", "reactionType")
       VALUES (:pageId, :userId, :avatarId, :reactionType)`,
      {
        replacements: {
          pageId: Number(pageId),
          userId: Number(userId),
          avatarId: Number(avatarId || 0),
          reactionType: validReaction,
        },
      }
    );
    myReaction = validReaction;
  }

  // Atualiza contador total de reações na página
  const countRow = await repo.sequelize.query(
    `SELECT COUNT(*)::int AS cnt FROM "diary_reactions" WHERE "pageId" = :pageId`,
    { replacements: { pageId: Number(pageId) }, type: QueryTypes.SELECT }
  );
  const totalLikes = Number(countRow[0]?.cnt || 0);
  await repo.sequelize.query(
    `UPDATE "diary_pages" SET "likesCount" = :cnt WHERE "id" = :pageId`,
    { replacements: { cnt: totalLikes, pageId: Number(pageId) } }
  );

  const [enriched] = await enrichPublicPagesForViewer([page], userId);
  return {
    success: true,
    myReaction,
    likesCount: enriched.likesCount,
    reactionsSummary: enriched.reactionsSummary,
  };
}

async function commentOnDiaryPage({ userId, avatarId, pageId, text }) {
  await ensureDiaryTables();
  if (!userId) throw new Error("Faça login para comentar anonimamente.");

  const cleanText = String(text || "").trim().slice(0, 600);
  if (!cleanText) throw new Error("Escreva uma mensagem antes de enviar.");

  const pageRows = await repo.sequelize.query(
    `SELECT * FROM "diary_pages" WHERE "id" = :id AND ("isPublicAnonymous" = TRUE OR "userId" = :userId) LIMIT 1`,
    { replacements: { id: Number(pageId), userId: Number(userId) }, type: QueryTypes.SELECT }
  );
  const page = pageRows[0];
  if (!page) throw new Error("Página não encontrada.");

  const isPageAuthor = Number(page.userId) === Number(userId) && Number(page.userId) !== 0;
  const alias = isPageAuthor
    ? `${page.anonymousAlias} (Autor)`
    : generateReaderAnonymousAlias(page.id, userId);

  const inserted = await repo.sequelize.query(
    `INSERT INTO "diary_comments" ("pageId", "commenterUserId", "commenterAvatarId", "anonymousAlias", "isPageAuthor", "text")
     VALUES (:pageId, :userId, :avatarId, :alias, :isPageAuthor, :text)
     RETURNING *`,
    {
      replacements: {
        pageId: Number(page.id),
        userId: Number(userId),
        avatarId: Number(avatarId || 0),
        alias,
        isPageAuthor,
        text: cleanText,
      },
      type: QueryTypes.SELECT,
    }
  );

  const countRow = await repo.sequelize.query(
    `SELECT COUNT(*)::int AS cnt FROM "diary_comments" WHERE "pageId" = :pageId`,
    { replacements: { pageId: Number(page.id) }, type: QueryTypes.SELECT }
  );
  await repo.sequelize.query(
    `UPDATE "diary_pages" SET "commentsCount" = :cnt WHERE "id" = :pageId`,
    { replacements: { cnt: Number(countRow[0]?.cnt || 0), pageId: Number(page.id) } }
  );

  // Notifica o autor da página sem revelar a identidade de quem comentou
  if (!isPageAuthor && Number(page.avatarId) > 0) {
    await createNotification({
      userId: page.userId,
      avatarId: page.avatarId,
      type: "DIARY_COMMENT",
      title: "🎭 Novo Apoio Anônimo no Diário",
      message: `${alias} deixou uma mensagem acolhedora na sua página "${page.title}".`,
      icon: "fa-book-open-reader",
    });
  }

  const c = inserted[0];
  return {
    success: true,
    comment: {
      id: Number(c.id),
      pageId: Number(c.pageId),
      anonymousAlias: c.anonymousAlias,
      isPageAuthor: Boolean(c.isPageAuthor),
      isMyComment: true,
      text: c.text,
      createdAt: c.createdAt,
    },
    commentsCount: Number(countRow[0]?.cnt || 0),
  };
}

async function deleteDiaryComment({ userId, commentId }) {
  await ensureDiaryTables();
  const rows = await repo.sequelize.query(
    `SELECT c.*, p."userId" AS "pageOwnerUserId"
     FROM "diary_comments" c
     JOIN "diary_pages" p ON p."id" = c."pageId"
     WHERE c."id" = :id LIMIT 1`,
    { replacements: { id: Number(commentId) }, type: QueryTypes.SELECT }
  );
  const row = rows[0];
  if (!row) throw new Error("Comentário não encontrado.");

  if (Number(row.commenterUserId) !== Number(userId) && Number(row.pageOwnerUserId) !== Number(userId)) {
    throw new Error("Sem permissão para remover este comentário.");
  }

  await repo.sequelize.query(`DELETE FROM "diary_comments" WHERE "id" = :id`, {
    replacements: { id: Number(commentId) },
  });

  const countRow = await repo.sequelize.query(
    `SELECT COUNT(*)::int AS cnt FROM "diary_comments" WHERE "pageId" = :pageId`,
    { replacements: { pageId: Number(row.pageId) }, type: QueryTypes.SELECT }
  );
  await repo.sequelize.query(
    `UPDATE "diary_pages" SET "commentsCount" = :cnt WHERE "id" = :pageId`,
    { replacements: { cnt: Number(countRow[0]?.cnt || 0), pageId: Number(row.pageId) } }
  );

  return { success: true, pageId: Number(row.pageId), commentsCount: Number(countRow[0]?.cnt || 0) };
}

/**
 * Registra o tempo de leitura ativa de uma página pública anônima e processa o pagamento
 * por interação/tempo de leitura tanto para o Leitor quanto para o Autor (com proteção Anti-Farm).
 */
async function recordDiaryReadingProgress({
  readerUserId,
  readerAvatarId,
  pageId,
  secondsRead = 0,
}) {
  await ensureDiaryTables();
  if (!readerUserId) throw new Error("Usuário não autenticado.");

  const rules = await getEconomyRules();
  const minReadRule = Math.max(10, Number(rules.diaryMinReadSeconds ?? 30));
  const readerRewardCoins = Math.max(0, Number(rules.diaryReaderRewardPerPageCoins ?? 0.25));
  const authorRewardPerReadCoins = Math.max(0, Number(rules.diaryAuthorRewardPerReadCoins ?? 0.50));
  const authorBonusPer10MinCoins = Math.max(0, Number(rules.diaryAuthorBonusPer10MinCoins ?? 5.00));
  const readerDailyLimitPages = Math.max(1, Number(rules.diaryReaderDailyLimitPages ?? 20));

  const pageRows = await repo.sequelize.query(
    `SELECT * FROM "diary_pages" WHERE "id" = :id AND "isPublicAnonymous" = TRUE LIMIT 1`,
    { replacements: { id: Number(pageId) }, type: QueryTypes.SELECT }
  );
  const page = pageRows[0];
  if (!page) throw new Error("Página pública não encontrada.");

  const reqSeconds = Math.max(10, Math.min(60, Number(page.estimatedReadSeconds || minReadRule)));
  const cleanSeconds = Math.max(1, Math.min(180, Math.floor(Number(secondsRead) || 0)));
  const monthKey = getMonthKey();
  const dayKey = getDayKey();
  const isSelfAuthor = Number(page.userId) === Number(readerUserId) && Number(page.userId) !== 0;

  // Busca ou cria sessão de leitura desta conta para esta página no mês
  const existingRows = await repo.sequelize.query(
    `SELECT * FROM "diary_reading_sessions"
     WHERE "pageId" = :pageId AND "readerUserId" = :readerUserId AND "monthKey" = :monthKey LIMIT 1`,
    {
      replacements: { pageId: Number(page.id), readerUserId: Number(readerUserId), monthKey },
      type: QueryTypes.SELECT,
    }
  );

  let session = existingRows[0];
  const prevSeconds = Number(session?.secondsRead || 0);
  const newSeconds = Math.max(prevSeconds, cleanSeconds);
  const deltaSeconds = Math.max(0, newSeconds - prevSeconds);

  if (!session) {
    const inserted = await repo.sequelize.query(
      `INSERT INTO "diary_reading_sessions"
        ("pageId", "readerUserId", "readerAvatarId", "authorUserId", "authorAvatarId", "monthKey", "dayKey", "secondsRead", "rewarded")
       VALUES (:pageId, :readerUserId, :readerAvatarId, :authorUserId, :authorAvatarId, :monthKey, :dayKey, :secondsRead, FALSE)
       RETURNING *`,
      {
        replacements: {
          pageId: Number(page.id),
          readerUserId: Number(readerUserId),
          readerAvatarId: Number(readerAvatarId || 0),
          authorUserId: Number(page.userId || 0),
          authorAvatarId: Number(page.avatarId || 0),
          monthKey,
          dayKey,
          secondsRead: newSeconds,
        },
        type: QueryTypes.SELECT,
      }
    );
    session = inserted[0];
  } else if (deltaSeconds > 0) {
    await repo.sequelize.query(
      `UPDATE "diary_reading_sessions"
       SET "secondsRead" = :secondsRead, "updatedAt" = NOW()
       WHERE "id" = :id`,
      { replacements: { secondsRead: newSeconds, id: session.id } }
    );
    session.secondsRead = newSeconds;
  }

  // Se o próprio autor estiver apenas relendo sua própria página, não soma pagamento nem tempo de farm
  if (isSelfAuthor) {
    return {
      success: true,
      qualified: true,
      isSelfAuthor: true,
      rewardedNow: false,
      readerEarnedCoins: 0,
      authorEarnedCoins: 0,
      message: "Esta página foi escrita por você (leituras do próprio autor não geram pagamento Anti-Farm).",
    };
  }

  // Se ainda não atingiu o tempo mínimo de leitura da página
  if (newSeconds < reqSeconds) {
    return {
      success: true,
      qualified: false,
      rewardedNow: false,
      secondsRead: newSeconds,
      requiredReadSeconds: reqSeconds,
      message: `Continue lendo por mais ${reqSeconds - newSeconds}s para concluir a leitura premiada.`,
    };
  }

  // Se já foi recompensado anteriormente nesta página neste mês
  if (session.rewarded) {
    return {
      success: true,
      qualified: true,
      rewardedNow: false,
      alreadyRewarded: true,
      readerEarnedCoins: Number(session.readerRewardCoins || 0),
      message: "Você já concluiu e recebeu a recompensa de leitura desta página!",
    };
  }

  // Verifica limite diário do leitor
  const todayCountRow = await repo.sequelize.query(
    `SELECT COUNT(*)::int AS cnt
     FROM "diary_reading_sessions"
     WHERE "readerUserId" = :readerUserId AND "dayKey" = :dayKey AND "rewarded" = TRUE`,
    { replacements: { readerUserId: Number(readerUserId), dayKey }, type: QueryTypes.SELECT }
  );
  const rewardedTodayCount = Number(todayCountRow[0]?.cnt || 0);
  const canRewardReader = rewardedTodayCount < readerDailyLimitPages && readerRewardCoins > 0;

  let actualReaderEarned = 0;
  let actualAuthorEarned = 0;
  let milestone10MinBonusEarned = 0;
  let updatedReaderWallet = null;

  // 1. Credita recompensa ao Leitor (se dentro do limite diário e tiver avatarId)
  if (canRewardReader && Number(readerAvatarId) > 0) {
    let readerWallet = await repo.Currency.findOne({
      where: { [Op.or]: [{ avatarId: Number(readerAvatarId) }, { ownerId: Number(readerAvatarId) }] },
    });
    if (readerWallet) {
      readerWallet.coins = Number((Number(readerWallet.coins || 0) + readerRewardCoins).toFixed(4));
      await readerWallet.save();
      actualReaderEarned = readerRewardCoins;
      updatedReaderWallet = readerWallet.get({ plain: true });

      await recordLedgerEntry({
        userId: readerUserId,
        avatarId: Number(readerAvatarId),
        currencyType: "Coins",
        category: "DIARY_READ_REWARD",
        amount: readerRewardCoins,
        feeAmount: 0,
        balanceAfter: readerWallet.coins,
        description: `Recompensa por tempo de leitura no Cantinho de Desabafo ("${page.title.slice(0, 50)}")`,
      });
    }
  }

  // 2. Atualiza métricas da página e credita recompensa ao Autor da página (se page.avatarId > 0)
  const newTotalReads = Number(page.totalReadsCount || 0) + 1;
  const newTotalSeconds = Number(page.totalReadingSeconds || 0) + reqSeconds;
  const prevMilestones = Number(page.paid10MinMilestones || 0);
  const currentMilestones = Math.floor(newTotalSeconds / 600); // a cada 600s (10 minutos) de leitura acumulada
  const newlyReachedMilestones = Math.max(0, currentMilestones - prevMilestones);

  if (Number(page.avatarId) > 0 && Number(page.userId) > 0) {
    const authorWallet = await repo.Currency.findOne({
      where: { [Op.or]: [{ avatarId: Number(page.avatarId) }, { ownerId: Number(page.avatarId) }] },
    });

    if (authorWallet) {
      actualAuthorEarned = authorRewardPerReadCoins;
      if (newlyReachedMilestones > 0 && authorBonusPer10MinCoins > 0) {
        milestone10MinBonusEarned = Number((newlyReachedMilestones * authorBonusPer10MinCoins).toFixed(2));
      }

      const totalAuthorCredit = Number((actualAuthorEarned + milestone10MinBonusEarned).toFixed(4));
      if (totalAuthorCredit > 0) {
        authorWallet.coins = Number((Number(authorWallet.coins || 0) + totalAuthorCredit).toFixed(4));
        await authorWallet.save();

        await recordLedgerEntry({
          userId: page.userId,
          avatarId: Number(page.avatarId),
          currencyType: "Coins",
          category: "DIARY_AUTHOR_REWARD",
          amount: totalAuthorCredit,
          feeAmount: 0,
          balanceAfter: authorWallet.coins,
          description:
            milestone10MinBonusEarned > 0
              ? `Leitura premiada (+${actualAuthorEarned} Coins) + Bônus de 10 min de leitura (+${milestone10MinBonusEarned} Coins) na página "${page.title.slice(0, 45)}"`
              : `Recompensa de autor por leitura completa na página "${page.title.slice(0, 50)}"`,
        });

        if (milestone10MinBonusEarned > 0) {
          await createNotification({
            userId: page.userId,
            avatarId: Number(page.avatarId),
            type: "DIARY_MILESTONE",
            title: "📖 +10 Minutos de Leitura no seu Diário!",
            message: `Sua página anônima "${page.title}" atingiu mais 10 minutos de leitura acumulada e rendeu +${milestone10MinBonusEarned.toFixed(2)} Coins de bônus!`,
            icon: "fa-coins",
          });
        }
      }
    }
  }

  const totalAuthorAdded = Number((actualAuthorEarned + milestone10MinBonusEarned).toFixed(2));

  await repo.sequelize.query(
    `UPDATE "diary_pages"
     SET "totalReadsCount" = :reads,
         "totalReadingSeconds" = :seconds,
         "paid10MinMilestones" = :milestones,
         "totalCoinsEarned" = COALESCE("totalCoinsEarned", 0) + :authorAdded,
         "updatedAt" = NOW()
     WHERE "id" = :id`,
    {
      replacements: {
        reads: newTotalReads,
        seconds: newTotalSeconds,
        milestones: Math.max(prevMilestones, currentMilestones),
        authorAdded: totalAuthorAdded,
        id: Number(page.id),
      },
    }
  );

  await repo.sequelize.query(
    `UPDATE "diary_reading_sessions"
     SET "secondsRead" = :secondsRead,
         "rewarded" = TRUE,
         "readerRewardCoins" = :readerCoins,
         "authorRewardCoins" = :authorCoins,
         "dayKey" = :dayKey,
         "updatedAt" = NOW()
     WHERE "id" = :id`,
    {
      replacements: {
        secondsRead: Math.max(newSeconds, reqSeconds),
        readerCoins: actualReaderEarned,
        authorCoins: totalAuthorAdded,
        dayKey,
        id: session.id,
      },
    }
  );

  return {
    success: true,
    qualified: true,
    rewardedNow: true,
    readerEarnedCoins: actualReaderEarned,
    authorEarnedCoins: totalAuthorAdded,
    milestone10MinBonusEarned,
    totalReadsCount: newTotalReads,
    totalReadingSeconds: newTotalSeconds,
    totalReadingMinutes: Number((newTotalSeconds / 60).toFixed(1)),
    wallet: updatedReaderWallet,
    message:
      actualReaderEarned > 0
        ? `Leitura concluída! Você ganhou +${actualReaderEarned.toFixed(2)} Coins por dedicar seu tempo e o autor anônimo recebeu +${ (actualAuthorEarned || authorRewardPerReadCoins).toFixed(2) } Coins!`
        : `Leitura concluída! Você atingiu o limite diário de bônus de leitor (${readerDailyLimitPages}/dia), mas sua leitura contou para o autor anônimo!`,
  };
}

module.exports = {
  DIARY_MOODS,
  DIARY_CATEGORIES,
  DIARY_REACTIONS,
  ensureDiaryTables,
  getDiaryOverview,
  saveDiaryPage,
  toggleDiaryPageVisibility,
  deleteDiaryPage,
  reactToDiaryPage,
  commentOnDiaryPage,
  deleteDiaryComment,
  recordDiaryReadingProgress,
};
