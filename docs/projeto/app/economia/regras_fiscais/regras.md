# Regras Fiscais — Taxas da Plataforma

> **Caminho:** `app/economia/regras_fiscais` · **Pai:** [economia](../regras.md) · **Status:** 🟡 Parcial (divergência aberta)

## Regras
1. **Transferência P2P de Coins: taxa ZERO** (diretriz da árvore do projeto).
2. Toda taxa é registrada no ledger (`feeAmount`), **mesmo quando vale 0**.
3. Taxas vigentes em `economy_rules` (padrões atuais):

| Chave | Padrão | Uso |
|---|---|---|
| `p2pCoinsTransferFeePercent` | **2%** ⚠️ | Transferência P2P de Coins |
| `withdrawFeePercent` / `withdrawFixedFeeCash` | — | Saque Pix |
| `cashToCoinsFeePercent`, `instantCoinsToCashFeePercent`, `coinsToChipsFeePercent`, `chipsToCoinsFeePercent` | — | Conversões |
| `buySpreadPercent` / `sellSpreadPercent` | — | Spread de compra e venda |
| `shopSalePlatformFeePercent` | 30% | Comissão sobre vendas UGC |
| `shopCreationFixedFeeCoins` / `shopTextureUploadFixedFeeCoins` | 5 / 1 Coins | Publicar item / enviar textura |
| `roomEntryPlatformFeePercent` | 15% | Passe de entrada 24h |
| `roomBoost24hFeeCoins` | 20 Coins | Boost de sala |

## ⚠️ Divergência aberta
- A árvore pede **taxa zero no P2P**, mas o código usa `p2pCoinsTransferFeePercent = 2.00` por padrão (`EconomyRuleModel.js:85`, `coinMarket.service.js:196`).
- Falta decidir qual vale e alinhar o código ou esta regra.
