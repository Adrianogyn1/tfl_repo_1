# Presença Global — Heartbeat em Memória (TTL 45 s, sem Disk I/O)

> **Caminho:** `app/infra_e_sistemas/presenca_global` · **Pai:** [infra_e_sistemas](../regras.md) · **Status:** 🟡 Parcial

## Regras
1. A presença fica **apenas em RAM**. Nunca gravar heartbeat no banco.
2. TTL de **45 000 ms** (`defaultTtlMs`). Avatar sem heartbeat nesse tempo fica offline.
3. Índice invertido por sala (`roomId → avatares`) para contar jogadores sem varrer tudo.
4. A limpeza dos expirados roda em intervalo agendado.
5. Não confundir com a métrica "online nos últimos 5 min" do `stats.service.js`, que é telemetria do site.

## Implementação atual
- Protótipo: `GoogleDrive/The fantasy life Project/backend/controllers/PresenceService.js` (endpoint `/api/v1/rooms/heartbeat`).
- Ainda **não foi portado** para o `WebSite/src`.
