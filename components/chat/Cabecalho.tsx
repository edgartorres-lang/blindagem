import { IconRecomecar, IconVerificado, IconVoltar } from "../icons";
import { FAIXA_TRICOLOR } from "./tipos";

interface Props {
  digitando: boolean;
  progresso: number;
  mostrarProgresso?: boolean;
  onVoltar: () => void;
  onRecomecar: () => void;
}

export function Cabecalho({ digitando, progresso, mostrarProgresso = true, onVoltar, onRecomecar }: Props) {
  return (
    <header style={{ flex: "none", background: "#fff", position: "relative", zIndex: 2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px 10px 6px" }}>
        <button
          type="button"
          aria-label="Voltar"
          onClick={onVoltar}
          style={{ width: 36, height: 40, border: 0, background: "none", display: "grid", placeItems: "center", cursor: "pointer", color: "#1F2A33" }}
        >
          <IconVoltar />
        </button>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: "#F2F6F9",
            border: "1px solid #D6DEE5",
            display: "grid",
            placeItems: "center",
            flex: "none",
          }}
        >
          <img src="/sym.png" alt="" style={{ height: 26, width: "auto" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontFamily: "var(--font-titulo)", fontWeight: 800, fontSize: 16.5, color: "#1F2A33" }}>Setor Norte Seguros</span>
            <IconVerificado />
          </div>
          <span style={{ fontSize: 13, color: digitando ? "#4E8A2E" : "#667781", fontWeight: 600 }} aria-live="polite">
            {digitando ? "digitando…" : "online"}
          </span>
        </div>
        <button
          type="button"
          onClick={onRecomecar}
          aria-label="Recomeçar conversa"
          title="Recomeçar"
          className="sn-hv-round"
          style={{ width: 40, height: 40, border: 0, borderRadius: "50%", display: "grid", placeItems: "center", cursor: "pointer", color: "#54656F" }}
        >
          <IconRecomecar />
        </button>
      </div>
      <div style={{ height: 3, background: FAIXA_TRICOLOR }} />
      {mostrarProgresso && (
        <div style={{ height: 3, background: "#E6EBF0" }}>
          <div style={{ height: 3, width: `${progresso}%`, background: "#396C97", transition: "width .4s ease" }} />
        </div>
      )}
    </header>
  );
}
