const express = require('express');
const multer = require('multer');
const fs = require('fs');
const router = express.Router();
require('dotenv').config();
const path = require('path');
const crypto = require('crypto');

const upload = multer({ storage: multer.memoryStorage() });
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads/");

router.post('/', upload.any(), Create);
router.get('/', Get);
router.get('/file/:name', GetFile);
router.get('/preview/:name/', GetFilePreview);
router.get('/itemsGame/', GetItemsGame);



async function Create(req, res)
{
    const folderName = `${UPLOAD_DIR}/manifest/${Date.now()}/`;
    try
    {
        if (!fs.existsSync(folderName))
        {
            fs.mkdirSync(folderName, { recursive: true });
        }

        let requestData = null;
        if (req.body && req.body.data)
        {
            requestData = JSON.parse(req.body.data);
        }



        const files = req.files;
        console.log('Dados recebidos:', requestData);
        console.log('Arquivos recebidos:', files ? files.length : 0);

        if (files)
        {
            files.forEach((file, index) =>
            {
                console.log(`Arquivo ${index + 1}: ${file.originalname}, Tamanho: ${file.size} bytes`);
                fs.writeFileSync(`${folderName}${file.originalname}`, file.buffer);
                //atualiza o path
                var name = file.originalname.split('.')[0];
                //atualiza no array
                var idx = requestData.selecteds.findIndex((f) => f.name.split('.')[0] == name);
                if(idx>=0) 
                     requestData.selecteds[idx].pathServer = folderName;
                //criar um guid de uid
                //requestData.selecteds[index].uid = crypto.randomBytes(16).toString('hex');
            });
        }
        fs.writeFileSync(folderName + "manifest.json", JSON.stringify(requestData));
        return res.status(200).json({
            success: true,
            error: null,
            data: requestData,
            message: { message: "Upload realizado com sucesso!" }
        });

    } catch (error)
    {
        console.error('Erro no upload:', error);
        if (fs.existsSync(folderName))
        {
            fs.rmSync(folderName, { recursive: true, force: true });
        }
        return res.status(500).json({
            success: false,
            error: error.message,
            data: null
        });
    }
}

function Get(req, res)
{
    try
    {
        var manifest_dir = `${UPLOAD_DIR}/manifest/`;
        var lastFolder = fs.readdirSync(manifest_dir).sort((a, b) => b - a)[0];
        var json = fs.readFileSync(`${manifest_dir}${lastFolder}/manifest.json`);
        const manifest = JSON.parse(json);
        return res.status(200).json({
            success: true,
            error: null,
            data: manifest,
            message: "arquivo encontrado com sucesso!"
        });
    } catch (error)
    {
        return res.status(500).json({
            success: false,
            error: error.message,
            data: null
        });
    }
}

function GetFile(req, res)
{
    try
    {
        var name = req.query.name || req.params.name;
        name = name.split('.')[0];

        var manifest_dir = `${UPLOAD_DIR}/manifest/`;
        var lastFolder = fs.readdirSync(manifest_dir).sort((a, b) => b - a)[0];
        var json = fs.readFileSync(`${manifest_dir}${lastFolder}/manifest.json`);
        var manifest = JSON.parse(json);
        //filtra o arquivo
        var file = manifest.selecteds.find((file) => file.name.split('.')[0] == name);
        if (!file) throw new Error("Arquivo nao encontrado");
        //envia o arquivoui
        var path = file.pathServer + file.name + ".pck";
        if (!fs.existsSync(path)) throw new Error("Arquivo nao encontrado");

        res.download(path);
    }
    catch (error)
    {


        res.json({
            success: false,
            error: null,
            message: { message: error.message }
        });
    }
}

function GetFilePreview(req, res)
{
    try
    {
        var name = req.query.name || req.params.name;
        var name = name.split('.')[0];
        var manifest_dir = `${UPLOAD_DIR}/manifest/`;
        var lastFolder = fs.readdirSync(manifest_dir).sort((a, b) => b - a)[0];
        var json = fs.readFileSync(`${manifest_dir}${lastFolder}/manifest.json`);
        var manifest = JSON.parse(json);
        //filtra o arquivo
        var file = manifest.selecteds.find((file) => file.name.split('.')[0] == name);
        if (!file) throw new Error("Arquivo nao encontrado");
        //envia o arquivoui
        var path = file.pathServer + name.split('.')[0] + ".png";
        if (!fs.existsSync(path)) 
                throw new Error("Arquivo nao encontrado");

        res.download(path);
    }
    catch (error)
    {
        res.json({
            success: false,
            error: null,
            message: { message: error.message }
        });
    }
}

function GetItemsGame(req, res)
{
    var manifest_dir = `${UPLOAD_DIR}/manifest/`;
    var lastFolder = fs.readdirSync(manifest_dir).sort((a, b) => b - a)[0];
    var json = fs.readFileSync(`${manifest_dir}${lastFolder}/manifest.json`);
    var manifest = JSON.parse(json);
   const result= manifest.selecteds.filter((f) => f.type == "ItemGame");
   let data = result.map((f) => {
    return {
        "name": f.name.split('.')[0],
        "category": f.category || "",
        "path": f.path + "",
        "download": process.env.SERVER_URL + "/api/manifest/file/"+f.name + "",
        "thumbnail": process.env.SERVER_URL + "/api/manifest/preview/" + f.name,
        "uid": f.uid,
        "size":""
    };
   });
   // [];
   
 
   

    return res.status(200).json({
        success: true,
        error: null,
        data: data,
        message: "arquivo encontrado com sucesso!"
    });

}


module.exports = { router };