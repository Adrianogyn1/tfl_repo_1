# Carteira

> **Caminho:** `app/user/avatar/carteira` · **Pai:** [avatar](../regras.md) · **Status:** ✅ Implementado

## Propósito
Exibição e gestão dos saldos multi-moeda (`Coins`, `Cash`, `Chips`) vinculados ao avatar ativo e acesso às operações financeiras.

## Filhos
- [registros](registros/regras.md) — Livro-razão e histórico detalhado de movimentações contábeis

## Regras
1. Cada avatar possui saldo independente nas 3 moedas da plataforma.
2. Apenas `Coins` podem ser transferidas entre jogadores P2P.
3. Conversões entre moedas operam com débito e crédito atômicos no ledger.
4. Toda e qualquer ação financeira abre em modal desacoplado (`.wallet-submodal`), preservando o shell clean.

## Implementação atual
- `src/models/game/CurrencyModel.js`, `src/views/profile/partials/view-market.ejs`, `public/js/profile/market.js`
