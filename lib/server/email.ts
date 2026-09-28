import "server-only";
import { AGENDA_URL } from "@/lib/conversa";
import { envObrigatoria } from "./env";

// E-mail ao cliente pelo Resend (README → Aviso ao cliente), com o PDF em anexo.

const SITE = "https://blindagem.setornorteseguros.com.br";
const DESCADASTRO = "mailto:edgartorres@setornorteseguros.com.br?subject=Descadastrar%20e-mail";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function htmlEmail(primeiroNome: string): string {
  const n = esc(primeiroNome);
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Seu Estudo de Blindagem Profissional</title></head>
<body style="margin:0;padding:0;background:#F2F6F9;font-family:'Nunito Sans','Segoe UI',Roboto,Arial,sans-serif;color:#1F2A33">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F6F9;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:10px;overflow:hidden">
<tr><td style="height:6px;background:#396C97;font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:24px 28px 8px"><img src="${SITE}/logo.png" alt="Setor Norte Seguros" height="40" style="height:40px;width:auto;border:0"></td></tr>
<tr><td style="padding:8px 28px 4px;font-size:15px;line-height:1.6;color:#2B3640">
<p style="margin:0 0 12px;font-size:18px;font-weight:800;color:#396C97">Olá, ${n}!</p>
<p style="margin:0 0 12px">Segue em anexo o seu Estudo de Blindagem Profissional da Saúde.</p>
<p style="margin:0 0 20px">Na consultoria gratuita, o corretor Edgar Torres revisa cada proteção com você.</p>
</td></tr>
<tr><td style="padding:0 28px 28px"><a href="${AGENDA_URL}" style="display:inline-block;background:#4E8A2E;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:24px">Agendar consultoria</a></td></tr>
<tr><td style="padding:16px 28px 22px;border-top:1px solid #DDE4EA;font-size:11px;line-height:1.5;color:#6B7782">
Torres Norte Corretora de Seguros Ltda · CNPJ 11.903.619/0001-22 · SUSEP 202087923<br>
www.setornorteseguros.com.br<br>
Você recebeu este e-mail porque autorizou o envio do estudo. <a href="${DESCADASTRO}" style="color:#396C97">Não quero mais receber e-mails</a>.
</td></tr>
</table></td></tr></table></body></html>`;
}

export function textoEmail(primeiroNome: string): string {
  return [
    `Olá, ${primeiroNome}!`,
    "",
    "Segue em anexo o seu Estudo de Blindagem Profissional da Saúde. Na consultoria gratuita, o corretor Edgar Torres revisa cada proteção com você.",
    "",
    `Agendar consultoria: ${AGENDA_URL}`,
    "",
    "Torres Norte Corretora de Seguros Ltda · CNPJ 11.903.619/0001-22 · SUSEP 202087923",
    "Para não receber mais e-mails, responda com a palavra DESCADASTRAR.",
  ].join("\n");
}

export async function enviarEmailEstudo(p: { para: string; primeiroNome: string; anexoNome: string; pdf: Uint8Array }) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${envObrigatoria("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: envObrigatoria("MAIL_FROM"),
      to: [p.para],
      subject: `Seu Estudo de Blindagem Profissional, ${p.primeiroNome}`,
      html: htmlEmail(p.primeiroNome),
      text: textoEmail(p.primeiroNome),
      headers: { "List-Unsubscribe": `<${DESCADASTRO}>` },
      attachments: [{ filename: p.anexoNome, content: Buffer.from(p.pdf).toString("base64") }],
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
}
