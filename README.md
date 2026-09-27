# Handoff: Cotador Blindagem Profissional da Saúde (formato WhatsApp)

## Como usar este pacote com o Claude Code
1. Descompacte esta pasta num diretório vazio e abra o Claude Code nele.
2. Cole o pedido:
   > Leia o README.md e implemente o projeto descrito em "Arquitetura", recriando fielmente o protótipo de `prototipo/Cotador Conversa.dc.html`. Use Next.js (App Router) + TypeScript, pronto para deploy na Vercel. Siga a ordem da seção "Plano de implementação" e me peça as variáveis de ambiente quando precisar.
3. Siga o "Checklist de publicação" no fim deste arquivo.

## Visão geral
Página de autoatendimento (celular) em que o profissional da saúde conversa com um "assistente" no estilo WhatsApp. Ele responde nome, profissão, tratamento (feminino/masculino), data de nascimento, renda, WhatsApp e e-mail, dá o consentimento LGPD e recebe um **Estudo de Blindagem em PDF (3 páginas)**. Em seguida é direcionado para agendar uma consultoria. Cada lead tem o PDF salvo numa **pasta do Google Drive**, é gravado numa **Google Sheet** (com o link do PDF) e gera um evento **Lead** no Meta (Pixel + API de Conversões). A partir da planilha, o **n8n** avisa o corretor e cadastra o cliente no **RD Station CRM**. Isso fica fora deste projeto.

**Não usa a API da Anthropic.** A carta é montada por modelo de texto (profissão × sexo).

## Sobre os arquivos de design
- `prototipo/Cotador Conversa.dc.html` é um **protótipo em HTML** que mostra o visual e o comportamento pretendidos. Não é código de produção. Abra no navegador (junto de `support.js` e `assets/`) para ver funcionando. Recrie em Next.js/React.
- `referencia/cotador-blindagem-saude.html` é o cotador original (formulário). É a **fonte de verdade para tabelas de preço, fórmulas e textos legais** e já tem geração de PDF com html2canvas + jsPDF, que pode ser reaproveitada.

## Fidelidade
**Alta fidelidade.** Cores, tipografia, espaçamentos, textos e fluxo são finais. Recriar pixel a pixel.

---

## Arquitetura (o mais simples possível)

```
Navegador (Next.js na Vercel)            Servidor (Route Handler /api/lead)
 ├─ Conversa (client component)           ├─ Valida Turnstile (anti-robô)
 ├─ Cálculo do estudo (lib/calc.ts)       ├─ Rate limit por IP
 ├─ Gera PDF (html2canvas + jsPDF)        ├─ Valida dados (zod) e recalcula o estudo
 ├─ Meta Pixel: PageView + Lead           ├─ Salva o PDF no Google Drive (pasta Leads)
 └─ POST /api/lead  ───────────────────▶  ├─ Grava linha na Google Sheet (com link do PDF)
                                          ├─ Envia PDF ao cliente (Resend) se autorizou e-mail
                                          └─ Meta CAPI: evento Lead (mesmo event_id do Pixel)

Google Sheet ──(nova linha)──▶ n8n ├─ Mensagem ao corretor
                                   └─ Cria/atualiza contato + negociação no RD Station CRM
```

- **Hospedagem:** Vercel (plano Hobby serve para começar). Domínio `blindagem.setornorteseguros.com.br` via CNAME `cname.vercel-dns.com`.
- **Leads:** Google Sheets, via conta de serviço do Google Cloud (API Sheets). A planilha é privada e só é compartilhada com o e-mail da conta de serviço.
- **E-mail:** Resend, com o domínio `setornorteseguros.com.br` verificado (SPF/DKIM). Remetente: `estudo@setornorteseguros.com.br`.
- **PDFs:** Google Drive, numa pasta dentro de um **Drive compartilhado** (Shared Drive) do Google Workspace. Contas de serviço não têm cota própria de armazenamento e não conseguem gravar no "Meu Drive" comum. Adicione a conta de serviço como **Gerente de conteúdo** do Drive compartilhado.
- **Aviso ao corretor e CRM:** feitos pelo n8n a partir da planilha (ver "Automação n8n"). O servidor não envia aviso ao corretor.
- **Meta:** Pixel no navegador + API de Conversões no servidor, com deduplicação por `event_id`.

