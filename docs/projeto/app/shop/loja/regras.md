# Loja

> **Caminho:** `app/shop/loja` · **Pai:** [shop](../regras.md) · **Status:** 🟡 Parcial

## Propósito
Representa as lojas criadas e gerenciadas por usuários na plataforma. Uma loja agrupa seus próprios catálogos temáticos.

## Filhos
- [catalogo](catalogo/regras.md) — Catálogos de itens disponibilizados pela loja

## Regras
1. Cada loja pertence a **1 avatar** proprietário. A gestão da loja é realizada pelo painel de controle do avatar em [user/avatar/lojas_proprias](../../user/avatar/lojas_proprias/regras.md).
2. Cada loja pode organizar seus produtos em **catálogos** temáticos específicos.
3. **Rolagem Infinita com Pool de Reciclagem:**
   - Consumo paginado em lotes de **20 itens** por requisição via cursores (`beforeId` / `afterId`).
   - Reaproveitamento de nós DOM fora da viewport (virtualização) no front-end para prevenir estouro de memória.
   - Pré-carregamento do próximo bloco sob demanda conforme o buffer de visualização do usuário baixar.
4. Lojas inativas ou suspensas são imediatamente ocultadas do Shop agregador, preservando o histórico financeiro no ledger.

## Implementação atual
- `public/js/profile/shop.js` (abas de itens criados pelo avatar e reviews)
- `src/controllers/game/shop/shop_controller.js`

## Pendências
- Entidade de modelo explícita para Loja (`StoreModel`) agrupando múltiplos catálogos por avatar criador.
