# docs/projeto — Árvore de Módulos do TFL

Documentação por módulo. **Cada pasta é um módulo** e tem um `regras.md`.

| Arquivo | Para quem | Conteúdo |
|---|---|---|
| [tree.md](tree.md) | Humanos | Árvore conceitual original |
| [llms.txt](llms.txt) | Modelos de IA | Protocolo de leitura, precedência e índice com links |
| `app/**/regras.md` | Todos | Regras de cada módulo |

## Como funciona
- As regras são **herdadas**: o que vale para `app/user` vale para `app/user/avatar/...`.
- Status de cada módulo: ✅ implementado · 🟡 parcial · ⏳ planejado.
- Modelo de cada `regras.md`: cabeçalho (caminho, pai e status) → Propósito → Filhos → Regras → Implementação atual → Pendências / Decisões abertas.

## Criar um módulo novo
1. Crie a pasta dentro do pai (nome em minúsculas, `snake_case`).
2. Copie a estrutura de um `regras.md` vizinho.
3. Coloque o link nos "Filhos" do `regras.md` do pai, no [llms.txt](llms.txt) e no [tree.md](tree.md).
