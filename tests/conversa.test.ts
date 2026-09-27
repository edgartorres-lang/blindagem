import { describe, expect, it } from "vitest";
import {
  emailValido,
  mascara,
  mensagemFinal,
  nomeValido,
  progresso,
  rendaDe,
  respostaConsentimento,
  segmentos,
  tempoDigitando,
  whatsValido,
} from "@/lib/conversa";

describe("máscaras (iguais ao protótipo)", () => {
  it("data dd/mm/aaaa", () => {
    expect(mascara("nasc", "15")).toBe("15");
    expect(mascara("nasc", "1503")).toBe("15/03");
    expect(mascara("nasc", "15031996")).toBe("15/03/1996");
    expect(mascara("nasc", "15/03/19961")).toBe("15/03/1996");
  });
  it("renda em moeda (dígitos ÷ 100)", () => {
    expect(mascara("renda", "5")).toBe("R$ 0,05");
    expect(mascara("renda", "550000")).toBe("R$ 5.500,00");
    expect(mascara("renda", "000")).toBe("");
    expect(rendaDe("R$ 5.500,00")).toBe(5500);
  });
  it("WhatsApp (00) 00000-0000", () => {
    expect(mascara("whats", "9")).toBe("(9");
    expect(mascara("whats", "96981")).toBe("(96) 981");
    expect(mascara("whats", "9632221234")).toBe("(96) 3222-1234");
    expect(mascara("whats", "96981339955")).toBe("(96) 98133-9955");
  });
});

describe("validações", () => {
  it("nome com 2 palavras ou mais", () => {
    expect(nomeValido("Maria")).toBe(false);
    expect(nomeValido("Maria Lima")).toBe(true);
  });
  it("WhatsApp com 10 dígitos ou mais", () => {
    expect(whatsValido("(96) 9813-3")).toBe(false);
    expect(whatsValido("(96) 3222-1234")).toBe(true);
  });
  it("e-mail", () => {
    expect(emailValido("maria@teste")).toBe(false);
    expect(emailValido("maria@teste.com.br")).toBe(true);
  });
});

describe("textos", () => {
  it("resposta e mensagem final conforme os consentimentos", () => {
    expect(respostaConsentimento(true, true)).toBe("Autorizo o contato por e-mail e WhatsApp.");
    expect(respostaConsentimento(false, false)).toBe("Prefiro não autorizar contato.");
    expect(mensagemFinal("Maria Lima", "m@x.com", "(96) 98133-9955", true, false)).toBe(
      "Pronto, Maria! O seu estudo está aqui em cima. Enviei uma cópia para *m@x.com*.",
    );
    expect(mensagemFinal("Maria Lima", "m@x.com", "(96) 98133-9955", false, false)).toBe(
      "Pronto, Maria! O seu estudo está aqui em cima. Toque no arquivo para abrir ou baixar.",
    );
  });
  it("*negrito*", () => {
    expect(segmentos("da *Setor Norte*.")).toEqual([
      { t: "da ", b: false },
      { t: "Setor Norte", b: true },
      { t: ".", b: false },
    ]);
  });
  it("tempo de digitação e progresso", () => {
    expect(tempoDigitando("abc", false)).toBe(550 + 39);
    expect(tempoDigitando("x".repeat(500), false)).toBe(1800);
    expect(tempoDigitando(undefined, false, 1600)).toBe(550 + 1600);
    expect(progresso("intro")).toBe(0);
    expect(progresso("gerando")).toBe(100);
  });
});
