import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { montarEventoLead } from "@/lib/server/capi";
import { gerarLeadId } from "@/lib/server/lead-id";
import { CABECALHO, letraColuna, linhaParaValores, sanitizar, type Linha } from "@/lib/server/planilha";
import { esquemaLead } from "@/lib/validacao";

const sha = (v: string) => createHash("sha256").update(v).digest("hex");

describe("planilha", () => {
  it("sanitiza injeção de fórmula", () => {
    expect(sanitizar("=HYPERLINK(\"x\")")).toBe("'=HYPERLINK(\"x\")");
    expect(sanitizar("+55")).toBe("'+55");
    expect(sanitizar("-1")).toBe("'-1");
    expect(sanitizar("@x")).toBe("'@x");
    expect(sanitizar("Maria")).toBe("Maria");
  });
  it("cabeçalho com 28 colunas na ordem do README (A…AB)", () => {
    expect(CABECALHO).toHaveLength(28);
    expect(CABECALHO[0]).toBe("data_hora");
    expect(CABECALHO[24]).toBe("pdf_url");
    expect(CABECALHO[27]).toBe("rd_crm_id");
    expect(letraColuna(0)).toBe("A");
    expect(letraColuna(25)).toBe("Z");
    expect(letraColuna(27)).toBe("AB");
  });
  it("linha segue a ordem do cabeçalho e mantém números", () => {
    const l = Object.fromEntries(CABECALHO.map((c, i) => [c, i === 6 ? 30 : c])) as Linha;
    l.nome = "=cmd";
    const v = linhaParaValores(l);
    expect(v[0]).toBe("data_hora");
    expect(v[2]).toBe("'=cmd");
    expect(v[6]).toBe(30);
  });
});

describe("lead_id", () => {
  it("8 primeiros caracteres de sha256(email + data + salt)", () => {
    expect(gerarLeadId("a@b.com", "27/09/2026 20:37", "sal")).toBe(sha("a@b.com27/09/2026 20:37sal").slice(0, 8));
  });
});

describe("Meta CAPI", () => {
  const base = {
    eventId: "abc-123-xyz",
    eventSourceUrl: "https://blindagem.setornorteseguros.com.br/",
    email: " Maria@Teste.com ",
    whats: "96981234567",
    nome: "Maria Souza Lima",
    sexo: "F" as const,
    nascimento: "19960315",
    valor: 255.7,
    profissao: "Fisioterapeuta",
  };

  it("user_data em minúsculas e SHA-256; ph com 55", () => {
    const e = montarEventoLead({ ...base, ip: "1.2.3.4", userAgent: "UA" }, new Date("2026-09-27T12:00:00Z"));
    expect(e.event_name).toBe("Lead");
    expect(e.event_id).toBe("abc-123-xyz");
    expect(e.event_time).toBe(1790510400);
    expect(e.action_source).toBe("website");
    expect(e.user_data.em).toEqual([sha("maria@teste.com")]);
    expect(e.user_data.ph).toEqual([sha("5596981234567")]);
    expect(e.user_data.fn).toEqual([sha("maria")]);
    expect(e.user_data.ln).toEqual([sha("lima")]);
    expect(e.user_data.ge).toEqual([sha("f")]);
    expect(e.user_data.db).toEqual([sha("19960315")]);
    expect(e.user_data.country).toEqual([sha("br")]);
    expect(e.user_data.client_ip_address).toBe("1.2.3.4");
    expect(e.custom_data).toEqual({ value: 255.7, currency: "BRL", content_name: "Estudo Blindagem", content_category: "Fisioterapeuta" });
  });

  it("sem fbp/fbc quando não vierem (cookies recusados)", () => {
    const e = montarEventoLead(base);
    expect(e.user_data.fbp).toBeUndefined();
    expect(e.user_data.fbc).toBeUndefined();
  });
});

describe("validação (zod)", () => {
  const ok = {
    nome: "Maria Souza Lima",
    prof: "fisio",
    sexo: "F",
    nasc: "15/03/1996",
    renda: 6000,
    whats: "(96) 98123-4567",
    email: "Maria@Teste.com.br",
    consentEmail: true,
    consentWhats: false,
    consentVersao: "2026-09-27",
    eventId: "0b7c1d8e-1111-4222-8333-444455556666",
  };

  it("aceita dados válidos, normaliza e calcula a idade", () => {
    const r = esquemaLead.safeParse(ok);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.whats).toBe("96981234567");
    expect(r.data.email).toBe("maria@teste.com.br");
    expect(r.data.idade).toBeGreaterThanOrEqual(30);
    expect(r.data.utm_source).toBe("");
  });

  it.each([
    ["nome com 1 palavra", { nome: "Maria" }],
    ["nome longo", { nome: "A ".repeat(70) }],
    ["profissão fora da lista", { prof: "medico" }],
    ["sexo inválido", { sexo: "X" }],
    ["data inválida", { nasc: "31/02/1990" }],
    ["menor de 18", { nasc: "01/01/2015" }],
    ["maior de 50", { nasc: "01/01/1960" }],
    ["renda abaixo de 500", { renda: 499 }],
    ["renda acima de 200 mil", { renda: 200001 }],
    ["WhatsApp curto", { whats: "(96) 9813" }],
    ["e-mail inválido", { email: "maria@teste" }],
    ["consentimento não booleano", { consentEmail: "sim" }],
  ])("rejeita %s", (_, patch) => {
    expect(esquemaLead.safeParse({ ...ok, ...patch }).success).toBe(false);
  });
});
