import { describe, expect, it } from "vitest";
import { anoMesBelem, carimboBelem, dataHoraBelem, idadeEm, parseDataBR, aaaammddBelem } from "@/lib/datas";

describe("datas em America/Belem", () => {
  // 28/09/2026 01:30 UTC = 27/09/2026 22:30 em Belém (UTC−3)
  const virada = new Date("2026-09-28T01:30:00Z");

  it("formata no fuso de Belém, não em UTC", () => {
    expect(dataHoraBelem(virada)).toBe("27/09/2026 22:30");
    expect(aaaammddBelem(virada)).toBe("20260927");
    expect(carimboBelem(virada)).toBe("20260927-2230");
    expect(anoMesBelem(new Date("2026-10-01T02:00:00Z"))).toBe("2026-09");
  });

  it("idade usa o dia de hoje em Belém", () => {
    const nasc = parseDataBR("28/09/1996")!;
    // Em UTC já é dia 28 (aniversário), mas em Belém ainda é 27: 29 anos.
    expect(idadeEm(nasc, virada)).toBe(29);
    expect(idadeEm(nasc, new Date("2026-09-28T03:00:00Z"))).toBe(30);
  });

  it("parseDataBR rejeita datas inválidas", () => {
    expect(parseDataBR("31/02/1990")).toBeNull();
    expect(parseDataBR("29/02/2023")).toBeNull();
    expect(parseDataBR("29/02/2024")).toEqual({ ano: 2024, mes: 2, dia: 29 });
    expect(parseDataBR("1/2/1990")).toBeNull();
    expect(parseDataBR("15/13/1990")).toBeNull();
  });
});
