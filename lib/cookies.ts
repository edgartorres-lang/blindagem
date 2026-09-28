// Escolha do visitante sobre cookies de medição (Pixel). Guardada no localStorage deste navegador.

export type EscolhaCookies = "aceito" | "recusado" | null;

const CHAVE = "sn-cookies";
const ouvintes = new Set<() => void>();

export function lerEscolhaCookies(): EscolhaCookies {
  try {
    const v = localStorage.getItem(CHAVE);
    return v === "aceito" || v === "recusado" ? v : null;
  } catch {
    return null;
  }
}

export function gravarEscolhaCookies(v: "aceito" | "recusado") {
  try {
    localStorage.setItem(CHAVE, v);
  } catch {}
  ouvintes.forEach((f) => f());
}

/** Para useSyncExternalStore. */
export function assinarEscolhaCookies(f: () => void) {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}
