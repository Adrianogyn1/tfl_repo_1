const repo = require("../../repositories/repository");
const router = require("express").Router();
const auth = require("../auth");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");


router.get("/texture/url", auth.CheckLogin, getUrlUpload);

router.get("/textures", auth.CheckLogin, getAll);
router.get("/texture/:id", auth.CheckLogin, getById);
router.post("/texture", auth.CheckLogin, create);
router.put("/texture/:id", auth.CheckLogin, update);
router.delete("/texture/:id", auth.CheckLogin, remove);

async function getUrlUpload(req, res) {
  const userId = req.userId;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const BUCKET_NAME = "tfl-bucket";
  
  // Caminho onde o arquivo será salvo no bucket
  const hash = req.query.hash || req.params.hash || crypto.randomUUID();
  var textureData = await repo.Texture.findOne({where: {hash: hash}});
  if(textureData)
  {
    if(textureData.status == "done")
        //erro ja existe
    return res.status(400).json({ error: "Texture already exists", success: false, data: textureData });
    else
      repo.Texture.destroy({where: {hash: hash}});
  }

  const filePath = `shop/${userId}/${Date.now()}-${hash}.png`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(filePath);

  if (error) {
    return res.json({ message: error.message, success: false });
  }

    var textureData = await repo.Texture.create({
      hash: hash,
      url: data.url,
      userId: userId,
      status: "pending"
    });


 return res.json({
    success: true,
    data: textureData,
    ...data
  });
}



//busca pela textura do usuario

async function getAll(req, res)
{
  const userId = req.userId;
  const { Op } = require("sequelize");
  const limit = parseInt(req.query?.limit || req.body?.limit) || 50;
  const offset = parseInt(req.query?.offset || req.body?.take || req.body?.skip || req.body?.offset) || 0;
  const q = repo.parseQueryStringToWhere(req.query?.q || req.body?.q || "");
  const o = repo.parseOrderByString(req.query?.q || req.body?.q || "");

  

  const textures = await repo.Texture.findAndCountAll({
    where: {
      userId: userId,
      ...q
    },
    order: o,
    limit: limit,
    offset: offset
  });

  return res.status(200).json({
    success: true,
    data: textures?.rows || [],
    count: textures?.count || 0,
    skip: offset,
    limit: limit,
    nextPage: textures?.count <= 0 ? 0 : Math.ceil((offset + limit) / limit) + 1
  });
}

async function getById(req, res)
{
  var id = req.params.id || req.body.id || req.query.id || null;
  if(!id)
  {
    return res.status(200).json({ error: "Texture not found", success: false });
  }
  const texture = await repo.Texture.findByPk(req.params.id);
  return res.status(200).json({
    success: true,
    data: texture
  });
}

async function create(req, res)
{
  const texture = await repo.Texture.create(req.body);
  if (!texture)
  {
    return res.status(200).json({ error: "error creating texture", success: false });
  }
  return res.status(200).json({
    success: true,
    data: texture
  });
}

async function update(req, res)
{
  var data = req.body;
  data.status = "done";
  var textureId = req.params.id || req.body.id || req.query.id || null;
  const texture = await repo.Texture.update(data, {
    where: { id: textureId},
  });
  if (!texture)
  {
    return res.status(200).json({ error: "error updating texture", success: false });
  }
  var data = await repo.Texture.findByPk(textureId);
  return res.status(200).json({
    success: true,
    data: data
  });
}

async function remove(req, res)
{
  const texture = await repo.Texture.destroy({ where: { id: req.params.id } });

  if (!texture)
  {
    return res.status(200).json({ error: "Texture not found", success: false });
  }

  return res.status(200).json({
    success: true,
    data: texture
  });
}

module.exports = {

  router,
};
