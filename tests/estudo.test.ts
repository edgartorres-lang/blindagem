import { describe, expect, it } from "vitest";
import { dataLonga, montarEstudo, nomeArquivoEstudo } from "@/lib/estudo";

const nb = (s: string) => s.replace(/ /g, " ");

describe("modelo das páginas do estudo", () => {
  const agora = new Date("2026-09-27T15:00:00Z");
  const m = montarEstudo({ nome: "Maria Souza Lima", prof: "fisio", sexo: "F", idade: 30, renda: 6000 }, agora);

  it("página 2: valores do caso 30 anos / R$ 6.000", () => {
    expect(nb(m.totalTxt)).toBe("R$ 255,70");
    expect(nb(m.protecaoTxt)).toBe("R$ 170,70");
    expect(m.totalPct).toBe("4,3%");
    expect(nb(m.essencialTxt)).toBe("R$ 105,93");
    expect(nb(m.atitudeTxt)).toBe("R$ 149,77");
    expect(nb(m.rviCapital)).toBe("R$ 3.000/mês");
    expect(m.profLabel).toBe("Fisioterapeuta");
    expect(m.coberturas).toHaveLength(6);
  });

  it("página 3: recuperação e evolução", () => {
    expect(m.payBig).toBe("28a 4m");
    expect(m.payTxt).toContain("em 28 anos e 4 meses, por volta dos 58 anos de idade.");
    expect(m.evolucao.map((e) => e.ano)).toEqual([5, 10, 15, 20, 25, 30]);
    expect(nb(m.evolucao[1].pago)).toBe("R$ 35.659,92");
    expect(nb(m.evolucao[1].reserva)).toBe("R$ 16.988,43");
    expect(m.evolucao[5].positivo).toBe(true);
  });

  it("carta no feminino e no masculino", () => {
    expect(m.carta[1]).toContain("cuidar de si mesma");
    const mm = montarEstudo({ nome: "João Silva", prof: "enf", sexo: "M", idade: 30, renda: 6000 }, agora);
    expect(mm.carta[1]).toContain("cuidar de si mesmo");
    expect(mm.profLabel).toBe("Enfermeiro");
  });

  it("datas em Belém", () => {
    expect(m.hojeLongo).toBe("Macapá, 27 de setembro de 2026");
    expect(m.hojeCurto).toBe("27/09/2026");
    // 01:30 UTC do dia 28 ainda é dia 27 em Belém
    expect(dataLonga(new Date("2026-09-28T01:30:00Z"))).toBe("Macapá, 27 de setembro de 2026");
  });

  it("nome do arquivo sem caracteres proibidos", () => {
    expect(nomeArquivoEstudo("Maria Souza Lima", "20260927")).toBe("Estudo Blindagem - Maria Souza Lima - 20260927.pdf");
    expect(nomeArquivoEstudo('Ana/Paula: "Reis"', "20260927")).toBe("Estudo Blindagem - AnaPaula Reis - 20260927.pdf");
  });
});
