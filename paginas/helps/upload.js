const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const express = require('express');
const multer = require('multer');
require('dotenv').config();


const router = express.Router();
router.use(express.json({ limit: '100kb' }));

function requireAuth(req, res, next) 
{
  if (req.session?.user || req.cookies?.user) return next();
  if (req.path === '/') return res.redirect('/admin/login');
  res.status(401).json({ ok: false, message: 'Sessão expirada. Faça login novamente.' });
}

router.use(requireAuth);

const ROOT = path.resolve(process.env.FILES_ROOT || process.cwd());
const REPO_DIR = path.resolve(__dirname);
const REPO_OWNER = process.env.GITHUB_OWNER || 'Adrianogyn1';
const ALLOWED_APPS = new Set((process.env.PM2_APPS || 'all').split(',').map(s => s.trim()).filter(Boolean));
const SKIP_DIRS = new Set(['node_modules', '.git']);
const MAX_EDIT_BYTES = 2 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;
const REPO_SEGMENT = /^[A-Za-z0-9._-]{1,100}$/;

/* ===================== Utilitários ===================== */

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const fail = (status, message) => new HttpError(status, message);

function sendOk(res, message) {
  res.json({ ok: true, message });
}

function sendError(res, err) {
  let status = 500;
  let message = 'Erro interno no servidor.';

  if (err instanceof HttpError) {
    status = err.status;
    message = err.message;
  } else if (err.code === 'ENOENT') {
    status = 404;
    message = 'Item não encontrado.';
  } else if (err.code === 'EEXIST') {
    status = 409;
    message = 'Já existe um item com esse nome.';
  } else {
    console.error(err);
  }

  if (!res.headersSent) res.status(status).json({ ok: false, message });
}

const wrap = (fn) => async (req, res) => {
  try {

    await fn(req, res);
  } catch (err) {
    sendError(res, err);
  }
};

// Garante que o caminho resolvido fique dentro de ROOT
function safePath(...segments) {
  const target = path.resolve(ROOT, ...segments);
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    throw fail(400, 'Caminho fora da área permitida.');
  }
  return target;
}

// Nome de um único segmento: sem barras, sem '.' ou '..'
function requireName(name) {
  if (typeof name !== 'string') throw fail(400, 'Nome inválido.');
  const n = name.trim();
  if (!n || n.length > 255 || n === '.' || n === '..' || /[\/\\\0]/.test(n)) {
    throw fail(400, 'Nome inválido.');
  }
  return n;
}

function bodyStr(body, key) {
  const v = body && body[key];
  if (typeof v !== 'string' || !v.trim()) throw fail(400, 'Dados inválidos.');
  return v;
}

function queryPath(req, fallback) {
  const v = req.query.path;
  if (typeof v === 'string' && v.length) return v;
  if (fallback !== undefined) return fallback;
  throw fail(400, 'Caminho não informado.');
}

async function statOrFail(p, kind) {
  let st;
  try {
    st = await fsp.stat(p);
  } catch (e) {
    if (e.code === 'ENOENT') throw fail(404, 'Item não encontrado.');
    throw e;
  }
  if (kind === 'file' && !st.isFile()) throw fail(400, 'Não é um arquivo.');
  if (kind === 'dir' && !st.isDirectory()) throw fail(400, 'Não é uma pasta.');
  return st;
}

const exists = (p) => fsp.access(p).then(() => true, () => false);

// Executa comando sem shell; remove segredos da mensagem de erro
function run(file, args, opts = {}) {
  const { secrets = [], ...execOpts } = opts;
  return new Promise((resolve, reject) => {
    execFile(file, args, { timeout: 120000, maxBuffer: 10 * 1024 * 1024, ...execOpts }, (err, stdout, stderr) => {
      if (err) {
        let msg = (stderr && stderr.toString().trim()) || 'Falha ao executar comando.';
        for (const s of secrets) msg = msg.split(s).join('***');
        return reject(fail(500, msg.slice(0, 500)));
      }
      resolve(stdout.toString().trim());
    });
  });
}

