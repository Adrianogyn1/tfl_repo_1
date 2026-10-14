# Páginas do Diário

> **Caminho:** `app/user/avatar/diario/paginas` · **Pai:** [diario](../regras.md) · **Status:** ✅ Implementado

## Propósito
Folhas escritas pelo avatar, com suporte a privacidade individual, anonimato blindado e leitura premiada.

## Regras
1. **Privacidade granular:** Cada página pode ser alternada a qualquer instante entre `🔒 Privado` (`isPublicAnonymous = false`) e `🎭 Público Anônimo` (`isPublicAnonymous = true`).
2. **Anonimato Blindado:** Páginas públicas ocultam totalmente `userId` e `avatarId`, recebendo pseudônimos líricos (ex: *"Viajante Noturno #412"*). Comentários de apoio recebem pseudônimos (ex: *"Ouvinte Amigo #319"*).
3. **5 Reações Empáticas:** `🫂 Abraço`, `❤️ Acolher`, `🤝 Te entendo`, `🌟 Força`, `🕯️ Paz`.
4. **Mecânica de Leitura Premiada:**
   - Cronômetro ativo no leitor imersivo exige tempo mínimo (`diaryMinReadSeconds`, padrão 30s) com a aba em foco.
   - Leitor ganha `+0.25 Coins` por página lida (até 20 páginas premiadas/dia).
   - Autor ganha `+0.50 Coins` por leitor único no mês e bônus de `+5.00 Coins` a cada 10 minutos acumulados.
5. **Anti-farm:** O autor não é recompensado por ler sua própria página. Limite idempotente de 1 recompensa por leitor/página/mês.

## Implementação atual
- `src/services/diary.service.js` (tabelas `diary_pages`, `diary_reactions`, `diary_comments`, `diary_reading_sessions`)
- `#modalDiaryReader` e `#modalDiaryEditor` em `src/views/profile/partials/view-diary.ejs`
