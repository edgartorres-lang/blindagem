import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { emProducao, env, log } from "./env";

// Rate limit por IP: 5 leads por hora e 20 por dia (README → Segurança, item 3).

let limites: { hora: Ratelimit; dia: Ratelimit } | null = null;

function upstash() {
  if (limites) return limites;
  const url = env("UPSTASH_REDIS_REST_URL");
  const token = env("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  limites = {
    hora: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 h"), prefix: "cotador:rl:h" }),
    dia: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 d"), prefix: "cotador:rl:d" }),
  };
  return limites;
}

// Fallback em memória só para desenvolvimento local (sem Upstash configurado).
const memoria = new Map<string, number[]>();
function limiteEmMemoria(chave: string): boolean {
  const agora = Date.now();
  const lista = (memoria.get(chave) ?? []).filter((t) => agora - t < 86_400_000);
  const naHora = lista.filter((t) => agora - t < 3_600_000).length;
  if (naHora >= 5 || lista.length >= 20) return false;
  lista.push(agora);
  memoria.set(chave, lista);
  return true;
}

/** true = pode seguir; false = acima do limite (responder 429). */
export async function dentroDoLimite(ip: string): Promise<boolean> {
  const rl = upstash();
  if (!rl) {
    if (emProducao) log("ratelimit", { aviso: "UPSTASH não configurado; usando limite em memória" });
    return limiteEmMemoria(ip);
  }
  const [h, d] = await Promise.all([rl.hora.limit(ip), rl.dia.limit(ip)]);
  return h.success && d.success;
}
