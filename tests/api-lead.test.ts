import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Conta de serviço do Google simulada (sem rede).
vi.mock("google-auth-library", () => ({
  JWT: class {
    async getAccessToken() {
      return { token: "tok-teste" };
    }
  },
}));

const ENV = {
  TURNSTILE_SECRET_KEY: "segredo",
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "sa@proj.iam.gserviceaccount.com",
  GOOGLE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nX\\n-----END PRIVATE KEY-----\\n",
  GOOGLE_SHEET_ID: "planilha123",
  GOOGLE_DRIVE_FOLDER_ID: "pasta-raiz",
  RESEND_API_KEY: "re_teste",
  MAIL_FROM: "Setor Norte Seguros <estudo@setornorteseguros.com.br>",
  NEXT_PUBLIC_META_PIXEL_ID: "999",
  META_CAPI_TOKEN: "capi-token",
  LEAD_HASH_SALT: "sal",
};

type Chamada = { etapa: string; url: string; init?: RequestInit };
let chamadas: Chamada[];
let falhar: Partial<Record<"sheets" | "drive" | "resend", boolean>>;

function etapaDe(url: string, init?: RequestInit): string {
  if (url.includes("turnstile")) return "turnstile";
  if (url.includes("upload/drive")) return "drive_upload";
  if (url.includes("drive/v3/files") && (init?.method ?? "GET") === "GET") return "drive_busca";
  if (url.includes("drive/v3/files")) return "drive_pasta";
  if (url.includes(":append")) return "sheets_append";
  if (url.includes("sheets.googleapis.com")) return "sheets_update";
  if (url.includes("resend.com")) return "resend";
  if (url.includes("graph.facebook.com")) return "capi";
  return "outro";
}

const resp = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  chamadas = [];
  falhar = {};
  Object.assign(process.env, ENV);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      const etapa = etapaDe(url, init);
      chamadas.push({ etapa, url, init });
      switch (etapa) {
        case "turnstile": {
          const token = (init?.body as URLSearchParams).get("response");
          return resp(200, { success: token === "token-ok" });
        }
        case "drive_busca":
          return resp(200, { files: [] });
        case "drive_pasta":
          return resp(200, { id: "pasta-mes" });
        case "drive_upload":
          return falhar.drive ? resp(500, { error: "x" }) : resp(200, { id: "arq1", webViewLink: "https://drive.google.com/file/d/arq1/view" });
        case "sheets_append":
          return falhar.sheets ? resp(503, { error: "x" }) : resp(200, { updates: { updatedRange: "Leads!A7:AB7" } });
        case "sheets_update":
          return resp(200, {});
        case "resend":
          return falhar.resend ? resp(500, { error: "x" }) : resp(200, { id: "email1" });
        case "capi":
          return resp(200, { events_received: 1 });
        default:
          return resp(404, {});
      }
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

const DADOS = {
  nome: "Maria Souza Lima",
  prof: "fisio",
  sexo: "F",
  nasc: "15/03/1996",
  renda: 6000,
  whats: "(96) 98123-4567",
  email: "maria@teste.com.br",
  consentEmail: true,
  consentWhats: true,
  consentVersao: "2026-09-27",
  eventId: "0b7c1d8e-1111-4222-8333-444455556666",
  eventSourceUrl: "https://blindagem.setornorteseguros.com.br/",
  cookiesAceitos: false,
  fbp: "fb.1.123.456",
  fbc: "",
  utm_source: "facebook",
  utm_medium: "cpc",
  utm_campaign: "=blindagem",
  utm_content: "",
  utm_term: "",
  fbclid: "",
};

let ipSeq = 0;
function requisicao(opts: { dados?: Record<string, unknown>; token?: string; empresa?: string; pdf?: Blob | null; ip?: string } = {}) {
  const fd = new FormData();
  fd.set("dados", JSON.stringify({ ...DADOS, ...(opts.dados ?? {}) }));
  fd.set("turnstile", opts.token ?? "token-ok");
  fd.set("empresa", opts.empresa ?? "");
  const pdf = opts.pdf === undefined ? new Blob(["%PDF-1.3\nconteudo"], { type: "application/pdf" }) : opts.pdf;
  if (pdf) fd.set("pdf", new File([pdf], "estudo.pdf", { type: pdf.type }));
  return new Request("http://localhost/api/lead", {
    method: "POST",
    body: fd,
    headers: { "x-forwarded-for": opts.ip ?? `10.0.0.${++ipSeq}`, "user-agent": "Vitest/1.0" },
  });
}

async function post(opts?: Parameters<typeof requisicao>[0]) {
  const { POST } = await import("@/app/api/lead/route");
  return POST(requisicao(opts));
}

const linhaGravada = () => {
  const c = chamadas.find((x) => x.etapa === "sheets_append")!;
  return (JSON.parse(String(c.init!.body)) as { values: (string | number)[][] }).values[0];
};

