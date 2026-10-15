const fs = require('fs');
const path = require('path');

const DOWNLOADS_BASE_PATH = path.join(__dirname, '../../public/downloads');

/**
 * Escaneia as pastas de downloads e retorna metadados das versões mais recentes.
 */
function getDownloadsInfo() {
  const platforms = ['windows', 'linux', 'android', 'ios'];
  const result = {};

  platforms.forEach((platform) => {
    const latestDir = path.join(DOWNLOADS_BASE_PATH, platform, 'latest');
    const versionFile = path.join(latestDir, 'version.json');

    if (fs.existsSync(versionFile)) {
      try {
        const raw = fs.readFileSync(versionFile, 'utf-8');
        const meta = JSON.parse(raw);
        const binaryPath = path.join(latestDir, meta.filename || '');
        const hasBinary = meta.filename && fs.existsSync(binaryPath);

        result[platform] = {
          active: true,
          version: meta.version || '1.0.0',
          filename: meta.filename || '',
          url: `/downloads/${platform}/latest/${meta.filename || ''}`,
          hasBinary: hasBinary,
          releaseNotes: meta.releaseNotes || 'Versão oficial do The Fantasy Life'
        };
      } catch (e) {
        result[platform] = { active: false, error: 'Meta inválido' };
      }
    } else {
      result[platform] = { active: false };
    }
  });

  return result;
}

function updatePlatformRelease(platform, { version, filename, releaseNotes }) {
  const latestDir = path.join(DOWNLOADS_BASE_PATH, platform, 'latest');
  if (!fs.existsSync(latestDir)) {
    fs.mkdirSync(latestDir, { recursive: true });
  }
  const versionFile = path.join(latestDir, 'version.json');
  const meta = {
    platform,
    version: version || '1.0.0',
    filename: filename || '',
    releaseNotes: releaseNotes || 'Versão oficial do The Fantasy Life',
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(versionFile, JSON.stringify(meta, null, 2), 'utf-8');
  return meta;
}

module.exports = {
  getDownloadsInfo,
  updatePlatformRelease,
  DOWNLOADS_BASE_PATH
};

