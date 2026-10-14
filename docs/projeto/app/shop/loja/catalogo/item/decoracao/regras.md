# Decoração

> **Caminho:** `app/shop/loja/catalogo/item/decoracao` · **Pai:** [item](../regras.md) · **Status:** 🟡 Parcial

## Propósito
Móveis residenciais e comerciais, eletrodomésticos e itens decorativos reais comercializados nas lojas para mobiliar salas 3D.

## Regras
1. Destinado a itens de mobília e ambientação da vida real (sofás, mesas, cadeiras, camas, lâmpadas, aparelhos de som, plantas decorativas).
2. Cada item deve conter dimensões de colisão, pontos de ancoragem e `prefabPath` válido para instanciação pelo Godot/Babylon.js.
3. Ao ser comprado, o item fica disponível no depósito/inventário de objetos do avatar para ser posicionado em suas salas ([user/avatar/salas/layout/items](../../../../../user/avatar/salas/layout/items/regras.md)).

## Implementação atual
- `src/models/game/ObjectModel.js` (persistência de instâncias na tabela `room_objects`).
- Catálogo comercial em expansão.
