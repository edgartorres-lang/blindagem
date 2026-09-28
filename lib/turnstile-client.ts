// Cloudflare Turnstile no navegador (modo invisível / interaction-only).
// O widget só aparece se a Cloudflare pedir interação; o token é gerado sob demanda, no "Confirmar".

type Turnstile = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  execute: (id: string) => void;
  reset: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let carregando: Promise<Turnstile> | null = null;
let widgetId: string | null = null;
let pendente: { ok: (t: string) => void; falha: (e: Error) => void } | null = null;

function carregarScript(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (carregando) return carregando;
  carregando = new Promise((ok, falha) => {
    const existente = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    if (existente) {
      existente.addEventListener("load", () => (window.turnstile ? ok(window.turnstile) : falha(new Error("Turnstile indisponível"))));
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => (window.turnstile ? ok(window.turnstile) : falha(new Error("Turnstile indisponível")));
    s.onerror = () => {
      carregando = null;
      falha(new Error("Falha ao carregar o Turnstile"));
    };
    document.head.appendChild(s);
  });
  return carregando;
}

/** Pré-carrega o script (chamado ao abrir a conversa). */
export function preCarregarTurnstile() {
  carregarScript().catch(() => undefined);
}

function container(): HTMLElement {
  let el = document.getElementById("sn-turnstile");
  if (!el) {
    el = document.createElement("div");
    el.id = "sn-turnstile";
    // Visível só se a Cloudflare exigir interação (appearance: interaction-only).
    el.style.cssText = "position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:50";
    document.body.appendChild(el);
  }
  return el;
}

/** Gera um token novo (tokens valem 5 min e só podem ser usados uma vez). */
export async function obterTokenTurnstile(timeoutMs = 45000): Promise<string> {
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!sitekey) throw new Error("NEXT_PUBLIC_TURNSTILE_SITE_KEY não configurada");
  const ts = await carregarScript();

  const promessa = new Promise<string>((ok, falha) => {
    pendente = { ok, falha };
  });
  if (widgetId === null) {
    widgetId = ts.render(container(), {
      sitekey,
      execution: "execute",
      appearance: "interaction-only",
      language: "pt-br",
      callback: (t: string) => pendente?.ok(t),
      "error-callback": () => pendente?.falha(new Error("Turnstile: erro")),
      "expired-callback": () => pendente?.falha(new Error("Turnstile: expirado")),
    });
  } else {
    ts.reset(widgetId);
  }
  ts.execute(widgetId);

  return Promise.race([
    promessa,
    new Promise<string>((_, falha) => setTimeout(() => falha(new Error("Turnstile: tempo esgotado")), timeoutMs)),
  ]);
}
