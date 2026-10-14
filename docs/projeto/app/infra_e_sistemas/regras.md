# Infra e Sistemas — Orquestrador, Presença, Portas, SEO e Cache

> **Caminho:** `app/infra_e_sistemas` · **Pai:** [app](../regras.md) · **Status:** 🟡 Parcial

## Propósito
Infraestrutura interna: servidores dedicados de jogo, presença online, alocação de portas, indexação e cache.

## Filhos
- [servidores](servidores/regras.md) — Pool de instâncias, health check e roteamento UDP
- [presenca_global](presenca_global/regras.md) — Heartbeat em memória, TTL de 45 s
- [crawling_e_seo](crawling_e_seo/regras.md) — Raiz pública indexável vs rotas privadas

## Regras
1. **Uso só interno:** nada deste módulo aparece em páginas do jogador. Métricas só no `/admin`.
2. **Cache:** `getPlatformStats()` usa TTL de 60 s (`STATS_CACHE_TTL_MS`). O polling do `/admin` é a cada 45 s.
3. **Autenticação servidor-a-servidor:** header `x-server-token: <masterKey>`.
4. Dados quentes (presença, lotação) ficam em RAM. O banco só recebe estado consolidado.

## Implementação atual
- `src/services/stats.service.js`, `src/controllers/game/server_controller.js`, `src/sockets/websocketController.js`
