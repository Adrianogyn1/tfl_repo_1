const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const express = require('express');
require('dotenv').config();
const router = express.Router();

router.get("/", (req, res) =>
{
  res.sendFile(path.join(__dirname, "./upload.html"));
});

router.get("/getfolders", (req, res) =>
{
  exec('find . -type d -maxdepth 3', (err, stdout) =>
  {
    if (err) return res.status(500).json({ error: err.message });
    const dirs = stdout.split('\n').filter(Boolean);
    res.json(dirs);
  });
});



router.get("/getfiles", (req, res) =>
{
  const targetDir = req.query.path;
  if (!targetDir) return res.status(400).json({ error: 'Caminho não informado' });

  fs.readdir(path.resolve(targetDir), { withFileTypes: true }, (err, items) =>
  {
    if (err) return res.status(500).json({ error: err.message });
    // Retorna o nome de todos os itens (pastas e arquivos)
    const fileNames = items.map(item => item.name);
    res.json(fileNames);
  });
});

router.get("/downloadFile", (req, res) =>
{
  const filePath = req.query.path;
  if (!filePath) return res.status(400).send('Caminho não informado');
  res.download(path.resolve(filePath));
});

router.post("/createFolder", express.json(), (req, res) =>
{
  const { parent, name } = req.body;
  if (!parent || !name) return res.status(400).send('Dados inválidos');

  const newDir = path.join(parent, name);
  fs.mkdir(path.resolve(newDir), { recursive: true }, (err) =>
  {
    res.status(err ? 500 : 200).send(err ? 'Erro: ' + err.message : 'Pasta criada com sucesso');
  });
});

router.post("/renameFile", express.json(), (req, res) =>
{
  const { dir, oldName, newName } = req.body;
  if (!dir || !oldName || !newName) return res.status(400).send('Dados inválidos');

  const oldPath = path.resolve(dir, oldName);
  const newPath = path.resolve(dir, newName);

  fs.rename(oldPath, newPath, (err) =>
  {
    res.status(err ? 500 : 200).send(err ? 'Erro: ' + err.message : 'Renomeado com sucesso');
  });
});

router.post("/extractFile", express.json(), (req, res) =>
{
  const { dir, fileName } = req.body;
  if (!dir || !fileName) return res.status(400).send('Dados inválidos');

  const filePath = path.resolve(dir, fileName);
  let cmd = `tar -zxvf "${filePath}" -C "${path.resolve(dir)}"`;
  if (fileName.endsWith('.zip'))
  {
    cmd = `unzip -o "${filePath}" -d "${path.resolve(dir)}"`;
  }

  exec(cmd, (err, stdout, stderr) =>
  {
    res.status(err ? 500 : 200).send(err ? 'Erro: ' + err.message : 'Descompactado com sucesso');
  });
});

router.post("/uploadFile", (req, res) =>
{
  let body = [];
  let destDir = '';
  let filesToSave = [];
  let currentFile = null;

  const boundaryMatch = req.headers['content-type']?.match(/boundary=(?:"([^"]+)"|([^\s]+))/i);
  if (!boundaryMatch) return res.status(400).send('Boundary não encontrado');
  const boundary = boundaryMatch[1] || boundaryMatch[2];
  const boundaryBuf = Buffer.from('--' + boundary);
  const endBoundaryBuf = Buffer.from('--' + boundary + '--');

  let bufferQueue = Buffer.alloc(0);

  req.on('data', chunk =>
  {
    bufferQueue = Buffer.concat([bufferQueue, chunk]);

    let boundaryIdx;
    while ((boundaryIdx = bufferQueue.indexOf(boundaryBuf)) !== -1)
    {
      let partBuf = bufferQueue.slice(0, boundaryIdx);
      bufferQueue = bufferQueue.slice(boundaryIdx + boundaryBuf.length);

      if (partBuf.length > 2)
      {
        processPart(partBuf);
      }

      if (bufferQueue.indexOf(Buffer.from('--\r\n')) === 0 || bufferQueue.indexOf(Buffer.from('--\n')) === 0 || bufferQueue.length < 2)
      {
        break;
      }
    }
  });

  req.on('end', () =>
  {
    if (bufferQueue.length > 2)
    {
      processPart(bufferQueue);
    }

    if (!destDir || filesToSave.length === 0)
    {
      return res.status(400).send('Dados inválidos');
    }

    let savedCount = 0;
    let hasError = false;

    filesToSave.forEach(fileObj =>
    {
      let target = path.join(destDir, fileObj.fileName);
      fs.writeFile(target, fileObj.data, (err) =>
      {
        if (hasError) return;
        if (err)
        {
          hasError = true;
          return res.status(500).send('Erro: ' + err.message);
        }
        savedCount++;
        if (savedCount === filesToSave.length)
        {
          res.status(200).send(`Sucesso! ${savedCount} arquivo(s) salvo(s) em ${destDir}`);
        }
      });
    });
  });

  function processPart(part)
  {
    let headerEndIdx = part.indexOf(Buffer.from('\r\n\r\n'));
    let headerEndLen = 4;
    if (headerEndIdx === -1)
    {
      headerEndIdx = part.indexOf(Buffer.from('\n\n'));
      headerEndLen = 2;
    }
    if (headerEndIdx === -1) return;

    let headers = part.slice(0, headerEndIdx).toString('utf8');
    let content = part.slice(headerEndIdx + headerEndLen);

    if (content.length >= 2 && content[content.length - 2] === 13 && content[content.length - 1] === 10)
    {
      content = content.slice(0, content.length - 2);
    } else if (content.length >= 1 && content[content.length - 1] === 10)
    {
      content = content.slice(0, content.length - 1);
    }

    if (headers.includes('name="dest"'))
    {
      destDir = content.toString('utf8').trim();
    } else if (headers.includes('filename="'))
    {
      let match = headers.match(/filename="(.+?)"/);
      if (match)
      {
        filesToSave.push({
          fileName: path.basename(match[1]),
          data: content
        });
      }
    }
  }
});