async function walkDirs(dir, rel, depth, out) {
  if (depth === 0) return;
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return; // pasta sem permissão: ignora
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const e of entries) {
    if (!e.isDirectory() || SKIP_DIRS.has(e.name)) continue;
    const childRel = rel === '.' ? `./${e.name}` : `${rel}/${e.name}`;
    out.push(childRel);
    await walkDirs(path.join(dir, e.name), childRel, depth - 1, out);
  }
}

/* ===================== Upload ===================== */

const upload = multer({
  storage: multer.diskStorage({ destination: os.tmpdir() }),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 50 }
}).array('file');

async function saveUploads(req, res) {
  const files = req.files || [];
  try {
    if (files.length === 0) throw fail(400, 'Nenhum arquivo enviado.');
    const dest = typeof req.body.dest === 'string' && req.body.dest.trim() ? req.body.dest : '.';
    await statOrFail(safePath(dest), 'dir');

    for (const f of files) {
      const name = requireName(path.basename(f.originalname));
      await fsp.copyFile(f.path, safePath(dest, name));
    }
    res.json({ ok: true, message: `${files.length} arquivo(s) salvo(s) em ${dest}.` });
  } finally {
    await Promise.all(files.map(f => fsp.unlink(f.path).catch(() => { })));
  }
}

/* ===================== Rotas ===================== */

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'upload.html'));
});

router.get('/getfolders', wrap(async (req, res) => {
  const out = [];
  await walkDirs(ROOT, '.', 3, out);
  res.json(out);
}));

router.get('/getfiles', wrap(async (req, res) => {
  const dir = safePath(queryPath(req, '.'));
  await statOrFail(dir, 'dir');
  const items = await fsp.readdir(dir, { withFileTypes: true });
  const list = items
    .map(i => ({ name: i.name, isDir: i.isDirectory() }))
    .sort((a, b) => (b.isDir - a.isDir) || a.name.localeCompare(b.name, 'pt-BR'));
  res.json(list);
}));

router.get('/downloadFile', wrap(async (req, res) => {
  const file = safePath(queryPath(req));
  await statOrFail(file, 'file');
  res.download(file, (err) => {
    if (err && !res.headersSent) res.status(500).json({ ok: false, message: 'Erro no download.' });
  });
}));

router.get('/downloadFolder', wrap(async (req, res) => {
  const dir = safePath(queryPath(req, '.'));
  await statOrFail(dir, 'dir');
  const folderName = path.basename(dir) || 'raiz';

  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'zip-'));
  const zipPath = path.join(tmpDir, `${folderName}.zip`);
  const cleanup = () => fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => { });

  try {
    await run('zip', ['-r', '-q', zipPath, '.'], { cwd: dir });
  } catch (err) {
    await cleanup();
    throw err;
  }
  res.download(zipPath, `${folderName}.zip`, () => cleanup());
}));

router.get('/editFile', wrap(async (req, res) => {
  const file = safePath(queryPath(req));
  const st = await statOrFail(file, 'file');
  if (st.size > MAX_EDIT_BYTES) throw fail(413, 'Arquivo grande demais para edição.');
  const data = await fsp.readFile(file, 'utf8');
  res.type('text/plain; charset=utf-8').send(data);
}));

router.post('/createFolder', wrap(async (req, res) => {
  const parent = bodyStr(req.body, 'parent');
  const name = requireName(bodyStr(req.body, 'name'));
  await fsp.mkdir(safePath(parent, name));
  sendOk(res, 'Pasta criada com sucesso.');
}));

router.post('/renameFile', wrap(async (req, res) => {
  const dir = bodyStr(req.body, 'dir');
  const oldName = requireName(bodyStr(req.body, 'oldName'));
  const newName = requireName(bodyStr(req.body, 'newName'));
  const src = safePath(dir, oldName);
  const dst = safePath(dir, newName);

  await statOrFail(src);
  if (src !== dst && await exists(dst)) throw fail(409, 'Já existe um item com esse nome.');
  await fsp.rename(src, dst);
  sendOk(res, 'Renomeado com sucesso.');
}));

