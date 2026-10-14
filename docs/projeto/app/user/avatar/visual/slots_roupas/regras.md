# Slots de Roupas

> **Caminho:** `app/user/avatar/visual/slots_roupas` · **Pai:** [visual](../regras.md) · **Status:** ✅ Implementado

## Propósito
Gerencia as peças vestidas e equipadas no esqueleto 3D do avatar ativo. Cada slot acomoda estritamente 1 item compatível por vez.

## Filhos
- [hair](hair/regras.md) — Cabelos e penteados
- [head](head/regras.md) — Chapéus, bonés e adereços de cabeça
- [eyes](eyes/regras.md) — Óculos, lentes e máscaras faciais
- [top](top/regras.md) — Parte superior (camisas, blusas, jaquetas)
- [bottom](bottom/regras.md) — Parte inferior (calças, shorts, saias)
- [fullbody](fullbody/regras.md) — Trajes inteiros (vestidos, macacões)
- [shoes](shoes/regras.md) — Calçados (tênis, botas, sandálias)
- [accessory](accessory/regras.md) — Acessórios corporais (mochilas, asas, relógios)
- [skin](skin/regras.md) — Textura base e tom de pele
- [animation](animation/regras.md) — Poses estáticas e animações de locomoção

## Regras
1. **Exclusividade por slot:** Apenas 1 peça pode estar equipada em cada slot simultaneamente (`avatar_outfits`).
2. **Conflito Fullbody vs Top/Bottom:** Ao equipar `fullbody`, o sistema desequipa automaticamente `top` e `bottom`. Ao equipar `top` ou `bottom`, desequipa automaticamente `fullbody`.
3. **Origem:** O avatar só pode equipar itens presentes em seu inventário (`avatar_inventories`) e compatíveis com seu gênero (`gender`).
4. **Cores customizadas:** Cada peça suporta `customColors` (`{ primary, secondary }`).
5. **Presets de Looks:** O avatar pode salvar até 10 combinações de looks completos em `avatar_outfit_styles`.

## Implementação atual
- `src/models/game/inventory.js`, `src/models/game/AvatarOutfit.js`, `src/models/game/AvatarOutfitStyle.js`
- `src/services/shop3d.service.js`
