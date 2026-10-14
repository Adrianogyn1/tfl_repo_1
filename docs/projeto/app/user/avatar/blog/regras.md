# Blog

> **Caminho:** `app/user/avatar/blog` · **Pai:** [avatar](../regras.md) · **Status:** ✅ Implementado

## Propósito
Central de relacionamentos sociais, feed público de publicações, gestão de conexões de amizade e mensageria em tempo real do avatar.

## Filhos
- [amigos](amigos/regras.md) — Grafo social, conexões mútuas, convites e bloqueios
- [chats](chats/regras.md) — Comunicação instantânea (DMs, grupos e chat global)

## Regras
1. O blog reúne as publicações do feed (texto, fotos e convites de salas 3D com lotação ao vivo).
2. Mini Reels expiram em 24h e Sentimentos em 6h.
3. Suporta 7 reações empáticas (`like`, `love`, `care`, `haha`, `wow`, `sad`, `angry`) e comentários em árvore recursiva infinita.
4. Sistema de Match/Crush mútuo 💘 gerando conexão imediata entre avatares.

## Implementação atual
- `src/views/profile/partials/view-social.ejs`, `public/js/profile/social.js`
- `src/models/social/*` (`Post`, `Photo`, `MiniReel`, `Like`, `Comment`, `AvatarMatch`)