router.get("/downloadFolder", (req, res) =>
{
  const targetDir = req.query.path;
  if (!targetDir) return res.status(400).send('Caminho não informado');

  const resolvedPath = path.resolve(targetDir);
  const folderName = path.basename(resolvedPath);
  const zipPath = path.join('/tmp', `${folderName}-${Date.now()}.zip`);

  exec(`zip -r "${zipPath}" "${resolvedPath}"`, (err) =>
  {
    if (err) return res.status(500).send('Erro ao compactar pasta: ' + err.message);

    res.download(zipPath, `${folderName}.zip`, (err) =>
    {
      fs.unlink(zipPath, () => { });
    });
  });
});

router.get("/editFile", (req, res) =>
{
  const filePath = req.query.path;
  if (!filePath) return res.status(400).send('Caminho não informado');

  fs.readFile(path.resolve(filePath), 'utf8', (err, data) =>
  {
    if (err) return res.status(500).send('Erro ao ler arquivo: ' + err.message);
    res.send(data);
  });
});

router.post("/saveFile", express.json(), (req, res) =>
{
  const { path: filePath, content } = req.body;
  if (!filePath || content === undefined) return res.status(400).send('Dados inválidos');

  fs.writeFile(path.resolve(filePath), content, 'utf8', (err) =>
  {
    res.status(err ? 500 : 200).send(err ? 'Erro ao salvar: ' + err.message : 'Arquivo salvo com sucesso');
  });
});

router.post("/deleteFile", express.json(), (req, res) =>
{
  const { dir, fileName } = req.body;
  if (!dir || !fileName) return res.status(400).send('Dados inválidos');

  const filePath = path.resolve(dir, fileName);
  fs.unlink(filePath, (err) =>
  {
    res.status(err ? 500 : 200).send(err ? 'Erro ao excluir: ' + err.message : 'Excluído com sucesso');
  });
});


router.post("/deleteFolder", express.json(), (req, res) =>
{
  const { dir } = req.body;
  if (!dir) return res.status(400).send('Caminho não informado');

  const folderPath = path.resolve(dir);

  if (folderPath === path.resolve(__dirname))
  {
    return res.status(403).send('Não é permitido excluir o diretório raiz.');
  }

  fs.rm(folderPath, { recursive: true, force: true }, (err) =>
  {
    res.status(err ? 500 : 200).send(err ? 'Erro ao excluir pasta: ' + err.message : 'Pasta excluída com sucesso');
  });
});

router.post("/reflash", (req, res) =>
{
  const app = req.body.app || 'all';

  const cmd = `pm2 restart ${app}`;

  exec(cmd, (error, stdout, stderr) =>
  {
    if (error) return res.status(500).send(stderr);
    res.send(stdout || 'Atualizado com sucesso!');
  });
});


router.post("/updateGit", (req, res) =>
{
  const rootDir = path.resolve(__dirname, './');
  exec('git pull', { cwd: rootDir }, (error, stdout, stderr) =>
  {
    if (error) return res.status(500).send(stderr);
    res.send(stdout || 'Atualizado com sucesso!');
  });
});

router.post("/createRepository", express.json(), (req, res) =>
{
  return res.status(200).send('Repositório criado com sucesso!');
  
  const { name } = req.body;
  const token = process.env.GITHUB_TOKEN;

  if (!name) return res.status(400).send('Informe o repositório.');

  const repoUrl = `https://${token}@github.com/Adrianogyn1/${name}.git`;
  const rootDir = path.resolve(__dirname, './');

  exec(`git clone ${repoUrl}`, { cwd: rootDir }, (error, stdout, stderr) =>
  {
    if (error) return res.status(500).send(stderr + '\n' + repoUrl);
    res.send('Repositório clonado com sucesso na pasta raiz!  ' + repoUrl);
  });
});




module.exports = router;