### Variáveis de ambiente (Vercel → Settings → Environment Variables)
Nenhuma delas vai para o navegador, exceto as que começam com `NEXT_PUBLIC_`.

| Nome | Uso |
|---|---|
| `NEXT_PUBLIC_META_PIXEL_ID` | ID do Pixel |
| `META_CAPI_TOKEN` | Token de acesso da API de Conversões (Gerenciador de Eventos) |
| `META_TEST_EVENT_CODE` | Opcional, só durante testes |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile (pública) |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile (secreta) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Conta de serviço |
| `GOOGLE_PRIVATE_KEY` | Chave privada da conta de serviço (com `\n`) |
| `GOOGLE_SHEET_ID` | ID da planilha |
| `GOOGLE_DRIVE_FOLDER_ID` | ID da pasta dos PDFs (dentro do Drive compartilhado) |
| `RESEND_API_KEY` | Envio de e-mail |
| `MAIL_FROM` | `Setor Norte Seguros <estudo@setornorteseguros.com.br>` |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limit (plano grátis da Upstash, integração nativa da Vercel) |
| `LEAD_HASH_SALT` | Texto aleatório para gerar o ID do lead |

---

## Segurança
1. **Nenhuma chave no navegador.** Todas as integrações rodam em `/api/lead`.
2. **Anti-robô:** Cloudflare Turnstile no modo invisível. O token é enviado junto do lead e validado no servidor antes de qualquer outra ação.
3. **Rate limit:** 5 leads por IP a cada hora e 20 por dia (`@upstash/ratelimit`). Acima disso, o servidor responde 429 e a conversa mostra: "Recebemos muitas solicitações deste dispositivo. Tente novamente mais tarde ou fale com o corretor."
4. **Honeypot:** campo oculto `empresa`. Se vier preenchido, responder 200 e descartar.
5. **Validação no servidor (zod):** nome com 2 palavras ou mais (máx. 120), profissão na lista fechada, sexo `F|M`, idade 18–50 (calculada no servidor a partir da data), renda de R$ 500 a R$ 200.000, WhatsApp com 10–11 dígitos, e-mail válido e consentimentos booleanos.
6. **O servidor recalcula o estudo.** O valor mostrado no e-mail e na planilha vem do cálculo do servidor, nunca do cliente. O PDF enviado pelo cliente é aceito só se for `application/pdf` com até 3 MB. Alternativa mais segura: gerar o PDF no servidor (ver "PDF").
7. **Cabeçalhos:** HTTPS (automático), `Content-Security-Policy` liberando só self, `connect.facebook.net`, `www.facebook.com`, `challenges.cloudflare.com` e `fonts.googleapis.com`/`fonts.gstatic.com`. Também `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy` restrita. Configurar em `next.config.js`.
8. **Sanitizar para a planilha:** prefixar com `'` qualquer valor que comece com `= + - @` (proteção contra injeção de fórmula).
9. **LGPD:** gravar a prova de consentimento (data/hora UTC, IP, user agent, texto exato dos consentimentos e versão da política). Publicar `/privacidade` com a política (o link já existe no cartão de consentimento). Não registrar dados pessoais nos logs da Vercel.
10. **Cookies do Pixel:** banner discreto no rodapé na primeira visita ("Usamos cookies para medir nossos anúncios. [Aceitar] [Recusar]"). O Pixel só carrega após "Aceitar". A CAPI envia o evento Lead de qualquer forma, porque o cliente consentiu contato na conversa, mas só inclui `fbp`/`fbc` se os cookies foram aceitos.

---

