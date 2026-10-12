const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const express = require('express');
const multer = require('multer');
const pty = require('node-pty');
const { WebSocketServer } = require('socket.io');
require('dotenv').config();
const { auth } = require('../auth');
const repo = require('../../repositories/repository');

const router = express.Router();
router.use(express.json({ limit: '100kb' }));

router.use(auth);

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
      const out = (stdout && stdout.toString().trim()) || (stderr && stderr.toString().trim()) || '';
      if (err) {
        let msg = (stderr && stderr.toString().trim()) || (stdout && stdout.toString().trim()) || 'Falha ao executar comando.';
        for (const s of secrets) msg = msg.split(s).join('***');
        return reject(fail(500, msg.slice(0, 500)));
      }
      resolve(out);
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

/* ===================== Rotas de arquivos ===================== */

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

/* ===================== PM2 ===================== */

const PM2_ACTIONS = new Set(['start', 'stop', 'restart']);

async function pm2List() {
  const raw = await run('pm2', ['jlist']);
  let list;
  try {
    list = JSON.parse(raw || '[]');
  } catch {
    throw fail(500, 'Não foi possível ler o status do PM2.');
  }
  return list.map(p => ({
    name: p.name,
    id: p.pm_id,
    status: (p.pm2_env && p.pm2_env.status) || 'unknown',
    cpu: p.monit ? p.monit.cpu : 0,
    memory: p.monit ? Math.round(p.monit.memory / 1048576) : 0,
    restarts: (p.pm2_env && p.pm2_env.restart_time) || 0
  }));
}

// Valida o app contra a whitelist (PM2_APPS) e contra os processos existentes
async function assertPm2App(app) {
  if (app === 'all') {
    if (!ALLOWED_APPS.has('all')) throw fail(403, 'Ação em todos os apps não permitida.');
    return app;
  }
  if (typeof app !== 'string' || !REPO_SEGMENT.test(app)) throw fail(400, 'App inválido.');
  if (!ALLOWED_APPS.has('all') && !ALLOWED_APPS.has(app)) throw fail(403, 'App não permitido.');
  const apps = await pm2List();
  if (!apps.some(a => a.name === app)) throw fail(404, 'App não encontrado no PM2.');
  return app;
}

router.get('/pm2/list', wrap(async (req, res) => {
  res.json(await pm2List());
}));

router.post('/pm2/action', wrap(async (req, res) => {
  const action = bodyStr(req.body, 'action');
  if (!PM2_ACTIONS.has(action)) throw fail(400, 'Ação inválida.');
  const app = await assertPm2App(bodyStr(req.body, 'app'));
  const out = await run('pm2', [action, app]);
  sendOk(res, out || `${app}: ${action} executado.`);
}));

router.post('/reflash', wrap(async (req, res) => {
  const app = await assertPm2App((req.body && req.body.app) || 'all');
  const out = await run('pm2', ['restart', app]);
  sendOk(res, out || 'Atualizado com sucesso!');
}));

/* ===================== Git ===================== */

const GIT_ENV = { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_EDITOR: 'true', GIT_MERGE_AUTOEDIT: 'no' };
const git = (args) => run('git', args, { cwd: REPO_DIR, env: GIT_ENV });

router.get('/git/status', wrap(async (req, res) => {
  await git(['fetch', '--quiet']).catch(() => { }); // atualiza ahead/behind
  const [branch, status, log] = await Promise.all([
    git(['rev-parse', '--abbrev-ref', 'HEAD']),
    git(['status', '-sb']),
    git(['log', '-5', '--oneline'])
  ]);
  res.json({ ok: true, branch, status, log });
}));

router.post('/git/pull', wrap(async (req, res) => {
  const mode = (req.body && req.body.mode) || 'autostash';

  if (mode === 'autostash') {
    const out = await git(['pull', '--autostash', '--no-rebase']);
    return sendOk(res, out || 'Atualizado com sucesso!');
  }
  if (mode === 'reset') {
    // Descarta alterações locais em arquivos rastreados e alinha com o remoto
    await git(['fetch']);
    const out = await git(['reset', '--hard', '@{u}']);
    return sendOk(res, out || 'Sincronizado com o remoto (alterações locais descartadas).');
  }
  throw fail(400, 'Modo inválido.');
}));

router.post('/git/commit', wrap(async (req, res) => {
  const message = bodyStr(req.body, 'message').trim();
  if (message.length > 200) throw fail(400, 'Mensagem muito longa (máx. 200 caracteres).');

  const changes = await git(['status', '--porcelain']);
  if (!changes) throw fail(400, 'Nada para commitar.');

  await git(['add', '-A']);
  const out = await git(['commit', '-m', message]);
  sendOk(res, out || 'Commit criado.');
}));

