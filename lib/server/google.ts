import "server-only";
import { JWT } from "google-auth-library";
import { envObrigatoria } from "./env";
import { CABECALHO, letraColuna, linhaParaValores, type Linha } from "./planilha";

// Google Drive (PDFs no Drive compartilhado) e Google Sheets (aba Leads), via REST com a conta de serviço.

const ABA = "Leads";
let cliente: JWT | null = null;

function jwt() {
  if (cliente) return cliente;
  cliente = new JWT({
    email: envObrigatoria("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    // Na Vercel a chave costuma vir com "\n" literais.
    key: envObrigatoria("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    // drive: necessário para listar/criar subpastas dentro da pasta do Drive compartilhado.
    scopes: ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/spreadsheets"],
  });
  return cliente;
}

async function googleFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const { token } = await jwt().getAccessToken();
  const r = await fetch(url, {
    ...init,
    headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${token}` },
    signal: init.signal ?? AbortSignal.timeout(20000),
  });
  if (!r.ok) {
    // Só status e o início do corpo (mensagem de erro do Google, sem dados do lead).
    const corpo = (await r.text()).slice(0, 200);
    throw new Error(`Google ${r.status} em ${new URL(url).pathname}: ${corpo}`);
  }
  return r;
}

// ===================== Drive =====================

const DRIVE = "https://www.googleapis.com/drive/v3/files";
const pastasCache = new Map<string, string>();
const aspas = (s: string) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

/** Subpasta "AAAA-MM" dentro da pasta de PDFs (cria se não existir). */
async function pastaDoMes(nome: string): Promise<string> {
  const pai = envObrigatoria("GOOGLE_DRIVE_FOLDER_ID");
  const chave = `${pai}/${nome}`;
  const emCache = pastasCache.get(chave);
  if (emCache) return emCache;

  const q = `'${aspas(pai)}' in parents and name = '${aspas(nome)}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const busca = new URLSearchParams({
    q,
    fields: "files(id)",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
    corpora: "allDrives",
    pageSize: "1",
  });
  const achou = (await (await googleFetch(`${DRIVE}?${busca}`)).json()) as { files?: { id: string }[] };
  let id = achou.files?.[0]?.id;
  if (!id) {
    const criada = await googleFetch(`${DRIVE}?supportsAllDrives=true&fields=id`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nome, mimeType: "application/vnd.google-apps.folder", parents: [pai] }),
    });
    id = ((await criada.json()) as { id: string }).id;
  }
  pastasCache.set(chave, id);
  return id;
}

export interface ArquivoDrive {
  id: string;
  webViewLink: string;
}

/** Upload multipart do PDF (sem permissão pública). */
export async function salvarPdfNoDrive(
  pdf: Uint8Array,
  nomeArquivo: string,
  anoMes: string,
  appProperties: Record<string, string>,
): Promise<ArquivoDrive> {
  const pasta = await pastaDoMes(anoMes);
  const boundary = `cotador${crypto.randomUUID().replace(/-/g, "")}`;
  const meta = JSON.stringify({ name: nomeArquivo, parents: [pasta], mimeType: "application/pdf", appProperties });
  const enc = new TextEncoder();
  const corpo = new Blob([
    enc.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n`),
    enc.encode(`--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`),
    pdf as BlobPart,
    enc.encode(`\r\n--${boundary}--`),
  ]);
  const r = await googleFetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,webViewLink",
    { method: "POST", headers: { "Content-Type": `multipart/related; boundary=${boundary}` }, body: corpo, signal: AbortSignal.timeout(30000) },
  );
  return (await r.json()) as ArquivoDrive;
}

// ===================== Sheets =====================

const SHEETS = "https://sheets.googleapis.com/v4/spreadsheets";

/** Grava a linha completa de uma vez (values.append). Retorna o número da linha gravada. */
export async function gravarLinha(linha: Linha): Promise<number | null> {
  const id = envObrigatoria("GOOGLE_SHEET_ID");
  const ultima = letraColuna(CABECALHO.length - 1);
  const range = encodeURIComponent(`${ABA}!A:${ultima}`);
  const r = await googleFetch(`${SHEETS}/${id}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values: [linhaParaValores(linha)] }),
  });
  const j = (await r.json()) as { updates?: { updatedRange?: string } };
  const m = /![A-Z]+(\d+)/.exec(j.updates?.updatedRange ?? "");
  return m ? Number(m[1]) : null;
}

/** Atualiza uma célula da linha (ex.: pdf_enviado depois do e-mail). */
export async function atualizarCelula(numLinha: number, coluna: (typeof CABECALHO)[number], valor: string) {
  const id = envObrigatoria("GOOGLE_SHEET_ID");
  const range = encodeURIComponent(`${ABA}!${letraColuna(CABECALHO.indexOf(coluna))}${numLinha}`);
  await googleFetch(`${SHEETS}/${id}/values/${range}?valueInputOption=RAW`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values: [[valor]] }),
  });
}
