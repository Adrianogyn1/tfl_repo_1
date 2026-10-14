# Diário

> **Caminho:** `app/user/avatar/diario` · **Pai:** [avatar](../regras.md) · **Status:** ✅ Implementado

## Propósito
Espaço íntimo de desabafo e registro emocional do avatar com estética tátil de caderno real.

## Filhos
- [paginas](paginas/regras.md) — Gestão individual das folhas escritas no diário

## Regras
1. Interface inspirada em caderno físico (linhas pautadas, textura de papel, argolas espirais e caligrafia manuscrita).
2. O avatar pode escolher estilos visuais de papel (creme, pergaminho, rosa, noturno) e tintas de caneta (azul, preta, sépia, violeta).
3. Cada sentimento registrado é afixado como um carimbo de selo postal no canto superior direito da página.

## Implementação atual
- `src/views/profile/partials/view-diary.ejs`, `public/js/profile/diary.js`
- `src/services/diary.service.js`
