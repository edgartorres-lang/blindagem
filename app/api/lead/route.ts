// POST /api/lead
// Ordem (README): Turnstile → rate limit → zod → recálculo → Drive → Sheets (obrigatório) → Resend e CAPI (allSettled).

import { calcularEstudo, centavos, recuperaEm } from "@/lib/calc";
import { aaaammddBelem, anoMesBelem, carimboBelem, dataCivilAAAAMMDD, dataHoraBelem, formatarDataBR } from "@/lib/datas";
import { nomeArquivoEstudo } from "@/lib/estudo";
import { primeiroNome } from "@/lib/format";
import { tituloProfissao } from "@/lib/profissoes";
import { esquemaLead } from "@/lib/validacao";
import { enviarLeadCapi } from "@/lib/server/capi";
import { enviarEmailEstudo } from "@/lib/server/email";
import { emProducao, env, log, logErro } from "@/lib/server/env";
import { atualizarCelula, gravarLinha, salvarPdfNoDrive } from "@/lib/server/google";
import { gerarLeadId } from "@/lib/server/lead-id";
import { comoTexto, type Linha } from "@/lib/server/planilha";
import { dentroDoLimite } from "@/lib/server/ratelimit";
import { validarTurnstile } from "@/lib/server/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PDF_MAX = 3 * 1024 * 1024;

const json = (status: number, body: Record<string, unknown>) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function ipDe(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return (xff?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "").trim() || "desconhecido";
}

/** Em desenvolvimento, integrações sem variáveis configuradas são puladas (com log) em vez de falhar. */
const configurado = (...nomes: string[]) => nomes.every((n) => env(n));
const pular = (integracao: string) => {
  log("dev", { aviso: `${integracao} não configurado; etapa pulada (só em desenvolvimento)` });
};

