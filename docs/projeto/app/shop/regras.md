# Shop

> **Caminho:** `app/shop` · **Pai:** [app](../regras.md) · **Status:** 🟡 Parcial

## Propósito
Vitrine pública única e agregador do marketplace que expõe os produtos de todas as lojas da plataforma.

## Filhos
- [loja](loja/regras.md) — Lojas criadas por usuários e agregadas no marketplace

## Regras
1. O Shop **não guarda saldo**. Todo pagamento passa por [economia](../economia/regras.md) e vira lançamento no ledger contábil.
2. Cada produto é precificado em uma moeda oficial: `Coins`, `Cash` ou `Chips` (`currencyType`).
3. **Royalties UGC:** o criador/dono da loja recebe `100% - shopSalePlatformFeePercent` (padrão 70% para o criador / 30% retido pela plataforma).
4. **Taxas fixas:** publicar item custa `shopCreationFixedFeeCoins` (padrão 5 Coins). Enviar textura custa `shopTextureUploadFixedFeeCoins` (padrão 1 Coin).
5. **Estoque:** `stock = -1` é infinito. `stock > 0` decrementa a cada venda unitária.
6. **Não duplicidade:** um avatar não pode comprar mais de uma vez o mesmo item estético.
7. Presentes (`POST /profile/shop/gift`) são liquidados exclusivamente em `Coins`.
8. Todas as taxas e comissões são configuradas centralizadamente em `economy_rules`.

## Implementação atual
- `src/views/profile/partials/view-shop.ejs`, `public/js/profile/shop.js`
- `src/services/shop3d.service.js`, `src/controllers/game/shop/shop_controller.js`
- `src/models/game/ShopContainer.js`

## Pendências
- Modularizar agregação multiloja em rolagem contínua com virtualização de nós.
