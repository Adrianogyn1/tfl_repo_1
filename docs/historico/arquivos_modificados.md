# Registro Cronológico de Arquivos Criados e Modificados

Este arquivo armazena exclusivamente a lista de arquivos modificados ou criados por tarefa/log, desacoplando essa listagem da memória ativa para economizar tokens e acelerar a tomada de decisão dos agentes.

### [LOG #59 - 2026-10-15] Diretriz Anti-Rollback Mandatória e Correção de Redirecionamento Pós-Login do Admin (admin/admin)
- **Criados / Modificados:**
  * `.agent/rules/project-memory.md`
  * `src/views/admin/login.html`
  * `src/controllers/auth.js`
  * `src/controllers/admin/index.js`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #58 - 2026-10-15] Estabilização do Pool Supabase (Session Mode 5432, Graceful Shutdown no Nodemon e Alívio de Reap Idle)
- **Criados / Modificados:**
  * `.env`
  * `index.js`
  * `src/services/coinMarket.service.js`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #57 - 2026-10-15] Padronização Global de Rotas em Inglês (Internacionalização Universal do Sistema)
- **Criados / Modificados:**
  * `src/routes/router.js`
  * `src/views/partials/footer.ejs`
  * `src/views/feedback/index.ejs`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #56 - 2026-10-15] Correção Crítica de Bloqueio no Pool PostgreSQL (ECHECKOUTTIMEOUT no Supabase / PgBouncer)
- **Criados / Modificados:**
  * `src/repositories/repository.js`
  * `src/models/index.js`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #55 - 2026-10-15] Filtro Temporal Dinâmico de Visitantes Ativos no Painel Admin (5m a 72h)
- **Criados / Modificados:**
  * `src/services/stats.service.js`
  * `src/views/admin/index.html`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #54 - 2026-10-14] Validação Integral de Tradução em Duas Linguagens (pt-BR e en-US) e Rota Universal de Idioma
- **Criados / Modificados:**
  * `src/locales/en-US.json`
  * `src/routes/router.js`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #53 - 2026-10-14] Identidade Visual Canônica, SEO Orgânico, Meta Tags, Robots.txt, Sitemap.xml e Nova Skill (.agent/skills/seo/SKILL.md)
- **Criados / Modificados:**
  * `.agent/skills/seo/SKILL.md`
  * `docs/brand/visual_identity.md`
  * `src/views/partials/seo-head.ejs`
  * `src/views/partials/header.ejs`
  * `src/views/home.ejs`
  * `src/views/profile/index.ejs`
  * `src/controllers/profile/profile_controller.js`
  * `src/routes/router.js`
  * `src/locales/pt-BR.json`
  * `docs/locales/i18n_keys_cache.md`
  * `src/locales/KEYS_CACHE.md`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #52 - 2026-10-14] Padronização Canônica de i18n (-endpoint / --key) e Criação do Cache de Memória
- **Criados / Modificados:**
  * `docs/locales/i18n_keys_cache.md`
  * `src/locales/KEYS_CACHE.md`
  * `src/locales/pt-BR.json`
  * `.agent/rules/project-memory.md`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #51 - 2026-10-14] Bug Report com Print Opcional e Painel de Votação da Comunidade para Sugestões & Ideias
- **Criados / Modificados:**
  * `src/models/feedback/FeedbackModels.js`
  * `src/models/index.js`
  * `src/services/feedback.service.js`
  * `src/routes/api.routers.js`
  * `src/locales/pt-BR.json`
  * `src/views/feedback/index.ejs`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #50 - 2026-10-14] Aplicação Estrita do Sistema de Tradução (i18n) e Valor Default em Todo o Projeto
- **Criados / Modificados:**
  * `.agent/rules/project-memory.md`
  * `PROJECT_MEMORY_LOG.txt`
  * `src/locales/pt-BR.json`
  * `src/views/feedback/index.ejs`
  * `src/views/changelog.ejs`
  * `src/views/partials/footer.ejs`
  * `src/views/home.ejs`
  * `src/routes/api.routers.js`
  * `src/routes/router.js`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #49 - 2026-10-14] Central de Contato, Reportar Bugs e Sugestões com Banco de Dados e Página Dedicada de Versões
