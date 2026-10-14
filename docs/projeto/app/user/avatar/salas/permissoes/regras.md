# Salas › Permissões — Pública, Amigos, Privada/Trancada

> **Caminho:** `app/user/avatar/salas/permissoes` · **Pai:** [salas](../regras.md) · **Status:** 🟡 Parcial

## Regras
| Nível | Quem vê na listagem | Quem entra |
|---|---|---|
| `public` | Todos (aparece no Explorar) | Todos (com passe, se for paga) |
| `friends` | Amigos aceitos do dono | Amigos aceitos |
| `private` / trancada | Só o dono | Só o dono e os convidados |

1. A permissão é verificada **no servidor**, tanto na listagem quanto na entrada (`/enter`). O front só esconde botões.
2. Avatar bloqueado pelo dono (`Ignore`) nunca entra, seja qual for o nível.
3. O passe pago não ignora a permissão: pagar não dá acesso a sala `friends` ou `private`.

## Implementação atual
- `rooms.isPrivate` + `avatars.privacyRooms`.
- Ainda falta unificar em um único campo de 3 níveis e criar uma lista de convidados.
