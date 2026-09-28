// Meta Pixel no navegador. Só carrega depois que o visitante aceita os cookies (README → Segurança, item 10).
// Eventos: PageView (ao carregar), ViewContent ("Vamos começar"), Lead (estudo gerado, com eventID da CAPI).

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push?: Fbq;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
    /** Só em desenvolvimento: registro das chamadas ao Pixel, para conferência. */
    __pixelLog?: unknown[][];
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
let iniciado = false;

function registrar(args: unknown[]) {
  if (process.env.NODE_ENV !== "production") (window.__pixelLog ??= []).push(args);
}

/** Snippet oficial do Pixel, reescrito sem script inline. */
function instalarFbq() {
  if (window.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.queue = [];
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  window._fbq ??= fbq;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
}

/** Carrega o Pixel e envia o PageView. Chamar só com cookies aceitos. */
export function iniciarPixel() {
  if (iniciado || !PIXEL_ID) return;
  iniciado = true;
  instalarFbq();
  window.fbq!("init", PIXEL_ID);
  registrar(["init", PIXEL_ID]);
  rastrear("PageView");
}

export const pixelAtivo = () => iniciado;

/** Envia um evento se o Pixel estiver ativo; senão, não faz nada. */
export function rastrear(evento: string, params?: Record<string, unknown>, eventID?: string) {
  if (!iniciado || !window.fbq) return;
  const args: unknown[] = ["track", evento];
  if (params || eventID) args.push(params ?? {});
  if (eventID) args.push({ eventID });
  window.fbq(...args);
  registrar(args);
}

export function rastrearLead(totalMensal: number, eventID: string) {
  rastrear("Lead", { content_name: "Estudo Blindagem", value: totalMensal, currency: "BRL" }, eventID);
}
