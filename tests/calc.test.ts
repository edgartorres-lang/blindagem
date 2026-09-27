import { describe, expect, it } from "vitest";
import { APORTE, RENTABILIDADE, calcularEstudo, recuperaEm, riscoMensal, simular, faixaDe, rendaBaseDe } from "@/lib/calc";
import { capitalTxt } from "@/lib/format";
import { carregarMotorReferencia } from "./referencia";

const ref = carregarMotorReferencia();

/** Mesmo cálculo de horizonte do compute() da referência. */
const hRef = (payM: number | null) =>
  payM !== null ? Math.min(45, Math.max(10, Math.ceil(payM / 12 / 5) * 5 + 5)) : 30;

// Valores esperados obtidos executando o motor de referencia/cotador-blindagem-saude.html
// (aporte R$ 85,00 e 10% a.a.). Ficam fixos aqui para o teste não depender só do arquivo de referência.
const CASOS = [
  {
    idade: 30, renda: 6000, faixa: 30, R: 6000,
    caps: ["R$ 60.000", "R$ 1.000", "R$ 4.800/mês", "R$ 60.000", "R$ 300.000", "R$ 5.500", "R$ 3.000/mês"],
    premios: [7.25, 2.6, 65.38, 12.51, 17.53, 0.66, 64.77],
    protecao: 170.7, total: 255.7, payM: 340, recupera: "28a 4m", H: 35,
    ano10: { pago: 35659.92, res: 16988.43 },
  },
  {
    idade: 42, renda: 9500, faixa: 45, R: 10000,
    caps: ["R$ 100.000", "R$ 2.000", "R$ 8.000/mês", "R$ 60.000", "R$ 300.000", "R$ 5.500", "R$ 5.000/mês"],
    premios: [37.75, 10.48, 213.19, 57.25, 17.53, 2.08, 167.7],
    protecao: 505.98, total: 590.98, payM: 443, recupera: "36a 11m", H: 45,
    ano10: { pago: 86432.88, res: 16988.43 },
  },
  {
    idade: 25, renda: 3000, faixa: 25, R: 4000,
    caps: ["R$ 40.000", "R$ 1.000", "R$ 3.200/mês", "R$ 40.000", "R$ 200.000", "R$ 5.500", "R$ 2.000/mês"],
    premios: [3.93, 2.58, 37.72, 5.14, 11.69, 0.54, 43.38],
    protecao: 104.98, total: 189.98, payM: 222, recupera: "18a 6m", H: 25,
    ano10: { pago: 24693.96, res: 16988.43 },
  },
] as const;

describe("3 casos x cotador original", () => {
  for (const c of CASOS) {
    describe(`${c.idade} anos / R$ ${c.renda}`, () => {
      const e = calcularEstudo(c.idade, c.renda);
      const cob = ref.coberturas(ref.bandOf(c.idade), ref.rendaBase(c.renda));
      const sim = ref.simular(c.idade, ref.rendaBase(c.renda), ref.APORTE_MIN, 0.1);

      it("faixa e renda-base", () => {
        expect(e.faixa).toBe(c.faixa);
        expect(e.rendaBase).toBe(c.R);
        expect(e.faixa).toBe(ref.bandOf(c.idade));
        expect(e.rendaBase).toBe(ref.rendaBase(c.renda));
      });

      it("capitais das coberturas", () => {
        const caps = [...e.coberturas.map((x) => capitalTxt(x.capital, x.mensal)), capitalTxt(e.rviCapital, true)];
        // Intl usa espaço inseguível depois de "R$" (igual ao original); normaliza só para comparar com o literal.
        expect(caps.map((s) => s.replace(/ /g, " "))).toEqual(c.caps);
        expect(caps).toEqual([...cob.ess.map((x) => x.cap), cob.atit[0].cap]);
      });

      it("prêmios mensais", () => {
        const premios = [...e.coberturas.map((x) => x.premio), e.rviMensal];
        premios.forEach((p, i) => expect(p).toBeCloseTo(c.premios[i], 2));
        premios.forEach((p, i) => expect(p).toBeCloseTo([...cob.ess, ...cob.atit][i].m, 10));
      });

      it("proteção e total mensal", () => {
        expect(e.protecaoMensal).toBeCloseTo(c.protecao, 2);
        expect(e.totalMensal).toBeCloseTo(c.total, 2);
        expect(e.protecaoMensal).toBeCloseTo(ref.riscoMensal(c.idade, ref.rendaBase(c.renda)), 10);
      });

      it("recuperação e horizonte", () => {
        expect(e.payM).toBe(c.payM);
        expect(e.payM).toBe(sim.payM);
        expect(recuperaEm(e.payM)).toBe(c.recupera);
        expect(e.H).toBe(c.H);
        expect(e.H).toBe(hRef(sim.payM));
      });

      it("projeção ano a ano", () => {
        expect(e.anos[10].pago).toBeCloseTo(c.ano10.pago, 2);
        expect(e.anos[10].res).toBeCloseTo(c.ano10.res, 2);
        expect(e.anos).toHaveLength(sim.anos.length);
        e.anos.forEach((p, i) => {
          expect(p.a).toBe(sim.anos[i].a);
          expect(p.pago).toBeCloseTo(sim.anos[i].pago, 6);
          expect(p.res).toBeCloseTo(sim.anos[i].res, 6);
        });
      });
    });
  }
});

