# Manual de Identidade Visual & Design System — The Fantasy Life (TFL)

Este guia estabelece as diretrizes canônicas de marca, paleta de cores, tipografia, símbolos e tom de voz do **The Fantasy Life**.

---

## 1. Conceito e Posicionamento da Marca

O **The Fantasy Life** é uma plataforma que une **Mundo Virtual 3D**, **Rede Social de Avatares** e **Economia Virtual**. Seu posicionamento é moderno, imersivo e acolhedor, combinando estética *Cyber/Metaverse* com calor humano e liberdade de expressão.

- **Nome Oficial:** The Fantasy Life
- **Nome Curto:** TFL (utilizado apenas de forma complementar ou em badges reduzidos)
- **Slogans Oficiais:**
  - *"O Teu Lugar é Aqui"*
  - *"Onde a Tua Imaginação Ganha Forma Digital"*
- **Tom de Voz:** Convidativo, autêntico, inclusivo e transparente. Evita termos frios ou jargões de backend em interfaces públicas.

---

## 2. Paleta de Cores Oficial

A paleta de cores foi desenvolvida para um ambiente Dark Theme imersivo, com alto contraste e acessibilidade (WCAG AAA em textos principais):

### 2.1 Cores Base (Ambiente)
- **Cyber Void (`#050505`)**: Cor do plano de fundo principal. Proporciona profundidade infinita e descanso visual em telas OLED.
- **Slate Obsidian (`#090d16` / `#0f172a`)**: Superfície dos cards, modais e containers com efeito `backdrop-blur` e bordas translúcidas `rgba(255, 255, 255, 0.08)`.
- **Card Accent Glass (`rgba(255, 255, 255, 0.03)`)**: Camada de elevação para separadores e estados de foco.

### 2.2 Cores de Ação e Destaque
- **Electric Blue (`#3b82f6` / `#2563eb`)**: Cor primária oficial da marca. Representa ação, identidade e tecnologia. Usada no logo ("Fantasy"), botões principais de CTA, avatares ativos e links de navegação primários.
- **Neon Cyan (`#06b6d4` / `#0891b2`)**: Cor secundária de conectividade. Usada em links externos, estados de exploração e indicadores de salas interativas.
- **Golden Amber (`#f59e0b` / `#d97706`)**: Cor de prestígio e valor. Usada exclusivamente no Selo Oficial `👑 VIP`, saldo em Coins, cotações de mercado e conquistas de jogadores.
- **Cyber Rose (`#f43f5e` / `#e11d48`)**: Cor de paixão e alerta vital. Usada no sistema de Match 💘, reações quentes, tags de Bugs Críticos e botões de cancelamento/exclusão.
- **Emerald Mint (`#10b981` / `#059669`)**: Cor de vida e segurança. Usada no indicador de status `Online`, mensagens de sucesso, recebimentos de Pix e crescimento de comunidade.

### 2.3 Tipografia e Contraste
- **Text White (`#ffffff`)**: Títulos h1/h2, botões de ação e números em destaque.
- **Text Zinc 200 (`#e4e4e7`)**: Textos corridos de leitura e labels de formulários.
- **Text Zinc 400 (`#a1a1aa`)**: Descrições secundárias, placeholders e metadados de data/hora.
- **Text Zinc 600 (`#52525b`)**: Bordas e divisores inativos.

---

## 3. Tipografia

- **Display / Títulos:** `Outfit` (Google Fonts)
  - Pesos: 700 (Bold) e 900 (Black).
  - Uso: Títulos de seções, contadores numéricos, logotipo e botões de destaque.
- **Corpo / UI:** `Inter` (Google Fonts)
  - Pesos: 300 (Light), 400 (Regular), 600 (Semi-bold).
  - Uso: Parágrafos, campos de formulário, mensagens de chat, tabelas e feeds.
- **Ícones Oficiais:** `Material Symbols Outlined` (Google Fonts)
  - Configuração: `font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20`.

---

## 4. Logotipo e Elementos Gráficos

- **Ícone do Logotipo:** `/static/images/Icon_tfl.png`
- **Composição Oficial do Logo:**
  - Ícone à esquerda (dimensões mínimas 32x32px).
  - Texto tipográfico: `The` (Branco) + `Fantasy` (Electric Blue `#3b82f6`) + `Life` (Branco), em fonte `Outfit`, peso Black (900), levemente itálico e tracking reduzido.
- **Favicon:** `/static/images/favicon.ico` (32x32) e `/static/images/Icon_tfl.png` (Apple Touch Icon).
