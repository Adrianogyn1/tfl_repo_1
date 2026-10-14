# Servidores — Pool de Instâncias, Health Check e Roteamento UDP

> **Caminho:** `app/infra_e_sistemas/servidores` · **Pai:** [infra_e_sistemas](../regras.md) · **Status:** 🟡 Parcial

## Regras
1. Cada instância é uma linha na tabela `servers` (`id`, `pid`, `roomId`, `ip`, `port`, `publicPort`, `maxPlayers`, `playersCount`, `scene`, `status`, `isClosed`, `region`, `uid`).
2. **Auto-replicação:** se todas as instâncias de uma sala estiverem cheias (`playersCount >= maxPlayers`), cria-se uma nova réplica (`Instância #N`) com porta própria.
3. Cada réplica tem porta exclusiva. Nunca reutilizar a porta de uma instância ativa.
4. **Health check:** instância sem resposta → `status` muda e `isClosed = true`. Não recebe mais jogadores.
5. O endereço público (`ip:publicPort`, `tfl://join?...`) só é entregue a jogadores autenticados com passe válido.

## Implementação atual
- `src/models/game/ServerModel.js`, `src/controllers/game/server_controller.js`
- `allocateOrReplicateRoomServerInstance` e `getRoomActiveServerInstances` em `src/services/coinMarket.service.js`

## Pendências
- Roteamento UDP e health check automático (ainda não existe rotina periódica).
- Tirar a lógica de servidores de dentro do `coinMarket.service.js` e criar um serviço próprio.
