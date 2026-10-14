# Layout da Sala

> **Caminho:** `app/user/avatar/salas/layout` · **Pai:** [salas](../regras.md) · **Status:** 🟡 Parcial

## Propósito
Organização arquitetônica, planta baixa, zoneamento espacial e distribuição de mobília dentro do ambiente 3D da sala.

## Filhos
- [items](items/regras.md) — Mobília, decoração e eletrodomésticos instanciados no layout da sala

## Regras
1. O layout define a malha de navegação (NavMesh), superfícies de colisão de paredes e piso, e áreas utilizáveis do ambiente 3D.
2. Suporta presets de organização pré-configurados ou customização livre de posicionamento.
3. Itens e móveis só podem ser fixados em superfícies válidas do layout (piso, paredes ou suportes).

## Implementação atual
- `src/models/game/RoomModel.js` (`scene`), `src/models/game/TerrainModel.js`