- **Criados / Modificados:**
  * `src/models/feedback/FeedbackModels.js`
  * `src/models/index.js`
  * `src/services/feedback.service.js`
  * `src/routes/api.routers.js`
  * `src/routes/router.js`
  * `src/views/feedback/index.ejs`
  * `src/views/changelog.ejs`
  * `src/views/home.ejs`
  * `src/views/partials/footer.ejs`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #48 - 2026-10-14] Abertura Automática Sob Demanda e Monitor de Encerramento por Ociosidade de Servidores de Salas
- **Criados / Modificados:**
  * `src/services/coinMarket.service.js`
  * `src/controllers/profile/profile_controller.js`
  * `public/js/profile/friends-chat.js`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #47 - 2026-10-14] Correção da Rota de Impulsionamento de Salas (/profile/room/:id/boost)
- **Criados / Modificados:**
  * `src/controllers/profile/profile_controller.js`
  * `src/services/coinMarket.service.js`
  * `src/models/game/RoomModel.js`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #46 - 2026-10-14] Correção de Rota Dual (/profile/ads/my) e Resiliência de Schema no Módulo Ads
- **Criados / Modificados:**
  * `src/controllers/profile/profile_controller.js`
  * `src/services/miniAds.service.js`
  * `src/models/game/MiniAdCampaign.js`
  * `src/views/profile/index.ejs`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #45 - 2026-10-14] Reformulação do Módulo Ads a Nível de Usuário e Auto-Complete de Nós da Conta
- **Criados / Modificados:**
  * `src/views/profile/partials/view-ads.ejs`
  * `public/js/profile/ads.js`
  * `src/views/profile/partials/sidebar.ejs`
  * `src/views/profile/index.ejs`
  * `src/services/miniAds.service.js`
  * `src/controllers/profile/profile_controller.js`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #44 - 2026-10-14] Correção Estrutural da Sidebar (/profile) e Sincronização de Sub-rotas
- **Criados / Modificados:**
  * `src/views/profile/partials/sidebar.ejs`
  * `public/js/profile/core.js`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #43 - 2026-10-14] Erradicação de Jargões Técnicos e Versionamento Contínuo com 5 Casas Decimais (0.00042)
- **Criados / Modificados:**
  * `src/config/changelog.user.json`
  * `src/config/changelog.admin.json`
  * `src/services/version.service.js`
  * `src/routes/api.routers.js`
  * `src/routes/router.js`
  * `src/controllers/admin/index.js`
  * `src/controllers/home/home_controller.js`
  * `src/views/home.ejs`
  * `src/views/partials/footer.ejs`
  * `public/js/profile/social.js`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #41 - 2026-10-14] Caderno Íntimo no Diário, Lobby de Cassino Stake/Betano, Sincronização de PIN e Normalização VIP
- **Criados / Modificados:**
  * `src/views/profile/partials/view-diary.ejs`
  * `public/js/profile/diary.js`
  * `src/views/profile/partials/view-cassino.ejs`
  * `src/services/coinMarket.service.js`
  * `public/js/profile/market.js`
  * `public/js/profile/social.js`
  * `src/controllers/profile/profile_controller.js`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #40 - 2026-10-14] Erradicação Total de IDs de Avatares em UIs e Correção de Sintaxe
- **Criados / Modificados:**
  * `src/views/profile/partials/view-social.ejs`
  * `src/controllers/profile/profile_controller.js`
  * `src/views/profile/partials/view-friends.ejs`
  * `src/views/profile/partials/modals.ejs`
  * `src/views/profile/partials/view-market.ejs`
  * `src/views/profile/partials/view-avatar.ejs`
  * `public/js/profile/friends-chat.js`
  * `public/js/profile/social.js`
  * `public/js/profile/core.js`
  * `public/js/profile/avatar-rooms.js`
  * `public/js/profile/shop.js`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #39 - 2026-10-14] Refatoração de Privacidade, Presença em Tempo Real, Diário Acolhedor e Jogo Responsável
