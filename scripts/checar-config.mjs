// Confere a configuração das integrações antes do deploy (somente leitura, não imprime chaves).
//
//   npm run checar                      → usa .env.local
//   node --env-file=OUTRO scripts/checar-config.mjs
//   npm run checar -- --criar-cabecalho → grava o cabeçalho na aba Leads, se a linha 1 estiver vazia
//
// Não grava leads, não envia e-mail e não envia eventos ao Meta.

import { JWT } from "google-auth-library";

const CABECALHO = [
  "data_hora", "lead_id", "nome", "profissao", "sexo", "nascimento", "idade", "renda", "whatsapp", "email",
  "total_mensal", "protecao_mensal", "recupera_em", "consent_email", "consent_whatsapp", "consent_texto_versao",
  "ip", "user_agent", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid",
  "pdf_url", "pdf_enviado", "status", "rd_crm_id",
];

const OBRIGATORIAS = [
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_PRIVATE_KEY", "GOOGLE_SHEET_ID", "GOOGLE_DRIVE_FOLDER_ID",
  "RESEND_API_KEY", "MAIL_FROM",
  "NEXT_PUBLIC_META_PIXEL_ID", "META_CAPI_TOKEN",
  "LEAD_HASH_SALT",
];

const env = (n) => (process.env[n] ?? "").trim();
// Upstash: aceita os nomes da integração da Vercel (KV_REST_API_*).
const upstashUrl = env("UPSTASH_REDIS_REST_URL") || env("KV_REST_API_URL");
const upstashToken = env("UPSTASH_REDIS_REST_TOKEN") || env("KV_REST_API_TOKEN");
const criarCabecalho = process.argv.includes("--criar-cabecalho");
let falhas = 0;
const ok = (m) => console.log(`  ✔ ${m}`);
const erro = (m) => { falhas++; console.log(`  ✘ ${m}`); };
const aviso = (m) => console.log(`  ! ${m}`);
const titulo = (m) => console.log(`\n${m}`);

async function jsonDe(r) {
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { _texto: t.slice(0, 200) }; }
}

// ---------- 1. Variáveis ----------
titulo("1. Variáveis de ambiente");
for (const n of OBRIGATORIAS) (env(n) ? ok : erro)(`${n}${env(n) ? "" : " ausente"}`);
(upstashUrl && upstashToken ? ok : erro)(upstashUrl && upstashToken ? "Upstash (UPSTASH_REDIS_REST_* ou KV_REST_API_*)" : "Upstash ausente (UPSTASH_REDIS_REST_URL/TOKEN ou KV_REST_API_URL/TOKEN)");
if (env("META_TEST_EVENT_CODE")) aviso("META_TEST_EVENT_CODE está definido: os eventos vão para 'Testar eventos'. Remova após os testes.");
if (env("NEXT_PUBLIC_TURNSTILE_SITE_KEY").startsWith("1x000000")) aviso("Turnstile com chave de TESTE (use só em desenvolvimento).");
if (env("LEAD_HASH_SALT") && env("LEAD_HASH_SALT").length < 16) aviso("LEAD_HASH_SALT curto; use 16+ caracteres aleatórios.");

// ---------- 2. Google ----------
titulo("2. Google (conta de serviço, Planilha e Drive)");
let token = null;
if (env("GOOGLE_SERVICE_ACCOUNT_EMAIL") && env("GOOGLE_PRIVATE_KEY")) {
  try {
    const jwt = new JWT({
      email: env("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
      key: env("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/spreadsheets"],
    });
    token = (await jwt.getAccessToken()).token;
    ok("Chave da conta de serviço válida");
  } catch (e) {
    erro(`Não autenticou a conta de serviço: ${String(e.message).slice(0, 150)}`);
  }
}
const g = (url, init = {}) => fetch(url, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` } });

if (token && env("GOOGLE_SHEET_ID")) {
  const id = env("GOOGLE_SHEET_ID");
  const meta = await g(`https://sheets.googleapis.com/v4/spreadsheets/${id}?fields=properties.title,properties.locale,properties.timeZone,sheets.properties.title`);
  if (!meta.ok) {
    erro(`Planilha inacessível (HTTP ${meta.status}). Compartilhe-a com ${env("GOOGLE_SERVICE_ACCOUNT_EMAIL")} como Editor e ative a Google Sheets API.`);
  } else {
    const m = await jsonDe(meta);
    ok(`Planilha "${m.properties?.title}" acessível`);
    if (m.properties?.locale !== "pt_BR") aviso(`Localidade da planilha é ${m.properties?.locale}; use pt_BR (Arquivo → Configurações) para datas e números.`);
    if (m.properties?.timeZone !== "America/Belem") aviso(`Fuso da planilha é ${m.properties?.timeZone}; recomendado America/Belem.`);
    const abas = (m.sheets ?? []).map((s) => s.properties.title);
    if (!abas.includes("Leads")) {
      erro(`Aba "Leads" não encontrada (abas: ${abas.join(", ")}).`);
    } else {
      const r = await jsonDe(await g(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent("Leads!1:1")}`));
      const linha1 = r.values?.[0] ?? [];
      if (linha1.length === 0 && criarCabecalho) {
        const w = await g(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent("Leads!A1")}?valueInputOption=RAW`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ values: [CABECALHO] }),
        });
        (w.ok ? ok : erro)(w.ok ? "Cabeçalho gravado na linha 1 da aba Leads" : `Falha ao gravar cabeçalho (HTTP ${w.status})`);
      } else if (linha1.length === 0) {
        erro('Linha 1 da aba Leads está vazia. Rode: npm run checar -- --criar-cabecalho');
      } else if (JSON.stringify(linha1) === JSON.stringify(CABECALHO)) {
        ok("Cabeçalho da aba Leads confere (28 colunas, na ordem)");
      } else {
        const dif = CABECALHO.map((c, i) => (linha1[i] !== c ? `${i + 1}: esperado "${c}", encontrado "${linha1[i] ?? ""}"` : null)).filter(Boolean);
        erro(`Cabeçalho diferente do esperado:\n      ${dif.slice(0, 5).join("\n      ")}`);
      }
    }
  }
}

