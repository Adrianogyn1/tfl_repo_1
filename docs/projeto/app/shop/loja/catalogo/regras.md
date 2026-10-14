# Catálogo

> **Caminho:** `app/shop/loja/catalogo` · **Pai:** [loja](../regras.md) · **Status:** 🟡 Parcial

## Propósito
Organizador temático de produtos dentro de uma loja. O catálogo agrupa itens da vida real ofertados aos jogadores.

## Filhos
- [item](item/regras.md) — Unidade de produto do catálogo (roupas, animais, veículos, decoração)

## Regras
1. Todo catálogo pertence a uma **loja** e possui nome, descrição e nicho de produtos.
2. O catálogo lista exclusivamente **itens** reais comercializáveis.
3. Não são permitidos itens mágicos ou fora da proposta de vida real do metaverso.
4. Itens inativos em um catálogo (`active = false`) não podem ser comprados, mas continuam existindo no inventário de quem os comprou.

## Implementação atual
- `shop_containers` (`ShopContainer.js`) organiza atualmente os itens por categorias.
