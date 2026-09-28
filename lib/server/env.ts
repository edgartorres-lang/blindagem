import "server-only";

// Variáveis de ambiente do servidor. Lidas sob demanda (nunca no módulo), para o build não depender delas.

export const emProducao = process.env.NODE_ENV === "production";

export function env(nome: string): string | undefined {
  const v = process.env[nome];
  return v && v.trim() ? v.trim() : undefined;
}

export function envObrigatoria(nome: string): string {
  const v = env(nome);
  if (!v) throw new Error(`Variável de ambiente ausente: ${nome}`);
  return v;
}

/** Log sem dados pessoais (README → LGPD): só etapa, lead_id e mensagens técnicas. */
export function log(etapa: string, info: Record<string, string | number | boolean | undefined> = {}) {
  console.log(JSON.stringify({ app: "cotador", etapa, ...info }));
}

export function logErro(etapa: string, err: unknown, info: Record<string, string | number | undefined> = {}) {
  const msg = err instanceof Error ? err.message : String(err);
  // Corta a mensagem para não vazar corpos de resposta longos (que podem conter dados do lead).
  console.error(JSON.stringify({ app: "cotador", etapa, erro: msg.slice(0, 300), ...info }));
}
