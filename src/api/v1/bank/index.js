const router = require("express").Router();
const profileController = require("../../../controllers/profile/profile_controller");

/**
 * Roteador /api/v1/bank (Unificado Web + Godot Engine)
 * Expõe carteira, câmbio, bolsa de liquidez FIFO, extrato completo, P2P Coins e Pix para o jogo no Godot:
 * - GET  /api/v1/bank/wallet
 * - GET  /api/v1/bank/market/ledger (ou /api/v1/bank/ledger)
 * - POST /api/v1/bank/market/transfer-coins (ou /api/v1/bank/transfer-coins)
 * - GET  /api/v1/bank/market/stats
 * - POST /api/v1/bank/market/buy
 * - POST /api/v1/bank/market/sell
 * - POST /api/v1/bank/market/cancel
 * - POST /api/v1/bank/market/convert
 * - POST /api/v1/bank/market/pix/create
 * - POST /api/v1/bank/market/pix/simulate-confirm
 * - POST /api/v1/bank/market/withdraw
 * - POST /api/v1/bank/market/withdraw/cancel
 */
router.use((req, res, next) => {
  if (
    !req.url.startsWith("/wallet") &&
    !req.url.startsWith("/market/")
  ) {
    req.url = "/market" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  return profileController(req, res, next);
});

module.exports = router;