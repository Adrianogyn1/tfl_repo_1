# App

> **Caminho:** `app` · **Pai:** — (raiz) · **Status:** ✅ Implementado

## Propósito
Raiz de toda a aplicação The Fantasy Life (TFL). As regras deste arquivo valem para **todos** os módulos filhos.

## Filhos
- [Shop](shop/regras.md) — Vitrine geral e agregador do marketplace
- [Infra_e_Sistemas](infra_e_sistemas/regras.md) — Orquestrador, presença, portas, SEO e cache
- [Economia](economia/regras.md) — Regras monetárias e auditoria
- [User](user/regras.md) — Conta civil, autenticação e credenciais

## Regras globais (NUNCA violar)
1. **Herança:** toda regra de uma pasta vale para suas subpastas. Um filho pode especializar, mas nunca contradizer o pai.
2. **Isolamento público vs interno:** nunca mencionar a engine do jogo, a API interna ou detalhes técnicos em páginas do jogador (`/`, `/profile`, `/tutorial`). `/api/v1/*` e `/ws/*` são de uso interno.
3. **Rodapé único:** o link do `/tutorial` e o seletor de idioma (`#langSelect`) ficam apenas no `src/views/partials/footer.ejs`.
4. **Admin isolado:** telemetria, visitas por região, taxas, aprovação de Pix, despesas e bots ficam somente em `/admin` (`requireAdminAuth`).
5. **Sem `alert()`:** usar sempre `window.showToast(msg, type)` (`public/js/toast.js`).
6. **UI orientada a ícones:** textos curtos, ícones com `title`.
7. **i18n:** `pt-BR` é o idioma principal e o fallback. Textos novos entram primeiro em `src/locales/pt-BR.json`.
8. **Paginação padrão:** 20 itens por página em qualquer listagem.
9. **PostgreSQL:** índices e `unique` compostos ficam apenas em `options.indexes` do Sequelize (evita o bug `SET DEFAULT ... UNIQUE`).
10. **Disk I/O:** consultas frequentes usam cache em memória com TTL. Nada de gravar em disco a cada heartbeat.
11. **Memória contínua:** toda mudança exige uma entrada nova em `PROJECT_MEMORY_LOG.txt` e a atualização do `regras.md` do módulo afetado.

## Implementação atual
- `app.js`, `server.js`, `src/routes/router.js`
- `src/locales/` (`i18n.js`, `pt-BR.json`, `en-US.json`, `es-ES.json`)
- `public/js/toast.js`
