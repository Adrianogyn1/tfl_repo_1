# Chats

> **Caminho:** `app/user/avatar/blog/chats` · **Pai:** [blog](../regras.md) · **Status:** ✅ Implementado

## Propósito
Sistema de bate-papo em tempo real (Global, Conversas Diretas/DM e Grupos) via WebSocket.

## Filhos
- [mensagens](mensagens/regras.md) — Mensagens trocadas nas conversas

## Regras
1. Conexão WebSocket em `/ws/chat` com identificação do avatar conectado.
2. **Cotas para Membros Básicos:**
   - Máximo de 3 novas DMs abertas por dia (`basicMaxChatOpensPerDay = 3`).
   - Apenas com amigos aceitos.
   - Máximo de 2 fotos (`basicMaxChatImagesPerDay = 2`) e 2 áudios (`basicMaxChatAudioPerDay = 2`) por dia.
3. **Membro VIP:** DMs ilimitadas com qualquer avatar e envio irrestrito de fotos e áudios de voz gravados via microfone.

## Implementação atual
- `src/controllers/social/chat_controller.js`, `src/views/profile/partials/view-chat.ejs`, `public/js/profile/friends-chat.js`
