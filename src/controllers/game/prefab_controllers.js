const repo = require("../../repositories/repository");
const router = require("express").Router();
const { Op } = require("sequelize");
const { CheckLogin: CheckAuth } = require("../auth");
const express = require("express");
const fs = require("fs");
const path = require("path");


const { stringify } = require("csv-stringify/sync");
const { parse } = require("csv-parse/sync");
const TYPES = ["RoomObject", "AvatarOutfit", "Otters"];
const attrs = () => repo.PrefabModel.rawAttributes;

router.get("/prefab/csv", CheckAuth, getCsv);
router.post("/prefab/csv", CheckAuth, express.text({ type: "*/*", limit: "10mb" }), updateCsv);

// Ações para Prefabs
router.get("/prefabs", CheckAuth, getAll);
router.get("/prefab/:id", CheckAuth, getById);
router.post("/prefab", CheckAuth, create);
router.put("/prefab/:id", CheckAuth, update);
router.post("/prefab/save", CheckAuth, saveAll);
router.delete("/prefab/:id", CheckAuth, remove);
router.get("/prefab", (req, res) =>
{
  var file = __dirname + "/../../paginas/view/prefab.html";
  var fileCombine = path.resolve(file);
  if (!fs.existsSync(fileCombine))
    return res.status(404).json({ error: "Prefab not found", success: false });
  else
    // return res.json({ success: true, data: file });
    //  return res.json({ success: true, data: file });
    return res.sendFile(fileCombine);
});


async function getCsv(req, res)
{
  try
  {
    const rows = await repo.PrefabModel.findAll({ raw: true, order: [["id", "ASC"]] });
    res.type("text/csv").send(stringify(rows, { header: true }));
  } catch (err)
  {
    res.status(500).json({ error: err.message, success: false });
  }
}



function coerce(col, raw)
{
  if (raw === "" || raw == null) return null;
  const type = attrs()[col]?.type?.key;
  switch (type)
  {
    case "BOOLEAN": {
      const s = String(raw).trim().toLowerCase();
      if (["true", "1", "t", "yes", "sim"].includes(s)) return true;
      if (["false", "0", "f", "no", "nao", "não"].includes(s)) return false;
      return null;
    }
    case "INTEGER":
    case "BIGINT": { const n = parseInt(raw, 10); return Number.isNaN(n) ? null : n; }
    case "FLOAT":
    case "DOUBLE":
    case "DECIMAL": { const n = parseFloat(raw); return Number.isNaN(n) ? null : n; }
    case "JSON":
    case "JSONB": try { return JSON.parse(raw); } catch { return raw; }
    default: return raw;
  }
}

async function updateCsv(req, res)
{
  if (typeof req.body !== "string" || !req.body.trim())
    return res.status(400).json({ success: false, error: "CSV vazio ou Content-Type inválido (use text/csv)" });

  const t = await repo.PrefabModel.sequelize.transaction();
  try
  {
    const rows = parse(req.body, { columns: true, skip_empty_lines: true, bom: true });
    let created = 0, updated = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++)
    {
      const { id, createdAt, updatedAt, ...raw } = rows[i];
      const line = i + 2;

      if (!raw.name || !raw.addressable) { errors.push({ line, error: "name e addressable são obrigatórios" }); continue; }
      if (raw.type && !TYPES.includes(raw.type)) { errors.push({ line, error: `type inválido: ${raw.type}` }); continue; }

      //remover hf, hm de name
      if (raw.name.includes("HF")) raw.name = raw.name.replace("HF", "");
      if (raw.name.includes("HM")) raw.name = raw.name.replace("HM", "");
      //substituir underscore por espaços
      raw.name = raw.name.replace("_", " ");
      //fazer trim
      raw.name = raw.name.trim();
      //capitalizar
      raw.name = raw.name.charAt(0).toUpperCase() + raw.name.slice(1);


      // só colunas que existem no model, com tipo convertido
      const v = {};
      for (const [k, val] of Object.entries(raw))
      {
        if (attrs()[k]) v[k] = coerce(k, val);
      }
      if (!v.uid) delete v.uid;
      if (!v.type) delete v.type;

      const pk = parseInt(id, 10);
      const [n] = pk ? await repo.PrefabModel.update(v, { where: { id: pk }, transaction: t }) : [0];
      if (n) updated++;
      else { await repo.PrefabModel.create(v, { transaction: t }); created++; }
    }

    if (errors.length) { await t.rollback(); return res.status(400).json({ success: false, errors }); }
    await t.commit();
    res.json({ success: true, created, updated });
  } catch (err)
  {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
}


function checkData(prefabData)
{
  let error = "";
  try
  {
    if (!prefabData) throw new Error("Dados do prefab são obrigatórios.");

    if (!prefabData.name) throw new Error("O nome do prefab é obrigatório.");

    if (!prefabData.addressable)
      throw new Error("O addressable do prefab é obrigatório.");
  } catch (e)
  {
    error = e.message;
  }
  return error;
}

