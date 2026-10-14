const os = require('os');
const repo = require('../repositories/repository');
const { getMarketStats } = require('./coinMarket.service');

// ============================================================================
// TELEMETRIA DE VISITAS AO SITE & REGIÕES DE ACESSO (EM MEMÓRIA + TEMPO REAL)
// ============================================================================
const visitTelemetry = {
  totalPageViews: 0,
  visitorsLastSeen: new Map(), // visitorId -> timestamp(ms)
  regionCounts: new Map(),     // regionName -> count
  pageCounts: new Map(),       // path -> count
  recentLogs: [],              // últimos 30 acessos
};

const TIMEZONE_TO_REGION = {
  'America/Sao_Paulo': 'Brasil — Sudeste (SP/RJ/MG)',
  'America/Fortaleza': 'Brasil — Nordeste (CE/RN)',
  'America/Recife': 'Brasil — Nordeste (PE/AL/PB)',
  'America/Bahia': 'Brasil — Nordeste (BA/SE)',
  'America/Maceio': 'Brasil — Nordeste (AL)',
  'America/Belem': 'Brasil — Norte (PA/AP)',
  'America/Manaus': 'Brasil — Norte (AM/RR)',
  'America/Cuiaba': 'Brasil — Centro-Oeste (MT)',
  'America/Campo_Grande': 'Brasil — Centro-Oeste (MS)',
  'America/Araguaina': 'Brasil — Norte (TO)',
  'America/Porto_Velho': 'Brasil — Norte (RO)',
  'America/Rio_Branco': 'Brasil — Norte (AC)',
  'Europe/Lisbon': 'Portugal — Lisboa / Porto',
  'America/New_York': 'Estados Unidos — Costa Leste',
  'America/Chicago': 'Estados Unidos — Centro',
  'America/Los_Angeles': 'Estados Unidos — Costa Oeste',
  'Europe/Madrid': 'Espanha — Madrid / Barcelona',
  'America/Argentina/Buenos_Aires': 'Argentina — Buenos Aires',
  'America/Santiago': 'Chile — Santiago',
  'America/Bogota': 'Colômbia — Bogotá',
  'America/Mexico_City': 'México — Cidade do México',
};

const COUNTRY_CODE_TO_REGION = {
  BR: 'Brasil — Geral',
  PT: 'Portugal',
  US: 'Estados Unidos (EUA)',
  ES: 'Espanha',
  AR: 'Argentina',
  MX: 'México',
  CL: 'Chile',
  CO: 'Colômbia',
  FR: 'França',
  DE: 'Alemanha',
  GB: 'Reino Unido',
  JP: 'Japão',
};

function resolveRegionFromRequest(req, extra = {}) {
  if (extra.region && String(extra.region).trim()) {
    return String(extra.region).trim();
  }
  const headerRegion = req.headers?.['x-visitor-region'];
  if (headerRegion && String(headerRegion).trim()) {
    return String(headerRegion).trim();
  }

  const tz = String(extra.timezone || req.headers?.['x-timezone'] || '').trim();
  if (tz && TIMEZONE_TO_REGION[tz]) {
    return TIMEZONE_TO_REGION[tz];
  }

  const cfCountry = String(
    req.headers?.['cf-ipcountry'] ||
    req.headers?.['x-vercel-ip-country'] ||
    req.headers?.['x-country-code'] ||
    ''
  ).toUpperCase().trim();
  const cfRegion = String(
    req.headers?.['cf-region'] ||
    req.headers?.['x-vercel-ip-country-region'] ||
    ''
  ).trim();

  if (cfCountry) {
    const baseCountry = COUNTRY_CODE_TO_REGION[cfCountry] || `País (${cfCountry})`;
    return cfRegion ? `${baseCountry} (${cfRegion})` : baseCountry;
  }

  if (tz) {
    if (tz.startsWith('America/')) return `Américas (${tz.replace('America/', '')})`;
    if (tz.startsWith('Europe/')) return `Europa (${tz.replace('Europe/', '')})`;
    if (tz.startsWith('Asia/')) return `Ásia (${tz.replace('Asia/', '')})`;
  }

  const lang = String(extra.language || req.headers?.['accept-language'] || '').toLowerCase();
  if (lang.startsWith('pt-pt')) return 'Portugal — Lisboa / Porto';
  if (lang.startsWith('pt')) return 'Brasil — Sudeste (SP/RJ/MG)';
  if (lang.startsWith('es')) return 'América Latina / Espanha';
  if (lang.startsWith('en')) return 'Estados Unidos / Internacional';

  return 'Brasil — Sudeste (SP/RJ/MG)';
}

