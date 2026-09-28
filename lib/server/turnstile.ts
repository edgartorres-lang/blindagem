import "server-only";
import { envObrigatoria } from "./env";

// Cloudflare Turnstile: valida o token no servidor antes de qualquer outra ação.
export async function validarTurnstile(token: string, ip: string | undefined): Promise<boolean> {
  if (!token || token.length > 2048) return false;
  const body = new URLSearchParams({ secret: envObrigatoria("TURNSTILE_SECRET_KEY"), response: token });
  if (ip) body.set("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) return false;
  const j = (await r.json()) as { success?: boolean };
  return j.success === true;
}
