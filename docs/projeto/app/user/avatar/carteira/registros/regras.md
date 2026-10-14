# Registros da Carteira

> **Caminho:** `app/user/avatar/carteira/registros` · **Pai:** [carteira](../regras.md) · **Status:** ✅ Implementado

## Propósito
Consulta paginada ao livro-razão contábil (`wallet_ledger`), exibindo cada transação de crédito, débito e taxa.

## Regras
1. Paginação obrigatória de **20 registros por página** (`GET /profile/wallet/paginated`).
2. Exibição de moeda (`currencyType`), valor bruto, taxa retida pela plataforma, valor líquido resultante, saldo anterior e saldo posterior.
3. Registros são estritamente imutáveis.

## Implementação atual
- `src/services/coinMarket.service.js` (`recordLedgerEntry`)
- `src/controllers/profile/profile_controller.js` (`/profile/wallet/paginated`)
- `#modalWalletLedger` em `src/views/profile/partials/view-market.ejs`