- **Criados / Modificados:**
  * `src/models/game/AvatarModel.js`
  * `src/controllers/profile/profile_controller.js`
  * `src/services/diary.service.js`
  * `src/views/profile/partials/view-diary.ejs`
  * `public/js/profile/diary.js`
  * `src/views/profile/partials/view-cassino.ejs`
  * `src/views/profile/partials/view-market.ejs`
  * `public/js/profile/market.js`
  * `src/views/profile/partials/view-shop.ejs`
  * `public/js/profile/shop.js`
  * `src/views/profile/partials/view-salas.ejs`
  * `src/views/profile/partials/sidebar.ejs`
  * `src/views/profile/partials/modals.ejs`
  * `src/views/profile/partials/view-user-profile.ejs`
  * `src/views/profile/partials/view-friends.ejs`
  * `public/downloads/windows/versions/README.md`
  * `public/downloads/linux/versions/README.md`
  * `public/downloads/android/versions/README.md`
  * `public/downloads/ios/versions/README.md`
  * `public/downloads/ios/latest/version.json`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #38 - 2026-10-14] Implementação Integral dos 5 Pilares Arquiteturais do Ecossistema TFL
- **Criados / Modificados:**
  * `src/models/social/User.js`
  * `src/models/game/GameSessionContract.js`
  * `src/models/game/index.js`
  * `src/middlewares/resolveAvatar.js`
  * `src/services/download.service.js`
  * `src/controllers/home/home_controller.js`
  * `src/controllers/admin/index.js`
  * `src/views/admin/index.html`
  * `src/controllers/game/avatar/avatar_controller.js`
  * `src/services/coinMarket.service.js`
  * `src/controllers/profile/profile_controller.js`
  * `src/views/profile/partials/modals.ejs`
  * `src/views/profile/partials/view-market.ejs`
  * `public/js/profile/market.js`
  * `src/views/profile/partials/view-vip.ejs`
  * `src/views/profile/partials/view-avatar.ejs`
  * `src/views/home.ejs`
  * `src/api/v1/game/room.routers.js`
  * `public/downloads/windows/latest/version.json`
  * `public/downloads/linux/latest/version.json`
  * `public/downloads/android/latest/version.json`
  * `PROJECT_MEMORY_LOG.txt`
  * `docs/historico/arquivos_modificados.md`

---

### [LOG #37 - 2026-10-14] Reestruturação Modular da Árvore (6 Pilares) e Design Ético Anti-Vício
- **Criados / Modificados:**
  * `docs/projeto/tree.md`
  * `docs/projeto/ESPECIFICACAO_COMPLETA_ECOSSISTEMA_TFL.txt`
  * `PROJECT_MEMORY_LOG.txt`

---

### [LOG #36 - 2026-10-14] Especificação Canônica do Ecossistema TFL e Homologação das IAs
- **Criados / Modificados:**
  * `docs/projeto/ESPECIFICACAO_COMPLETA_ECOSSISTEMA_TFL.txt`
  * `PROJECT_MEMORY_LOG.txt`

---

### [LOG #35 - 2026-10-14] Desacoplamento Arquitetural da Memória do Projeto para Economia de Tokens
- **Criados / Modificados:**
  * `docs/historico/logs/2026-10-12.md`
  * `docs/historico/logs/2026-10-13.md`
  * `docs/historico/logs/2026-10-14.md`
  * `docs/historico/arquivos_modificados.md`
  * `docs/historico/readme.md`
  * `.agent/rules/project-memory.md`
  * `PROJECT_MEMORY_LOG.txt`

---

