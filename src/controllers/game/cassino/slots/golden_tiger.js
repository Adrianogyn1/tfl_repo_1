
/*
 * Golden Tiger Slot Machine v4
 * - Jackpots isolados por FAIXA DE BET (pools separados)
 * - Fortune Tiger Bonus: Cascade com multiplicador x3
 * - Scatter 3+ ativa bônus com queda de símbolos
 */

const fs = require("fs");
const path = require("path");
const router = require("express").Router();
const sessionService = require("../sessionService");

// ============= SÍMBOLOS =============
const S = {
  WILD: "wild",
  GOLD: "gold",
  DRAGON: "dragon",
  FORTUNE_BAG: "fortune_bag",
  RED_ENVELOPE: "red_envelope",
  SCROLL: "scroll",
  ORANGE: "orange",
  SCATTER: "scatter",
};

// ============= PAYTABLE =============
const PAYTABLE = {
  [S.WILD]: 100,
  [S.GOLD]: 40,
  [S.DRAGON]: 12,
  [S.FORTUNE_BAG]: 5,
  [S.RED_ENVELOPE]: 4,
  [S.SCROLL]: 2.5,
  [S.ORANGE]: 1.5,
};

const SCATTER_PAYOUT = { 3: 5, 4: 10, 5: 20 };
const SCATTER_BONUS_THRESHOLD = 3;
const CASCADE_MULTIPLIER = 3;
const MAX_CASCADE_LEVELS = 10;

// ============= CONFIGURAÇÕES FIXAS =============
const ALLOWED_BETS = [0.5, 1, 2, 2.5, 3, 3.5, 4, 4.5, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 75, 100, 125, 150, 200, 250];
const MAX_PAYOUT_MULTIPLIER = 4000;
const BET_TIER_THRESHOLD = 10;

// ============= JACKPOT TIERS =============
const JACKPOT_TIERS = {
  MINI: { chance: 1 / 200, minValue: 25, seed: 0 },
  MINOR: { chance: 1 / 500, minValue: 50, seed: 0 },
  MAJOR: { chance: 1 / 1500, minValue: 100, seed: 0 },
  GRAND: { chance: 1 / 5000, minValue: 500, seed: 0 },
};

// ============= PARÂMETROS AJUSTÁVEIS =============
let houseEdge = 0.01;
let jackpotContribution = 0.25;

const MIN_FRACTION = 0;
const MAX_FRACTION = 0.95;
const MIN_POOL_SHARE = 0.02;

function validateConfig(newHouseEdge, newJackpotContribution) {
  if (typeof newHouseEdge !== "number" || Number.isNaN(newHouseEdge)) {
    return "houseEdge precisa ser um número";
  }
  if (typeof newJackpotContribution !== "number" || Number.isNaN(newJackpotContribution)) {
    return "jackpotContribution precisa ser um número";
  }
  if (newHouseEdge < MIN_FRACTION || newHouseEdge > MAX_FRACTION) {
    return `houseEdge precisa estar entre ${MIN_FRACTION} e ${MAX_FRACTION}`;
  }
  if (newJackpotContribution < MIN_FRACTION || newJackpotContribution > MAX_FRACTION) {
    return `jackpotContribution precisa estar entre ${MIN_FRACTION} e ${MAX_FRACTION}`;
  }
  const poolShare = 1 - newHouseEdge - newJackpotContribution;
  if (poolShare < MIN_POOL_SHARE) {
    return `houseEdge + jackpotContribution não pode deixar menos de ${MIN_POOL_SHARE * 100}% pro pool`;
  }
  return null;
}

// ============= ARQUIVOS DE PERSISTÊNCIA =============
const STATE_FILE = path.join(__dirname, "machine-state.json");
const HISTORY_FILE = path.join(__dirname, "spin-history.jsonl");
const SESSIONS_DIR = path.join(__dirname, "sessions");
const MACHINE_ID = "golden-tiger";

if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

// ============= ESTADO DA MÁQUINA =============
const pools = new Map();
const jackpots = {
  tier1: { mini: JACKPOT_TIERS.MINI.seed, minor: JACKPOT_TIERS.MINOR.seed, major: JACKPOT_TIERS.MAJOR.seed, grand: JACKPOT_TIERS.GRAND.seed },
  tier2: { mini: JACKPOT_TIERS.MINI.seed, minor: JACKPOT_TIERS.MINOR.seed, major: JACKPOT_TIERS.MAJOR.seed, grand: JACKPOT_TIERS.GRAND.seed },
};

