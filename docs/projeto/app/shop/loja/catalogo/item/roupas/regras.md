# Roupas

> **Caminho:** `app/shop/loja/catalogo/item/roupas` · **Pai:** [item](../regras.md) · **Status:** ✅ Implementado

## Propósito
Itens de vestuário, penteados, calçados e acessórios para customização anatômica de avatares.

## Regras (`SHOP_3D_RULES`)
1. **Slots Padronizados (10):** `hair`, `head`, `eyes`, `top`, `bottom`, `fullbody`, `shoes`, `accessory`, `skin` e `animation`. É proibido cadastrar roupas fora dessa lista estrita.
2. **Gênero:** `Universal` serve para qualquer avatar. `Male` exclusivo para avatares masculinos (`gender: 1`) e `Female` para femininos (`gender: 0`).
3. **Prefabs:** Convenção de nomenclatura de mesh `HM_*` (masculino) e `HF_*` (feminino).
4. **Cores:** Suporte a cores primária e secundária personalizáveis (`defaultColors: { primary, secondary }`).
5. **Shaders UGC:** Parâmetros definidos estritamente conforme schemas: `SkinHeadSchema`, `SkinBodySchema`, `HairSchema` e `PbrSchema`.

## Implementação atual
- `src/services/shop3d.service.js`
- `src/controllers/game/shop/shop_controller.js`
- `src/models/game/ShopContainer.js`

## Ver também
- Uso e inventário equipado: [user/avatar/visual/slots_roupas](../../../../../user/avatar/visual/slots_roupas/regras.md)
