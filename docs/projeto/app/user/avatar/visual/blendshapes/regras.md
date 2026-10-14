# Blendshapes (Morph Targets)

> **Caminho:** `app/user/avatar/visual/blendshapes` · **Pai:** [visual](../regras.md) · **Status:** 🟡 Parcial

## Propósito
Parâmetros de morph targets e deformações anatômicas (rosto e corpo) para personalização do formato do avatar.

## Regras
1. Permite o ajuste contínuo (valores normalizados de `0.0` a `1.0` ou `-1.0` a `1.0`) de traços anatômicos:
   - Formato dos olhos, nariz, boca, queixo e mandíbula.
   - Proporções corporais: altura, massa muscular, largura dos ombros e quadril.
2. Os valores são serializados e transmitidos ao cliente Godot/Babylon para deformação em tempo real sobre a malha base do avatar.
3. Roupas e peças de vestuário devem se conformar adequadamente aos morphs da pele sem gerar clipping (interpenetração de malhas).

## Implementação atual
- Menus C# de personalização na Godot Engine (`PersonalizarPage.cs`).
- Suporte parcial no WebSite via shaders e materiais em `stage3d-babylon.js`.