function validReturn(prefab)
{
  var retVal = prefab;
  if (retVal.description == null) retVal.description = "";
  if (retVal.uid == null) retVal.uid = "";
  if (retVal.name == null) retVal.name = "";
  if (retVal.materialId == null || retVal.materialId == "")
    retVal.materialId = 0;
  if (retVal.thumbnail == null) retVal.thumbnail = "";
  if (retVal.version == null) retVal.version = "";
  return retVal;
}

async function getAll(req, res)
{
  const limit = parseInt(req.query?.limit || req.body?.limit) || 10;
  const offset =
    parseInt(
      req.query?.offset || req.body?.take || req.body?.skip || req.body?.offset,
    ) || 0;
  const query = req.query?.q || req.body?.q || "";
  const whereCondition = repo.parseQueryStringToWhere(query);

  try
  {
    const prefabs = await repo.PrefabModel.findAndCountAll({
      where: whereCondition,
      limit: limit,
      offset: offset,
    });
    var data = [];
    prefabs.rows.forEach((element) =>
    {
      data.push(validReturn(element));
    });

    return res.json({
      success: true,
      data: data,
      count: prefabs?.count || 0,
      skip: offset,
      limit: limit,
      nextPage:
        prefabs?.count <= 0 ? 0 : Math.ceil((offset + limit) / limit) + 1,
    });
  } catch (err)
  {
    return res
      .status(500)
      .json({ success: false, data: [], error: err.message });
  }
}

async function getById(req, res)
{
  try
  {
    const prefab = await repo.PrefabModel.findOne({
      where: { uid: req.params.id },
    });
    if (!prefab)
    {
      return res
        .status(404)
        .json({ error: "Prefab not found", success: false });
    }

    return res.json({ success: true, data: validReturn(prefab) });
  } catch (err)
  {
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function create(req, res)
{
  try
  {
    const prefabData = req.body;

    if (prefabData.id && prefabData.id > 0)
    {
      return update(req, res);
    }
    //verifica a uid
    if (prefabData.uid)
    {
      var exist = await repo.PrefabModel.findOne({
        where: { uid: prefabData.uid },
      });
      if (exist) return update(req, res);
    }

    console.log("Vamos criar", prefabData);
    delete prefabData.id;

    const error = checkData(prefabData);

    if (error)
    {
      return res.status(400).json({ error: error, success: false });
    }

    const prefab = await repo.PrefabModel.create(prefabData);
    return res.json({ success: true, data: prefab });
  } catch (err)
  {
    console.log(err);
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function update(req, res)
{
  try
  {
    const error = checkData(req.body);

    console.log("Vamos atualizar", req.body);

    if (error) return res.status(400).json({ error, success: false });

    const id = req.body.id || req.params.id || 0;
    const uid = req.body.uid;
    console.log(`id: ${id} uid: ${uid}`);

    const prefabExists = await repo.PrefabModel.findOne({
      where: { [Op.or]: [{ id }, { uid: uid || "" }] },
    });

    if (!prefabExists)
      return res
        .status(404)
        .json({ error: "Prefab not found", success: false });

    await repo.PrefabModel.update(req.body, { where: { id: prefabExists.id } });
    const updatedPrefab = await repo.PrefabModel.findByPk(prefabExists.id);

    return res.json({ success: true, data: validReturn(updatedPrefab) });
  } catch (err)
  {
    console.log(err);
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function remove(req, res)
{
  try
  {
    const prefab = await repo.PrefabModel.findByPk(req.params.id);
    if (!prefab)
    {
      return res
        .status(404)
        .json({ error: "Prefab not found", success: false });
    }

    await repo.PrefabModel.destroy({ where: { id: req.params.id } });
    return res.json({ success: true, message: "Prefab deleted successfully" });
  } catch (err)
  {
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function saveAll(req, res)
{
  try
  {
    const prefabs = req.body;
    const results = [];

    if (!Array.isArray(prefabs))
    {
      console.error("Prefabs must be an array");
      return res
        .status(400)
        .json({ error: "Prefabs must be an array", success: false });
    }

    let updateList = [];
    let createList = [];
    for (const prefab of prefabs)
    {
      const error = checkData(prefab);
      if (error) throw new Error(error);
      var exist = await repo.PrefabModel.findOne({
        where: { uid: prefab.uid },
      });
      delete prefab.id;
      if (exist)
      {
        updateList.push(prefab);
      } else
      {
        createList.push(prefab);
      }
    }
    //vamos fazer via transacao
    const transaction = await repo.sequelize.transaction();
    try
    {
      for (const prefab of createList)
      {
        const newPrefab = await repo.PrefabModel.create(prefab, {
          transaction,
        });
        results.push(newPrefab.id);
      }
      for (const prefab of updateList)
      {
        await repo.PrefabModel.update(prefab, {
          where: { uid: prefab.uid },
          transaction,
        });
      }
      await transaction.commit();
    } catch (err)
    {
      await transaction.rollback();
      throw err;
    }

    const retVal = await repo.PrefabModel.findAll({
      where: { id: { [Op.in]: results } },
    });
    let data = [];
    retVal.forEach((element) =>
    {
      data.push(validReturn(element));
    });
    return res.json({ success: true, data: data });
  } catch (err)
  {
    console.log(err);
    return res.status(400).json({ error: err.message, success: false });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  saveAll,
  router,
};