### [LOG #34 - 2026-10-14] Revisão Integral e Reestruturação Mobile-First das UIs
- **Criados / Modificados:**
  * `src/views/profile/partials/view-vip.ejs`
  * `src/views/profile/partials/view-avatar.ejs`
  * `src/views/profile/partials/modals.ejs`
  * `src/views/profile/partials/sidebar.ejs`
  * `src/views/profile/partials/view-chat.ejs`
  * `src/views/profile/partials/view-user-profile.ejs`
  * `src/views/profile/partials/view-salas.ejs`
  * `src/views/profile/index.ejs`
  * `src/views/home.ejs`
  * `public/js/profile/core.js`
  * `PROJECT_MEMORY_LOG.txt`

---

### [LOG #33 - 2026-10-14] Especialização da Skill de Backend
- **Criados / Modificados:**
  * `.agent/skills/backend/SKILL.md`
  * `PROJECT_MEMORY_LOG.txt`

---

### [LOG #32 - 2026-10-14] Criação da Skill Oficial de Engenharia Backend
- **Criados / Modificados:**
  * `.agent/skills/backend/SKILL.md`
  * `PROJECT_MEMORY_LOG.txt`

---

### [LOG #31 - 2026-10-14] Atualização Integral da Árvore de Módulos (tree.md)
- **Modificados:**
  * `docs/projeto/tree.md`
  * `PROJECT_MEMORY_LOG.txt`

---

### [LOG #30 - 2026-10-14] Classificação Arquitetural da Árvore
- **Modificados:**
  * `docs/projeto/tree.md`
  * `PROJECT_MEMORY_LOG.txt`

---

### [LOG #29 - 2026-10-14] Refatoração Estrutural: Contêiner Visual e Layout
- **Criados / Modificados:**
  * `docs/projeto/tree.md`
  * `docs/projeto/llms.txt`
  * `docs/projeto/app/user/avatar/regras.md`
  * `docs/projeto/app/user/avatar/visual/regras.md`
  * `docs/projeto/app/user/avatar/visual/blendshapes/regras.md`
  * `docs/projeto/app/user/avatar/visual/slots_roupas/**/regras.md`
  * `docs/projeto/app/user/avatar/salas/regras.md`
  * `docs/projeto/app/user/avatar/salas/layout/regras.md`
  * `docs/projeto/app/user/avatar/salas/layout/items/regras.md`
  * `docs/projeto/app/shop/loja/catalogo/item/roupas/regras.md`
  * `docs/projeto/app/shop/loja/catalogo/item/decoracao/regras.md`
  * `PROJECT_MEMORY_LOG.txt`

---

### [LOG #28 - 2026-10-13] Auditoria da Árvore vs Código Real
- **Modificados:**
  * `docs/projeto/tree.md`
  * `PROJECT_MEMORY_LOG.txt`

---

### [LOG #27 - 2026-10-13] Criação e Sincronização dos 55 Ramos
- **Criados / Modificados:**
  * `docs/projeto/app/user/avatar/regras.md`
  * `docs/projeto/app/user/avatar/slots_roupas/**/regras.md` (11 arquivos)
  * `docs/projeto/app/user/avatar/lojas_proprias/**/regras.md` (6 arquivos)
  * `docs/projeto/app/user/avatar/carteira/**/regras.md` (2 arquivos)
  * `docs/projeto/app/user/avatar/diario/**/regras.md` (2 arquivos)
  * `docs/projeto/app/user/avatar/conquistas/regras.md`
  * `docs/projeto/app/user/avatar/salas/**/regras.md` (4 arquivos)
  * `docs/projeto/app/user/avatar/blog/**/regras.md` (8 arquivos)
  * `docs/projeto/llms.txt`
  * `PROJECT_MEMORY_LOG.txt`

