# -*- coding: utf-8 -*-
"""
Expansor Parte 7: Variáveis de Ambiente, Configuração de Produção, Nginx, PM2,
Certificados SSL e Conclusão Formal.
Ultrapassa com folga a meta de 2.000 linhas.
"""

target_file = '/media/not/Projetos/WebSite/docs/projeto/ESPECIFICACAO_COMPLETA_ECOSSISTEMA_TFL.txt'

def expand_part_7():
    with open(target_file, 'r', encoding='utf-8') as f:
        base_content = f.read()

    lines = base_content.split('\n')

    while lines and ('FIM DEFINITIVO E ABSOLUTO DA ESPECIFICAÇÃO' in lines[-1] or '=' in lines[-1] or not lines[-1].strip()):
        lines.pop()

    def p(text=""):
        lines.append(text)

    p("")
    p("=" * 80)
    p("SEÇÃO ESPECIAL U: VARIÁVEIS DE AMBIENTE (.env), SEGREDOS E DEPLOY EM PRODUÇÃO")
    p("=" * 80)
    p("Esta seção especifica todos os parâmetros de configuração necessários para inicializar")
    p("e manter o ecossistema TFL operando de forma segura em ambientes de desenvolvimento, homologação e produção:")
    p("")

    env_vars = [
        ("PORT", "3000", "Porta HTTP/WebSocket principal onde o Express escuta as conexões web."),
        ("NODE_ENV", "production", "Ambiente de execução ('development', 'test', 'production')."),
        ("DB_HOST", "localhost", "Endereço do cluster PostgreSQL 14+."),
        ("DB_PORT", "5432", "Porta de conexão padrão do banco PostgreSQL."),
        ("DB_NAME", "thefantasylife", "Nome do banco de dados relacional principal."),
        ("DB_USER", "tfl_app_user", "Usuário do PostgreSQL com permissões concedidas apenas nas tabelas de schema."),
        ("DB_PASS", "SenhaComplexaSuperSegura2026", "Senha criptografada do usuário do banco de dados."),
        ("JWT_SECRET", "ChaveMestraParaAssinaturaDeTokensJwtDe32CaracteresMinimo", "Segredo para geração e validação de tokens JWT."),
        ("JWT_EXPIRATION", "7d", "Tempo de expiração padrão para tokens de autenticação de sessão."),
        ("TICKET_SECRET", "SegredoExclusivoParaTicketsEfemerosDeSalas30s", "Chave privada para assinatura dos tickets efêmeros de entrada em salas 3D."),
        ("ASAAS_API_KEY", "$aact_YTU5YTE0M2M6N2ZlZC00Zj...", "Chave de API em ambiente de produção do Gateway de Pagamentos Asaas."),
        ("ASAAS_WEBHOOK_SECRET", "whsec_991823abce...", "Assinatura para validação de integridade dos webhooks bancários Pix recebidos."),
        ("SERVER_SECRET_TOKEN", "SegredoParaComunicaoEntreServidoresDedicadosEBackend", "Token estático de alta entropia transmitido no header `x-server-token`."),
        ("UPLOAD_DIR", "/media/not/Projetos/WebSite/uploads", "Diretório do sistema de arquivos onde são armazenadas imagens e arquivos 3D."),
        ("MAX_FILE_SIZE_MB", "15", "Tamanho máximo permitido para upload de malhas 3D (.glb)."),
        ("CORS_ORIGINS", "https://thefantasy.life,https://app.thefantasy.life", "Lista separada por vírgulas de origens permitidas para requisições cross-origin.")
    ]

    p("U.1 DICIONÁRIO DE VARIÁVEIS DE AMBIENTE:")
    for ev in env_vars:
        p(f"--------------------------------------------------------------------------------")
        p(f"VARIÁVEL: `{ev[0]}`")
        p(f"Exemplo: `{ev[1]}`")
        p(f"Finalidade: {ev[2]}")
        p("")

    p("U.2 CONFIGURAÇÃO RECOMENDADA DO PROXY REVERSO (NGINX):")
    p("O Nginx deve ser configurado como terminação SSL/TLS (HTTPS) e balanceador de carga:")
    p("```nginx")
    p("server {")
    p("    listen 443 ssl http2;")
    p("    server_name thefantasy.life;")
    p("")
    p("    ssl_certificate /etc/letsencrypt/live/thefantasy.life/fullchain.pem;")
    p("    ssl_certificate_key /etc/letsencrypt/live/thefantasy.life/privkey.pem;")
    p("")
    p("    # Compressão Gzip para aceleração móvel")
    p("    gzip on;")
    p("    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;")
    p("")
    p("    # WebSockets e API REST")
    p("    location / {")
    p("        proxy_pass http://127.0.0.1:3000;")
    p("        proxy_http_version 1.1;")
    p("        proxy_set_header Upgrade $http_upgrade;")
    p("        proxy_set_header Connection 'upgrade';")
    p("        proxy_set_header Host $host;")
    p("        proxy_set_header X-Real-IP $remote_addr;")
    p("        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;")
    p("        proxy_set_header X-Forwarded-Proto $scheme;")
    p("        proxy_read_timeout 86400s;")
    p("    }")
    p("}")
    p("```")
    p("")
    p("U.3 GESTÃO DE PROCESSOS COM PM2 (CLUSTER MODE):")
    p("Para garantir alta disponibilidade e reinicialização automática sem downtime:")
    p("```bash")
    p("# Inicialização em modo cluster utilizando todos os núcleos de CPU disponíveis")
    p("pm2 start app.js -i max --name 'tfl-web-cluster'")
    p("")
    p("# Salvar estado para recuperação pós-reboot")
    p("pm2 save")
    p("pm2 startup")
    p("```")
    p("")
    p("=" * 80)
    p("                   [FIM DEFINITIVO E ABSOLUTO DA ESPECIFICAÇÃO]")
    p("=" * 80)

    final_content = "\n".join(lines)
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(final_content)

    print(f"Expansão Parte 7 concluída com sucesso!")
    print(f"Total de linhas final: {len(lines)}")
    print(f"Total de bytes final: {len(final_content.encode('utf-8'))}")

if __name__ == '__main__':
    expand_part_7()
