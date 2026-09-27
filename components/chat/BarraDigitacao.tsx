import type { RefObject } from "react";
import { IconEnviar } from "../icons";
import { SOMBRA } from "./tipos";

interface Props {
  inputRef: RefObject<HTMLInputElement | null>;
  valor: string;
  placeholder: string;
  inputMode: "numeric" | "tel" | "email" | "text";
  desligado: boolean;
  onChange: (v: string) => void;
  onEnviar: () => void;
}

export function BarraDigitacao({ inputRef, valor, placeholder, inputMode, desligado, onChange, onEnviar }: Props) {
  return (
    <div style={{ flex: "none", display: "flex", alignItems: "flex-end", gap: 6, padding: "6px 8px 10px" }}>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#fff",
          borderRadius: 24,
          minHeight: 48,
          padding: "0 16px",
          boxShadow: SOMBRA,
        }}
      >
        <input
          ref={inputRef}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEnviar();
            }
          }}
          placeholder={placeholder}
          disabled={desligado}
          inputMode={inputMode}
          type={inputMode === "email" ? "email" : "text"}
          autoComplete="off"
          aria-label="Mensagem"
          // 16 px evita o zoom automático do iOS ao focar.
          style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "none", font: "inherit", fontSize: 16, color: "#111B21", padding: "12px 0" }}
        />
      </div>
      <button
        type="button"
        onClick={onEnviar}
        aria-label="Enviar"
        disabled={desligado}
        style={{
          flex: "none",
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: 0,
          background: desligado ? "#9FB5A0" : "#4E8A2E",
          display: "grid",
          placeItems: "center",
          cursor: desligado ? "default" : "pointer",
          color: "#fff",
        }}
      >
        <IconEnviar />
      </button>
    </div>
  );
}