router.post('/extractFile', wrap(async (req, res) => {
  const dir = bodyStr(req.body, 'dir');
  const fileName = requireName(bodyStr(req.body, 'fileName'));
  const file = safePath(dir, fileName);
  const outDir = safePath(dir);
  await statOrFail(file, 'file');

  const lower = fileName.toLowerCase();
  if (lower.endsWith('.zip')) {
    await run('unzip', ['-o', '-q', file, '-d', outDir]);
  } else if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz')) {
    await run('tar', ['-xzf', file, '-C', outDir]);
  } else if (lower.endsWith('.tar')) {
    await run('tar', ['-xf', file, '-C', outDir]);
  } else {
    throw fail(400, 'Formato não suportado.');
  }
  sendOk(res, 'Descompactado com sucesso.');
}));

router.post('/uploadFile', (req, res) => {
  upload(req, res, (uploadErr) => {
    if (uploadErr) {
      const status = uploadErr.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ ok: false, message: uploadErr.message });
    }
    wrap(saveUploads)(req, res);
  });
});

router.post('/saveFile', wrap(async (req, res) => {
  const target = safePath(bodyStr(req.body, 'path'));
  const content = req.body.content;
  if (typeof content !== 'string') throw fail(400, 'Dados inválidos.');
  await statOrFail(target, 'file');
  await fsp.writeFile(target, content, 'utf8');
  sendOk(res, 'Arquivo salvo com sucesso.');
}));

router.post('/deleteFile', wrap(async (req, res) => {
  const dir = bodyStr(req.body, 'dir');
  const fileName = requireName(bodyStr(req.body, 'fileName'));
  const target = safePath(dir, fileName);
  await statOrFail(target, 'file');
  await fsp.unlink(target);
  sendOk(res, 'Excluído com sucesso.');
}));

router.post('/deleteFolder', wrap(async (req, res) => {
  const target = safePath(bodyStr(req.body, 'dir'));
  if (target === ROOT) throw fail(403, 'Não é permitido excluir o diretório raiz.');
  await statOrFail(target, 'dir');
  await fsp.rm(target, { recursive: true, force: true });
  sendOk(res, 'Pasta excluída com sucesso.');
}));

router.post('/reflash', wrap(async (req, res) => {
  const app = (req.body && req.body.app) || 'all';
  if (!ALLOWED_APPS.has(app)) throw fail(400, 'App inválido.');
  const out = await run('pm2', ['restart', app]);
  sendOk(res, out || 'Atualizado com sucesso!');
}));

router.post('/updateGit', wrap(async (req, res) => {
  const out = await run('git', ['pull'], { cwd: REPO_DIR });
  sendOk(res, out || 'Atualizado com sucesso!');
}));

router.post('/createRepository', wrap(async (req, res) => {
  const parts = bodyStr(req.body, 'name').trim().split('/');
  if (parts.length > 2) throw fail(400, 'Nome de repositório inválido.');

  const repo = parts.pop();
  const owner = parts.pop() || REPO_OWNER;
  if (!REPO_SEGMENT.test(owner) || !REPO_SEGMENT.test(repo) || repo.startsWith('.')) {
    throw fail(400, 'Nome de repositório inválido.');
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) throw fail(500, 'GITHUB_TOKEN não configurado.');

  const target = safePath(repo);
  if (await exists(target)) throw fail(409, 'Já existe uma pasta com esse nome.');

  // Token enviado por header, sem entrar na URL nem no .git/config
  const basic = Buffer.from(`x-access-token:${token}`).toString('base64');
  const url = `https://github.com/${owner}/${repo}.git`;

  await run(
    'git',
    ['-c', `http.extraheader=Authorization: Basic ${basic}`, 'clone', url, repo],
    { cwd: ROOT, secrets: [token, basic], env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }
  );
  sendOk(res, `Repositório "${owner}/${repo}" clonado com sucesso.`);
}));

module.exports = router;