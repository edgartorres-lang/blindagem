// Envio do lead ao servidor (lado do navegador): Turnstile → multipart (dados + PDF) → POST /api/lead.
// Nenhuma chave secreta aqui; só a site key pública do Turnstile.

import { CONSENT_VERSAO } from "./conversa";
import type { Profissao, Sexo } from "./profissoes";
import { obterTokenTurnstile } from "./turnstile-client";
import { lerUtms } from "./utm";

export interface DadosConversa {
  nome: string;
  prof: Profissao;
  sexo: Sexo;
  /** "dd/mm/aaaa" */
  nasc: string;
  idade: number;
  renda: number;
  /** "(00) 00000-0000" */
  whats: string;
  email: string;
}

export type ResultadoEnvio =
  | { ok: true; eventId: string; totalMensal: number }
  | { ok: false; motivo: "limite" | "erro" };

/** Contexto de medição (Pixel), preenchido na etapa 6. */
export interface ContextoMedicao {
  cookiesAceitos: boolean;
  fbp: string;
  fbc: string;
}

const lerCookie = (nome: string) =>
  document.cookie
    .split("; ")
    .find((c) => c.startsWith(nome + "="))
    ?.slice(nome.length + 1) ?? "";

/** fbp/fbc só com cookies aceitos. Sem o cookie _fbc, monta o fbc a partir do fbclid (formato fb.1.<ms>.<fbclid>). */
export function contextoMedicaoPadrao(cookiesAceitos: boolean): ContextoMedicao {
  if (!cookiesAceitos) return { cookiesAceitos, fbp: "", fbc: "" };
  const fbclid = lerUtms().fbclid;
  const fbc = lerCookie("_fbc") || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : "");
  return { cookiesAceitos, fbp: lerCookie("_fbp"), fbc };
}

export async function enviarLead(
  dados: DadosConversa,
  consent: { email: boolean; whatsapp: boolean },
  pdf: Blob,
  opcoes: { honeypot?: string; medicao?: ContextoMedicao; nomeArquivo?: string } = {},
): Promise<ResultadoEnvio> {
  const token = await obterTokenTurnstile();
  const eventId = crypto.randomUUID();
  const medicao = opcoes.medicao ?? contextoMedicaoPadrao(false);

  const payload = {
    nome: dados.nome,
    prof: dados.prof,
    sexo: dados.sexo,
    nasc: dados.nasc,
    renda: dados.renda,
    whats: dados.whats,
    email: dados.email,
    consentEmail: consent.email,
    consentWhats: consent.whatsapp,
    consentVersao: CONSENT_VERSAO,
    eventId,
    eventSourceUrl: window.location.origin + window.location.pathname,
    cookiesAceitos: medicao.cookiesAceitos,
    fbp: medicao.fbp,
    fbc: medicao.fbc,
    ...lerUtms(),
  };

  const fd = new FormData();
  fd.set("dados", JSON.stringify(payload));
  fd.set("pdf", new File([pdf], opcoes.nomeArquivo ?? "estudo.pdf", { type: "application/pdf" }));
  fd.set("turnstile", token);
  fd.set("empresa", opcoes.honeypot ?? "");

  const r = await fetch("/api/lead", { method: "POST", body: fd });
  if (r.status === 429) return { ok: false, motivo: "limite" };
  if (!r.ok) return { ok: false, motivo: "erro" };
  const j = (await r.json()) as { ok?: boolean; totalMensal?: number };
  if (!j.ok) return { ok: false, motivo: "erro" };
  return { ok: true, eventId, totalMensal: j.totalMensal ?? 0 };
}
