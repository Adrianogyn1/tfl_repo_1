# Moedas — Cash, Coins e Chips

> **Caminho:** `app/economia/moedas` · **Pai:** [economia](../regras.md) · **Status:** ✅ Implementado

## Regras
| Moeda | Papel | Entra por | Sai por | P2P entre jogadores |
|---|---|---|---|---|
| `Cash` | Moeda forte com lastro em R$ | Compra via Pix | Saque via Pix | ❌ **Nunca** |
| `Coins` | Moeda de circulação no mundo | Conversão, prêmios, vendas | Compras, passes, boosts | ✅ Única moeda transferível |
| `Chips` | Fichas de minigames | Conversão de Coins | Cassino e conversão de volta | ❌ |

1. **Conversões:** Cash → Coins, Coins → Chips, Chips → Coins, e Coins → Cash com deságio de liquidez. Cada conversão tem a sua taxa em `economy_rules`.
2. Cassino e minigames usam **somente `Chips`**.
3. A bolsa P2P negocia lotes de `Coins` (`coin_orders`), com execução FIFO.

## Implementação atual
- `src/models/game/CurrencyModel.js`, `src/models/bank/CoinOrder.js`
- `src/views/profile/partials/view-market.ejs`, `public/js/profile/market.js`
