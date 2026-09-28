# Deploy e teste de ponta a ponta

Guia para publicar o cotador em **blindagem.setornorteseguros.com.br** e conferir que tudo funciona.
Siga na ordem. Cada parte termina com uma verificação.

> **Nunca** cole chaves no chat, em e-mail ou no código. Elas vão só no `.env.local` (seu computador) e em
> Vercel → Settings → Environment Variables.

---

## Parte A — Preparar os serviços

### A1. Google Cloud (conta de serviço)
1. Acesse <https://console.cloud.google.com> com a conta do Google Workspace da Setor Norte.
2. Crie um projeto (ex.: `cotador-blindagem`).
3. **APIs e serviços → Biblioteca**: ative **Google Sheets API** e **Google Drive API**.
4. **IAM e administrador → Contas de serviço → Criar conta de serviço** (ex.: `cotador-leads`). Não precisa de papel no projeto.
5. Abra a conta criada → **Chaves → Adicionar chave → JSON**. Guarde o arquivo em local seguro.
6. Do JSON você vai usar:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY` (cole o valor inteiro, com os `\n`, entre aspas no `.env.local`)

### A2. Google Drive (PDFs)
1. No Drive, crie o **Drive compartilhado** “Setor Norte – Leads” (não pode ser o “Meu Drive”).
2. Dentro dele, crie a pasta **Estudos Blindagem**.
3. No Drive compartilhado → **Gerenciar membros** → adicione o `client_email` da conta de serviço como **Gerente de conteúdo**.
4. Abra a pasta e copie o ID da URL (`drive.google.com/drive/folders/`**`ESTE_ID`**) → `GOOGLE_DRIVE_FOLDER_ID`.
5. Adicione como membros quem precisa ver os estudos (o corretor). **Não** crie link público.

### A3. Google Planilhas (leads)
1. Crie a planilha e renomeie a primeira aba para **`Leads`** (exatamente assim).
2. **Arquivo → Configurações**: Localidade **Brasil** e Fuso horário **(GMT-03:00) Belém**.
3. **Compartilhar** → `client_email` da conta de serviço como **Editor**.
4. Copie o ID da URL (`docs.google.com/spreadsheets/d/`**`ESTE_ID`**`/edit`) → `GOOGLE_SHEET_ID`.
5. O cabeçalho é gravado pelo checador (passo A8) com `npm run checar -- --criar-cabecalho`.
6. Depois do cabeçalho, na coluna **AA (`status`)**: **Dados → Validação de dados → Menu suspenso** com
   `Novo, Contatado, Agendado, Fechado, Perdido` (aplique de AA2 para baixo).
7. Opcional: formate `renda`, `total_mensal` e `protecao_mensal` (H, K, L) como moeda.

### A4. Resend (e-mail ao cliente)
1. <https://resend.com> → **Domains → Add domain** → `setornorteseguros.com.br`.
2. Publique no DNS (cPanel → **Zone Editor**) os registros que o Resend mostrar (DKIM `resend._domainkey`,
   e SPF/MX no subdomínio `send`). Eles **não** mexem no e-mail atual da empresa.
3. Aguarde o status **Verified**.
4. **API Keys → Create** com permissão **Sending access** restrita ao domínio → `RESEND_API_KEY`.
5. `MAIL_FROM` = `Setor Norte Seguros <estudo@setornorteseguros.com.br>`.
6. Respostas ao e-mail vão para `estudo@`. Se essa caixa não existir, crie um alias para o corretor
   (o link de descadastro já aponta para `edgartorres@`).

### A5. Cloudflare Turnstile (anti-robô)
1. <https://dash.cloudflare.com> → **Turnstile → Add widget**.
2. Nome: `Cotador Blindagem`. **Widget mode: Invisible**.
3. Hostnames: `blindagem.setornorteseguros.com.br` e o endereço provisório da Vercel (`<projeto>.vercel.app`, que você terá na Parte B).
4. Copie **Site key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e **Secret key** → `TURNSTILE_SECRET_KEY`.
5. No `.env.local` (seu computador) mantenha as **chaves de teste** que já estão lá; as reais só funcionam nos hostnames acima.

### A6. Meta (Pixel + API de Conversões)
1. **Gerenciador de Eventos** → seu Pixel → copie o ID → `NEXT_PUBLIC_META_PIXEL_ID`.
2. **Configurações → API de Conversões → Gerar token de acesso** → `META_CAPI_TOKEN`.
3. **Testar eventos** → copie o código (ex.: `TEST12345`) → `META_TEST_EVENT_CODE` (só durante os testes).
4. **Business Manager → Segurança da marca → Domínios**: verifique `setornorteseguros.com.br` (de preferência por registro TXT no DNS).

### A7. Upstash (limite de envios)
Crie depois do projeto na Vercel (Parte B, passo B5). Nada a fazer agora.

### A8. Verificação local (antes do deploy)
1. Preencha o `.env.local` com os valores reais de Google, Resend e Meta (mantenha o Turnstile de teste).
2. Rode:
   ```bash
   npm run checar -- --criar-cabecalho
   ```
3. Esperado: tudo ✔, exceto o aviso do Turnstile de teste e o Upstash (ainda não criado).
4. Opcional, teste local real: `npm run dev`, faça um lead em <http://localhost:3000> e confira planilha, Drive e e-mail.

---

## Parte B — Vercel e domínio

### B1. Importar o projeto
1. <https://vercel.com> → **Add New → Project** → conecte o GitHub e importe `edgartorres-lang/blindagem`.
2. Framework: **Next.js** (detectado). Não altere Build/Output.

### B2. Variáveis de ambiente
Em **Settings → Environment Variables**, cadastre para **Production** e **Preview**:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | chaves **reais** do Turnstile (A5) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` | do JSON (A1). A chave pode ser colada com quebras de linha reais ou com `\n` |
| `GOOGLE_SHEET_ID` / `GOOGLE_DRIVE_FOLDER_ID` | A3 / A2 |
| `RESEND_API_KEY` / `MAIL_FROM` | A4 |
| `NEXT_PUBLIC_META_PIXEL_ID` / `META_CAPI_TOKEN` | A6 |
| `META_TEST_EVENT_CODE` | A6 — **só durante os testes** |
| `LEAD_HASH_SALT` | texto aleatório longo (use um novo, diferente do `.env.local`) |

