const { Op, where } = require('sequelize');
const repo = require('../repository');
const router = require("express").Router();
const auth = require('../controllers/auth');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const multerMiddleware = multer({ storage: multer.memoryStorage() }); // Usa buffer em memória, cuidado com arquivos grandes!
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'uploads');
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

// Rota de teste: GET /test-terrain
router.get('/game/terrain', async (req, res) => {
    //
    
    // Pega o primeiro usuário do banco para simular o login
    const user = await repo.User.findOne({ limit: 1 });
   
    const room = await repo.RoomModel.findOne({limit:1});
    room.userId = user.id;
    room.save();
    if (!user) return res.send("Nenhum usuário encontrado no banco.");


    // Ajuste o nome da propriedade conforme seu controller de auth espera (ex: jwt.sign)
    const token =user.token; // Se precisar de um real, use: auth.generateToken(user);

    res.send(`
        <div>${user.username}-${user.token}  ${room.name}-${room.uid}</div>
        <form action="/game/terrain" method="POST" enctype="multipart/form-data">
    <!-- Importante: token deve estar antes do file -->
    <input type="text" name="token" value="${user.token}"> 
    <input type="text" name="uid" value="${user.uid}">
    <input type="text" name="target_uid" value="${room.uid}">
    <input type="text" name="roomId" value="${room.uid}">
    <input type="file" name="file">
    <button type="submit">Enviar Terrain</button>
</form>
        <script>
            // Injeta o token no cabeçalho se o seu auth middleware lê via header
            fetch('/game/terrain', {
                method: 'POST',
                headers: { 'token': '${token}' }
            });
        </script>
    `);
});


// Rotas: multerMiddleware.single('file') injeta o arquivo em req.file
// CORRETO: Multer primeiro para preencher o body, auth depois para validar o token
router.post('/game/terrain', multerMiddleware.single('file'), auth.CheckLogin, create);
router.put('/game/terrain/:id', multerMiddleware.single('file'), auth.CheckLogin, update);
async function create(req, res) { return update(req, res); }

async function update(req, res) {
    try {
        const result = await HandleTerrainUpdate(req);
        if (!result.success) throw new Error(result.error);
        return res.json({ success: true, data: result.data });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
}

/**
 * Manipula a atualização ou criação de terrenos.
 * Gerencia tanto os dados relacionais no banco quanto o armazenamento físico de arquivos.
 */

async function HandleTerrainUpdate(req) {
    const terrain = req.terrain || req.body;
    const fileInput = req.file;
    
    
    let arquivoFoiModificado = false;
    let backupRealizado = false;
    let caminhoFinal = null;
    let caminhoBackup = null;

    try {
        const user = req.userData;
        if (!user) throw new Error("User not found");
        
        // Buscando room pelo target_uid (que é o room.uid)
        const room = await repo.RoomModel.findOne({ where: { uid: terrain.target_uid } });
        if (!room) throw new Error("Room not found");

        let terrainData = await repo.Terrain.findOne({ where: { uid: terrain.uid } });

        if(!fileInput){
            //update
            //confia nos dados? vamos manter sempre algum coisas
            delete terrain.hash;
            delete terrain.userId;
            delete terrain.token;
            
            await terrainData.update({ ...terrain }, { where: { uid: terrain.uid } });
            return {
                success: true,
                data: terrainData
            }
        }
        
        const dir = path.join(UPLOAD_DIR, "Terrains_data");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        caminhoFinal = path.join(dir, `uid_${terrain.uid}.data`);
        caminhoBackup = caminhoFinal + ".bk";

        const novoHash = crypto.createHash('sha256').update(fileInput.buffer).digest('hex');
        const precisaAtualizarArquivo = !terrainData || terrainData.hash !== novoHash || !fs.existsSync(caminhoFinal);
        const statusFile = !terrainData ? "criado" : "modificado";

        await repo.sequelize.transaction(async (t) => {
            if (!terrainData) {
                terrainData = await repo.Terrain.create({ 
                    ...terrain, 
                    userId: user.id 
                }, { transaction: t });
            } else {
                await terrainData.update({ ...terrain }, { transaction: t });
            }

            if (precisaAtualizarArquivo) {
                if (fs.existsSync(caminhoFinal)) {
                    fs.copyFileSync(caminhoFinal, caminhoBackup);
                    backupRealizado = true;
                }
                fs.writeFileSync(caminhoFinal, fileInput.buffer);
                arquivoFoiModificado = true;
            }

            await repo.FileInfo.create({
                userId: user.id,
                hash: novoHash,
                token: novoHash,
                status: statusFile,
                type: 'file',
                size: fileInput.size,
                url: `${SERVER_URL}/files/uid_${terrain.uid}.data`,
                inCdn: false,
                target_uid: terrain.uid
            }, { transaction: t });

            await terrainData.update({ path: caminhoFinal, hash: novoHash }, { transaction: t });
        });

        if (backupRealizado && fs.existsSync(caminhoBackup)) fs.unlinkSync(caminhoBackup);

        return { success: true, data: await repo.Terrain.findByPk(terrainData.id) };

    } catch (err) {
        if (arquivoFoiModificado) {
            if (backupRealizado) fs.copyFileSync(caminhoBackup, caminhoFinal);
            else if (fs.existsSync(caminhoFinal)) fs.unlinkSync(caminhoFinal);
        }
        if (backupRealizado && fs.existsSync(caminhoBackup)) fs.unlinkSync(caminhoBackup);
        
        return { success: false, error: err.message };
    }
}

module.exports = { HandleTerrainUpdate, router};