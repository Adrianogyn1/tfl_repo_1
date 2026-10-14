# Conquistas

> **Caminho:** `app/user/avatar/conquistas` · **Pai:** [avatar](../regras.md) · **Status:** ✅ Implementado

## Propósito
Progressão do avatar através de trilhas de carreira, níveis de experiência e selos honorários equipáveis.

## Regras
1. **Trilhas Oficiais (`avatar_careers`):**
   - 🧭 Explorador Dimensional (visitas e tempo em salas 3D)
   - ✒️ Escriba do Diário (páginas escritas e minutos de leitura gerados)
   - 💎 Magnata P2P (liquidez e transferências na bolsa)
   - 💖 Estrela Social (seguidores, reações recebidas e match)
   - 🏠 Grande Anfitrião (criação de salas e passes vendidos)
2. **Exclusividade de Selo Ativo:** Apenas 1 selo de conquista pode estar equipado por vez (`isEquipped = true`).
3. Avatares da mesma conta não geram pontos de XP entre si (anti-farm).

## Implementação atual
- `src/models/game/AvatarCareerModel.js`, `src/services/avatarCareer.service.js`
- Endpoints: `GET /api/v1/avatars/me/careers`, `POST /api/v1/avatars/me/careers/equip`
