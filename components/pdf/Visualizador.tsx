import type { ReactNode } from "react";
import { IconBaixar, IconVoltar } from "../icons";

interface Props {
  nomeArquivo: string;
  /** zoom = (largura do aparelho − 44) / 794, no máximo 1. */
  zoom: number;
  onFechar: () => void;
  onBaixar: () => void;
  children: ReactNode;
}

// Visualizador de PDF em tela cheia (protótipo: tela #3C4043, barra #111B21).
export function Visualizador({ nomeArquivo, zoom, onFechar, onBaixar, children }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Estudo em PDF"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 6,
        background: "#3C4043",
        display: "flex",
        flexDirection: "column",
        animation: "snIn .2s ease-out",
      }}
    >
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "10px 8px", background: "#111B21", color: "#fff" }}>
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar estudo"
          style={{ width: 44, height: 44, border: 0, background: "none", display: "grid", placeItems: "center", cursor: "pointer", color: "#fff" }}
        >
          <IconVoltar />
        </button>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
          <span style={{ fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nomeArquivo}</span>
          <span style={{ fontSize: 12, color: "#AEBAC1" }}>3 páginas</span>
        </div>
        <button
          type="button"
          onClick={onBaixar}
          aria-label="Baixar PDF"
          style={{ width: 44, height: 44, border: 0, background: "none", display: "grid", placeItems: "center", cursor: "pointer", color: "#fff" }}
        >
          <IconBaixar />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: 12 }}>
        <div style={{ zoom, display: "flex", flexDirection: "column", gap: 22, width: 794 }}>{children}</div>
      </div>
    </div>
  );
}
