# Salas

> **Caminho:** `app/user/avatar/salas` · **Pai:** [avatar](../regras.md) · **Status:** ✅ Implementado

## Propósito
Ambientes virtuais 3D (casas, apartamentos, estúdios, lojas físicas) pertencentes e decorados pelo avatar.

## Filhos
- [layout](layout/regras.md) — Planta baixa, zoneamento arquitetônico e mobília/items da sala
- [configuracao](configuracao/regras.md) — Nome, cena base, lotação máxima e passe de entrada
- [permissoes](permissoes/regras.md) — Controle de acesso (pública, amigos, privada)

## Regras
1. Cada sala 3D pertence a 1 avatar proprietário (`rooms.avatarId`).
2. Salas suportam Passe de Entrada de 24h (`entryValue` em Coins). 15% retido pela plataforma e 85% para o dono.
3. **Visitas Únicas Mensais:** A cada 1.000 visitas únicas no mês, o dono ganha bônus automático de 50 Coins.
4. Salas cheias são auto-replicadas em novas instâncias do cluster de servidores dedicada na tabela `servers`.

## Implementação atual
- `src/models/game/RoomModel.js`, `src/services/coinMarket.service.js`, `src/views/profile/partials/view-salas.ejs`
