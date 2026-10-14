# Avatar

> **Caminho:** `app/user/avatar` · **Pai:** [user](../regras.md) · **Status:** ✅ Implementado

## Propósito
Persona ativa e identidade visual do jogador no metaverso. Funciona como um escudo absoluto de privacidade sobre a conta civil (`User`).

## Filhos
- [visual](visual/regras.md) — Morfologia (blendshapes) e 10 slots anatômicos de vestuário
- [lojas_proprias](lojas_proprias/regras.md) — Gestão das lojas do avatar e criação de itens
- [veiculos](veiculos/regras.md) — Garagem e veículos possuídos
- [animais](animais/regras.md) — Pets domésticos ativos e no inventário
- [carteira](carteira/regras.md) — Saldos tri-moeda e registros contábeis
- [diario](diario/regras.md) — Caderno físico, páginas e leitura premiada
- [conquistas](conquistas/regras.md) — Trilhas de carreiras e selos equipáveis
- [salas](salas/regras.md) — Ambientes 3D (casas, estúdios, lojas físicas)
- [blog](blog/regras.md) — Feed, amigos, listas sociais e mensageria em tempo real

## Regras
1. O avatar é a **identidade pública**. Nenhum dado da conta (`userId`, e-mail, login) pode vazar em payloads públicos.
2. **Avatar ativo:** `selected = true` na sessão web. Na API v1, identificado via header `x-profile-id` (com fallback para o selecionado).
3. **Gênero:** `0 = Feminino` e `1 = Masculino`. Define a compatibilidade de modelos de vestuário.
4. **Privacidade por seção:** controles granulares (`public`, `friends`, `private`) configurados diretamente no contexto de cada recurso: `privacyPosts`, `privacyPhotos`, `privacyRooms`, `privacyFriends`, `privacyFollowers`.
5. **VIP:** campos `vip`, `isVip`, `vipPlan`, `vipExpiresAt`. Concede o selo `👑 VIP` e privilégios de chat.
6. As fotos de perfil e capa passam estritamente pelo proxy seguro `/profile/media/:id`.

## Implementação atual
- `src/models/game/AvatarModel.js`, `src/views/profile/partials/view-avatar.ejs`, `public/js/profile/core.js`