Para gerar o `LEAD_HASH_SALT`:
```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

### B3. Primeiro deploy
1. **Deploy**. Ao terminar, anote o endereço `https://<projeto>.vercel.app`.
2. Confirme que esse endereço está nos hostnames do Turnstile (A5, passo 3).

### B4. Região
O `vercel.json` fixa as funções em **São Paulo (`gru1`)**. Confira em **Settings → Functions**.

### B5. Upstash
1. Na Vercel: **Storage → Create Database → Upstash (Redis)** → plano gratuito → região São Paulo → conecte ao projeto.
2. A integração cria as variáveis sozinha (`KV_REST_API_URL`/`KV_REST_API_TOKEN` ou `UPSTASH_REDIS_REST_*` — o código aceita as duas).
3. **Deployments → ⋯ → Redeploy**.

### B6. Domínio
1. **Settings → Domains → Add** → `blindagem.setornorteseguros.com.br`.
2. A Vercel mostra um **CNAME**. No cPanel → **Zone Editor** → adicione:
   `CNAME` · nome `blindagem` · destino = valor mostrado pela Vercel (ex.: `cname.vercel-dns.com`).
3. Aguarde o domínio ficar **Valid** (minutos a algumas horas). O HTTPS é emitido automaticamente.

### B7. n8n
Monte o fluxo da seção “Automação n8n” do `README.md` (gatilho na aba `Leads`, filtro `status = Novo` e
`rd_crm_id` vazio, mensagem ao corretor, RD Station CRM e gravação do `rd_crm_id`).
Link `wa.me` **somente** quando `consent_whatsapp = SIM`.

---

## Parte C — Teste de ponta a ponta

**Antes de começar**
- `META_TEST_EVENT_CODE` cadastrado e a tela **Gerenciador de Eventos → Testar eventos** aberta.
- Use um e-mail e um WhatsApp seus.
- Faça os testes no celular (Safari no iPhone e/ou Chrome no Android) e no computador.

### C1. Fluxo completo (e-mail + WhatsApp autorizados, cookies aceitos)
1. Abra `https://blindagem.setornorteseguros.com.br/?utm_source=teste&utm_medium=cpc&utm_campaign=e2e&fbclid=TESTE123`.
2. Aparece o aviso de cookies → **Aceitar**. *Meta: `PageView` (Navegador).*
3. **Vamos começar**. *Meta: `ViewContent`.*
4. Teste as validações: nome com uma palavra, data `31/02/1990`, WhatsApp incompleto e e-mail sem domínio → cada uma mostra a mensagem de nova tentativa.
5. Complete com dados válidos: renda **R$ 6.000,00** e uma data de nascimento que dê **30 anos**.
6. Marque **as duas** autorizações → **Confirmar**.

**Na conversa**
- [ ] Fica “digitando…” alguns segundos e aparece o cartão do PDF (“3 páginas · PDF · ~900 kB”).
- [ ] Mensagem: “Enviei uma cópia para *seu e-mail*. O corretor *Edgar Torres* vai falar com você pelo WhatsApp *número*.”
- [ ] Cartão de consultoria: **Agendar consultoria** abre a agenda; **Abrir meu estudo** abre o visualizador.
- [ ] No estudo: página 2 com **R$ 255,70** de investimento mensal e página 3 com **28a 4m**. O botão de download baixa o PDF.

