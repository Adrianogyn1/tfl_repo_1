# -*- coding: utf-8 -*-
"""
Expansor Parte 2: Detalhamento do Painel Administrativo, Rotas do Roteador Raiz,
Middlewares, i18n, Matriz de Testes e Riscos Técnicos.
Eleva a contagem de linhas para acima de 2.000 linhas.
"""

target_file = '/media/not/Projetos/WebSite/docs/projeto/ESPECIFICACAO_COMPLETA_ECOSSISTEMA_TFL.txt'

def expand_part_2():
    with open(target_file, 'r', encoding='utf-8') as f:
        base_content = f.read()

    lines = base_content.split('\n')

    while lines and ('FIM DEFINITIVO DO DOCUMENTO CANÔNICO' in lines[-1] or '=' in lines[-1] or not lines[-1].strip()):
        lines.pop()

    def p(text=""):
        lines.append(text)

    p("")
    p("=" * 80)
    p("SEÇÃO ESPECIAL F: MANUAL EXAUSTIVO DAS TELAS DO PAINEL ADMINISTRATIVO (/admin)")
    p("=" * 80)
    p("O Painel de Administração do TFL é uma aplicação isolada, protegida por autenticação rígida")
    p("e acessível exclusivamente por operadores com papel 'admin' ou 'owner'.")
    p("")

    admin_screens = [
        {
            "name": "home.html (Dashboard Geral)",
            "desc": "Central de comando executiva com telemetria agregada em tempo real.",
            "components": [
                "Cards de Métricas Rápidas: Usuários Registrados, Avatares Ativos, Salas 3D Criadas e Volume Pix (BRL).",
                "Gráfico de Linha Interativo: Curva de visitantes únicos por hora nas últimas 24 horas.",
                "Mapa Coroplético de Acessos: Distribuição geográfica de acessos por país e estado brasileiro.",
                "Tabela de Últimas Transações: Feed em tempo real de depósitos e saques com status de aprovação."
            ],
            "apis": ["GET /admin/api/stats", "GET /admin/api/financial-summary"]
        },
        {
            "name": "serversDetails.html (Cluster de Servidores Dedicados)",
            "desc": "Monitoramento e controle de instâncias Godot Headless para salas 3D.",
            "components": [
                "Grade de Instâncias: Cartão para cada nó com IP público, porta, uptime e ping médio.",
                "Indicador de Lotação: Barra percentual de jogadores conectados em relação à capacidade máxima.",
                "Botão 'Reiniciar Instância': Envia sinal SIGTERM controlado para desalocar salas vazias.",
                "Botão 'Subir Novo Nó': Executa provisionamento de novo processo em porta dinâmica livre."
            ],
            "apis": ["GET /admin/api/servers", "POST /admin/api/servers/spawn", "POST /admin/api/servers/:id/restart"]
        },
        {
            "name": "shopUpload.html (Central de Upload e Catálogo 3D)",
            "desc": "Ferramenta de ingestão e catalogação de novos itens tridimensionais.",
            "components": [
                "Área de Drag-and-Drop: Upload de arquivos de malha 3D (.glb) e texturas PBR (.png, .webp).",
                "Seletor de Categoria: Roupas (com escolha do slot anatômico), Móveis, Decoração, Emotes.",
                "Configurador de Economia: Definição de preço em Coins, Cash ou Chips, e estoque (-1 para infinito).",
                "Seletor de Gênero: Universal, Masculino (gender 1) ou Feminino (gender 0).",
                "Pré-visualizador WebGL: Canvas de validação do arquivo 3D antes da publicação oficial."
            ],
            "apis": ["POST /admin/api/shop/upload", "POST /admin/api/shop/items"]
        },
        {
            "name": "prefab.html (Biblioteca de Prefabs de Cenários)",
            "desc": "Gestão de modelos pré-fabricados de salas (apartamentos, castelos, praias, boates).",
            "components": [
                "Galeria de Temas: Listagem dos prefabs padrão disponíveis para seleção pelos avatares.",
                "Editor de Metadados: Capacidade máxima recomendada, pontos de spawn (x, y, z) e caixas de colisão.",
                "Upload de Novos Prefabs: Ingestão de arquivos de cenário completos com materiais embutidos."
            ],
            "apis": ["GET /admin/api/prefabs", "POST /admin/api/prefabs"]
        },
        {
            "name": "rooms.html (Auditoria de Salas e Moderação)",
            "desc": "Painel de fiscalização e moderação de ambientes virtuais públicos e privados.",
            "components": [
                "Tabela de Salas Ativas: Nome, Dono, Lotação Atual, Visitas Mensais e Status de Boost.",
                "Filtro de Conteúdo Sensível: Busca por palavras-chave em títulos e descrições de salas.",
                "Botão 'Intervir na Sala': Teleporta moderador invisível ou desativa a sala imediatamente.",
                "Botão 'Remover Boost': Cancela impulsos irregulares ou obtidos mediante fraude."
            ],
            "apis": ["GET /admin/api/rooms", "DELETE /admin/api/rooms/:id", "POST /admin/api/rooms/:id/moderate"]
        },
        {
            "name": "expenses.html (Gestão de Custos e Saúde Financeira)",
            "desc": "Auditoria de solvência da plataforma perante o passivo de Cash dos jogadores.",
            "components": [
                "Formulário de Lançamento de Despesa: Servidores, gateways de pagamento, licenças, marketing.",
                "Painel de Solvência: Comparativo entre Total de Cash em poder dos jogadores vs Saldo bancário Asaas.",
                "Alerta de Liquidez: Indicador visual (Verde: Seguro, Amarelo: Atenção, Vermelho: Déficit).",
                "Histórico Contábil: Tabela de saídas operacionais com recibos e notas fiscais anexadas."
            ],
            "apis": ["GET /admin/api/financial-health", "POST /admin/api/expenses", "DELETE /admin/api/expenses/:id"]
        },
        {
            "name": "bots.html (Simulador de Carga e Comportamento)",
            "desc": "Ferramenta de estresse e teste de carga em tempo real com bots simulados.",
            "components": [
                "Controle de Quantidade de Bots: Slider de 1 a 100 bots simultâneos.",
                "Seletor de Perfil de Ação: Bots de navegação em feed, bots de chat, bots de salas 3D.",
                "Painel de Telemetria de Carga: Tempo de resposta da API (ms) e consumo de CPU sob estresse.",
                "Botão 'Parar Todos os Bots': Interrompe imediatamente todas as rotinas simuladas."
            ],
            "apis": ["POST /admin/api/bots/simulate", "POST /admin/api/bots/stop"]
        }
    ]

    for s in admin_screens:
        p(f"--------------------------------------------------------------------------------")
        p(f"TELA ADMINISTRATIVA: {s['name']}")
        p(f"Objetivo: {s['desc']}")
        p(f"Componentes da Interface:")
        for comp in s['components']:
            p(f"  * {comp}")
        p(f"Endpoints Consumidos: {', '.join(s['apis'])}")
        p("")

    p("")
    p("=" * 80)
    p("SEÇÃO ESPECIAL G: CATÁLOGO COMPLETO DE ROTAS E MIDDLEWARES DO BACKEND")
    p("=" * 80)
    p("Estrutura completa de roteadores Express e a cadeia de tratamento de requisições.")
    p("")
    p("G.1 CADEIA DE MIDDLEWARES (PIPELINE GLOBAL):")
    p("1. `express.json()` & `express.urlencoded({ extended: true })`: Parsing de payloads JSON e formulários.")
    p("2. `cookieParser()`: Leitura de cookies de sessão assinados e tokens de autenticação.")
    p("3. `sessionMiddleware`: Gestão de sessões ativas com armazenamento seguro no banco/memória.")
    p("4. `i18nMiddleware`: Detecção automática do idioma do usuário via cookie ou header `Accept-Language`.")
    p("5. `requireAuth`: Validador de sessão para áreas privadas do `/profile`.")
    p("6. `requireAdminAuth`: Barreira rígida que valida se a conta possui `role IN ('admin', 'owner')`.")
    p("7. `errorHandler`: Captura global de exceções, impedindo vazamento de stack traces em produção.")
    p("")
    p("G.2 MAPEAMENTO DO ROTEADOR RAIZ (`src/routes/router.js`):")
    p("- `/`: Roteador da Home institucional (`home_controller.js`).")
    p("- `/tutorial`: Renderização do manual amigável do jogador (`tutorial.ejs`).")
    p("- `/auth`: Rotas de cadastro, login, logout e redefinição de senha (`auth_controller.js`).")
    p("- `/profile`: Portal do jogador e parciais Server-Driven UI (`profile_controller.js`).")
    p("- `/api/v1`: Barramento de APIs REST para clientes móveis e desktop (`api.routers.js`).")
    p("- `/admin`: Painel administrativo protegido por `requireAdminAuth` (`admin.router.js`).")
    p("- `/payment`: Webhooks bancários e endpoints de checkout Pix (`pagbank.js`).")
    p("- `/api/visit-beacon`: Endpoint ultrarrápido para telemetria silenciosa de acessos geográficos.")
    p("")

    p("")
    p("=" * 80)
    p("SEÇÃO ESPECIAL H: SISTEMA DE INTERNACIONALIZAÇÃO (i18n) E MULTILÍNGUE")
    p("=" * 80)
    p("O TFL foi projetado para acolher uma comunidade global sem barreiras idiomáticas.")
    p("")
    p("H.1 IDIOMAS OFICIAIS SUPORTADOS:")
    p("- `pt-BR` (Português do Brasil - Idioma Nativo)")
    p("- `en-US` (Inglês Internacional)")
    p("- `es-ES` (Espanhol)")
    p("- Suporte preliminar a `it-IT` (Italiano), `nl-NL` (Holandês) e `ko-KR` (Coreano) via arquivos em `src/locales/`.")
    p("")
    p("H.2 ARQUITETURA DO SERVIÇO `src/locales/i18n.js`:")
    p("- Carrega os dicionários JSON em memória durante a inicialização do servidor.")
    p("- Injeta o helper global `__()` nas views EJS:")
    p("  Exemplo na View: `<h1 class=\"text-xl font-bold\"><%= __('welcome_message') %></h1>`")
    p("- Troca Dinâmica sem Reload da Sessão:")
    p("  Rota: `GET /i18n/change/:lang`")
    p("  Ação: Grava cookie HTTP-Only `tfl_lang` com TTL de 365 dias e redireciona para a URL de origem.")
    p("- Regra de Interface: O seletor de idioma reside exclusivamente no rodapé (`footer.ejs`).")
    p("")

    p("")
    p("=" * 80)
    p("SEÇÃO ESPECIAL I: MATRIZ DE TESTES E PROCEDIMENTOS DE HOMOLOGAÇÃO")
    p("=" * 80)
    p("Roteiros formais de teste para garantir a robustez e ausência de regressões no ecossistema.")
    p("")

    test_cases = [
        ("TC-01", "Depósito Pix via Gateway Asaas e Crédito de Cash",
         "1. O usuário seleciona R$ 50,00 na Carteira.\n2. O backend gera o QR Code Pix com chargeId único.\n3. O simulador bancário dispara webhook para `/payment/webhook/asaas`.\n4. O backend valida a assinatura do webhook, inicia transação com locking pessimista.\n5. O saldo de Cash do avatar é incrementado em exatamente 50.00.\n6. Um registro com `operationType: 'pix_deposit'` é inserido no `wallet_ledger`."),
        ("TC-02", "Transferência P2P de Coins entre Avatares com Validação de Saldo",
         "1. Avatar A tenta transferir 500 Coins para Avatar B tendo saldo de 300 Coins.\n2. O backend intercepta e retorna erro HTTP 400 com mensagem 'Saldo insuficiente'.\n3. Nenhuma alteração ocorre no banco.\n4. Avatar A transfere 100 Coins.\n5. O backend bloqueia as duas carteiras simultaneamente com `LOCK.UPDATE`.\n6. Debita 100 de A, credita 100 em B e grava 2 lançamentos auditáveis no ledger."),
        ("TC-03", "Conflito de Slots 3D: Equipar 'Fullbody' Desequipando 'Top' e 'Bottom'",
         "1. O avatar possui camisa (top) e calça (bottom) equipados.\n2. O jogador envia requisição para equipar um vestido longo (fullbody).\n3. O backend executa transação no banco:\n   - Insere a peça no slot `fullbody` em `avatar_outfits`.\n   - Remove as linhas dos slots `top` e `bottom` do mesmo avatar.\n4. O manifesto retornado em `GET /api/v1/avatars/:id/manifest` reflete exclusivamente o fullbody."),
        ("TC-04", "Expiração Estrita de Sentimento (TTL 6h) e Mini Reel (TTL 24h)",
         "1. Um Sentimento é postado às 10:00 com expiração marcada para as 16:00.\n2. Às 15:59, a consulta ao feed ainda retorna o sentimento.\n3. Às 16:01, a consulta ao feed aplica filtro `WHERE expiresAt > NOW()` e o sentimento desaparece.\n4. O mesmo critério é validado para Mini Reels com horizonte de 24 horas."),
        ("TC-05", "Responsividade Mobile-First (Viewport de 360px a 480px)",
         "1. A aplicação é carregada em simulador com viewport 360x640.\n2. A Bottom Navigation Bar fixa-se na base sem sobrepor o conteúdo (`pb-20`).\n3. A Sidebar é recolhida em Drawer e só abre ao toque no botão hambúrguer ou aba Menu.\n4. O chat flutuante abre em modo tela cheia (100% viewport) sem barras horizontais de scroll quebrado.")
    ]

    for tc in test_cases:
        p(f"--------------------------------------------------------------------------------")
        p(f"CASO DE TESTE [{tc[0]}]: {tc[1]}")
        p(f"Procedimento de Execução:")
        for step in tc[2].split('\n'):
            p(f"  {step}")
        p("")

    p("")
    p("=" * 80)
    p("SEÇÃO ESPECIAL J: MATRIZ DE RISCOS TÉCNICOS E PLANO DE CONTINGÊNCIA")
    p("=" * 80)
    p("Identificação preventiva de vulnerabilidades de arquitetura e procedimentos de mitigação.")
    p("")
    p("J.1 RISCO 1: FALHA OU QUEDA DE INSTÂNCIA DE SERVIDOR DEDICADO GODOT")
    p("- Impacto: Desconexão abrupta de jogadores em uma sala específica.")
    p("- Mitigação e Recuperação:")
    p("  * O serviço `stats.service.js` roda verificação de heartbeat a cada 15 segundos.")
    p("  * Caso uma instância pare de responder por 45 segundos, seu status é alterado para 'offline'.")
    p("  * O balanceador do Backend provisiona automaticamente uma nova instância em porta livre.")
    p("  * Os clientes de jogo recebem evento WebSocket de reconexão e reconectam na nova sala em < 3s.")
    p("")
    p("J.2 RISCO 2: INCONSISTÊNCIA OU DIVERGÊNCIA DE SALDOS MONETÁRIOS")
    p("- Impacto: Quebra de confiança de jogadores ou prejuízo financeiro.")
    p("- Mitigação e Auditoria:")
    p("  * O Livro-Razão (`wallet_ledger`) é a autoridade absoluta de prova contábil.")
    p("  * Script de auditoria diária compara o somatório dos lançamentos históricos de cada avatar")
    p("    com o valor gravado na coluna `currencies.coins` e `currencies.cash`.")
    p("  * Em caso de divergência de 1 centavo, a conta é suspensa cautelarmente para análise da diretoria.")
    p("")
    p("J.3 RISCO 3: ATAQUES DE NEGAÇÃO DE SERVIÇO (DDoS) E SPAM EM CHAT")
    p("- Impacto: Lentidão do servidor Express e degradação da experiência social.")
    p("- Mitigação:")
    p("  * Rate limiting configurado via middleware: máximo de 60 requisições por minuto por IP em rotas gerais.")
    p("  * No chat: Cota diária de DMs para contas não-VIP (limite de 30 novas conversas por dia).")
    p("  * Cooldown de envio de mensagens no WebSocket: intervalo mínimo de 500ms entre balões de texto.")
    p("")
    p("J.4 RISCO 4: ALUCINAÇÃO DE MODELOS DE INTELIGÊNCIA ARTIFICIAL EM DESENVOLVIMENTO")
    p("- Impacto: Criação de rotas contraditórias, vazamento de permissão ou reintrodução de termos de engine.")
    p("- Mitigação:")
    p("  * Regra de ouro: Antes de qualquer código, o modelo DEVE ler `ARQUITETURA_DEFINITIVA_TFL.txt`.")
    p("  * Princípio do Lazy Loading: A IA consulta a `tree.md` e abre apenas o `regras.md` do nó desejado.")
    p("  * Validação de proibições: Toda revisão de código deve checar a lista de proibições do L3.")
    p("=" * 80)
    p("                 [FIM DEFINITIVO E OFICIAL DA ESPECIFICAÇÃO]")
    p("=" * 80)

    final_content = "\n".join(lines)
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(final_content)

    print(f"Expansão Parte 2 concluída com sucesso!")
    print(f"Total de linhas final: {len(lines)}")
    print(f"Total de bytes final: {len(final_content.encode('utf-8'))}")

if __name__ == '__main__':
    expand_part_2()