let machineHouseBalance = 0;
const stats = new Map();

function defaultStats() {
  return {
    spins: 0,
    totalWagered: 0,
    totalPaidOut: 0,
    houseProfit: 0,
    bonusTriggeredCount: 0,
    jackpotTriggeredCount: 0,
    jackpotsByTier: { mini: 0, minor: 0, major: 0, grand: 0 },
    scatterCounts: { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    biggestWin: null,
  };
}

function getStats(betAmount) {
  if (!stats.has(betAmount)) stats.set(betAmount, defaultStats());
  return stats.get(betAmount);
}

function getTier(betAmount) {
  return betAmount < BET_TIER_THRESHOLD ? "tier1" : "tier2";
}

function recordSpinStats({ betAmount, sessionId, totalWin, bonusTriggered, jackpotTier, scatterCount }) {
  const s = getStats(betAmount);
  s.spins += 1;
  s.totalWagered += betAmount;
  s.totalPaidOut += totalWin;
  s.houseProfit = s.totalWagered - s.totalPaidOut;

  if (bonusTriggered) s.bonusTriggeredCount += 1;
  if (jackpotTier) {
    s.jackpotTriggeredCount += 1;
    s.jackpotsByTier[jackpotTier] = (s.jackpotsByTier[jackpotTier] || 0) + 1;
  }

  const scatterKey = String(scatterCount);
  s.scatterCounts[scatterKey] = (s.scatterCounts[scatterKey] || 0) + 1;

  if (!s.biggestWin || totalWin > s.biggestWin.amount) {
    s.biggestWin = {
      amount: totalWin,
      betAmount,
      sessionId,
      timestamp: new Date().toISOString(),
      bonusTriggered,
      jackpotTier: jackpotTier || null,
      scatterCount,
    };
  }
}

function getStatsSummary() {
  const summary = {};
  for (const [bet, s] of stats.entries()) summary[bet] = s;
  return summary;
}

function getAggregatedStats() {
  let totalSpins = 0, totalWagered = 0, totalPaidOut = 0, globalBiggestWin = null;
  for (const s of stats.values()) {
    totalSpins += s.spins;
    totalWagered += s.totalWagered;
    totalPaidOut += s.totalPaidOut;
    if (s.biggestWin && (!globalBiggestWin || s.biggestWin.amount > globalBiggestWin.amount)) {
      globalBiggestWin = s.biggestWin;
    }
  }
  return {
    totalSpins,
    totalWagered,
    totalPaidOut,
    houseProfit: totalWagered - totalPaidOut,
    machineHouseBalance,
    jackpots,
    globalBiggestWin,
  };
}

// ============= POOLS =============
function getPool(betAmount) {
  if (!pools.has(betAmount)) pools.set(betAmount, 0);
  return pools.get(betAmount);
}

function feedPool(betAmount) {
  const jackpotCut = betAmount * jackpotContribution;
  const houseCut = betAmount * houseEdge;
  const toPool = betAmount - houseCut - jackpotCut;

  pools.set(betAmount, getPool(betAmount) + toPool);
  machineHouseBalance += houseCut;

  const tier = getTier(betAmount);
  const tierJackpots = jackpots[tier];
  tierJackpots.mini += jackpotCut * 0.4;
  tierJackpots.minor += jackpotCut * 0.3;
  tierJackpots.major += jackpotCut * 0.2;
  tierJackpots.grand += jackpotCut * 0.1;
}

function maxPoolWinCeiling(betAmount) {
  return getPool(betAmount);
}

function withdrawPoolWin(betAmount, amount) {
  if (amount <= 0) return true;
  const pool = getPool(betAmount);
  if (pool < amount) return false;
  pools.set(betAmount, pool - amount);
  return true;
}

function getPoolInfo() {
  const info = {};
  ALLOWED_BETS.forEach((bet) => { info[bet] = getPool(bet).toFixed(2); });
  return info;
}

// ============= PERSISTÊNCIA =============
function serializeState() {
  return {
    savedAt: new Date().toISOString(),
    machineHouseBalance,
    jackpots,
    config: { houseEdge, jackpotContribution },
    pools: Object.fromEntries(pools),
    stats: getStatsSummary(),
  };
}

function applyLoadedState(parsed) {
  if (!parsed || typeof parsed !== "object") return;

  if (typeof parsed.machineHouseBalance === "number" && !Number.isNaN(parsed.machineHouseBalance)) {
    machineHouseBalance = parsed.machineHouseBalance;
  }

  if (parsed.jackpots && typeof parsed.jackpots === "object") {
    if (parsed.jackpots.tier1) Object.assign(jackpots.tier1, parsed.jackpots.tier1);
    if (parsed.jackpots.tier2) Object.assign(jackpots.tier2, parsed.jackpots.tier2);
  }

  if (parsed.config && typeof parsed.config === "object") {
    const err = validateConfig(parsed.config.houseEdge, parsed.config.jackpotContribution);
    if (!err) {
      houseEdge = parsed.config.houseEdge;
      jackpotContribution = parsed.config.jackpotContribution;
    }
  }

  if (parsed.pools && typeof parsed.pools === "object") {
    Object.entries(parsed.pools).forEach(([betStr, value]) => {
      const bet = Number(betStr);
      const amount = Number(value);
      if (!Number.isNaN(bet) && !Number.isNaN(amount)) pools.set(bet, amount);
    });
  }

  if (parsed.stats && typeof parsed.stats === "object") {
    Object.entries(parsed.stats).forEach(([betStr, s]) => {
      const bet = Number(betStr);
      if (Number.isNaN(bet) || !s || typeof s !== "object") return;
      const merged = defaultStats();
      merged.spins = Number(s.spins) || 0;
      merged.totalWagered = Number(s.totalWagered) || 0;
      merged.totalPaidOut = Number(s.totalPaidOut) || 0;
      merged.houseProfit = merged.totalWagered - merged.totalPaidOut;
      merged.bonusTriggeredCount = Number(s.bonusTriggeredCount) || 0;
      merged.jackpotTriggeredCount = Number(s.jackpotTriggeredCount) || 0;
      if (s.jackpotsByTier && typeof s.jackpotsByTier === "object") {
        Object.assign(merged.jackpotsByTier, s.jackpotsByTier);
      }
      if (s.scatterCounts && typeof s.scatterCounts === "object") {
        Object.entries(s.scatterCounts).forEach(([k, v]) => { merged.scatterCounts[k] = Number(v) || 0; });
      }
      merged.biggestWin = s.biggestWin || null;
      stats.set(bet, merged);
    });
  }
}

function loadState() {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      console.log(`[golden-tiger] Estado zerado (${STATE_FILE})`);
      return;
    }
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    applyLoadedState(parsed);
    console.log(`[golden-tiger] Estado carregado (savedAt: ${parsed.savedAt})`);
  } catch (err) {
    console.error(`[golden-tiger] Erro ao carregar estado:`, err.message);
  }
}

