# Salas › Configuração — Nome, Lotação e Regras de Entrada

> **Caminho:** `app/user/avatar/salas/configuracao` · **Pai:** [salas](../regras.md) · **Status:** ✅ Implementado

## Regras
1. Campos editáveis pelo dono: `name`, `description`, `maxPlayers`, `scene` e `entryValue`.
2. **Passe de entrada:** `entryValue = 0` é grátis. `entryValue > 0` é pago em Coins.
3. O passe vale `roomPassDurationHours` (24 h), registrado em `room_entry_passes` com `expiresAt`.
4. **Repasse:** a plataforma retém `roomEntryPlatformFeePercent` (15%) e o dono recebe o restante (85%) na hora.
5. A interface mostra ao vivo a simulação "taxa da plataforma vs repasse líquido" antes de salvar.
6. `maxPlayers` define a lotação **por instância**. Ao lotar, abre-se uma réplica, a sala nunca recusa por falta de vaga.

## Implementação atual
- `POST /profile/room/create`, `POST /profile/room/update`, `POST /profile/room/:id/enter`
- `enterRoomWithPassAndVisit` em `coinMarket.service.js`
