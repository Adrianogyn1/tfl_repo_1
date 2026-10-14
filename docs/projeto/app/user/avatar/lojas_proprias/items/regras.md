# Items da Loja do Avatar

> **Caminho:** `app/user/avatar/lojas_proprias/items` · **Pai:** [lojas_proprias](../regras.md) · **Status:** 🟡 Parcial

## Propósito
Gerenciamento de produtos fabricados ou revendidos pelo avatar em suas lojas próprias.

## Filhos
- [roupas](roupas/regras.md) — Roupas e cosméticos criados pelo avatar
- [animais](animais/regras.md) — Pets e animais criados para venda
- [veiculos](veiculos/regras.md) — Veículos disponibilizados na loja
- [decoracao](decoracao/regras.md) — Móveis e itens decorativos produzidos

## Regras
1. O avatar só pode gerenciar os itens onde consta como criador (`avatarId` correspondente).
2. Itens pausados deixam de ser listados na vitrine pública do Shop.
3. Edição de valores ou texturas respeita os limites e parâmetros de validação da plataforma.
