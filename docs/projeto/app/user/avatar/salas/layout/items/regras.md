# Items da Sala

> **Caminho:** `app/user/avatar/salas/layout/items` · **Pai:** [layout](../regras.md) · **Status:** 🟡 Parcial

## Propósito
Móveis residenciais e comerciais, eletrodomésticos e decorações instanciadas e posicionadas no espaço 3D da sala.

## Regras
1. Apenas o proprietário da sala possui permissão para instanciar, mover, rotacionar ou remover itens do ambiente.
2. Cada item instanciado persiste sua coordenada tridimensional (`position`, `rotation`, `scale`) na tabela `room_objects`.
3. Os itens são adquiridos previamente na categoria de decoração do marketplace.

## Implementação atual
- `src/models/game/ObjectModel.js` (`room_objects`)
- `GET /profile/room/:id/details`
