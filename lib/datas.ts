// Datas no fuso America/Belem (UTC−3, sem horário de verão).

export const FUSO = "America/Belem";

type Partes = { ano: number; mes: number; dia: number; hora: number; minuto: number };

function partesBelem(d: Date): Partes {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: FUSO,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { ano: +p.year, mes: +p.month, dia: +p.day, hora: +p.hour, minuto: +p.minute };
}

const z = (n: number) => String(n).padStart(2, "0");

/** "dd/mm/aaaa hh:mm" em Belém (coluna data_hora). */
export function dataHoraBelem(d = new Date()) {
  const p = partesBelem(d);
  return `${z(p.dia)}/${z(p.mes)}/${p.ano} ${z(p.hora)}:${z(p.minuto)}`;
}

/** "AAAAMMDD" em Belém. */
export function aaaammddBelem(d = new Date()) {
  const p = partesBelem(d);
  return `${p.ano}${z(p.mes)}${z(p.dia)}`;
}

/** "AAAAMMDD-hhmm" em Belém (nome do PDF no Drive). */
export function carimboBelem(d = new Date()) {
  const p = partesBelem(d);
  return `${p.ano}${z(p.mes)}${z(p.dia)}-${z(p.hora)}${z(p.minuto)}`;
}

/** "AAAA-MM" em Belém (subpasta mensal no Drive). */
export function anoMesBelem(d = new Date()) {
  const p = partesBelem(d);
  return `${p.ano}-${z(p.mes)}`;
}

export interface DataCivil {
  ano: number;
  mes: number;
  dia: number;
}

/** Converte "dd/mm/aaaa" em data civil válida (rejeita 31/02 etc.). */
export function parseDataBR(s: string): DataCivil | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const dia = +m[1];
  const mes = +m[2];
  const ano = +m[3];
  const dt = new Date(Date.UTC(ano, mes - 1, dia));
  if (dt.getUTCFullYear() !== ano || dt.getUTCMonth() !== mes - 1 || dt.getUTCDate() !== dia) return null;
  if (ano < 1900) return null;
  return { ano, mes, dia };
}

/** Idade completa em anos na data de "hoje" em Belém. */
export function idadeEm(nasc: DataCivil, agora = new Date()): number {
  const h = partesBelem(agora);
  let idade = h.ano - nasc.ano;
  if (h.mes < nasc.mes || (h.mes === nasc.mes && h.dia < nasc.dia)) idade--;
  return idade;
}

/** Data civil → "dd/mm/aaaa". */
export const formatarDataBR = (d: DataCivil) => `${z(d.dia)}/${z(d.mes)}/${d.ano}`;

/** Data civil → "AAAAMMDD" (campo db da CAPI). */
export const dataCivilAAAAMMDD = (d: DataCivil) => `${d.ano}${z(d.mes)}${z(d.dia)}`;