function maskIp(ipRaw) {
  const ip = String(ipRaw || '127.0.0.1').split(',')[0].trim();
  if (ip === '::1' || ip === '127.0.0.1' || ip.includes('127.0.0.1')) return 'Local / 127.0.x.x';
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.x.x`;
  return ip.slice(0, 14);
}

function detectDeviceLabel(ua = '') {
  const s = String(ua).toLowerCase();
  if (s.includes('bot') || s.includes('axios') || s.includes('simulator')) return 'Bot / Automação';
  if (s.includes('mobile') || s.includes('android') || s.includes('iphone')) return 'Mobile / Smartphone';
  if (s.includes('windows')) return 'Desktop (Windows)';
  if (s.includes('linux')) return 'Desktop (Linux)';
  if (s.includes('macintosh') || s.includes('mac os')) return 'Desktop (macOS)';
  return 'Navegador Web';
}

function recordSiteVisit(req, extra = {}) {
  try {
    const rawPath = String(extra.path || req.originalUrl || req.url || '/').split('?')[0];
    if (
      rawPath.startsWith('/static') ||
      rawPath.startsWith('/files') ||
      rawPath.startsWith('/favicon') ||
      rawPath.startsWith('/admin/api/stats')
    ) {
      return;
    }

    const ipRaw = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const ua = req.headers?.['user-agent'] || '';
    const userId = req.session?.user?.id || req.user?.id || extra.userId || '';
    const visitorKey = userId ? `user_${userId}` : `${ipRaw}_${ua.slice(0, 40)}`;

    const region = resolveRegionFromRequest(req, extra);
    const nowMs = Date.now();

    visitTelemetry.totalPageViews += 1;
    visitTelemetry.visitorsLastSeen.set(visitorKey, nowMs);
    visitTelemetry.regionCounts.set(region, (visitTelemetry.regionCounts.get(region) || 0) + 1);
    visitTelemetry.pageCounts.set(rawPath, (visitTelemetry.pageCounts.get(rawPath) || 0) + 1);

    visitTelemetry.recentLogs.unshift({
      timestamp: new Date(nowMs).toISOString(),
      path: rawPath,
      region,
      ipMasked: maskIp(ipRaw),
      device: detectDeviceLabel(ua),
      user: req.session?.user?.userName || req.user?.userName || extra.userName || 'Visitante',
    });

    if (visitTelemetry.recentLogs.length > 30) {
      visitTelemetry.recentLogs.length = 30;
    }
  } catch (_) {}
}

function getVisitStatsSnapshot() {
  const nowMs = Date.now();
  const fiveMinAgo = nowMs - 5 * 60 * 1000;
  let onlineNow = 0;
  for (const lastSeen of visitTelemetry.visitorsLastSeen.values()) {
    if (lastSeen >= fiveMinAgo) onlineNow += 1;
  }

  const total = Math.max(1, visitTelemetry.totalPageViews);

  const byRegion = Array.from(visitTelemetry.regionCounts.entries())
    .map(([region, count]) => ({
      region,
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const byPage = Array.from(visitTelemetry.pageCounts.entries())
    .map(([path, count]) => ({
      path,
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return {
    totalPageViews: visitTelemetry.totalPageViews,
    uniqueVisitors: visitTelemetry.visitorsLastSeen.size,
    onlineNow: Math.max(onlineNow, 1),
    byRegion,
    byPage,
    recentLogs: visitTelemetry.recentLogs.slice(0, 20),
  };
}

function formatUptime(seconds) {
  const s = Math.floor(Number(seconds) || 0);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
}

async function safeCount(model, where = {}) {
  try {
    if (!model || typeof model.count !== 'function') return 0;
    return await model.count({ where });
  } catch (_) {
    return 0;
  }
}

async function safeSum(model, field, where = {}) {
  try {
    if (!model || typeof model.sum !== 'function') return 0;
    const val = await model.sum(field, { where });
    return Number(val || 0);
  } catch (_) {
    return 0;
  }
}

async function safeRawCount(sql) {
  try {
    const [rows] = await repo.sequelize.query(sql);
    return Number(rows?.[0]?.cnt || 0);
  } catch (_) {
    return 0;
  }
}

function clearVisitTelemetry() {
  visitTelemetry.totalPageViews = 0;
  visitTelemetry.visitorsLastSeen.clear();
  visitTelemetry.regionCounts.clear();
  visitTelemetry.pageCounts.clear();
  visitTelemetry.recentLogs.length = 0;
  cachedDbStats = null;
  lastStatsCacheTime = 0;
  return { cleared: true, timestamp: new Date().toISOString() };
}

// ============================================================================
// CACHE COM TTL DE 60 SEGUNDOS PARA ESTANCAR CONSUMO DE DISK I/O NO BANCO
// ============================================================================
let cachedDbStats = null;
let lastStatsCacheTime = 0;
const STATS_CACHE_TTL_MS = 60 * 1000; // 60 segundos de TTL

async function getPlatformStats(options = {}) {
  const force = Boolean(options && (options.force === true || options === true));
  const now = new Date();
  const nowMs = Date.now();

  const isCacheValid = !force && cachedDbStats && (nowMs - lastStatsCacheTime < STATS_CACHE_TTL_MS);

  let dbStats = cachedDbStats;
  let dbStatus = 'online';
  let dbLatencyMs = cachedDbStats?.dbLatencyMs || 1;

  if (!isCacheValid) {
    const t0 = Date.now();
    try {
      await repo.sequelize.query('SELECT 1');
    } catch (_) {
      dbStatus = 'degraded';
    }
    dbLatencyMs = Math.max(1, Date.now() - t0);

    const Op = repo.Sequelize.Op;
    const [
      usersCount,
      avatarsCount,
      onlineAvatarsCount,
      vipAvatarsCount,
      postsCount,
      photosCount,
      activeReelsCount,
      likesCount,
      commentsCount,
      friendsAcceptedCount,
      friendsPendingCount,
      followsCount,
      matchesMutualCount,
      crushesCount,
      roomsCount,
      serversCount,
      activeServersCount,
      objectsCount,
      chatRoomsCount,
      chatMessagesCount,
      totalCashInWallets,
      totalCoinsInWallets,
      totalChipsInWallets,
      transactionsCount,
      pendingApprovalsCount,
      diaryPagesCount,
      diaryPublicCount,
      diaryCommentsCount,
      ledgerEntriesCount,
      marketStats,
    ] = await Promise.all([
      safeCount(repo.User),
      safeCount(repo.Avatar),
      safeCount(repo.Avatar, { online: true }),
      safeCount(repo.Avatar, { vip: true }),
      safeCount(repo.Post),
      safeCount(repo.Photo),
      safeCount(repo.MiniReel, { expiresAt: { [Op.gt]: now } }),
      safeCount(repo.Like),
      safeCount(repo.Comment),
      safeCount(repo.Friend, { status: 'accepted' }),
      safeCount(repo.Friend, { status: 'pending' }),
      safeCount(repo.Follow),
      safeCount(repo.MatchProfile, { status: 'matched' }),
      safeCount(repo.MatchProfile, { status: 'liked' }),
      safeCount(repo.RoomModel),
      safeCount(repo.Server),
      safeCount(repo.Server, { isClosed: false }),
      safeCount(repo.ObjectModel),
      safeCount(repo.ChatRoom),
      safeCount(repo.ChatMessage),
      safeSum(repo.Currency, 'cash'),
      safeSum(repo.Currency, 'coins'),
      safeSum(repo.Currency, 'chips'),
      safeCount(repo.PaymentBank),
      safeCount(repo.PaymentBank, { status: 'WAITING_APPROVAL' }),
      safeRawCount('SELECT COUNT(*)::int AS cnt FROM public.diary_pages'),
      safeRawCount('SELECT COUNT(*)::int AS cnt FROM public.diary_pages WHERE "isPublicAnonymous" = true'),
      safeRawCount('SELECT COUNT(*)::int AS cnt FROM public.diary_comments'),
      safeRawCount('SELECT COUNT(*)::int AS cnt FROM public.wallet_ledger'),
      getMarketStats().catch(() => ({ totalCoinsInPool: 0, totalActiveOrders: 0, rateCoinsPerCash: 250 })),
    ]);

    cachedDbStats = {
      dbStatus,
      dbLatencyMs,
      community: {
        usersCount,
        avatarsCount,
        onlineAvatarsCount,
        vipAvatarsCount,
        friendsAcceptedCount,
        friendsPendingCount,
        followsCount,
        matchesMutualCount: Math.floor(matchesMutualCount / 2) || matchesMutualCount,
        crushesCount,
      },
      social: {
        postsCount,
        photosCount,
        activeReelsCount,
        likesCount,
        commentsCount,
        diaryPagesCount,
        diaryPublicCount,
        diaryCommentsCount,
      },
      metaverse: {
        roomsCount,
        serversCount,
        activeServersCount,
        objectsCount,
        chatRoomsCount,
        chatMessagesCount,
      },
      economy: {
        totalCashInWallets: Number(totalCashInWallets.toFixed(2)),
        totalCoinsInWallets: Math.floor(totalCoinsInWallets),
        totalChipsInWallets: Math.floor(totalChipsInWallets),
        poolCoins: Number(marketStats?.totalCoinsInPool || 0),
        activeOrdersCount: Number(marketStats?.totalActiveOrders || 0),
        rateCoinsPerCash: Number(marketStats?.rateCoinsPerCash || 250),
        transactionsCount,
        pendingApprovalsCount,
        ledgerEntriesCount,
        rules: marketStats,
      },
    };
    lastStatsCacheTime = nowMs;
  }

  const mem = process.memoryUsage();
  const rssMb = Number((mem.rss / (1024 * 1024)).toFixed(1));
  const heapUsedMb = Number((mem.heapUsed / (1024 * 1024)).toFixed(1));
  const heapTotalMb = Number((mem.heapTotal / (1024 * 1024)).toFixed(1));
  const heapUsagePercent = heapTotalMb > 0 ? Math.min(100, Math.round((heapUsedMb / heapTotalMb) * 100)) : 0;
  const cpuCores = os.cpus()?.length || 1;
  const loadAvg1m = Number((os.loadavg()?.[0] || 0).toFixed(2));

  return {
    timestamp: now.toISOString(),
    isCached: isCacheValid,
    cacheAgeSeconds: Math.floor((nowMs - lastStatsCacheTime) / 1000),
    visits: getVisitStatsSnapshot(),
    server: {
      status: cachedDbStats?.dbStatus || dbStatus,
      dbLatencyMs: cachedDbStats?.dbLatencyMs || dbLatencyMs,
      uptimeSeconds: Math.floor(process.uptime()),
      uptimeFormatted: formatUptime(process.uptime()),
      rssMb,
      heapUsedMb,
      heapTotalMb,
      heapUsagePercent,
      cpuCores,
      loadAvg1m,
      nodeVersion: process.version,
      platform: process.platform,
    },
    community: { ...cachedDbStats?.community },
    social: { ...cachedDbStats?.social },
    metaverse: { ...cachedDbStats?.metaverse },
    economy: { ...cachedDbStats?.economy },
  };
}

module.exports = {
  getPlatformStats,
  recordSiteVisit,
  getVisitStatsSnapshot,
  clearVisitTelemetry,
};
