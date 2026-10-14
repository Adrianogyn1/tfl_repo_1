# Ledger e Auditoria — Hash SHA-256 e Atomicidade no PostgreSQL

> **Caminho:** `app/economia/ledger_auditoria` · **Pai:** [economia](../regras.md) · **Status:** 🟡 Parcial

## Regras
1. **Imutável:** `wallet_ledger` só aceita `INSERT`. Nunca `UPDATE` nem `DELETE`. Correções viram um lançamento de estorno.
2. **Campos obrigatórios:** `avatarId`, `userId`, `currencyType`, `type`, `grossAmount`, `feeAmount`, `amount` (líquido), `balanceBefore`, `balanceAfter`, `hashAudit`, `createdAt`.
3. **`hashAudit`:** SHA-256 do conteúdo do lançamento.
4. **Atomicidade:** carteira e ledger são alterados na mesma `sequelize.transaction`, com bloqueio da linha da carteira (`SELECT ... FOR UPDATE`).
5. **Saldo negativo não existe:** se o débito deixaria o saldo abaixo de zero, a transação aborta.
6. Extrato para o jogador: paginado em 20 por página (`GET /profile/wallet/paginated`).

## Implementação atual
- `wallet_ledger` + `recordLedgerEntry` em `src/services/coinMarket.service.js` e `src/services/shop3d.service.js`.
- `hashAudit` existe só no protótipo do Drive (`backend/models/WalletLedger.js`). **Ainda não existe no `WebSite`.**

## Decisões abertas
- Encadear o hash (`sha256(hashAnterior + lançamento)`) para detectar adulteração em sequência?
