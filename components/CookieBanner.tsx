"use client";

import { gravarEscolhaCookies } from "@/lib/cookies";
import { SOMBRA } from "./chat/tipos";

// Banner discreto no rodapé, na primeira visita (README → Segurança, item 10).
export function CookieBanner() {
  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      style={{
        position: "absolute",
        left: 8,
        right: 8,
        bottom: 66,
        zIndex: 4,
        background: "#fff",
        borderRadius: 8,
        boxShadow: `${SOMBRA}, 0 4px 16px rgba(11,20,26,.12)`,
        padding: "8px 8px 8px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12.5,
        lineHeight: 1.35,
        color: "#54656F",
        animation: "snIn .22s ease-out",
      }}
    >
      <span style={{ flex: 1 }}>Usamos cookies para medir nossos anúncios.</span>
      <button
        type="button"
        onClick={() => gravarEscolhaCookies("recusado")}
        className="sn-hv-clear"
        style={{ border: 0, borderRadius: 16, padding: "7px 10px", fontWeight: 700, fontSize: 13, color: "#54656F", cursor: "pointer" }}
      >
        Recusar
      </button>
      <button
        type="button"
        onClick={() => gravarEscolhaCookies("aceito")}
        style={{
          border: 0,
          borderRadius: 16,
          padding: "7px 14px",
          background: "#4E8A2E",
          color: "#fff",
          fontWeight: 800,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        Aceitar
      </button>
    </div>
  );
}
