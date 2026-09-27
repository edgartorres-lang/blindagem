// Motor de cálculo do Estudo de Blindagem.
// Fonte de verdade: referencia/cotador-blindagem-saude.html (ESS, RVI, riscoMensal, coberturas, simular).
// Código puro (sem DOM, sem Node): é importado pela conversa no navegador e pelo /api/lead no servidor.

export type Faixa = 20 | 25 | 30 | 35 | 40 | 45 | 50;
export type RendaBase = 4000 | 6000 | 8000 | 10000;
/** Prêmios mensais Icatu Essencial: [vida, apoio financeiro, DIT, doenças graves, IPA, funeral (SAF)] */
export type Premios = readonly [number, number, number, number, number, number];

export const FAIXAS: readonly Faixa[] = [20, 25, 30, 35, 40, 45, 50];
export const RENDAS: readonly RendaBase[] = [4000, 6000, 8000, 10000];

/** Aporte mensal fixo na previdência (Atitude+Simples). */
export const APORTE = 85;
/** Rentabilidade fixa ao ano. */
export const RENTABILIDADE = 0.1;
/** Horizonte máximo da projeção, em anos. */
export const HMAX = 45;
export const IDADE_MIN = 18;
export const IDADE_MAX = 50;

// Prêmios mensais Icatu Essencial por faixa etária e renda-base (gerado a partir da referência).
export const ESS: Record<Faixa, Record<RendaBase, Premios>> = {
  20: {
    4000: [3.18, 2.56, 34.86, 3.5, 11.69, 0.44],
    6000: [4.77, 2.56, 52.28, 5.25, 17.53, 0.44],
    8000: [6.35, 2.56, 69.71, 5.25, 17.53, 0.44],
    10000: [7.94, 9.89, 87.14, 5.25, 17.53, 0.44],
  },
  25: {
    4000: [3.93, 2.58, 37.72, 5.14, 11.69, 0.54],
    6000: [5.9, 2.58, 56.58, 7.71, 17.53, 0.54],
    8000: [7.87, 2.58, 75.45, 7.71, 17.53, 0.54],
    10000: [9.83, 9.92, 94.31, 7.71, 17.53, 0.54],
  },
  30: {
    4000: [4.83, 2.6, 43.59, 8.34, 11.69, 0.66],
    6000: [7.25, 2.6, 65.38, 12.51, 17.53, 0.66],
    8000: [9.66, 2.6, 87.17, 12.51, 17.53, 0.66],
    10000: [12.08, 9.97, 108.97, 12.51, 17.53, 0.66],
  },
  35: {
    4000: [5.81, 2.62, 50.92, 14.7, 11.69, 0.8],
    6000: [8.72, 2.62, 76.38, 22.05, 17.53, 0.8],
    8000: [11.63, 2.62, 101.85, 22.05, 17.53, 0.8],
    10000: [14.54, 10.02, 127.31, 22.05, 17.53, 0.8],
  },
  40: {
    4000: [8.39, 2.69, 63.56, 22.83, 11.69, 1.15],
    6000: [12.58, 2.69, 95.34, 34.24, 17.53, 1.15],
    8000: [16.78, 2.69, 127.12, 34.24, 17.53, 1.15],
    10000: [20.97, 10.15, 158.9, 34.24, 17.53, 1.15],
  },
  45: {
    4000: [15.1, 2.86, 85.28, 38.17, 11.69, 2.08],
    6000: [22.65, 2.86, 127.91, 57.25, 17.53, 2.08],
    8000: [30.2, 2.86, 170.55, 57.25, 17.53, 2.08],
    10000: [37.75, 10.48, 213.19, 57.25, 17.53, 2.08],
  },
  50: {
    4000: [25.68, 3.12, 118.7, 61.07, 11.69, 3.53],
    6000: [38.52, 3.12, 178.05, 91.61, 17.53, 3.53],
    8000: [51.36, 3.12, 237.4, 91.61, 17.53, 3.53],
    10000: [64.19, 11.01, 296.75, 91.61, 17.53, 3.53],
  },
};

/** Taxa mensal por R$ 1.000 de Renda Vitalícia por Invalidez (Atitude+Simples). */
export const RVI: Record<Faixa, number> = { 20: 22.53, 25: 21.69, 30: 21.59, 35: 22.78, 40: 26.22, 45: 33.54, 50: 47.37 };

/** Primeira faixa ≥ idade (acima de 50 usa 50). */
export const faixaDe = (idade: number): Faixa => FAIXAS.find((b) => idade <= b) ?? 50;

/** Primeira renda-base ≥ renda (acima de 10.000 usa 10.000). */
export const rendaBaseDe = (renda: number): RendaBase => RENDAS.find((x) => renda <= x) ?? 10000;

const soma = (xs: readonly number[]) => xs.reduce((a, x) => a + x, 0);

/** Prêmio da Renda Vitalícia por Invalidez: 0,5 × renda base / 1000 × RVI[faixa]. */
export const premioRVI = (faixa: Faixa, R: RendaBase) => ((0.5 * R) / 1000) * RVI[faixa];

/** Custo mensal de risco (Essencial + RVI) para uma idade e renda-base. */
export function riscoMensal(idade: number, R: RendaBase): number {
  const b = faixaDe(idade);
  return soma(ESS[b][R]) + premioRVI(b, R);
}