describe("POST /api/lead", () => {
  it("fluxo completo na ordem do README", async () => {
    const r = await post();
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.ok).toBe(true);
    expect(j.totalMensal).toBe(255.7);

    const ordem = chamadas.map((c) => c.etapa);
    expect(ordem.slice(0, 5)).toEqual(["turnstile", "drive_busca", "drive_pasta", "drive_upload", "sheets_append"]);
    // Resend e CAPI só depois da planilha; pdf_enviado atualizado depois do e-mail.
    expect(ordem).toContain("resend");
    expect(ordem).toContain("capi");
    expect(ordem.indexOf("sheets_update")).toBeGreaterThan(ordem.indexOf("resend"));
  });

  it("grava a linha completa com valores recalculados no servidor", async () => {
    // O cliente não manda valores do estudo; mesmo que mandasse, seriam ignorados.
    await post({ dados: { totalMensal: 1 } });
    const v = linhaGravada();
    expect(v).toHaveLength(28);
    expect(v[2]).toBe("Maria Souza Lima");
    expect(v[3]).toBe("Fisioterapeuta");
    expect(v[4]).toBe("F");
    expect(v[5]).toBe("15/03/1996");
    expect(v[7]).toBe(6000);
    expect(v[8]).toBe("'96981234567");
    expect(v[10]).toBe(255.7);
    expect(v[11]).toBe(170.7);
    expect(v[12]).toBe("28a 4m");
    expect(v[13]).toBe("SIM");
    expect(v[14]).toBe("SIM");
    expect(v[15]).toBe("2026-09-27");
    expect(v[17]).toBe("Vitest/1.0");
    expect(v[18]).toBe("facebook");
    expect(v[20]).toBe("'=blindagem"); // injeção de fórmula neutralizada
    expect(v[24]).toBe("https://drive.google.com/file/d/arq1/view");
    expect(v[25]).toBe("PENDENTE");
    expect(v[26]).toBe("Novo");
    expect(v[27]).toBe("");
    expect(String(v[1])).toMatch(/^[0-9a-f]{8}$/);
    expect(String(v[0])).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);

    const upd = chamadas.find((c) => c.etapa === "sheets_update")!;
    expect(decodeURIComponent(upd.url)).toContain("Leads!Z7");
    expect(JSON.parse(String(upd.init!.body))).toEqual({ values: [["SIM"]] });
  });

  it("e-mail: assunto, anexo e sem e-mail quando não autorizado", async () => {
    await post();
    const email = JSON.parse(String(chamadas.find((c) => c.etapa === "resend")!.init!.body));
    expect(email.subject).toBe("Seu Estudo de Blindagem Profissional, Maria");
    expect(email.attachments[0].filename).toMatch(/^Estudo Blindagem - Maria Souza Lima - \d{8}\.pdf$/);
    expect(email.html).toContain("Olá, Maria!");
    expect(email.html).toContain("https://calendar.app.google/a7VPtRQcGx5wVE529");

    chamadas = [];
    await post({ dados: { consentEmail: false } });
    expect(chamadas.map((c) => c.etapa)).not.toContain("resend");
    expect(linhaGravada()[25]).toBe("NÃO");
  });

  it("CAPI: mesmo event_id e sem fbp quando cookies recusados", async () => {
    await post();
    const capi = JSON.parse(String(chamadas.find((c) => c.etapa === "capi")!.init!.body));
    expect(capi.data[0].event_id).toBe(DADOS.eventId);
    expect(capi.data[0].user_data.fbp).toBeUndefined();
    expect(capi.data[0].custom_data.value).toBe(255.7);

    chamadas = [];
    await post({ dados: { cookiesAceitos: true } });
    const capi2 = JSON.parse(String(chamadas.find((c) => c.etapa === "capi")!.init!.body));
    expect(capi2.data[0].user_data.fbp).toBe("fb.1.123.456");
  });

  it("Turnstile inválido → 403 e nada é gravado", async () => {
    const r = await post({ token: "token-ruim" });
    expect(r.status).toBe(403);
    expect(chamadas.map((c) => c.etapa)).toEqual(["turnstile"]);
  });

  it("honeypot preenchido → 200 e descarta", async () => {
    const r = await post({ empresa: "ACME" });
    expect(r.status).toBe(200);
    expect(chamadas.map((c) => c.etapa)).toEqual(["turnstile"]);
  });

  it("dados inválidos → 400", async () => {
    expect((await post({ dados: { nome: "Maria" } })).status).toBe(400);
    expect((await post({ dados: { nasc: "01/01/1960" } })).status).toBe(400);
    expect(chamadas.map((c) => c.etapa)).not.toContain("sheets_append");
  });

  it("PDF ausente, de outro tipo ou maior que 3 MB → 400", async () => {
    expect((await post({ pdf: null })).status).toBe(400);
    expect((await post({ pdf: new Blob(["oi"], { type: "text/plain" }) })).status).toBe(400);
    expect((await post({ pdf: new Blob(["<html>"], { type: "application/pdf" }) })).status).toBe(400);
    expect((await post({ pdf: new Blob([new Uint8Array(3 * 1024 * 1024 + 1)], { type: "application/pdf" }) })).status).toBe(400);
  });

  it("rate limit: 6º lead do mesmo IP na hora → 429", async () => {
    const ip = "200.1.1.1";
    for (let i = 0; i < 5; i++) expect((await post({ ip })).status).toBe(200);
    expect((await post({ ip })).status).toBe(429);
  });

  it("planilha falhou → 500 (sem e-mail nem CAPI)", async () => {
    falhar.sheets = true;
    const r = await post();
    expect(r.status).toBe(500);
    expect(chamadas.map((c) => c.etapa)).not.toContain("resend");
    expect(chamadas.map((c) => c.etapa)).not.toContain("capi");
  });

  it("Drive falhou → grava com pdf_url vazio e segue", async () => {
    falhar.drive = true;
    const r = await post();
    expect(r.status).toBe(200);
    expect(linhaGravada()[24]).toBe("");
    expect(chamadas.map((c) => c.etapa)).toContain("resend");
  });

  it("e-mail falhou → pdf_enviado = ERRO e resposta 200", async () => {
    falhar.resend = true;
    const r = await post();
    expect(r.status).toBe(200);
    const upd = chamadas.find((c) => c.etapa === "sheets_update")!;
    expect(JSON.parse(String(upd.init!.body))).toEqual({ values: [["ERRO"]] });
  });
});
