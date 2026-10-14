# Economia — Regras Monetárias e Auditoria

> **Caminho:** `app/economia` · **Pai:** [app](../regras.md) · **Status:** ✅ Implementado

## Filhos
- [moedas](moedas/regras.md) — Cash, Coins e Chips
- [regras_fiscais](regras_fiscais/regras.md) — Taxas da plataforma (P2P taxa zero)
- [ledger_auditoria](ledger_auditoria/regras.md) — Hash SHA-256 e atomicidade no PostgreSQL

## Regras
1. **Taxas centralizadas:** toda taxa, cotação e prêmio vive em `economy_rules` (`EconomyRuleModel.js`) e é editada no `/admin`. Nunca deixar valores fixos no código.
2. **Toda movimentação vira lançamento no ledger** ([ledger_auditoria](ledger_auditoria/regras.md)).
3. **Atomicidade:** débito e crédito acontecem na mesma transação do banco.
4. A carteira é do **avatar** (`currencies.avatarId`), não da conta.
5. A saúde financeira (passivo de Cash vs despesas operacionais) só aparece no `/admin`.

## Implementação atual
- `src/services/coinMarket.service.js`, `src/services/financialHealth.service.js`
- `src/models/game/EconomyRuleModel.js`, `src/models/game/CurrencyModel.js`, `src/models/bank/*`
