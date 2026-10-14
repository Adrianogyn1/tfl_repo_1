# Mensagens do Chat

> **Caminho:** `app/user/avatar/blog/chats/mensagens` · **Pai:** [chats](../regras.md) · **Status:** ✅ Implementado

## Propósito
Conteúdo transmitido nos chats: texto, imagens, notas de áudio e convites dinâmicos de salas 3D.

## Filhos
- [avatares](avatares/regras.md) — Participantes e emissores das mensagens

## Regras
1. Mensagens de texto sanitizadas contra XSS.
2. Áudios gravados via `MediaRecorder` ou fotos anexadas consom as cotas diárias de membros básicos.
3. Convites de salas 3D (`kind: "room_invite"`) geram cartões interativos no chat com endereço `IP:Porta`, lotação em tempo real e botão de auto-replicação caso a instância esteja cheia.

## Implementação atual
- `src/models/social/ChatMessage.js`, `public/js/profile/friends-chat.js`
