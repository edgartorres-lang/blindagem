// Geração do PDF no navegador (README → PDF, opção 1): html2canvas + jsPDF, A4, JPEG 0,85, scale 2.
// As páginas vêm de <PaginasEstudo>, renderizadas fora da tela.

export interface PdfGerado {
  blob: Blob;
  /** Tamanho em bytes. */
  tamanho: number;
}

async function esperarRecursos(raiz: HTMLElement) {
  if (document.fonts) await document.fonts.ready;
  const imgs = [...raiz.querySelectorAll("img")];
  await Promise.all(imgs.map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => undefined))));
}

export async function gerarPdf(raiz: HTMLElement): Promise<PdfGerado> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  await esperarRecursos(raiz);

  const paginas = [...raiz.querySelectorAll<HTMLElement>("[data-pagina-estudo]")];
  if (paginas.length !== 3) throw new Error(`Esperava 3 páginas, encontrei ${paginas.length}`);

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  for (let i = 0; i < paginas.length; i++) {
    const canvas = await html2canvas(paginas[i], {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      width: 794,
      height: 1123,
      windowWidth: 794,
    });
    if (i) pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.85), "JPEG", 0, 0, 210, 297, undefined, "FAST");
  }
  pdf.setProperties({ title: "Estudo de Blindagem Profissional da Saúde", author: "Setor Norte Seguros", creator: "Setor Norte Seguros" });
  const blob = pdf.output("blob");
  return { blob, tamanho: blob.size };
}

/** "418 kB" */
export const tamanhoTxt = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} kB`;

/** Baixa o blob com o nome indicado (mesmo arquivo enviado ao servidor). */
export function baixarBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
