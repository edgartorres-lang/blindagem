// UTMs e fbclid: lidos da URL na chegada, guardados em sessionStorage e enviados com o lead.

export const CHAVES_UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const;
export type Utms = Record<(typeof CHAVES_UTM)[number], string>;

const STORAGE = "sn-utms";

export function capturarUtms() {
  try {
    const q = new URLSearchParams(window.location.search);
    if (!CHAVES_UTM.some((k) => q.get(k))) return; // chegada sem UTMs: mantém as da sessão
    const u = Object.fromEntries(CHAVES_UTM.map((k) => [k, (q.get(k) ?? "").slice(0, 500)]));
    sessionStorage.setItem(STORAGE, JSON.stringify(u));
  } catch {}
}

export function lerUtms(): Utms {
  const vazio = Object.fromEntries(CHAVES_UTM.map((k) => [k, ""])) as Utms;
  try {
    const s = sessionStorage.getItem(STORAGE);
    return s ? { ...vazio, ...(JSON.parse(s) as Partial<Utms>) } : vazio;
  } catch {
    return vazio;
  }
}
