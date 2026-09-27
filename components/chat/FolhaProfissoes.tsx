import { PROF, PROFISSOES, type Profissao } from "@/lib/profissoes";
import { IconFechar } from "../icons";

interface Props {
  selecionada: Profissao | null;
  onSelecionar: (p: Profissao) => void;
  onEnviar: () => void;
  onFechar: () => void;
}

export function FolhaProfissoes({ selecionada, onSelecionar, onEnviar, onFechar }: Props) {
  return (
    <div
      onClick={onFechar}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        background: "rgba(11,20,26,.4)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Profissões"
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: "8px 0 14px", animation: "snIn .2s ease-out" }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#D1D7DB", margin: "2px auto 8px" }} />
        <div style={{ display: "flex", alignItems: "center", padding: "0 8px 6px" }}>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            style={{ width: 44, height: 44, border: 0, background: "none", display: "grid", placeItems: "center", cursor: "pointer", color: "#54656F" }}
          >
            <IconFechar />
          </button>
          <span
            style={{
              flex: 1,
              textAlign: "center",
              marginRight: 44,
              fontFamily: "var(--font-titulo)",
              fontWeight: 800,
              fontSize: 16.5,
              color: "#1F2A33",
            }}
          >
            Profissões
          </span>
        </div>
        <div
          style={{
            padding: "4px 20px 6px",
            fontSize: 12.5,
            fontWeight: 700,
            color: "#667781",
            letterSpacing: ".04em",
            textTransform: "uppercase",
          }}
        >
          Área de atuação
        </div>
        <div role="radiogroup">
          {PROFISSOES.map((k) => {
            const sel = selecionada === k;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={sel}
                onClick={() => onSelecionar(k)}
                className="sn-hv-sheet"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  border: 0,
                  padding: "0 20px",
                  minHeight: 52,
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 16,
                  color: "#111B21",
                }}
              >
                <span style={{ flex: 1 }}>{PROF[k].label}</span>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: `2px solid ${sel ? "#396C97" : "#AEBAC1"}`,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {sel && <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#396C97" }} />}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ padding: "10px 16px 0" }}>
          <button
            type="button"
            onClick={onEnviar}
            disabled={!selecionada}
            style={{
              width: "100%",
              minHeight: 48,
              border: 0,
              borderRadius: 24,
              background: selecionada ? "#4E8A2E" : "#B7C7B8",
              color: "#fff",
              fontWeight: 800,
              fontSize: 15.5,
              cursor: selecionada ? "pointer" : "default",
            }}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
