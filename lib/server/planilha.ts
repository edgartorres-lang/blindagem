import "server-only";

// Proteção contra injeção de fórmula (README → Segurança, item 8):
// prefixa com ' qualquer texto que comece com = + - @. Com valueInputOption=USER_ENTERED,
// o Sheets trata o ' como marcador de texto e não o exibe.
export function sanitizar(v: string): string {
  return /^[=+\-@]/.test(v) ? `'${v}` : v;
}

/** Força texto (ex.: WhatsApp só com dígitos, que o Sheets converteria em número). */
export const comoTexto = (v: string) => `'${v}`;

/** Cabeçalho da aba Leads, na ordem do README. */
export const CABECALHO = [
  "data_hora",
  "lead_id",
  "nome",
  "profissao",
  "sexo",
  "nascimento",
  "idade",
  "renda",
  "whatsapp",
  "email",
  "total_mensal",
  "protecao_mensal",
  "recupera_em",
  "consent_email",
  "consent_whatsapp",
  "consent_texto_versao",
  "ip",
  "user_agent",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "pdf_url",
  "pdf_enviado",
  "status",
  "rd_crm_id",
] as const;

export type Coluna = (typeof CABECALHO)[number];
export type Linha = Record<Coluna, string | number>;

/** Converte a linha em array na ordem do cabeçalho, sanitizando textos. */
export function linhaParaValores(l: Linha): (string | number)[] {
  return CABECALHO.map((c) => {
    const v = l[c];
    return typeof v === "number" ? v : sanitizar(v);
  });
}

/** Letra da coluna (A, B, …, AB) a partir do índice 0-based. */
export function letraColuna(i: number): string {
  let s = "";
  let n = i + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