## Meta (Pixel + API de Conversões)
- **Pixel:** `PageView` ao carregar. `ViewContent` quando o usuário toca em "Vamos começar". `Lead` quando o estudo é gerado (após confirmar o consentimento). Passar `{ eventID }` no `fbq('track','Lead',{content_name:'Estudo Blindagem', value: totalMensal, currency:'BRL'}, {eventID})`.
- **CAPI (servidor):** `POST https://graph.facebook.com/v21.0/{PIXEL_ID}/events` com:
  - `event_name: "Lead"`, `event_time` (segundos), `event_id` (**o mesmo do Pixel**), `action_source: "website"`, `event_source_url`.
  - `user_data`: `em`, `ph` (55 + DDD + número), `fn`, `ln`, `ge` (f/m), `db` (AAAAMMDD), `country` ("br"), todos em minúsculas e hash **SHA-256**. Mais `client_ip_address`, `client_user_agent`, `fbp`, `fbc` (sem hash).
  - `custom_data`: `value` (total mensal), `currency: "BRL"`, `content_name: "Estudo Blindagem"`, `content_category` (profissão).
- **UTMs:** ler `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` e `fbclid` da URL na chegada, guardar em `sessionStorage` e enviar com o lead. Assim a planilha mostra de qual anúncio veio cada lead.
- **Teste:** usar `META_TEST_EVENT_CODE` e conferir em Gerenciador de Eventos → Testar eventos que o Lead aparece **deduplicado** (Navegador + Servidor).

## Google Sheet — aba `Leads`
Linha 1 (cabeçalho), nesta ordem:
`data_hora | lead_id | nome | profissao | sexo | nascimento | idade | renda | whatsapp | email | total_mensal | protecao_mensal | recupera_em | consent_email | consent_whatsapp | consent_texto_versao | ip | user_agent | utm_source | utm_medium | utm_campaign | utm_content | utm_term | fbclid | pdf_url | pdf_enviado | status | rd_crm_id`

- `data_hora` no fuso America/Belem, formato `dd/mm/aaaa hh:mm`.
- `lead_id`: 8 primeiros caracteres de `sha256(email + data + LEAD_HASH_SALT)`.
- `pdf_url`: link `webViewLink` do arquivo no Drive (acesso restrito à organização; **não** tornar público).
- `rd_crm_id`: preenchido pelo n8n depois de criar o contato no RD. Serve para evitar duplicidade.
- A linha é gravada **uma única vez, já completa** (`values.append`), depois do upload do PDF, para o gatilho do n8n nunca ler uma linha pela metade.
- `status` começa como `Novo`. O corretor muda para `Contatado`, `Agendado`, `Fechado` ou `Perdido`, com validação de dados na planilha.
- Sugestão para o corretor: uma aba `Painel` com fórmulas (leads por dia, por profissão, por campanha e % agendado) e filtro por status. É criada à mão uma vez, não pelo código.

## Google Drive (PDFs)
- Upload pela Drive API v3 (`files.create`, `uploadType=multipart`, `supportsAllDrives=true`), `parents: [GOOGLE_DRIVE_FOLDER_ID]`, `mimeType: application/pdf`.
- Organização: subpasta por mês `AAAA-MM` (criar se não existir). Nome do arquivo: `{AAAAMMDD-hhmm} - {Nome} - {lead_id}.pdf`.
- Propriedades do arquivo (`appProperties`): `lead_id`, `profissao`. Facilitam buscas.
- Não criar permissão pública. Quem precisa ver (corretor) acessa pelo Drive compartilhado.
- Se o upload falhar, a linha é gravada com `pdf_url` vazio e o e-mail ao cliente segue normalmente.

