// Formatação pt-BR (igual ao cotador original e ao protótipo).

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** R$ 1.234,56 */
export const brl = (v: number) => (Number.isFinite(v) ? BRL.format(v) : "—");

/** R$ 1.235 (sem centavos quando redondo) */
export const brl0 = (v: number) => BRL.format(Math.round(v)).replace(/,00$/, "");

/** Capital de uma cobertura: "R$ 4.800/mês" ou "R$ 60.000". */
export const capitalTxt = (valor: number, mensal: boolean) => brl0(valor) + (mensal ? "/mês" : "");

/** 12,3% */
export const pct1 = (v: number) =>
  (v * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";

/** Primeiro nome. */
export const primeiroNome = (n: string) => (n || "").trim().split(/\s+/)[0] || "";
