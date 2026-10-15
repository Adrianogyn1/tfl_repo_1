---
name: seo
description: Especialista em Search Engine Optimization (SEO), Identidade Visual e Crescimento Orgânico do The Fantasy Life (TFL). Focado em rastreamento orgânico por buscadores (Google, Bing), Core Web Vitals, metatags canônicas, OpenGraph, Twitter Cards, Schema.org JSON-LD, sitemap dinâmico, robots.txt, padronização de títulos e governança da identidade visual e paleta de cores oficial.
---

# TFL SEO & Visual Identity — Organic Growth & Brand Governance

Este documento define as diretrizes, padrões técnicos e boas práticas de **Search Engine Optimization (SEO)**, **Crescimento Orgânico** e **Identidade Visual** para a plataforma **The Fantasy Life (TFL)**.

---

## 1. Princípios de Crescimento 100% Orgânico (Sem Tráfego Pago)

> [!IMPORTANT]
> O The Fantasy Life não utiliza campanhas de tráfego pago (Ads) nesta fase. Todo o tráfego deve ser conquistado de forma **orgânica e sustentável** através de excelência em indexação, velocidade de carregamento (Core Web Vitals), compartilhamento social envolvente e conteúdo relevante.

### 1.1 Metas de Descoberta Orgânica
- **Indexação Impecável:** Todas as páginas públicas (`/`, `/tutorial`, `/changelog`, `/contato`, `/reportar-bug`, `/sugestoes`) devem ser rastreáveis e indexáveis com tags canônicas explícitas.
- **Títulos Claros e Atrativos:** Nunca utilize títulos genéricos ou técnicos como "Home", "Painel TFL" ou "index". O nome oficial é sempre **The Fantasy Life**, acompanhado da proposta de valor da página.
- **Taxa de Cliques (CTR) em Compartilhamentos:** Implantação impecável de tags Open Graph e Twitter Cards para que links compartilhados no WhatsApp, Discord, X/Twitter, Telegram e Facebook gerem previews ricos e convidativos.

---

## 2. Identidade Visual Oficial do The Fantasy Life

### 2.1 Nome e Promessa da Marca
- **Nome Oficial:** The Fantasy Life
- **Abreviação:** TFL (uso secundário/interno)
- **Slogans Oficiais:**
  - *"O Teu Lugar é Aqui"*
  - *"Onde a Tua Imaginação Ganha Forma Digital"*

### 2.2 Paleta de Cores Oficial (Design Token System)
| Token | Cor Hex | Tailwind | Aplicação / Significado |
|---|---|---|---|
| **Cyber Void** | `#050505` | `bg-[#050505]` / `bg-black` | Fundo principal da aplicação (Dark Theme imersivo). |
| **Slate Obsidian** | `#090d16` / `#0f172a` | `bg-slate-900` / `bg-zinc-950` | Cards, superfícies modais e containers com blur. |
| **Electric Blue** | `#3b82f6` | `text-blue-500` / `bg-blue-600` | Cor primária da marca, botões de ação e destaques principais. |
| **Neon Cyan** | `#06b6d4` | `text-cyan-500` / `bg-cyan-600` | Conexões, links e transições de tecnologia. |
| **Cyber Rose** | `#f43f5e` | `text-rose-500` / `bg-rose-600` | Curtidas, Match/Crush, alertas de bug e destaques quentes. |
| **Golden Amber** | `#f59e0b` | `text-amber-500` / `bg-amber-600` | Selo VIP, moedas, mercado e conquistas de jogadores. |
| **Emerald Mint** | `#10b981` | `text-emerald-500` / `bg-emerald-600` | Status online, confirmações de sucesso e saldo positivo. |
| **Text Primary** | `#ffffff` | `text-white` | Títulos e textos de alto contraste. |
| **Text Muted** | `#a1a1aa` | `text-zinc-400` | Parágrafos explicativos e metadados secundários. |

### 2.3 Tipografia
- **Títulos e Display:** `Outfit` (sans-serif), pesos 700 (Bold) e 900 (Black).
- **Corpo e Dados:** `Inter` (sans-serif), pesos 300 (Light), 400 (Regular) e 600 (Semi-bold).
- **Ícones do Sistema:** `Material Symbols Outlined` (variations: FILL 1, wght 500).

---

## 3. Padrão de Títulos e Metatags Canônicas

### 3.1 Padrão de Títulos de Páginas
Todo título segue a fórmula:
$$\text{The Fantasy Life} \mid \text{Nome da Seção / Proposta de Valor}$$

- **Home:** `The Fantasy Life | Mundo Virtual 3D, Rede Social & Avatares`
- **Perfil do Usuário:** `The Fantasy Life | Universo Virtual, Rede Social & Avatares`
- **Tutorial:** `The Fantasy Life | Guia & Tutorial Oficial`
- **Notas de Versão:** `The Fantasy Life | Notas de Atualização do Sistema`
- **Atendimento e Suporte:** `The Fantasy Life | Central de Atendimento & Feedback`
- **Reportar Bug:** `The Fantasy Life | Reportar um Problema ou Bug`
- **Sugestões:** `The Fantasy Life | Sugestões & Votação da Comunidade`

### 3.2 Metatags Canônicas Obrigatórias
```html
<!-- SEO Primário -->
<meta name="description" content="The Fantasy Life é um mundo virtual 3D e rede social onde você cria seu avatar, explora salas interativas, compartilha reels, fotos e sentimentos, e vive novas experiências digitais.">
<meta name="keywords" content="mundo virtual 3d, jogo de avatar, rede social 3d, the fantasy life, tfl, metaverso brasileiro, criar avatar, salas virtuais, bate-papo virtual">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="canonical" href="<%= canonicalUrl %>">

<!-- Open Graph / Facebook / Discord -->
<meta property="og:locale" content="pt_BR">
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Fantasy Life">
<meta property="og:title" content="<%= title %>">
<meta property="og:description" content="<%= description %>">
<meta property="og:url" content="<%= canonicalUrl %>">
<meta property="og:image" content="<%= ogImageUrl %>">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<%= title %>">
<meta name="twitter:description" content="<%= description %>">
<meta name="twitter:image" content="<%= ogImageUrl %>">
```

---

## 4. Dados Estruturados Schema.org (JSON-LD)

Para que o Google exiba rich snippets e cartões de pesquisa do The Fantasy Life, injetamos JSON-LD no cabeçalho das páginas públicas:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://thefantasylife.com/#website",
      "url": "https://thefantasylife.com/",
      "name": "The Fantasy Life",
      "description": "Mundo Virtual 3D, Rede Social de Avatares e Economia Virtual.",
      "inLanguage": "pt-BR"
    },
    {
      "@type": "SoftwareApplication",
      "name": "The Fantasy Life",
      "applicationCategory": "GameApplication",
      "operatingSystem": "Web, Windows, Linux, Android",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "BRL"
      }
    }
  ]
}
</script>
```

---

## 5. Rastreamento Orgânico: `robots.txt` e `sitemap.xml`

- `robots.txt`:
  - Permite a varredura das rotas públicas (`/`, `/tutorial`, `/contato`, `/reportar-bug`, `/sugestoes`, `/changelog`).
  - Bloqueia `/admin/`, `/api/` internas e rotas financeiras restritas.
  - Aponta para `Sitemap: https://<domain>/sitemap.xml`.
- `sitemap.xml`:
  - Rota dinâmica `GET /sitemap.xml` que entrega todas as rotas públicas indexáveis com datas de atualização e prioridades.
