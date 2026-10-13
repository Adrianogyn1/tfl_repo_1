---
trigger: always_on
description: Regra obrigatória para ler e atualizar o arquivo PROJECT_MEMORY_LOG.txt em todas as tarefas do projeto The Fantasy Life (TFL).
---

# Memória Contínua do Projeto (`PROJECT_MEMORY_LOG.txt`)

1. **Leitura Obrigatória**: Antes de planejar ou modificar qualquer arquivo neste repositório, leia `/media/not/Projetos/WebSite/PROJECT_MEMORY_LOG.txt` para compreender:
   - O propósito do projeto **The Fantasy Life (TFL)**.
   - As regras estritas de negócio e interface (ex.: nunca expor detalhes internos da API ou da engine do jogo em páginas públicas; manter `/tutorial` e seletor de idioma apenas no rodapé `footer.ejs`; manter estatísticas de visita/região e ferramentas administrativas exclusivamente em `/admin`; nunca usar `alert()` nativo, usando sempre `window.showToast`).
   - A responsabilidade de cada módulo.
   - O histórico do que já foi implementado.

2. **Atualização Obrigatória**: Sempre que concluir uma tarefa que crie, altere ou remova funcionalidades, rotas, views ou serviços:
   - Adicione uma nova entrada `[LOG #XX - DATA]` na seção `5. HISTÓRICO DE LOGS E IMPLEMENTAÇÕES` de `/media/not/Projetos/WebSite/PROJECT_MEMORY_LOG.txt` descrevendo o que foi feito e quais arquivos foram alterados.
   - Caso tenha criado ou alterado um módulo estrutural, atualize também a seção `4. DESCRIÇÃO DETALHADA DE CADA MÓDULO` no mesmo arquivo.
