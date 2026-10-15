# Legenda de Arquitetura:
# [M] - Model     : Entidade persistida com tabela própria no banco (PK, FKs, colunas)
# [C] - Container : Agrupador lógico, módulo de contexto ou contêiner de pastas
# [S] - Slot/Enum : Propriedade fixa, valor de enumeração ou slot anatômico

# Legenda de Status:
# [ok]    - De acordo (totalmente implementado e aderente ao código do WebSite)
# [warn]  - Requer atenção (parcialmente implementado, pendência de modelagem ou divergência de regra)
# [error] - Não está de acordo (não implementado ou ausente no banco/backend)

App [C] [ok]
├── Infra_e_Sistemas [C] [ok]
│   ├── servidores [M] [ok]
│   ├── telemetria_global [C] [ok]
│   └── crawling_e_seo [C] [warn]
│
├── Economia [C] [ok]
│   ├── moedas [M] [ok]
│   ├── regras_fiscais_admin [M] [ok]
│   ├── ledger_auditoria [M] [ok]
│   └── bolsa_p2p [M] [ok]
│
├── Admin [C] [ok]
│   ├── dashboard_telemetria [M] [ok]
│   ├── saude_financeira [M] [ok]
│   ├── gateway_asaas [M] [ok]
│   └── simulador_bots [C] [ok]
│
└── User [M] [ok]
    ├── seguranca_pin [M] [ok]
    ├── carteira_fiduciaria [M] [ok]
    │   ├── saldo_cash [M] [ok]
    │   └── pix_transacoes [M] [ok]
    │
    └── avatar [M] [ok]
        ├── 1. visual [C] [ok]
        │   ├── blendshapes [S] [ok]
        │   ├── slots_roupas [C] [ok]
        │   │   ├── hair [S] [ok]
        │   │   ├── head [S] [ok]
        │   │   ├── eyes [S] [ok]
        │   │   ├── top [S] [ok]
        │   │   ├── bottom [S] [ok]
        │   │   ├── fullbody [S] [ok]
        │   │   ├── shoes [S] [ok]
        │   │   ├── accessory [S] [ok]
        │   │   ├── skin [S] [ok]
        │   │   └── animation [S] [ok]
        │   ├── presets_looks [M] [ok]
        │   └── palco_3d [C] [ok]
        │
        ├── 2. salas [C] [ok]
        │   ├── layout [C] [ok]
        │   │   └── items [M] [ok]
        │   ├── configuracao [C] [ok]
        │   ├── ranking_visitas [M] [ok]
        │   └── boost_24h [M] [ok]
        │
        ├── 3. vinculos [C] [ok]
        │   ├── amigos [C] [ok]
        │   │   ├── lista_amigos [M] [ok]
        │   │   └── pedidos_pendentes [M] [ok]
        │   ├── match_silencioso [M] [ok]
        │   └── chats [C] [ok]
        │       ├── dms [M] [ok]
        │       └── canais_grupo [M] [ok]
        │
        ├── 4. carreiras [C] [ok]
        │   ├── progresso_xp [M] [ok]
        │   └── insignias_titulos [M] [ok]
        │
        ├── 5. comercio [C] [ok]
        │   ├── lojas_proprias [C] [ok]
        │   │   └── items_ugc [M] [ok]
        │   ├── catalogo_oficial [M] [ok]
        │   ├── inventario [M] [ok]
        │   └── saldo_coins [M] [ok]
        │
        └── 6. lazer [C] [ok]
            ├── diario [C] [ok]
            │   ├── desabafos [M] [ok]
            │   └── historico_humor [M] [ok]
            ├── sentimentos_6h [M] [ok]
            ├── mini_reels_24h [M] [ok]
            └── cassino_recreativo [C] [ok]
                ├── contrato_sessao [M] [ok]
                ├── limite_conversao_80 [M] [ok]
                ├── slots_tiger [C] [ok]
                ├── roleta [C] [ok]
                └── dados_bacboo [C] [ok]