router.post('/git/push', wrap(async (req, res) => {
  const out = await git(['push']);
  sendOk(res, out || 'Push concluído.');
}));

// Mantido por compatibilidade com a rota antiga
router.post('/updateGit', wrap(async (req, res) => {
  const out = await git(['pull', '--autostash', '--no-rebase']);
  sendOk(res, out || 'Atualizado com sucesso!');
}));

router.post('/createRepository', wrap(async (req, res) => {
  const parts = bodyStr(req.body, 'name').trim().split('/');
  if (parts.length > 2) throw fail(400, 'Nome de repositório inválido.');

  const repoName = parts.pop();
  const owner = parts.pop() || REPO_OWNER;
  if (!REPO_SEGMENT.test(owner) || !REPO_SEGMENT.test(repoName) || repoName.startsWith('.')) {
    throw fail(400, 'Nome de repositório inválido.');
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) throw fail(500, 'GITHUB_TOKEN não configurado.');

  const target = safePath(repoName);
  if (await exists(target)) throw fail(409, 'Já existe uma pasta com esse nome.');

  // Token enviado por header, sem entrar na URL nem no .git/config
  const basic = Buffer.from(`x-access-token:${token}`).toString('base64');
  const url = `https://github.com/${owner}/${repoName}.git`;

  await run(
    'git',
    ['-c', `http.extraheader=Authorization: Basic ${basic}`, 'clone', url, repoName],
    { cwd: ROOT, secrets: [token, basic], env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }
  );
  sendOk(res, `Repositório "${owner}/${repoName}" clonado com sucesso.`);
}));

/* ===================== Terminal (Socket.IO + PTY) ===================== */

const MAX_TERMINALS = 3;
const MAX_INPUT = 64 * 1024;
const TERMINAL_CWD = process.env.TERMINAL_CWD || path.resolve(__dirname, '..', '..');
// Opcional: restringe a IDs específicos (ex.: TERMINAL_USER_IDS=1,2). Vazio = qualquer usuário autenticado do /admin.
const TERMINAL_USER_IDS = new Set((process.env.TERMINAL_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean));
const terminals = new Set();

function clampInt(v, min, max, fallback) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function canUseTerminal(user) {
  if (!user) return false;
  return TERMINAL_USER_IDS.size === 0 || TERMINAL_USER_IDS.has(String(user.id));
}

function spawnShell(cols, rows) {
  const shell = process.env.TERMINAL_SHELL || process.env.SHELL || '/bin/bash';
  const terminal= pty.spawn(shell, ['-l'], {
    name: 'xterm-256color',
    cols,
    rows,
    cwd: TERMINAL_CWD,
    env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' }
  });
  //pasta principal
 // const folder = `'${__dirname}'`;
 // terminal.write(`cd ${folder}\n`);
  return  terminal;
}

// Chamado pelo hub para cada conexão em /admin
function onConnection(socket, nsp) {
  let term = null;

  const closeTerm = () => {
    if (!term) return;
    const t = term;
    term = null;
    terminals.delete(t);
    try { t.kill(); } catch { }
  };

  socket.emit('admin:ready', { user: socket.data.user?.id ?? null });

  socket.on('term:open', (payload, ack) => {
    const reply = typeof ack === 'function' ? ack : () => { };
    if (!canUseTerminal(socket.data.user)) return reply({ ok: false, message: 'Sem permissão' });
    if (term) return reply({ ok: true, message: 'Já aberto' });
    if (terminals.size >= MAX_TERMINALS) return reply({ ok: false, message: 'Limite de terminais atingido' });

    const cols = clampInt(payload?.cols, 10, 400, 80);
    const rows = clampInt(payload?.rows, 5, 150, 24);

    let t;
    try {
      t = spawnShell(cols, rows);
    } catch (err) {
      console.error('[terminal] spawn:', err);
      return reply({ ok: false, message: 'Falha ao iniciar o shell' });
    }
    term = t;
    terminals.add(t);

    t.onData((data) => socket.emit('term:data', data));
    t.onExit(({ exitCode }) => {
      if (term === t) { term = null; }
      terminals.delete(t);
      socket.emit('term:exit', { code: exitCode });
    });

    reply({ ok: true });
  });

  socket.on('term:input', (data) => {
    if (!term || typeof data !== 'string' || data.length > MAX_INPUT) return;
    term.write(data);
  });

  socket.on('term:resize', (p) => {
    if (!term) return;
    try { term.resize(clampInt(p?.cols, 10, 400, 80), clampInt(p?.rows, 5, 150, 24)); } catch { }
  });

  socket.on('term:close', (_p, ack) => {
    closeTerm();
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('disconnect', closeTerm);
}

module.exports ={
  router,
  onConnection
};