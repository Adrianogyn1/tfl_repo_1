# Lojas Próprias

> **Caminho:** `app/user/avatar/lojas_proprias` · **Pai:** [avatar](../regras.md) · **Status:** 🟡 Parcial

## Propósito
Painel de controle do avatar para criar, personalizar e gerenciar suas próprias lojas no marketplace.

## Filhos
- [items](items/regras.md) — Gestão dos itens cadastrados à venda na loja

## Regras
1. Cada loja pertence ao avatar ativo.
2. O avatar pode cadastrar produtos autorizados nas categorias filhas de `items`.
3. Publicar itens cobra a taxa de criação de item (`shopCreationFixedFeeCoins`, padrão 5 Coins) e upload de textura (`shopTextureUploadFixedFeeCoins`, padrão 1 Coin).
4. O repasse das vendas (70%) é creditado automaticamente na carteira do avatar com registro auditável no ledger contábil.

## Implementação atual
- `public/js/profile/shop.js` (seção "Criados por mim" e estatísticas de vendas/reviews)
