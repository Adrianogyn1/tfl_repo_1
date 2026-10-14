# Visual

> **Caminho:** `app/user/avatar/visual` · **Pai:** [avatar](../regras.md) · **Status:** ✅ Implementado

## Propósito
Contêiner agregador da estética e morfologia 3D do avatar. Engloba tanto as deformações geométricas do corpo e rosto (blendshapes) quanto o vestuário e itens cosméticos acoplados aos slots do esqueleto.

## Filhos
- [blendshapes](blendshapes/regras.md) — Morph targets de personalização corporal e facial
- [slots_roupas](slots_roupas/regras.md) — 10 slots anatômicos de vestimentas, acessórios e animações

## Regras
1. Define a aparência visual final sintetizada do avatar em todos os clientes (Web Babylon.js e Godot Engine 3D).
2. As alterações visuais são persistidas no avatar ativo e refletidas imediatamente no manequim 3D do perfil.

## Implementação atual
- `src/views/profile/partials/view-avatar.ejs`, `public/js/profile/avatar-rooms.js`, `public/js/profile/stage3d-babylon.js`
- `src/services/shop3d.service.js`
