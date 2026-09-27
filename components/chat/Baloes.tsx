import type { CSSProperties, ReactNode } from "react";
import { segmentos } from "@/lib/conversa";
import { IconChecks, IconLista, IconResponder } from "../icons";
import { SOMBRA, type Botao } from "./tipos";

/** Texto com *negrito* (peso 800). */
export function TextoRico({ texto }: { texto: string }) {
  return (
    <>
      {segmentos(texto).map((s, i) =>
        s.b ? (
          <b key={i} style={{ fontWeight: 800 }}>
            {s.t}
          </b>
        ) : (
          <span key={i}>{s.t}</span>
        ),
      )}
    </>
  );
}

const hora: CSSProperties = { float: "right", margin: "6px 0 -4px 10px", fontSize: 11, color: "#667781" };

export function BalaoBot({ texto, time, raio }: { texto: string; time: string; raio: string }) {
  return (
    <div
      style={{
        maxWidth: "86%",
        background: "#fff",
        borderRadius: raio,
        padding: "6px 8px 7px 9px",
        boxShadow: SOMBRA,
        fontSize: 15,
        lineHeight: 1.42,
        textWrap: "pretty",
      }}
    >
      <TextoRico texto={texto} />
      <span style={hora}>{time}</span>
    </div>
  );
}

export function BalaoUsuario({ texto, time, raio }: { texto: string; time: string; raio: string }) {
  return (
    <div
      style={{
        maxWidth: "86%",
        background: "#D9FDD3",
        borderRadius: raio,
        padding: "6px 8px 7px 9px",
        boxShadow: SOMBRA,
        fontSize: 15,
        lineHeight: 1.42,
        wordBreak: "break-word",
      }}
    >
      <span>{texto}</span>
      <span style={{ ...hora, display: "inline-flex", alignItems: "center", gap: 3 }}>
        {time}
        <IconChecks />
      </span>
    </div>
  );
}

export function BotoesResposta({ botoes, ativo, onPick }: { botoes: Botao[]; ativo: boolean; onPick: (b: Botao) => void }) {
  return (
    <div style={{ width: 320, maxWidth: "90%", display: "flex", flexDirection: "column", gap: 3, marginTop: 3, opacity: ativo ? 1 : 0.6 }}>
      {botoes.map((b) => (
        <button
          key={b.v}
          type="button"
          onClick={() => onPick(b)}
          className="sn-hv"
          style={{
            width: "100%",
            minHeight: 44,
            border: 0,
            borderRadius: 8,
            boxShadow: SOMBRA,
            fontWeight: 700,
            fontSize: 15,
            color: "#396C97",
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 7,
          }}
        >
          {b.list && <IconLista />}
          {b.reply && <IconResponder />}
          {b.label}
        </button>
      ))}
    </div>
  );
}

export function Digitando() {
  return (
    <div
      style={{
        alignSelf: "flex-start",
        marginTop: 10,
        background: "#fff",
        borderRadius: "0 8px 8px 8px",
        padding: "12px 14px",
        boxShadow: SOMBRA,
      }}
      aria-label="digitando"
    >
      <div style={{ display: "flex", gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#8696A0",
              animation: `snDot 1.2s ${i * 0.15}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Linha de mensagem: alinhamento, espaçamento entre grupos e animação de entrada. */
export function LinhaMsg({ bot, primeiro, children }: { bot: boolean; primeiro: boolean; children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: bot ? "flex-start" : "flex-end",
        marginTop: primeiro ? 10 : 3,
        animation: "snIn .22s ease-out",
      }}
    >
      {children}
    </div>
  );
}
