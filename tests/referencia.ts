// Carrega o motor de cálculo ORIGINAL de referencia/cotador-blindagem-saude.html num sandbox (node:vm),
// para os testes compararem lib/calc.ts com o código de verdade do cotador, e não com números digitados.
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

export interface MotorReferencia {
  ESS: Record<string, Record<string, number[]>>;
  RVI: Record<string, number>;
  APORTE_MIN: number;
  bandOf: (idade: number) => number;
  rendaBase: (renda: number) => number;
  riscoMensal: (idade: number, R: number) => number;
  coberturas: (b: number, R: number) => {
    ess: { k: string; cap: string; v?: number; m: number }[];
    atit: { k: string; cap: string; v: number; m: number }[];
  };
  simular: (idade: number, R: number, A: number, rate: number) => {
    anos: { a: number; pago: number; res: number }[];
    payM: number | null;
  };
}

function trecho(html: string, inicio: string, fim: string) {
  const i = html.indexOf(inicio);
  const j = html.indexOf(fim, i);
  if (i < 0 || j < 0) throw new Error(`Trecho não encontrado na referência: ${inicio}`);
  return html.slice(i, j);
}

export function carregarMotorReferencia(): MotorReferencia {
  const html = readFileSync(path.join(__dirname, "..", "referencia", "cotador-blindagem-saude.html"), "utf8");
  const codigo = [
    trecho(html, "// Prêmios mensais Icatu Essencial", '$("rentab")'),
    trecho(html, "// ===== Motor de cálculo =====", "// ===== Gráfico"),
    "globalThis.__ref = { ESS, RVI, APORTE_MIN, bandOf, rendaBase, riscoMensal, coberturas, simular };",
  ].join("\n");
  const ctx = vm.createContext({ Intl, Math, Number, String, isFinite });
  vm.runInContext(codigo, ctx);
  return (ctx as unknown as { __ref: MotorReferencia }).__ref;
}