if (token && env("GOOGLE_DRIVE_FOLDER_ID")) {
  const r = await g(`https://www.googleapis.com/drive/v3/files/${env("GOOGLE_DRIVE_FOLDER_ID")}?supportsAllDrives=true&fields=name,mimeType,driveId,capabilities(canAddChildren)`);
  if (!r.ok) {
    erro(`Pasta do Drive inacessível (HTTP ${r.status}). Adicione a conta de serviço ao Drive compartilhado como Gerente de conteúdo e ative a Google Drive API.`);
  } else {
    const f = await jsonDe(r);
    if (f.mimeType !== "application/vnd.google-apps.folder") erro("GOOGLE_DRIVE_FOLDER_ID não é uma pasta.");
    else ok(`Pasta "${f.name}" acessível`);
    if (!f.driveId) erro('A pasta está no "Meu Drive". Ela precisa estar num Drive compartilhado (contas de serviço não têm cota própria).');
    else ok("Pasta está num Drive compartilhado");
    (f.capabilities?.canAddChildren ? ok : erro)(f.capabilities?.canAddChildren ? "Conta de serviço pode criar arquivos na pasta" : "Conta de serviço NÃO pode criar arquivos (precisa ser Gerente de conteúdo).");
  }
}

// ---------- 3. Resend ----------
titulo("3. Resend (e-mail)");
if (env("RESEND_API_KEY")) {
  const r = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}` } });
  const j = await jsonDe(r);
  if (r.status === 401 || r.status === 403) {
    aviso("A chave não tem permissão para listar domínios (chave 'Sending access'). Isso é normal; confira no painel se o domínio está 'Verified'.");
  } else if (!r.ok) {
    erro(`Chave do Resend inválida (HTTP ${r.status}).`);
  } else {
    const dominio = (env("MAIL_FROM").match(/@([^>\s]+)/) ?? [])[1];
    const d = (j.data ?? []).find((x) => x.name === dominio);
    if (!d) erro(`Domínio ${dominio} não cadastrado no Resend.`);
    else (d.status === "verified" ? ok : erro)(`Domínio ${dominio}: ${d.status}`);
  }
}

// ---------- 4. Turnstile ----------
titulo("4. Cloudflare Turnstile");
if (env("TURNSTILE_SECRET_KEY")) {
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret: env("TURNSTILE_SECRET_KEY"), response: "token-de-verificacao" }),
  });
  const j = await jsonDe(r);
  const codigos = j["error-codes"] ?? [];
  if (codigos.includes("invalid-input-secret")) erro("TURNSTILE_SECRET_KEY inválida.");
  else ok("Chave secreta do Turnstile reconhecida pela Cloudflare");
}

// ---------- 5. Meta ----------
titulo("5. Meta (Pixel + API de Conversões)");
if (env("NEXT_PUBLIC_META_PIXEL_ID") && env("META_CAPI_TOKEN")) {
  const r = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(env("NEXT_PUBLIC_META_PIXEL_ID"))}?fields=name&access_token=${encodeURIComponent(env("META_CAPI_TOKEN"))}`);
  const j = await jsonDe(r);
  if (r.ok && j.name) ok(`Pixel "${j.name}" acessível com o token da CAPI`);
  else erro(`Token/Pixel não conferem (HTTP ${r.status}: ${j.error?.message?.slice(0, 120) ?? ""}).`);
}

// ---------- 6. Upstash ----------
titulo("6. Upstash Redis (rate limit)");
if (upstashUrl && upstashToken) {
  try {
    const r = await fetch(`${upstashUrl.replace(/\/$/, "")}/ping`, { headers: { Authorization: `Bearer ${upstashToken}` } });
    const j = await jsonDe(r);
    (r.ok && j.result === "PONG" ? ok : erro)(r.ok && j.result === "PONG" ? "Redis respondeu PONG" : `Redis não respondeu (HTTP ${r.status}).`);
  } catch (e) {
    erro(`URL do Upstash inválida: ${String(e.message).slice(0, 100)}`);
  }
}

console.log(falhas ? `\n${falhas} problema(s) encontrado(s).` : "\nTudo certo.");
process.exit(falhas ? 1 : 0);
