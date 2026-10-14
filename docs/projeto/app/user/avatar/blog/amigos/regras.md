# Amigos

> **Caminho:** `app/user/avatar/blog/amigos` · **Pai:** [blog](../regras.md) · **Status:** ✅ Implementado

## Propósito
Gerenciamento das relações sociais do avatar: lista de amigos confirmados, solicitações pendentes e bloqueios de segurança.

## Filhos
- [lista_amigos](lista_amigos/regras.md) — Amizades mútuas aceitas
- [pedidos_pendentes](pedidos_pendentes/regras.md) — Solicitações enviadas e recebidas
- [ignorados](ignorados/regras.md) — Lista de avatares bloqueados

## Regras
1. Amizade é uma relação estritamente bidirecional dependente de convite e aceite mútuo.
2. A lista de amigos respeita a configuração de privacidade `privacyFriends` do avatar.
3. Membro básico só pode abrir conversas privadas com amigos aceitos desta lista.

## Implementação atual
- `src/models/social/Friend.js`, `src/views/profile/partials/view-friends.ejs`, `public/js/profile/social.js`