let saveScheduled = false;
function saveState() {
  if (saveScheduled) return;
  saveScheduled = true;
  setImmediate(() => {
    saveScheduled = false;
    try {
      const tmpFile = `${STATE_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(serializeState(), null, 2));
      fs.renameSync(tmpFile, STATE_FILE);
    } catch (err) {
      console.error(`[golden-tiger] Erro ao salvar estado:`, err.message);
    }
  });
}

function saveStateSync() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(serializeState(), null, 2));
  } catch (err) {
    console.error(`[golden-tiger] Erro ao salvar (shutdown):`, err.message);
  }
}

loadState();
process.on("SIGINT", () => { saveStateSync(); process.exit(0); });
process.on("SIGTERM", () => { saveStateSync(); process.exit(0); });

// ============= HISTÓRICO =============
function appendHistory(record) {
  try {
    fs.appendFileSync(HISTORY_FILE, JSON.stringify(record) + "\n");
  } catch (err) {
    console.error(`[golden-tiger] Erro ao gravar histórico global:`, err.message);
  }
}

function getSessionHistoryFile(sessionId) {
  return path.join(SESSIONS_DIR, `${sessionId}.jsonl`);
}

function appendSessionHistory(sessionId, record) {
  try {
    const file = getSessionHistoryFile(sessionId);
    fs.appendFileSync(file, JSON.stringify(record) + "\n");
  } catch (err) {
    console.error(`[golden-tiger] Erro ao gravar histórico da sessão:`, err.message);
  }
}

function getSessionSpins(sessionId, limit = 100) {
  try {
    const file = getSessionHistoryFile(sessionId);
    if (!fs.existsSync(file)) return [];
    const lines = fs.readFileSync(file, "utf8").trim().split("\n").filter(l => l);
    return lines.slice(-limit).map(l => JSON.parse(l));
  } catch (err) {
    console.error(`[golden-tiger] Erro ao ler histórico da sessão:`, err.message);
    return [];
  }
}

// ============= REEL STRIPS =============
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildStrip(weights) {
  const strip = [];
  for (const [symbol, count] of Object.entries(weights)) {
    for (let i = 0; i < count; i++) strip.push(symbol);
  }
  return shuffleArray(strip);
}

const reelWeights = {
  0: { [S.WILD]: 3, [S.GOLD]: 2, [S.DRAGON]: 5, [S.FORTUNE_BAG]: 8, [S.RED_ENVELOPE]: 10, [S.SCROLL]: 12, [S.ORANGE]: 15, [S.SCATTER]: 2 },
  1: { [S.WILD]: 3, [S.GOLD]: 2, [S.DRAGON]: 5, [S.FORTUNE_BAG]: 8, [S.RED_ENVELOPE]: 10, [S.SCROLL]: 12, [S.ORANGE]: 15, [S.SCATTER]: 2 },
  2: { [S.WILD]: 3, [S.GOLD]: 2, [S.DRAGON]: 5, [S.FORTUNE_BAG]: 8, [S.RED_ENVELOPE]: 10, [S.SCROLL]: 12, [S.ORANGE]: 15, [S.SCATTER]: 2 },
};

const reelStrips = {
  0: buildStrip(reelWeights[0]),
  1: buildStrip(reelWeights[1]),
  2: buildStrip(reelWeights[2]),
};

const visibleSymbolPool = {};
for (const reelIndex of Object.keys(reelWeights)) {
  const entries = Object.entries(reelWeights[reelIndex]).filter(([sym]) => sym !== S.SCATTER);
  const expanded = [];
  entries.forEach(([sym, count]) => { for (let i = 0; i < count; i++) expanded.push(sym); });
  visibleSymbolPool[reelIndex] = expanded;
}

function randomVisibleSymbol(reelIndex) {
  const pool = visibleSymbolPool[reelIndex];
  return pool[randomInt(pool.length)];
}

// ============= PAYLINES =============
const PAYLINES = [
  { index: 0, rows: [0, 0, 0] },
  { index: 1, rows: [1, 1, 1] },
  { index: 2, rows: [2, 2, 2] },
  { index: 3, rows: [0, 1, 2] },
  { index: 4, rows: [2, 1, 0] },
];

// ============= RNG =============
function randomInt(max) {
  return Math.floor(Math.random() * max);
}

// ============= SPIN ENGINE =============
function spinReel(reelIndex) {
  const strip = reelStrips[reelIndex];
  const stopIndex = randomInt(strip.length);
  const column = [];
  for (let row = 0; row < 3; row++) column.push(strip[(stopIndex + row) % strip.length]);
  return column;
}

function generateRawGrid() {
  return [spinReel(0), spinReel(1), spinReel(2)];
}

function symbolMatches(symbolAtCell, referenceSymbol) {
  if (symbolAtCell === S.WILD) return true;
  return symbolAtCell === referenceSymbol;
}

function evaluatePaylines(finalGrid, betAmount) {
  const wins = [];
  for (const line of PAYLINES) {
    const symbolsInLine = line.rows.map((row, col) => finalGrid[col][row]);
    const reference = symbolsInLine.find((s) => s !== S.WILD) ?? S.WILD;
    const allMatch = symbolsInLine.every((s) => symbolMatches(s, reference));
    if (!allMatch) continue;
    const multiplier = PAYTABLE[reference];
    if (!multiplier) continue;
    const amount = multiplier * betAmount;
    const positions = line.rows.map((row, col) => [col, row]);
    wins.push({ lineIndex: line.index, positions, symbol: reference, amount });
  }
  return wins;
}

function evaluateScatter(rawGrid) {
  const positions = [];
  for (let col = 0; col < rawGrid.length; col++) {
    for (let row = 0; row < rawGrid[col].length; row++) {
      if (rawGrid[col][row] === S.SCATTER) positions.push([col, row]);
    }
  }
  return { count: positions.length, positions };
}

function generateFinalGrid(rawGrid) {
  return rawGrid.map((column, col) =>
    column.map((symbol) => (symbol === S.SCATTER ? randomVisibleSymbol(col) : symbol))
  );
}

function findSymbolPositions(grid, symbol) {
  const positions = [];
  for (let col = 0; col < grid.length; col++) {
    for (let row = 0; row < grid[col].length; row++) {
      if (grid[col][row] === symbol) {
        positions.push([col, row]);
      }
    }
  }
  return positions;
}

function removeSymbols(grid, positions) {
  for (const [col, row] of positions) {
    grid[col][row] = null;
  }
}

function dropSymbols(grid) {
  for (let col = 0; col < grid.length; col++) {
    const column = grid[col];
    const nonNull = column.filter(s => s !== null);
    const nullCount = column.length - nonNull.length;
    grid[col] = [...Array(nullCount).fill(null), ...nonNull];
  }
}

function fillNewSymbols(grid) {
  for (let col = 0; col < grid.length; col++) {
    for (let row = 0; row < grid[col].length; row++) {
      if (grid[col][row] === null) {
        grid[col][row] = randomVisibleSymbol(col);
      }
    }
  }
}

function evaluateCascadeBonus(displayGrid, betAmount) {
  let cascadeLevel = 0;
  let totalBonusWin = 0;
  let cascadeHistory = [];

  while (cascadeLevel < MAX_CASCADE_LEVELS) {
    const goldPositions = findSymbolPositions(displayGrid, S.GOLD);

    if (goldPositions.length === 0) break;

    const multiplier = Math.pow(CASCADE_MULTIPLIER, cascadeLevel);
    const cascadeWin = goldPositions.length * betAmount * multiplier;
    totalBonusWin += cascadeWin;

    cascadeHistory.push({
      level: cascadeLevel,
      goldCount: goldPositions.length,
      multiplier,
      win: cascadeWin,
      positions: goldPositions,
    });

    removeSymbols(displayGrid, goldPositions);
    dropSymbols(displayGrid);
    fillNewSymbols(displayGrid);

    cascadeLevel++;
  }

  return {
    triggered: totalBonusWin > 0,
    totalWin: totalBonusWin,
    cascades: cascadeHistory,
    cascadeCount: cascadeLevel,
  };
}

function evaluateSpin(betAmount) {
  const rawGrid = generateRawGrid();
  const { count: scatterCount, positions: scatterPositions } = evaluateScatter(rawGrid);
  const finalGrid = generateFinalGrid(rawGrid);

  let lineWins = evaluatePaylines(finalGrid, betAmount);
  let poolWin = lineWins.reduce((sum, w) => sum + w.amount, 0);
  let bonusTriggered = false;
  let bonusData = null;

  const scatterMultiplier = SCATTER_PAYOUT[scatterCount];
  if (scatterMultiplier) {
    const scatterAmount = scatterMultiplier * betAmount;
    poolWin += scatterAmount;
    lineWins.push({ lineIndex: -1, positions: scatterPositions, symbol: S.SCATTER, amount: scatterAmount });
  }

  if (scatterCount >= SCATTER_BONUS_THRESHOLD) {
    bonusData = evaluateCascadeBonus(finalGrid, betAmount);
    if (bonusData.triggered) {
      poolWin += bonusData.totalWin;
      bonusTriggered = true;
    }
  }

  const maxPayout = betAmount * MAX_PAYOUT_MULTIPLIER;
  if (poolWin > maxPayout) poolWin = maxPayout;

  return { displayGrid: finalGrid, wins: lineWins, poolWin, scatterCount, scatterPositions, bonusTriggered, bonusData };
}

function spinWithPoolConstraint(betAmount, ceiling) {
  let result;
  let attempts = 0;
  const maxAttempts = 200;

  do {
    result = evaluateSpin(betAmount);
    attempts++;
    if (result.poolWin <= ceiling) return result;
  } while (attempts < maxAttempts);

  const fallbackRaw = generateRawGrid();
  const fallbackFinal = generateFinalGrid(fallbackRaw);
  return {
    displayGrid: fallbackFinal,
    wins: [],
    poolWin: 0,
    scatterCount: 0,
    scatterPositions: [],
    bonusTriggered: false,
    bonusData: null,
  };
}

function maybeAwardJackpot(betAmount) {
  const tier = getTier(betAmount);
  const tierJackpots = jackpots[tier];

  const tiers = ["mini", "minor", "major", "grand"];
  for (const tierName of tiers) {
    if (Math.random() < JACKPOT_TIERS[tierName.toUpperCase()].chance) {
      const won = tierJackpots[tierName];
      tierJackpots[tierName] = JACKPOT_TIERS[tierName.toUpperCase()].seed;
      return { tier: tierName, amount: won };
    }
  }
  return null;
}

// ============= ROTAS =============
router.get("/", (req, res) => {
  res.json({
    status: "ok",
    pools: getPoolInfo(),
    jackpots,
    config: { houseEdge, jackpotContribution },
  });
});

router.get("/config", (req, res) => {
  res.json({ houseEdge, jackpotContribution, poolShare: 1 - houseEdge - jackpotContribution });
});

router.post("/config", (req, res) => {
  const newHouseEdge = req.body.houseEdge ?? houseEdge;
  const newJackpotContribution = req.body.jackpotContribution ?? jackpotContribution;

  const err = validateConfig(newHouseEdge, newJackpotContribution);
  if (err) return res.json({ success: false, message: err });

  houseEdge = newHouseEdge;
  jackpotContribution = newJackpotContribution;
  saveState();

  return res.json({
    success: true,
    config: { houseEdge, jackpotContribution, poolShare: 1 - houseEdge - jackpotContribution },
  });
});

router.get("/analytics", (req, res) => {
  res.json({
    machine: MACHINE_ID,
    config: { houseEdge, jackpotContribution },
    pools: getPoolInfo(),
    jackpots,
    perDenomination: getStatsSummary(),
    aggregated: getAggregatedStats(),
  });
});

router.get("/session/:sessionId/history", (req, res) => {
  const { sessionId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
  const spins = getSessionSpins(sessionId, limit);
  res.json({ sessionId, count: spins.length, spins });
});

router.post("/spin", async (req, res) => {
  const { sessionId, betAmount } = req.body;

  if (!sessionId || typeof sessionId !== "string") {
    return res.json({ success: false, message: "sessionId inválido", data: null });
  }
  if (!ALLOWED_BETS.includes(betAmount)) {
    return res.json({ success: false, message: "Valor de aposta não permitido", data: null });
  }

  const debited = sessionService.debit(sessionId, betAmount);
  if (!debited) {
    return res.json({ success: false, message: "Saldo insuficiente", data: null });
  }

  feedPool(betAmount);

  const ceiling = maxPoolWinCeiling(betAmount);
  const result = spinWithPoolConstraint(betAmount, ceiling);

  if (!withdrawPoolWin(betAmount, result.poolWin)) {
    sessionService.credit(sessionId, betAmount);
    saveState();
    return res.json({ success: false, message: "Erro ao processar spin", data: null });
  }

  const jackpotResult = maybeAwardJackpot(betAmount);
  const jackpotAmount = jackpotResult ? jackpotResult.amount : 0;
  const totalWin = result.poolWin + jackpotAmount;

  if (totalWin > 0) sessionService.credit(sessionId, totalWin);

  const balance = sessionService.getBalance(sessionId);

  recordSpinStats({
    betAmount,
    sessionId,
    totalWin,
    bonusTriggered: result.bonusTriggered,
    jackpotTier: jackpotResult ? jackpotResult.tier : null,
    scatterCount: result.scatterCount,
  });

  appendHistory({
    timestamp: new Date().toISOString(),
    machine: MACHINE_ID,
    sessionId,
    betAmount,
    grid: result.displayGrid,
    wins: result.wins,
    totalWin,
    bonusTriggered: result.bonusTriggered,
    jackpot: jackpotResult,
    scatterCount: result.scatterCount,
    balanceAfter: balance,
    poolAfter: getPool(betAmount),
    jackpotsAfter: jackpots,
  });

  appendSessionHistory(sessionId, {
    timestamp: new Date().toISOString(),
    betAmount,
    grid: result.displayGrid,
    wins: result.wins,
    totalWin,
    jackpot: jackpotResult,
    bonusTriggered: result.bonusTriggered,
    scatterCount: result.scatterCount,
    balanceAfter: balance,
  });

  saveState();

  return res.json({
    success: true,
    data: {
      grid: result.displayGrid,
      wins: result.wins,
      totalWin,
      balance,
      bonusTriggered: result.bonusTriggered,
      bonusData: result.bonusData,
      jackpot: jackpotResult,
      scatterCount: result.scatterCount,
    },
  });
});

module.exports = { router };
