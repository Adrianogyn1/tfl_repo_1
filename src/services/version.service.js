/**
 * ============================================================================
 * TFL VERSION & CHANGELOG SERVICE (DUAL-VIEW: USER & ADMIN)
 * ============================================================================
 * Gerencia:
 * - Versionamento fracionado de 5 casas decimais (ex: 0.00042) ancorado no Git
 * - Arquivo 1: changelog.user.json — 100% voltado para jogadores (zero jargão técnico, sem commits ou termos de dev)
 * - Arquivo 2: changelog.admin.json — Exclusivo para equipe e /admin (commits, rollbackTarget, migrations, rotas e dados de engenharia)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHANGELOG_USER_PATH = path.join(__dirname, '../config/changelog.user.json');
const CHANGELOG_ADMIN_PATH = path.join(__dirname, '../config/changelog.admin.json');

let cachedGitInfo = null;
let lastGitCheck = 0;

function getGitMetadata() {
  const now = Date.now();
  if (cachedGitInfo && now - lastGitCheck < 30000) {
    return cachedGitInfo;
  }

  let commitHash = '5e9e4b8';
  let commitCount = 42;
  let commitDate = new Date().toISOString().split('T')[0];

  try {
    commitHash = execSync('git rev-parse --short HEAD', { timeout: 1500, stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim();
    const countStr = execSync('git rev-list --count HEAD', { timeout: 1500, stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim();
    commitCount = parseInt(countStr, 10) || 42;
    const dateStr = execSync('git log -1 --format=%cs', { timeout: 1500, stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (dateStr) commitDate = dateStr;
  } catch (_) {
    // Modo fallback seguro caso git não esteja no path ou em container restrito
  }

  cachedGitInfo = {
    commitHash,
    commitCount,
    commitDate,
  };
  lastGitCheck = now;
  return cachedGitInfo;
}

function loadJsonFile(filePath, fallback = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Erro ao ler ${path.basename(filePath)}:`, err.message);
  }
  return fallback;
}

function saveJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Erro ao salvar ${path.basename(filePath)}:`, err.message);
    return false;
  }
}

/**
 * Formata um número de commit em versão decimal fracionária de 5 casas (ex: 42 -> "0.00042")
 */
function formatDecimalVersion(commitCount, decimals = 5) {
  const count = Math.max(1, parseInt(commitCount, 10) || 0);
  const padded = String(count).padStart(decimals, '0');
  return `0.${padded}`;
}

/**
 * Retorna a versão ativa da plataforma (ex: "0.00042")
 */
function getCurrentVersion() {
  const git = getGitMetadata();
  if (git.commitCount) {
    return formatDecimalVersion(git.commitCount, 5);
  }
  const userChangelog = loadJsonFile(CHANGELOG_USER_PATH, { currentVersion: '0.00042' });
  return userChangelog.currentVersion || '0.00042';
}

/**
 * Retorna as notas da versão atual:
 * - forAdmin = false: dados 100% amigáveis para jogadores (changelog.user.json)
 * - forAdmin = true: dados com detalhes técnicos de engenharia (changelog.admin.json)
 */
function getCurrentVersionInfo(forAdmin = false) {
  const version = getCurrentVersion();
  const filePath = forAdmin ? CHANGELOG_ADMIN_PATH : CHANGELOG_USER_PATH;
  const data = loadJsonFile(filePath, { releases: [] });
  const latest = Array.isArray(data.releases) && data.releases.length > 0 ? data.releases[0] : null;

  if (forAdmin) {
    const git = getGitMetadata();
    return {
      version,
      releaseDate: latest?.releaseDate || git.commitDate,
      gitCommit: git.commitHash,
      gitCommitCount: git.commitCount,
      rollbackTarget: latest?.rollbackTarget || null,
      title: latest?.title || `Release ${version}`,
      summary: latest?.summary || '',
      whatsNew: latest?.whatsNew || [],
      fixes: latest?.fixes || [],
      knownIssues: latest?.knownIssues || [],
      technicalDetails: latest?.technicalDetails || null,
    };
  }

  // Visualização limpa para Usuário Final
  return {
    version,
    releaseDate: latest?.releaseDate || new Date().toISOString().split('T')[0],
    title: latest?.title || 'Atualização da Plataforma',
    summary: latest?.summary || 'Novidades e melhorias contínuas no seu mundo virtual.',
    whatsNew: latest?.whatsNew || [],
    fixes: latest?.fixes || [],
    knownIssues: latest?.knownIssues || [],
  };
}

/**
 * Retorna todo o histórico de versões:
 * - forAdmin = false: lista amigável de releases dos jogadores
 * - forAdmin = true: lista técnica com commits, rotas e rollback targets
 */
function getAllReleases(forAdmin = false) {
  const filePath = forAdmin ? CHANGELOG_ADMIN_PATH : CHANGELOG_USER_PATH;
  const data = loadJsonFile(filePath, { releases: [] });
  return Array.isArray(data.releases) ? data.releases : [];
}

/**
 * Retorna o documento completo do changelog do usuário
 */
function getUserChangelog() {
  return loadJsonFile(CHANGELOG_USER_PATH, { currentVersion: getCurrentVersion(), releases: [] });
}

/**
 * Retorna o documento completo do changelog administrativo
 */
function getAdminChangelog() {
  return loadJsonFile(CHANGELOG_ADMIN_PATH, { currentVersion: getCurrentVersion(), releases: [] });
}

module.exports = {
  getCurrentVersion,
  getCurrentVersionInfo,
  getAllReleases,
  getUserChangelog,
  getAdminChangelog,
  formatDecimalVersion,
  CHANGELOG_USER_PATH,
  CHANGELOG_ADMIN_PATH,
};