export async function POST(req: Request) {
  const ip = ipDe(req);
  const userAgent = (req.headers.get("user-agent") ?? "").slice(0, 300);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json(400, { ok: false, erro: "formato" });
  }

  // 1) Turnstile — antes de qualquer outra ação.
  try {
    const ok = await validarTurnstile(String(form.get("turnstile") ?? ""), ip === "desconhecido" ? undefined : ip);
    if (!ok) return json(403, { ok: false, erro: "verificacao" });
  } catch (e) {
    logErro("turnstile", e);
    return json(500, { ok: false, erro: "verificacao" });
  }

  // 2) Rate limit por IP.
  try {
    if (!(await dentroDoLimite(ip))) return json(429, { ok: false, erro: "limite" });
  } catch (e) {
    logErro("ratelimit", e); // Upstash fora do ar não deve derrubar a captação.
  }

  // Honeypot: campo oculto "empresa" preenchido = robô. Responde 200 e descarta.
  if (String(form.get("empresa") ?? "").trim()) {
    log("honeypot");
    return json(200, { ok: true });
  }

  // 3) Validação (zod) — idade recalculada no servidor.
  let dadosBrutos: unknown;
  try {
    dadosBrutos = JSON.parse(String(form.get("dados") ?? ""));
  } catch {
    return json(400, { ok: false, erro: "dados" });
  }
  const parsed = esquemaLead.safeParse(dadosBrutos);
  if (!parsed.success) {
    log("validacao", { campos: parsed.error.issues.map((i) => i.path.join(".")).join(",") });
    return json(400, { ok: false, erro: "dados" });
  }
  const d = parsed.data;

  // PDF do cliente: só application/pdf, até 3 MB, com assinatura %PDF-.
  const arquivo = form.get("pdf");
  if (!(arquivo instanceof File) || arquivo.type !== "application/pdf" || arquivo.size === 0 || arquivo.size > PDF_MAX) {
    return json(400, { ok: false, erro: "pdf" });
  }
  const pdf = new Uint8Array(await arquivo.arrayBuffer());
  if (new TextDecoder().decode(pdf.subarray(0, 5)) !== "%PDF-") return json(400, { ok: false, erro: "pdf" });

  // 4) Recálculo no servidor — os valores gravados e enviados vêm daqui, nunca do cliente.
  const estudo = calcularEstudo(d.idade, d.renda);
  const agora = new Date();
  const dataHora = dataHoraBelem(agora);
  const leadId = gerarLeadId(d.email, dataHora);
  const profissao = tituloProfissao(d.prof, d.sexo);
  log("lead_recebido", { lead_id: leadId });

  // 5) Drive — se falhar, segue com pdf_url vazio.
  let pdfUrl = "";
  if (!emProducao && !configurado("GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_PRIVATE_KEY", "GOOGLE_DRIVE_FOLDER_ID")) pular("Google Drive");
  else {
    try {
      const nomeDrive = `${carimboBelem(agora)} - ${d.nome.replace(/[\\/:*?"<>|]/g, "")} - ${leadId}.pdf`;
      const f = await salvarPdfNoDrive(pdf, nomeDrive, anoMesBelem(agora), { lead_id: leadId, profissao });
      pdfUrl = f.webViewLink ?? "";
      log("drive_ok", { lead_id: leadId });
    } catch (e) {
      logErro("drive", e, { lead_id: leadId });
    }
  }

  // 6) Sheets — obrigatório. Linha gravada uma única vez, já completa.
  const linha: Linha = {
    data_hora: dataHora,
    lead_id: leadId,
    nome: d.nome,
    profissao,
    sexo: d.sexo,
    nascimento: formatarDataBR(d.nascCivil),
    idade: d.idade,
    renda: centavos(d.renda),
    whatsapp: comoTexto(d.whats),
    email: d.email,
    total_mensal: centavos(estudo.totalMensal),
    protecao_mensal: centavos(estudo.protecaoMensal),
    recupera_em: recuperaEm(estudo.payM),
    consent_email: d.consentEmail ? "SIM" : "NÃO",
    consent_whatsapp: d.consentWhats ? "SIM" : "NÃO",
    consent_texto_versao: d.consentVersao,
    ip,
    user_agent: userAgent,
    utm_source: d.utm_source,
    utm_medium: d.utm_medium,
    utm_campaign: d.utm_campaign,
    utm_content: d.utm_content,
    utm_term: d.utm_term,
    fbclid: d.fbclid,
    pdf_url: pdfUrl,
    pdf_enviado: d.consentEmail ? "PENDENTE" : "NÃO",
    status: "Novo",
    rd_crm_id: "",
  };

  let numLinha: number | null = null;
  if (!emProducao && !configurado("GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_PRIVATE_KEY", "GOOGLE_SHEET_ID")) pular("Google Sheets");
  else {
    try {
      numLinha = await gravarLinha(linha);
      log("sheets_ok", { lead_id: leadId, linha: numLinha ?? undefined });
    } catch (e) {
      logErro("sheets", e, { lead_id: leadId });
      return json(500, { ok: false, erro: "planilha" });
    }
  }

  // 7) Resend (se autorizou e-mail) e CAPI, em paralelo; falhas não afetam a resposta.
  const tarefas: Promise<void>[] = [];

  if (d.consentEmail) {
    if (!emProducao && !configurado("RESEND_API_KEY", "MAIL_FROM")) pular("Resend");
    else
      tarefas.push(
        (async () => {
          let status = "SIM";
          try {
            await enviarEmailEstudo({
              para: d.email,
              primeiroNome: primeiroNome(d.nome),
              anexoNome: nomeArquivoEstudo(d.nome, aaaammddBelem(agora)),
              pdf,
            });
            log("email_ok", { lead_id: leadId });
          } catch (e) {
            status = "ERRO";
            logErro("email", e, { lead_id: leadId });
          }
          if (numLinha) await atualizarCelula(numLinha, "pdf_enviado", status).catch((e) => logErro("sheets_pdf_enviado", e, { lead_id: leadId }));
        })(),
      );
  }

  if (!emProducao && !configurado("NEXT_PUBLIC_META_PIXEL_ID", "META_CAPI_TOKEN")) pular("Meta CAPI");
  else
    tarefas.push(
      enviarLeadCapi({
        eventId: d.eventId,
        eventSourceUrl: d.eventSourceUrl || req.headers.get("referer") || "https://blindagem.setornorteseguros.com.br/",
        email: d.email,
        whats: d.whats,
        nome: d.nome,
        sexo: d.sexo,
        nascimento: dataCivilAAAAMMDD(d.nascCivil),
        ip: ip === "desconhecido" ? undefined : ip,
        userAgent,
        fbp: d.cookiesAceitos ? d.fbp || undefined : undefined,
        fbc: d.cookiesAceitos ? d.fbc || undefined : undefined,
        valor: centavos(estudo.totalMensal),
        profissao,
      })
        .then(() => log("capi_ok", { lead_id: leadId }))
        .catch((e) => logErro("capi", e, { lead_id: leadId })),
    );

  await Promise.allSettled(tarefas);
  return json(200, { ok: true, leadId, totalMensal: centavos(estudo.totalMensal) });
}
