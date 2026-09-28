import "server-only";
import { createHash } from "node:crypto";
import { env, envObrigatoria } from "./env";

// Meta API de Conversões: evento Lead com o mesmo event_id do Pixel (deduplicação).

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
const norm = (v: string) => v.trim().toLowerCase();

export interface DadosCapi {
  eventId: string;
  eventSourceUrl: string;
  email: string;
  /** Só dígitos, com DDD (sem 55). */
  whats: string;
  nome: string;
  sexo: "F" | "M";
  /** AAAAMMDD */
  nascimento: string;
  ip?: string;
  userAgent?: string;
  /** Só quando o visitante aceitou cookies. */
  fbp?: string;
  fbc?: string;
  valor: number;
  profissao: string;
}

export function montarEventoLead(d: DadosCapi, agora = new Date()) {
  const partes = norm(d.nome).split(/\s+/).filter(Boolean);
  const user_data: Record<string, string | string[]> = {
    em: [sha256(norm(d.email))],
    ph: [sha256(`55${d.whats.replace(/\D/g, "")}`)],
    fn: [sha256(partes[0] ?? "")],
    ln: [sha256(partes.length > 1 ? partes[partes.length - 1] : "")],
    ge: [sha256(d.sexo === "F" ? "f" : "m")],
    db: [sha256(d.nascimento)],
    country: [sha256("br")],
  };
  if (d.ip) user_data.client_ip_address = d.ip;
  if (d.userAgent) user_data.client_user_agent = d.userAgent;
  if (d.fbp) user_data.fbp = d.fbp;
  if (d.fbc) user_data.fbc = d.fbc;

  return {
    event_name: "Lead",
    event_time: Math.floor(agora.getTime() / 1000),
    event_id: d.eventId,
    action_source: "website",
    event_source_url: d.eventSourceUrl,
    user_data,
    custom_data: {
      value: d.valor,
      currency: "BRL",
      content_name: "Estudo Blindagem",
      content_category: d.profissao,
    },
  };
}

export async function enviarLeadCapi(d: DadosCapi) {
  const pixel = envObrigatoria("NEXT_PUBLIC_META_PIXEL_ID");
  const body: Record<string, unknown> = { data: [montarEventoLead(d)] };
  const teste = env("META_TEST_EVENT_CODE");
  if (teste) body.test_event_code = teste;
  const r = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(pixel)}/events?access_token=${encodeURIComponent(envObrigatoria("META_CAPI_TOKEN"))}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`CAPI ${r.status}: ${(await r.text()).slice(0, 200)}`);
}
