# Item

> **Caminho:** `app/shop/loja/catalogo/item` · **Pai:** [catalogo](../regras.md) · **Status:** 🟡 Parcial

## Propósito
Unidade base comercializável dentro de um catálogo. Todo item pertence a um tipo específico da vida real.

## Filhos
- [roupas](roupas/regras.md) — Roupas, calçados, cortes de cabelo e acessórios
- [animais](animais/regras.md) — Pets domésticos reais (cães, gatos, pássaros)
- [veiculos](veiculos/regras.md) — Transporte urbano real (carros, motos, bikes, skates)
- [decoracao](decoracao/regras.md) — Móveis, eletrodomésticos e itens decorativos de ambientes

## Regras
1. Todo item deve pertencer obrigatoriamente a uma das 4 categorias filhas: `roupas`, `animais`, `veiculos` ou `decoracao`.
2. Metadados obrigatórios de todo item:
   - `title`: Nome descritivo comercial.
   - `category`: Tipo exato do item (`clothing`, `pet`, `vehicle`, `furniture`).
   - `currencyType`: Moeda cobrada (`Coins`, `Cash` ou `Chips`).
   - `price`: Valor monetário numérico.
   - `stock`: Quantidade em estoque (`-1` para infinito ou `>= 0`).
   - `rarity`: Nível de raridade (`common`, `rare`, `epic`, `legendary`).
   - `prefabPath`: Caminho do modelo 3D validado para carregamento em runtime.
   - `active`: Flag booleana de disponibilidade na loja.
3. Itens comprados são debitados da carteira do avatar e adicionados ao inventário correspondente do avatar em [user/avatar](../../../../user/avatar/regras.md).

## Implementação atual
- `src/models/game/ShopContainer.js`
- `src/services/shop3d.service.js`