### [LOG #43 - 2026-10-14] Erradicação de Jargões Técnicos e Versionamento Contínuo com 5 Casas Decimais (0.00042)
- **Criados / Modificados:**
  * `src/config/changelog.user.json`
  * `src/config/changelog.admin.json`
  * `src/services/version.service.js`
  * `src/controllers/home/home_controller.js`
  * `src/controllers/admin/index.js`
  * `src/routes/api.routers.js`
  * `src/routes/router.js`
  * `src/controllers/profile/profile_controller.js`
  * `src/views/home.ejs`
  * `src/views/partials/footer.ejs`
  * `public/js/profile/social.js`
  * `PROJECT_MEMORY_LOG.txt`

---

### [LOG #42 - 2026-10-14] Mini Ads, Influenciadores (50% Rev-Share), Guias da Comunidade, Chat de Proximidade (Local) e Sub-Rotas por Ramo
- **Criados / Modificados:**
  * `src/models/game/MiniAdCampaign.js`
  * `src/models/game/MiniAdImpression.js`
  * `src/models/game/AvatarModel.js`
  * `src/models/game/EconomyRuleModel.js`
  * `src/models/game/index.js`
  * `src/models/game/associations.js`
  * `src/services/miniAds.service.js`
  * `src/services/coinMarket.service.js`
  * `src/controllers/social/chat_controller.js`
  * `src/controllers/profile/profile_controller.js`
  * `src/views/profile/partials/view-ads.ejs`
  * `src/views/profile/partials/view-chat.ejs`
  * `src/views/profile/partials/sidebar.ejs`
  * `src/views/profile/index.ejs`
  * `public/js/profile/ads.js`
  * `public/js/profile/friends-chat.js`
  * `public/js/profile/core.js`
  * `PROJECT_MEMORY_LOG.txt`

---

### [LOG #34 - 2026-10-14] Revisão Integral e Reestruturação Mobile-First de Todas as UIs do Projeto
- **Criados / Modificados:**
  * `src/views/profile/partials/view-vip.ejs`
  * `src/views/profile/partials/view-avatar.ejs`
  * `src/views/profile/partials/modals.ejs`
  * `src/views/profile/partials/sidebar.ejs`
  * `src/views/profile/partials/view-chat.ejs`
  * `src/views/profile/partials/view-user-profile.ejs`
  * `src/views/profile/partials/view-salas.ejs`
  * `src/views/profile/index.ejs`
  * `src/views/home.ejs`
  * `public/js/profile/core.js`
  * `PROJECT_MEMORY_LOG.txt`

---

### [LOG #33 - 2026-10-14] Especialização da Skill de Backend
- **Modificados:**
  * `.agent/skills/backend/SKILL.md`
  * `PROJECT_MEMORY_LOG.txt`

---

### [LOG #32 - 2026-10-14] Criação da Skill Oficial de Engenharia Backend
- **Criados / Modificados:**
  * `.agent/skills/backend/SKILL.md`
  * `PROJECT_MEMORY_LOG.txt`

---

### [LOG #31 - 2026-10-14] Atualização Integral da Árvore de Módulos (tree.md)
- **Modificados:**
  * `docs/projeto/tree.md`
  * `docs/projeto/llms.txt`
  * `PROJECT_MEMORY_LOG.txt`

---

### [LOG #30 - 2026-10-14] Classificação Arquitetural da Árvore
- **Modificados:**
  * `docs/projeto/tree.md`
  * `PROJECT_MEMORY_LOG.txt`

---

### [LOG #29 - 2026-10-14] Refatoração Estrutural de Ramos: Visual e Layout
- **Criados / Modificados:**
  * `docs/projeto/app/user/avatar/visual/regras.md`
  * `docs/projeto/app/user/avatar/visual/blendshapes/regras.md`
  * `docs/projeto/app/user/avatar/salas/layout/regras.md`
  * `docs/projeto/tree.md`
  * `docs/projeto/llms.txt`
  * `PROJECT_MEMORY_LOG.txt`

---

### [LOG #04 a #26 - 2026-10-12 a 2026-10-13]
- Consultar os arquivos individuais em `docs/historico/logs/YYYY-MM-DD.md` para arquivos de tarefas legadas.

