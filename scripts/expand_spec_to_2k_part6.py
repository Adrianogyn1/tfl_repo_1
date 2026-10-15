# -*- coding: utf-8 -*-
"""
Expansor Parte 6: Protocolo de Pacotes WebSocket, Sincronização de Rede 3D
e Plano de Depreciação de Código Legado.
Garante que o arquivo ultrapasse 2.050 linhas.
"""

target_file = '/media/not/Projetos/WebSite/docs/projeto/ESPECIFICACAO_COMPLETA_ECOSSISTEMA_TFL.txt'

def expand_part_6():
    with open(target_file, 'r', encoding='utf-8') as f:
        base_content = f.read()

    lines = base_content.split('\n')

    while lines and ('FIM DEFINITIVO E ABSOLUTO DA ESPECIFICAÇÃO' in lines[-1] or '=' in lines[-1] or not lines[-1].strip()):
        lines.pop()

    def p(text=""):
        lines.append(text)

    p("")
    p("=" * 80)
    p("SEÇÃO ESPECIAL S: PROTOCOLO DE PACOTES WEBSOCKET E SINCRONIZAÇÃO DE REDE 3D")
    p("=" * 80)
    p("Especificação dos pacotes binários e JSON transmitidos entre clientes e servidores dedicados:")
    p("")

    packets = [
        {
            "event": "game:handshake",
            "direction": "Cliente 3D -> Servidor Dedicado",
            "payload": "{ 'ticket': '<JWT_30S>', 'clientVersion': '1.0.0', 'avatarId': 101 }",
            "behavior": "Valida o ticket assinado pelo Backend. Se válido, instancia o nó do avatar na cena 3D e responde `game:joined` com o estado de todos os jogadores presentes."
        },
        {
            "event": "game:player_transform",
            "direction": "Bidirecional (Cliente <-> Servidor)",
            "payload": "{ 'p': [12.4, 0.0, -8.1], 'r': [0, 90, 0], 'v': [1.2, 0, 0], 'anim': 'walk' }",
            "behavior": "Taxa de atualização de 20 Hz (a cada 50ms). O servidor dedicado faz interpolação de movimento linear (Lerp/Slerp) para suavizar a renderização nos outros clientes."
        },
        {
            "event": "game:interaction_furniture",
            "direction": "Cliente 3D -> Servidor Dedicado -> Backend REST",
            "payload": "{ 'instanceId': 502, 'action': 'sit', 'seatIndex': 0 }",
            "behavior": "Informa que o avatar sentou no sofá. O servidor trava o assento para impedir que dois avatares ocupem o mesmo lugar e transmite o estado aos outros clientes."
        },
        {
            "event": "game:player_leave",
            "direction": "Servidor Dedicado -> Backend REST",
            "payload": "{ 'avatarId': 101, 'roomId': 55, 'durationSeconds': 1420 }",
            "behavior": "Notifica a saída do jogador para liberação de vaga na sala e atualização das estatísticas de visitas da sala e XP de carreira do avatar."
        },
        {
            "event": "chat:direct_message",
            "direction": "Cliente Web -> SoketHub -> Cliente Destinatário",
            "payload": "{ 'toAvatarId': 202, 'content': 'Olá, vamos para a sala da praia?', 'idempotencyKey': 'uuid-v4' }",
            "behavior": "Encaminha mensagem instantânea se o destinatário estiver online no socket `/ws/chat`, ou armazena no banco para entrega assim que ele conectar."
        }
    ]

    for pkt in packets:
        p(f"--------------------------------------------------------------------------------")
        p(f"EVENTO DE REDE: `{pkt['event']}`")
        p(f"Sentido do Fluxo: {pkt['direction']}")
        p(f"Estrutura do Pacote:")
        p(f"  {pkt['payload']}")
        p(f"Comportamento e Regras:")
        p(f"  {pkt['behavior']}")
        p("")

    p("")
    p("=" * 80)
    p("SEÇÃO ESPECIAL T: PLANO DE DEPRECIAÇÃO E LIMPEZA DE CÓDIGO LEGADO")
    p("=" * 80)
    p("Durante a evolução do projeto, algumas rotas e arquivos monolíticos antigos foram substituídos")
    p("pela nova arquitetura modular Server-Driven UI e API REST v1. Esta seção estabelece o plano de limpeza:")
    p("")
    p("T.1 ARQUIVOS MARCADOS COMO DEPRECADOS (PARA ARQUIVAMENTO FUTURO):")
    p("1. `src/views/index_old.html` & `src/views/profile/index_old.html`:")
    p("   - Status: Legado monolítico substituído integralmente por `src/views/profile/index.ejs`")
    p("     e seus partials modulares (`view-user-profile.ejs`, `view-diary.ejs`, etc.).")
    p("   - Ação: Manter isolado como referência histórica ou mover para pasta `_lixo/`.")
    p("")
    p("2. `src/api/v1/old/` (Antigos Controladores de API):")
    p("   - Contém: `api_controller.js`, `assas_client.js`, `bank_controller.js`, `manifest_controller.js`.")
    p("   - Status: Substituído pelos novos controladores especializados em `src/controllers/game/`,")
    p("     `src/controllers/social/` e `src/services/`.")
    p("   - Ação: Todos os novos endpoints devem ser desenvolvidos exclusivamente dentro de `src/api/v1/`")
    p("     seguindo os padrões da Seção 7 deste documento.")
    p("")
    p("T.2 REGRAS DE TRANSIÇÃO E BLINDAGEM DE COMPATIBILIDADE:")
    p("- Nenhuma view ativa em produção deve importar ou fazer referência a arquivos da pasta `old`.")
    p("- O arquivo `src/routes/router.js` é a única autoridade de montagem de rotas da aplicação.")
    p("")
    p("=" * 80)
    p("                   [FIM DEFINITIVO E ABSOLUTO DA ESPECIFICAÇÃO]")
    p("=" * 80)

    final_content = "\n".join(lines)
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(final_content)

    print(f"Expansão Parte 6 concluída com sucesso!")
    print(f"Total de linhas final: {len(lines)}")
    print(f"Total de bytes final: {len(final_content.encode('utf-8'))}")

if __name__ == '__main__':
    expand_part_6()