describe("varredura completa x cotador original", () => {
  const rendas = [500, 1999.99, 3000, 4000, 4000.01, 5500, 6000, 7200, 8000, 9500, 10000, 10000.01, 25000, 200000];
  it("idades 18–50 × rendas: proteção, recuperação e horizonte idênticos", () => {
    for (let idade = 18; idade <= 50; idade++) {
      for (const renda of rendas) {
        const R = ref.rendaBase(renda);
        const e = calcularEstudo(idade, renda);
        const sim = ref.simular(idade, R, ref.APORTE_MIN, 0.1);
        expect(e.rendaBase).toBe(R);
        expect(e.protecaoMensal).toBeCloseTo(ref.riscoMensal(idade, R), 10);
        expect(e.payM).toBe(sim.payM);
        expect(e.H).toBe(hRef(sim.payM));
      }
    }
  });

  it("tabelas ESS e RVI iguais às da referência", async () => {
    const { ESS, RVI } = await import("@/lib/calc");
    expect(JSON.parse(JSON.stringify(ESS))).toEqual(ref.ESS);
    expect({ ...RVI }).toEqual(Object.fromEntries(Object.entries(ref.RVI).map(([k, v]) => [k, v])));
  });
});

describe("regras do README", () => {
  it("aporte R$ 85 e 10% a.a. fixos", () => {
    expect(APORTE).toBe(85);
    expect(RENTABILIDADE).toBe(0.1);
    expect(APORTE).toBe(ref.APORTE_MIN);
  });

  it("faixas e rendas-base nos limites", () => {
    expect(faixaDe(18)).toBe(20);
    expect(faixaDe(20)).toBe(20);
    expect(faixaDe(21)).toBe(25);
    expect(faixaDe(50)).toBe(50);
    expect(faixaDe(60)).toBe(50);
    expect(rendaBaseDe(500)).toBe(4000);
    expect(rendaBaseDe(6000)).toBe(6000);
    expect(rendaBaseDe(6000.01)).toBe(8000);
    expect(rendaBaseDe(200000)).toBe(10000);
  });

  it("a faixa avança com a idade na projeção", () => {
    // 30 anos: 12 primeiros meses na faixa 30; no 2º ano (31 anos) passa para a faixa 35.
    const { anos } = simular(30, 6000, 0, 0);
    expect(riscoMensal(31, 6000)).toBeGreaterThan(riscoMensal(30, 6000));
    expect(anos[1].pago).toBeCloseTo(12 * riscoMensal(30, 6000), 10);
    expect(anos[2].pago - anos[1].pago).toBeCloseTo(12 * riscoMensal(31, 6000), 10);
  });

  it("recuperaEm", () => {
    expect(recuperaEm(12)).toBe("1a 0m");
    expect(recuperaEm(null)).toBe("Não recupera");
  });
});
