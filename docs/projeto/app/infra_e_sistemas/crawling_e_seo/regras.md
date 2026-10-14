# Crawling e SEO — Raiz Pública Indexável vs Rotas Privadas Blindadas

> **Caminho:** `app/infra_e_sistemas/crawling_e_seo` · **Pai:** [infra_e_sistemas](../regras.md) · **Status:** ⏳ Planejado

## Regras
1. **Indexáveis:** `/`, `/tutorial` e páginas institucionais (Sobre, Contato).
2. **Bloqueadas** com `noindex`, `X-Robots-Tag` e `Disallow`: `/profile`, `/admin`, `/api`, `/ws`, `/auth`, `/payment` e `/profile/media`.
3. Páginas indexáveis não podem ter detalhes técnicos internos (vale a regra 2 do [app](../../regras.md)).
4. Cada página pública tem `<title>`, `meta description` e `og:*` próprios, por idioma.
5. O `sitemap.xml` lista só as rotas indexáveis.

## Implementação atual
- Não existe `robots.txt`, `sitemap.xml` nem `X-Robots-Tag` no projeto.
