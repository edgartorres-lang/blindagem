// Envio do lead ao servidor (lado do navegador).
// ETAPA 3: stub que simula o POST. Na etapa 5 passa a chamar /api/lead (Turnstile + multipart com o PDF).

import type { Profissao, Sexo } from "./profissoes";

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

export type ResultadoEnvio = { ok: true } | { ok: false; motivo: "limite" | "erro" };

export async function enviarLead(
  _dados: DadosConversa,
  _consent: { email: boolean; whatsapp: boolean },
  _pdf: Blob,
): Promise<ResultadoEnvio> {
  await new Promise((r) => setTimeout(r, 900));
  // Só no stub: ?simular=erro ou ?simular=limite para testar as mensagens de falha.
  const simular = new URLSearchParams(window.location.search).get("simular");
  if (simular === "erro") return { ok: false, motivo: "erro" };
  if (simular === "limite") return { ok: false, motivo: "limite" };
  return { ok: true };
}