export type ChaveCobertura = "vida" | "apoio" | "dit" | "dg" | "ipa" | "saf";

export interface Cobertura {
  chave: ChaveCobertura;
  nome: string;
  descricao: string;
  /** Valor do capital segurado, em reais. */
  capital: number;
  /** true quando o capital é uma renda mensal ("/mês"). */
  mensal: boolean;
  /** Prêmio mensal, em reais. */
  premio: number;
}

export function coberturasEssencial(faixa: Faixa, R: RendaBase): Cobertura[] {
  const e = ESS[faixa][R];
  const vida = 10 * R;
  return [
    { chave: "vida", nome: "Vida (morte natural ou acidental)", descricao: "Capital para a família. Inclui adiantamento por doença terminal.", capital: vida, mensal: false, premio: e[0] },
    { chave: "apoio", nome: "Apoio financeiro", descricao: "Cobertura obrigatória vinculada à vida.", capital: vida < 100000 ? 1000 : 2000, mensal: false, premio: e[1] },
    { chave: "dit", nome: "Diária de incapacidade temporária (DIT)", descricao: "Com LER/DORT/LTC. Renda enquanto estiver afastado do trabalho.", capital: 0.8 * R, mensal: true, premio: e[2] },
    { chave: "dg", nome: "Doenças graves (24 doenças)", descricao: "Pago no diagnóstico, como câncer, AVC e infarto.", capital: Math.min(10 * R, 60000), mensal: false, premio: e[3] },
    { chave: "ipa", nome: "Invalidez permanente por acidente (IPA)", descricao: "Total ou parcial, proporcional à perda.", capital: Math.min(50 * R, 300000), mensal: false, premio: e[4] },
    { chave: "saf", nome: "Assistência funeral individual (SAF)", descricao: "Organização e custeio do funeral.", capital: 5500, mensal: false, premio: e[5] },
  ];
}

export interface PontoAno {
  /** Anos desde o início (0 … HMAX). */
  a: number;
  /** Total pago acumulado (seguro + previdência). */
  pago: number;
  /** Reserva acumulada na previdência. */
  res: number;
}

/**
 * Projeção mês a mês até HMAX anos. A faixa avança com a idade.
 * payM = primeiro mês em que a reserva alcança o total pago (null se não alcança).
 */
export function simular(idade: number, R: RendaBase, aporte = APORTE, taxaAnual = RENTABILIDADE) {
  const rm = Math.pow(1 + taxaAnual, 1 / 12) - 1;
  let res = 0;
  let pago = 0;
  let payM: number | null = null;
  const anos: PontoAno[] = [{ a: 0, pago: 0, res: 0 }];
  for (let m = 1; m <= HMAX * 12; m++) {
    const p = riscoMensal(idade + Math.floor((m - 1) / 12), R);
    res = res * (1 + rm) + aporte;
    pago += p + aporte;
    if (payM === null && res >= pago) payM = m;
    if (m % 12 === 0) anos.push({ a: m / 12, pago, res });
  }
  return { anos, payM };
}

/** Horizonte do gráfico: múltiplo de 5 acima do payback, +5, entre 10 e 45 (30 se não recupera). */
export const horizonte = (payM: number | null) =>
  payM !== null ? Math.min(HMAX, Math.max(10, Math.ceil(payM / 12 / 5) * 5 + 5)) : 30;

export interface Estudo {
  idade: number;
  renda: number;
  faixa: Faixa;
  rendaBase: RendaBase;
  coberturas: Cobertura[];
  /** Soma dos prêmios Essencial. */
  essencialMensal: number;
  /** Capital da Renda Vitalícia por Invalidez (por mês). */
  rviCapital: number;
  /** Prêmio mensal da Renda Vitalícia por Invalidez. */
  rviMensal: number;
  /** Proteção mensal = Essencial + RVI (coluna protecao_mensal). */
  protecaoMensal: number;
  aporte: number;
  /** Total mensal = proteção + aporte (coluna total_mensal). */
  totalMensal: number;
  anos: PontoAno[];
  /** Mês de recuperação (1-based) ou null. */
  payM: number | null;
  /** Horizonte do gráfico em anos. */
  H: number;
}

export function calcularEstudo(idade: number, renda: number): Estudo {
  const faixa = faixaDe(idade);
  const R = rendaBaseDe(renda);
  const coberturas = coberturasEssencial(faixa, R);
  const essencialMensal = soma(coberturas.map((c) => c.premio));
  const rviMensal = premioRVI(faixa, R);
  const protecaoMensal = essencialMensal + rviMensal;
  const { anos, payM } = simular(idade, R);
  return {
    idade,
    renda,
    faixa,
    rendaBase: R,
    coberturas,
    essencialMensal,
    rviCapital: 0.5 * R,
    rviMensal,
    protecaoMensal,
    aporte: APORTE,
    totalMensal: protecaoMensal + APORTE,
    anos,
    payM,
    H: horizonte(payM),
  };
}

/** "12a 4m" (formato do protótipo) ou "Não recupera". Usado na planilha (recupera_em) e no PDF. */
export const recuperaEm = (payM: number | null) =>
  payM !== null ? `${Math.floor(payM / 12)}a ${payM % 12}m` : "Não recupera";

/** Arredonda para centavos (valores gravados na planilha e enviados ao Meta). */
export const centavos = (v: number) => Math.round(v * 100) / 100;
