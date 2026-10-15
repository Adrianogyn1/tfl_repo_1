# -*- coding: utf-8 -*-
"""
Expansor Parte 4: Detalhamento de todos os Services em src/services/,
todos os Modais em modals.ejs e Design System com paleta de cores.
Garante que a especificação ultrapasse 2.000 linhas com extrema solidez técnica.
"""

target_file = '/media/not/Projetos/WebSite/docs/projeto/ESPECIFICACAO_COMPLETA_ECOSSISTEMA_TFL.txt'

def expand_part_4():
    with open(target_file, 'r', encoding='utf-8') as f:
        base_content = f.read()

    lines = base_content.split('\n')

    while lines and ('FIM DEFINITIVO E OFICIAL DA ESPECIFICAÇÃO' in lines[-1] or '=' in lines[-1] or not lines[-1].strip()):
        lines.pop()

    def p(text=""):
        lines.append(text)

    p("")
    p("=" * 80)
    p("SEÇÃO ESPECIAL N: ESPECIFICAÇÃO DETALHADA DOS SERVICES (src/services/)")
    p("=" * 80)
    p("A camada de Serviços isola 100% das regras de negócio complexas, mantendo os controllers")
    p("apenas como orquestradores de requisição e resposta HTTP.")
    p("")

    services = [
        {
            "file": "src/services/stats.service.js",
            "name": "Serviço de Telemetria Geográfica e Presença Global",
            "funcs": [
                "`recordVisit(ip, userAgent, headers)`: Extrai fuso horário, país e estado brasileiro a partir de headers de proxy e GeoIP. Grava contagem agregada com cache TTL de 60 segundos para não onerar o banco com I/O de disco.",
                "`getOnlineAvatarsCount()`: Retorna o número exato de avatares com sockets ativos nos namespaces de chat e salas 3D.",
                "`getGeographicDistribution()`: Monta mapa percentual de acessos por região para o dashboard administrativo."
            ]
        },
        {
            "file": "src/services/coinMarket.service.js",
            "name": "Serviço do Mercado de Moedas e Bolsa P2P FIFO",
            "funcs": [
                "`createOrder(avatarId, type, amount, pricePerCoin)`: Registra uma nova ordem no livro de ofertas. Se for venda, bloqueia as Coins imediatamente na carteira do vendedor com lock pessimista.",
                "`matchOrders()`: Algoritmo de cruzamento contínuo. Emparelha ordens de compra e venda pela melhor cotação disponível (FIFO). Executa liquidação atômica e transfere Coins para o comprador e Cash para o vendedor, retendo taxa da plataforma.",
                "`recordLedgerEntry(avatarId, currency, opType, amount, fee, balanceAfter, metadata)`: Helper centralizado para gravação imutável no `wallet_ledger`."
            ]
        },
        {
            "file": "src/services/shop3d.service.js",
            "name": "Serviço da Loja 3D e Liquidação de Royalties UGC",
            "funcs": [
                "`processPurchase(buyerAvatarId, shopItemId, currencyChoice)`: Conduz a transação bancária completa. Verifica compatibilidade de gênero e duplicação no inventário. Debita o valor e credita 70% de royalties ao avatar criador (se houver), retendo 30% para a plataforma.",
                "`equipAndResolveConflicts(avatarId, shopItemId)`: Lê a categoria do item. Se for `fullbody`, executa desequipamento automático de `top` e `bottom` e equipa a nova peça."
            ]
        },
        {
            "file": "src/services/storage.service.js",
            "name": "Serviço de Upload Seguro e Proxy de Mídias",
            "funcs": [
                "`uploadImage(fileBuffer, mimeType, folder)`: Valida tamanho máximo (5MB) e assinaturas de cabeçalho MIME (magic bytes) para impedir uploads maliciosos. Gera hash SHA-256 e armazena em disco com caminhos sanitizados.",
                "`getSecureMediaStream(mediaId, requestingUser)`: Valida se o usuário tem permissão para visualizar a mídia com base na visibilidade do post ou diário antes de despachar os bytes."
            ]
        },
        {
            "file": "src/services/diary.service.js",
            "name": "Serviço de Diário Pessoal e Desabafos de Saúde Mental",
            "funcs": [
                "`saveEntry(avatarId, moodEmoji, content, visibility)`: Grava nova confissão diária com carimbo de data/hora.",
                "`getTimeline(avatarId, viewerAvatarId)`: Aplica filtros rígidos de privacidade (se o visualizador não for amigo, retorna apenas entradas públicas).",
                "`getMoodStats(avatarId, days)`: Calcula a média semanal e mensal do estado de humor do avatar para relatórios de autocuidado."
            ]
        },
        {
            "file": "src/services/avatarCareer.service.js",
            "name": "Serviço de Progressão de Carreiras e Ocupações Virtuais",
            "funcs": [
                "`addExperience(avatarId, careerType, xpGained)`: Incrementa a experiência na carreira correspondente (`explorador`, `escriba`, `magnata`, `social`, `anfitriao`).",
                "`checkLevelUp(currentXp)`: Aplica fórmula de progressão exponencial `XP_Necessario = 100 * (Nivel ^ 1.5)`. Ao subir de nível, desbloqueia títulos honoríficos e insígnias para exibição no perfil."
            ]
        },
        {
            "file": "src/services/nameGenerator.service.js",
            "name": "Gerador Procedural de Nomes Fonéticos e Fantasia",
            "funcs": [
                "`generateAvatarName(style)`: Combina prefixos e sufixos fonéticos harmoniosos (élficos, modernos, cyberpunk) garantindo unicidade no banco.",
                "`generateRoomName(theme)`: Sugere títulos criativos e atraentes para novas salas 3D."
            ]
        },
        {
            "file": "src/services/financialHealth.service.js",
            "name": "Serviço de Auditoria de Liquidez e Solvência Financeira",
            "funcs": [
                "`calculateCashLiability()`: Soma o saldo total de Cash em posse de todos os avatares do sistema.",
                "`compareWithAsaasLiquidity(apiKey)`: Consulta saldo bancário real disponível e calcula o índice de cobertura.",
                "`logExpense(category, amount, desc)`: Registra custo operacional em `platform_operational_expenses`."
            ]
        }
    ]

    for s in services:
        p(f"--------------------------------------------------------------------------------")
        p(f"SERVICE: {s['file']}")
        p(f"Responsabilidade: {s['name']}")
        p(f"Funções e Regras de Negócio:")
        for fn in s['funcs']:
            p(f"  * {fn}")
        p("")

    p("")
    p("=" * 80)
    p("SEÇÃO ESPECIAL O: INVENTÁRIO COMPLETO DE MODAIS DO SISTEMA (modals.ejs)")
    p("=" * 80)
    p("O arquivo `src/views/profile/partials/modals.ejs` concentra todos os diálogos de topo de tela")
    p("utilizados pelo jogador no portal social, evitando recarregamento de páginas.")
    p("")

    modals = [
        ("#modalCreateAvatar", "Criação de Avatar", "Formulário com nome do avatar, seleção de gênero inicial (Feminino/Masculino/Outro), escolha de rig base e biografia inicial. Dispara `POST /profile/avatar/create`."),
        ("#modalSwitchAvatar", "Alternância de Personas", "Lista de todos os avatares pertencentes ao usuário com fotos, saldos individuais e botão 'Ativar'. Dispara `POST /profile/avatar/switch`."),
        ("#modalWalletDepositPix", "Depósito de Cash via Pix", "Seleção de valor pré-definido (R$ 10, R$ 25, R$ 50, R$ 100) ou personalizado. Renderiza QR Code dinâmico do Asaas e botão 'Copiar Chave'."),
        ("#modalWalletWithdrawPix", "Saque de Cash para Conta Bancária", "Exibe saldo disponível para resgate, campo de chave Pix, validação de titularidade do CPF e aviso de prazo de liquidação (até 24h úteis)."),
        ("#modalWalletTransferP2P", "Transferência P2P de Coins", "Busca de avatar destinatário por nome com autocompletar, campo de quantidade de Coins e confirmação de senha do usuário."),
        ("#modalWalletConverter", "Conversor Instantâneo de Moedas", "Calculadora com taxas de conversão atualizadas em tempo real entre Cash, Coins e Chips."),
        ("#modalCreateRoom", "Criação de Sala 3D", "Escolha do nome da sala, descrição, seleção do prefab de cenário base (apartamento, praia, auditório), capacidade máxima e senha opcional."),
        ("#modalEditRoomLayout", "Editor de Layout e Mobília", "Interface para reposicionamento e rotação de móveis da sala 3D, com listagem de itens do inventário prontos para disposição."),
        ("#modalFollowersList", "Lista de Seguidores", "Exibe a lista de avatares que seguem a persona ativa, com opção de seguir de volta ou visitar seus perfis."),
        ("#modalFriendsList", "Central de Amigos", "Abas de 'Amigos Atuais', 'Pedidos Recebidos' e 'Sugestões de Conexão' baseadas em interesses comuns."),
        ("#modalPhotoLightbox", "Visualizador de Alta Resolução", "Modal preto translúcido em tela cheia para exibição de fotos do feed e galeria, com zoom e atalhos de navegação anterior/próxima."),
        ("#modalConfirmVip", "Confirmação de Assinatura VIP", "Resumo dos benefícios do plano escolhido, valor a ser debitado e seleção entre Cash ou Coins como método de pagamento.")
    ]

    for m in modals:
        p(f"--------------------------------------------------------------------------------")
        p(f"MODAL: {m[0]}")
        p(f"Nome Amigável: {m[1]}")
        p(f"Comportamento e Elementos: {m[2]}")
        p("")

    p("")
    p("=" * 80)
    p("SEÇÃO ESPECIAL P: DESIGN SYSTEM, PALETA DE CORES E IDENTIDADE VISUAL")
    p("=" * 80)
    p("O Design System do TFL foi projetado para transmitir sofisticação, modernidade e imersão.")
    p("")
    p("P.1 PALETA CROMÁTICA OFICIAL:")
    p("- Dourado Prestígio (Coins, VIP e Insígnias):")
    p("  * Primário: `#f59e0b` (Tailwind amber-500)")
    p("  * Destaque/Brilho: `#fbbf24` (amber-400)")
    p("  * Profundo: `#b45309` (amber-700)")
    p("- Verde Esmeralda (Cash Fiduciário e Transações Financeiras):")
    p("  * Primário: `#10b981` (Tailwind emerald-500)")
    p("  * Sucesso/Confirmação: `#34d399` (emerald-400)")
    p("  * Fundo de Alerta Positivo: `#064e3b` (emerald-900)")
    p("- Azul Royal (Chips e Minigames de Cassino Recreativo):")
    p("  * Primário: `#2563eb` (Tailwind blue-600)")
    p("  * Destaque de Mesa: `#3b82f6` (blue-500)")
    p("- Roxo Místico (Metaverso 3D, Portais e Salas Especiais):")
    p("  * Primário: `#9333ea` (Tailwind purple-600)")
    p("  * Acento Neon: `#a855f7` (purple-500)")
    p("- Escala de Fundo Escuro (Dark Mode Imersivo Mobile):")
    p("  * Background Principal: `#0a0a0a` (neutral-950 puro)")
    p("  * Superfície de Cartões (Cards): `#171717` (neutral-900 com borda neutral-800)")
    p("  * Vidro Translúcido: `rgba(23, 23, 23, 0.75)` com filtro `backdrop-blur-xl`")
    p("")
    p("P.2 TIPOGRAFIA:")
    p("- Fonte Primária de Interface: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif.")
    p("- Fonte de Títulos e Chamadas: `Outfit` ou `Montserrat` (peso 700 e 800) com tracking apertado (`tracking-tight`).")
    p("- Legibilidade em Telas Pequenas: Tamanho base de 14px a 16px para textos de post e diário,")
    p("  garantindo excelente leitura em telas AMOLED sob a luz solar.")
    p("")
    p("=" * 80)
    p("                 [FIM DEFINITIVO E OFICIAL DA ESPECIFICAÇÃO]")
    p("=" * 80)

    final_content = "\n".join(lines)
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(final_content)

    print(f"Expansão Parte 4 concluída com sucesso!")
    print(f"Total de linhas final: {len(lines)}")
    print(f"Total de bytes final: {len(final_content.encode('utf-8'))}")

if __name__ == '__main__':
    expand_part_4()