**No Google Drive**
- [ ] Pasta `AAAA-MM` criada dentro de “Estudos Blindagem”.
- [ ] Arquivo `AAAAMMDD-hhmm - Nome - <lead_id>.pdf`, sem link público.

**Na planilha (aba Leads)**
- [ ] Uma linha nova e completa: `data_hora` no horário de Belém, `profissao`, `idade 30`, `renda 6000`,
  `total_mensal 255,7`, `protecao_mensal 170,7`, `recupera_em 28a 4m`, `consent_email SIM`, `consent_whatsapp SIM`,
  `consent_texto_versao 2026-09-27`, `utm_source teste`, `utm_campaign e2e`, `fbclid TESTE123`, `pdf_url` com link,
  `status Novo`.
- [ ] `pdf_enviado` passa de `PENDENTE` para **SIM** em poucos segundos.

**No e-mail**
- [ ] Assunto “Seu Estudo de Blindagem Profissional, *Nome*”, com o PDF anexado, botão **Agendar consultoria** e rodapé com CNPJ/SUSEP e link de descadastro.
- [ ] Chegou na caixa de entrada (não no spam). Em “Mostrar original”, SPF e DKIM = PASS.

**No Meta (Testar eventos)**
- [ ] `Lead` com **Navegador** e **Servidor**, marcado como **deduplicado**, valor **255,7 BRL**.

**No n8n / RD Station**
- [ ] O corretor recebeu a mensagem com o link `wa.me`.
- [ ] Contato e negociação criados no funil “Blindagem Saúde”; `rd_crm_id` preenchido na planilha.

### C2. Só e-mail autorizado
- [ ] Mensagem final só com o e-mail. Planilha: `consent_whatsapp NÃO`. Mensagem do n8n **sem** link `wa.me`.

### C3. Nenhuma autorização
- [ ] Mensagem “Toque no arquivo para abrir ou baixar.” Nenhum e-mail. Planilha: `pdf_enviado NÃO`.

### C4. Cookies recusados (janela anônima)
- [ ] **Recusar** → nenhum `PageView`/`ViewContent` no Meta.
- [ ] Ao concluir: `Lead` aparece **só como Servidor**.

### C5. Fora do perfil
- [ ] Data de nascimento de alguém com mais de 50 anos → mensagem explicativa + cartão de consultoria; campo de digitação travado.
- [ ] **Nenhuma** linha nova na planilha e nenhum evento `Lead`.

### C6. Limite de envios (opcional)
- [ ] Do mesmo aparelho/rede, o 6º lead dentro de 1 hora mostra “Recebemos muitas solicitações deste dispositivo…”.
  Para liberar antes: Upstash → Data Browser → apague as chaves `cotador:rl:*`.

### C7. Segurança
- [ ] <https://securityheaders.com> com o endereço do site → nota **A** ou superior.
- [ ] `POST` sem verificação é recusado:
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://blindagem.setornorteseguros.com.br/api/lead
  ```
  Esperado: `400` ou `403`.
- [ ] <https://blindagem.setornorteseguros.com.br/privacidade> abre (também pelo link do cartão de autorização).
- [ ] Vercel → **Logs**: as linhas do `/api/lead` mostram só `etapa` e `lead_id`, sem nome, e-mail ou telefone.

### C8. Encerramento dos testes
1. Vercel → apague `META_TEST_EVENT_CODE` → **Redeploy**.
2. Apague as linhas de teste da planilha, os PDFs de teste no Drive e os contatos/negociações de teste no RD.

---

## Problemas comuns

| Sintoma | Onde olhar / o que fazer |
|---|---|
| “Não consegui enviar agora…” | Vercel → Logs → `etapa: "sheets"`. Em geral: aba não se chama `Leads`, planilha não compartilhada com a conta de serviço ou Sheets API desativada. Rode `npm run checar`. |
| Linha gravada mas `pdf_url` vazio | Log `etapa: "drive"`. Conta de serviço sem papel de Gerente de conteúdo, pasta fora de Drive compartilhado ou Drive API desativada. |
| Fica “digitando…” e depois erro, sem nada no log | Turnstile: o hostname do site não está no widget, ou a site key não é a do widget. |
| E-mail não chega | Resend → **Emails** (status do envio) e domínio **Verified**. Planilha mostra `pdf_enviado ERRO`. |
| `Lead` não deduplica no Meta | O evento do navegador só existe com cookies aceitos; os dois precisam do mesmo `event_id` (automático). Confira se o Pixel ID é o mesmo nas duas pontas. |
| Chave do Google “DECODER routines::unsupported” | `GOOGLE_PRIVATE_KEY` colada pela metade ou sem as linhas `BEGIN/END PRIVATE KEY`. |

## Comandos úteis
```bash
npm run dev
```
```bash
npm test
```
```bash
npm run checar
```
