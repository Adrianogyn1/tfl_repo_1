/*
* usado internamente para criação de carteira e transações
*/


const repo = require("../../repository");
const router = require("express").Router();//por hora nao usamos



function checkData(currencyData)
{
  let error = "";
  try
  {
    if (!currencyData) throw new Error("Dados da moeda são obrigatórios.");

    if (currencyData.coins === undefined || currencyData.coins === null
      || currencyData.cash === undefined || currencyData.cash === null
      || currencyData.chips === undefined || currencyData.chips === null
    )
      throw new Error("O valor da moeda é obrigatório.");

    if (!currencyData.userId) throw new Error("O userId é obrigatório.");
    if(!currencyData.ownerId) throw new Error("O ownerId é obrigatório.");
  } catch (e)
  {
    error = e.message;
  }
  return error;
}


//#region api rotas
async function getAll(req, res)
{
  const limit = parseInt(req.query?.limit || req.body?.limit) || 50;
  const offset =
    parseInt(
      req.query?.offset || req.body?.take || req.body?.skip || req.body?.offset,
    ) || 0;

  try
  {
    const currencies = await repo.Currency.findAndCountAll({
      limit: limit,
      offset: offset,
    });

    return res.json({
      success: true,
      data: currencies?.rows || [],
      count: currencies?.count || 0,
      skip: offset,
      limit: limit,
      nextPage:
        currencies?.count <= 0 ? 0 : Math.ceil((offset + limit) / limit) + 1,
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
    const currency = await repo.Currency.findByPk(req.params.id);
    if (!currency)
    {
      return res
        .status(404)
        .json({ error: "Currency not found", success: false });
    }
    return res.json({ success: true, data: currency });
  } catch (err)
  {
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function create(req, res)
{
  try
  {
    const currencyData = req.body;
    const error = checkData(currencyData);
    const role = req.userData.role;

    if (error)
    {
      return res.status(400).json({ error: error, success: false });
    }

    delete currencyData.uid;
    const currency = await repo.Currency.create(currencyData);
    return res.json({ success: true, data: currency });
  } catch (err)
  {
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function update(req, res)
{
  try
  {
    const error = checkData(req.body);
    if (error)
    {
      return res.status(400).json({ error: error, success: false });
    }

    const currencyExists = await repo.Currency.findByPk(req.params.id);
    if (!currencyExists)
    {
      return res
        .status(404)
        .json({ error: "Currency not found", success: false });
    }

    await repo.Currency.update(req.body, { where: { id: req.params.id } });
    const updatedCurrency = await repo.Currency.findByPk(req.params.id);

    return res.json({ success: true, data: updatedCurrency });
  } catch (err)
  {
    return res.status(500).json({ error: err.message, success: false });
  }
}

async function remove(req, res)
{
  try
  {
    const currency = await repo.Currency.findByPk(req.params.id);
    if (!currency)
    {
      return res
        .status(404)
        .json({ error: "Currency not found", success: false });
    }

    await repo.Currency.destroy({ where: { id: req.params.id } });
    return res.json({
      success: true,
      message: "Currency deleted successfully",
    });
  } catch (err)
  {
    return res.status(500).json({ error: err.message, success: false });
  }
}
//#endregion


//cria uma nova
async function _create(wallet)
{

  try
  {
    var error = checkData(wallet);
    if (error) throw new Error(error);

    await repo.Currency.create(wallet);
    return true;
  }
  catch (err)
  {
    console.log(err);
    return false;
  }
}
//atualiza
async function _update(wallet, walletId)
{

  try
  {
    var error = checkData(wallet);
    if (error) throw new Error(error);

    await repo.Currency.update(wallet, { where: { id: walletId } });
    return true;

  } catch (err)
  {
    console.log(err);
    return false;
  }

}
//retorna a wallet pela id
async function _getById(walletId) {
  return await repo.Currency.findByPk(walletId);
}
async function _getByOwnerId(avatarID) {
  return await repo.Currency.findOne({
    where: {
      ownerId: avatarID,
    }
  });
}

//usado sempre que houver alguma transacao
async function SumBalance(avatarID)
{
  try
  {
    let coins, cash, chips;
    coins = await repo.CurrencyRegister.sum('value', {
      where: {
        ownerId: avatarID,
        type: 'Coins',
      },
    });
    cash = await repo.CurrencyRegister.sum('value', {
      where: {
        ownerId: avatarID,
        type: 'Cash',
      },
    });
    chips = await repo.CurrencyRegister.sum('value', {
      where: {
        ownerId: avatarID,
        type: 'Chips',
      },
    });
    var wallet = await repo.Currency.findOne({
      where: {
        userId: avatarID,
      }
    });
    if (!wallet)
      throw new Error("Wallet not found");

    wallet.coins = coins;
    wallet.cash = cash;
    wallet.chips = chips;

    _update(wallet, wallet.id);

    return true;
  } catch (err)
  {
    console.log(err);
    return false;
  }
}

module.exports = {
  _create,
  _update,
  _getById,
  _getByOwnerId,
  SumBalance,
  router,
};