## Aviso ao cliente (se `consent_email`)
E-mail pelo Resend.
- Assunto: `Seu Estudo de Blindagem Profissional, {primeiro nome}`
- Corpo curto com logo, texto "Olá, {primeiro nome}! Segue em anexo o seu Estudo de Blindagem Profissional da Saúde. Na consultoria gratuita, o corretor Edgar Torres revisa cada proteção com você.", botão "Agendar consultoria" (https://calendar.app.google/a7VPtRQcGx5wVE529) e rodapé com CNPJ/SUSEP e link de descadastro.
- Anexo: `Estudo Blindagem - {Nome} - {AAAAMMDD}.pdf`.

## Ordem no servidor
Turnstile → rate limit → zod → recálculo → **Drive** → **Sheets (obrigatório)** → Resend e CAPI em `Promise.allSettled`. Se a planilha falhar, responder 500 e a conversa mostra "Não consegui enviar agora. Tente de novo em instantes."

## Automação n8n (fora deste repositório, documentada aqui para referência)
1. **Google Sheets Trigger**: evento "Row Added", aba `Leads`, verificação a cada minuto.
2. **IF**: `status` = `Novo` e `rd_crm_id` vazio.
3. **Mensagem ao corretor**: pelo canal que vocês já usam no n8n (Evolution API, Z-API, WhatsApp Cloud ou e-mail). Texto sugerido: `Novo lead: {nome} ({profissao}, {idade} anos). Renda {renda}. WhatsApp autorizado: {consent_whatsapp}. Estudo: {pdf_url}`. Incluir o link `https://wa.me/55{whatsapp}` **somente se `consent_whatsapp` = SIM**.
4. **RD Station CRM** (nó HTTP Request, API v1 `https://crm.rdstation.com/api/v1`, `token` na query): buscar contato por e-mail; se não existir, criar o contato (`/contacts`) com nome, e-mail, telefone e campos personalizados (profissão, renda, idade, consentimentos). Depois, criar a negociação (`/deals`) no funil "Blindagem Saúde", com fonte = `utm_source`, campanha = `utm_campaign`, valor = `total_mensal` e nota com `pdf_url`.
5. **Google Sheets Update**: gravar `rd_crm_id` na linha (chave `lead_id`).

## PDF
- **Opção 1 (recomendada para começar):** gerar no navegador, como no cotador original (`html2canvas` + `jsPDF`, A4, JPEG com qualidade 0,85, `scale: 2`). As 3 páginas são os blocos `data-screen-label="Estudo p1/p2/p3"` do protótipo (794×1123 px). Renderizar as páginas fora da tela, gerar o blob, mostrar o cartão de arquivo e enviar em `multipart/form-data` para `/api/lead`.
- **Opção 2 (mais robusta):** gerar no servidor com `@react-pdf/renderer`, com base nos dados validados. Elimina o upload do cliente e garante que o PDF bate com o cálculo do servidor. Pode ficar para uma segunda versão.
- O botão de download do visualizador baixa o mesmo blob.

---

## Telas e componentes (do protótipo)
Container: largura máx. 430 px, altura `min(100dvh, 920px)`, centralizado. No celular ocupa a tela inteira. Fundo da página `#DCE3E8`.

1. **Cabeçalho** (fundo `#fff`): voltar (36×40), avatar 42 px redondo (`#F2F6F9`, borda `#D6DEE5`, símbolo `sym.png` com 26 px de altura), "Setor Norte Seguros" (Nunito 800, 16,5 px, `#1F2A33`) + selo verificado verde `#7DB85A`, status "online" / "digitando…" (13 px, 600, `#667781` / `#4E8A2E`) e botão recomeçar (40 px). Abaixo: faixa tricolor de 3 px (`#396C97` 0–62%, `#7DB85A` 62–84%, `#4D4C4E` 84–100%) e barra de progresso de 3 px (trilho `#E6EBF0`, preenchimento `#396C97`, transição de largura em 0,4 s).
2. **Área de mensagens** (fundo `#EFEAE2`, padding 12 px): chip "Hoje" e aviso de privacidade (`#FFEECD`, 12,5 px).
   - Balão do bot: `#fff`, raio `0 8 8 8` no primeiro do grupo e `8` nos seguintes, sombra `0 1px .5px rgba(11,20,26,.13)`, 15 px/1,42, máx. 86%. `*texto*` vira negrito 800. Hora 11 px `#667781` flutuando à direita.
   - Balão do usuário: `#D9FDD3`, raio `8 0 8 8`, dois checks azuis `#53BDEB`.
   - Espaço de 10 px entre grupos e 3 px dentro do grupo. Entrada: fade + translateY(6 px) em 0,22 s.
   - Botões de resposta rápida: largura 320 px, altura mín. 44, `#fff`, raio 8, Nunito Sans 700 15 px `#396C97`. Ficam com opacidade 0,6 depois de usados.
   - Indicador "digitando": 3 pontos de 7 px `#8696A0` pulando (1,2 s, defasagem de 0,15 s).
3. **Barra de digitação:** campo pill (`#fff`, altura mín. 48, raio 24, fonte 16 px para evitar zoom no iOS) e botão enviar redondo de 48 px `#4E8A2E` (`#9FB5A0` quando desabilitado). O placeholder muda por etapa.
4. **Folha de profissões** (bottom sheet): overlay `rgba(11,20,26,.4)`, folha `#fff` com raio superior 16, puxador, título "Profissões", itens de 52 px com rádio (anel `#AEBAC1` / `#396C97`, miolo 12 px) e botão "Enviar" pill de 48 px verde.
5. **Cartão de consentimento:** 320 px, texto de introdução, 2 checkboxes de 22 px (raio 5, marcado `#396C97`), nota "Você pode retirar a autorização quando quiser. Política de privacidade" e botão "Confirmar" (vira "Confirmado" e trava).
6. **Cartão de arquivo PDF:** 290 px, miniatura de 132 px (faixa tricolor, logo, "Olá, {nome},", linhas cinza) e rodapé `#F5F6F6` com ícone PDF vermelho `#E5484D`, nome do arquivo e "3 páginas · PDF". Toque abre o visualizador.
7. **Cartão de consultoria:** faixa tricolor de 6 px, título "Consultoria personalizada" (Nunito 800 16 px), texto, "30 min · on-line · sem custo" e ações "Agendar consultoria" (abre a agenda em nova aba) e "Abrir meu estudo".
8. **Visualizador de PDF:** tela cheia `#3C4043`, barra `#111B21` com voltar, nome do arquivo e baixar. Páginas A4 com 794 px de largura, escaladas para caber (`zoom = (largura − 44) / 794`) e rolagem vertical.

## Roteiro da conversa (textos exatos no protótipo)
`intro → nome → prof → sexo → nasc → renda → whats → email → consent → gerando → fim`
- Validações e mensagens de nova tentativa:
  - Nome com menos de 2 palavras: "Pode me dizer o seu nome completo? Ele vai no seu estudo."
  - Data inválida: "Não reconheci essa data. Pode digitar no formato dd/mm/aaaa?"
  - Renda zero: "Pode informar a renda em reais? Por exemplo, R$ 5.500,00."
  - WhatsApp com menos de 10 dígitos: "Esse número parece incompleto. Pode digitar com DDD?"
  - E-mail inválido: "Esse e-mail não parece válido. Pode conferir?"
- Máscaras: data `dd/mm/aaaa`; renda em moeda (dígitos ÷ 100); WhatsApp `(00) 00000-0000`.
- Idade fora de 18–50: mensagem explicativa + cartão de consultoria. **Não grava como lead completo.** Grava com `status = Fora do perfil`, sem PDF e sem evento Lead no Meta.
- Tempo de "digitando": `min(1800, 550 + caracteres × 13)` ms. O cartão do PDF tem +1600 ms.
- Ao confirmar o consentimento: executar Turnstile → gerar PDF → `POST /api/lead` → só então mostrar o cartão do arquivo e as mensagens finais. Enquanto isso, fica o indicador "digitando".
- A mensagem final varia conforme os consentimentos (ver `confirmConsent()` no protótipo).

## Cálculo (copiar de `referencia/` ou do protótipo → `lib/calc.ts`, usado no cliente e no servidor)
- Faixa de idade: primeiro valor ≥ idade em [20, 25, 30, 35, 40, 45, 50].
- Renda base: primeiro valor ≥ renda em [4000, 6000, 8000, 10000]. Acima de 10.000, usa 10.000.
- Tabela `ESS[faixa][renda]` = prêmios mensais [vida, apoio, DIT, doenças graves, IPA, funeral]. `RVI[faixa]` = taxa por R$ 1.000 de renda.
- Renda por invalidez = 0,5 × renda base / 1000 × RVI[faixa].
- **Aporte na previdência fixo: R$ 85,00. Rentabilidade fixa: 10% a.a.** (taxa mensal = 1,10^(1/12) − 1).
- A projeção mês a mês até 45 anos avança a faixa com a idade. O mês de recuperação é o primeiro em que reserva ≥ total pago. O horizonte do gráfico é arredondado para cima em múltiplos de 5 anos, +5, com mínimo de 10 e máximo de 45.
- Capitais: vida 10× renda base; apoio R$ 1.000 (R$ 2.000 se vida ≥ 100 mil); DIT 80% da renda/mês; doenças graves mín(10× renda, 60.000); IPA mín(50× renda, 300.000); funeral R$ 5.500.

## Design tokens
- Cores: azul `#396C97`, azul escuro (hover) `#2C5578`, verde da marca `#7DB85A`, verde de ação/texto `#4E8A2E`, grafite `#4D4C4E`, texto `#111B21` / `#1F2A33` / `#2B3640`, secundário `#54656F` / `#5E6B76` / `#667781` / `#6B7782`, balão do usuário `#D9FDD3`, fundo do chat `#EFEAE2` (alternativo `#E6EDF2`), aviso `#FFEECD`, linhas `#E6EBF0` / `#DDE4EA` / `#E9EDEF`, destaque verde claro `#EAF4E3`, azul claro `#F2F6F9`.
- Tipografia: Nunito (700/800/900) para títulos e marca; Nunito Sans (400/600/700/800) para o texto. Tamanhos: 11, 12,5, 13, 14, 15, 16, 16,5 px.
- Raios: 5 (checkbox), 8 (balões/botões), 16 (bottom sheet), 24 (campo/pill), 50% (avatar/enviar).
- Sombra: `0 1px .5px rgba(11,20,26,.13)`.

## Assets
- `prototipo/assets/logo.png`: logo horizontal da Setor Norte (extraído do cotador original).
- `prototipo/assets/sym.png`: símbolo da marca (avatar e marca-d'água do PDF).
- Ícones: SVGs inline no protótipo (voltar, recomeçar, verificado, enviar, calendário, arquivo, download).

## Plano de implementação
1. Next.js + TS, fontes via `next/font/google` e cabeçalhos de segurança.
2. `lib/calc.ts` + testes (comparar 3 casos com o cotador original).
3. Conversa em React (máquina de estados por etapa), fiel ao protótipo.
4. Páginas do PDF + geração com html2canvas/jsPDF.
5. `/api/lead`: Turnstile → rate limit → zod → recálculo → Drive → Sheets → Resend (cliente) → CAPI.
6. Pixel + banner de cookies + captura de UTMs.
7. `/privacidade`.
8. Deploy na Vercel e domínio.

## Checklist de publicação
- [ ] Criar a planilha com a aba `Leads` e o cabeçalho acima e compartilhá-la com a conta de serviço (Editor).
- [ ] Google Cloud: criar projeto → ativar Google Sheets API → criar conta de serviço → gerar chave JSON.
- [ ] Resend: adicionar o domínio `setornorteseguros.com.br` e publicar os registros DNS indicados.
- [ ] Google Drive: criar o Drive compartilhado "Setor Norte – Leads" e a pasta "Estudos Blindagem", adicionar a conta de serviço como Gerente de conteúdo, ativar a **Google Drive API** no projeto do Cloud e copiar o ID da pasta.
- [ ] n8n: montar o fluxo da seção "Automação n8n" e testar com uma linha manual.
- [ ] Cloudflare Turnstile: criar o widget para `blindagem.setornorteseguros.com.br`.
- [ ] Meta: Gerenciador de Eventos → Pixel → Configurações → gerar o token da API de Conversões. Verificar o domínio no Business Manager.
- [ ] Upstash: criar o Redis (grátis) pela integração da Vercel.
- [ ] Vercel: importar o repositório, cadastrar as variáveis e adicionar o domínio. No DNS: `CNAME blindagem → cname.vercel-dns.com`.
- [ ] Testar um lead completo e conferir: PDF na pasta do Drive, linha na planilha com `pdf_url`, e-mail do cliente, mensagem do n8n, contato + negociação no RD CRM e Lead deduplicado no Meta.
- [ ] Remover `META_TEST_EVENT_CODE`.

## Arquivos
- `prototipo/Cotador Conversa.dc.html`: protótipo interativo (abrir no navegador com `support.js` e `assets/` ao lado).
- `referencia/cotador-blindagem-saude.html`: cotador original (tabelas, fórmulas, textos legais e PDF).
