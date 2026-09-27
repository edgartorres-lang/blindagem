// Etapa 1: casca do aparelho para conferir fontes, cores e cabeçalhos de segurança.
// A conversa entra na etapa 3.
export default function Home() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 430,
          height: "min(100dvh, 920px)",
          display: "flex",
          flexDirection: "column",
          background: "var(--chat-bg)",
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(20,40,60,.18)",
        }}
      >
        <header style={{ background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px 10px 16px" }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "var(--azul-claro)",
                border: "1px solid #D6DEE5",
                display: "grid",
                placeItems: "center",
              }}
            >
              <img src="/sym.png" alt="" style={{ height: 26, width: "auto" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span style={{ fontFamily: "var(--font-titulo)", fontWeight: 800, fontSize: 16.5, color: "var(--texto-2)" }}>
                Setor Norte Seguros
              </span>
              <span style={{ fontSize: 13, color: "var(--sec-3)", fontWeight: 600 }}>online</span>
            </div>
          </div>
          <div style={{ height: 3, background: "linear-gradient(90deg,#396C97 0 62%,#7DB85A 62% 84%,#4D4C4E 84% 100%)" }} />
        </header>
        <main style={{ flex: 1, padding: 12, fontSize: 15, lineHeight: 1.42 }}>
          <p style={{ fontFamily: "var(--font-titulo)", fontWeight: 900 }}>Nunito 900 — Setor Norte</p>
          <p style={{ fontFamily: "var(--font-titulo)", fontWeight: 800 }}>Nunito 800 — Consultoria personalizada</p>
          <p style={{ fontWeight: 400 }}>Nunito Sans 400 — Seus dados são usados apenas para montar o seu estudo.</p>
          <p style={{ fontWeight: 600 }}>Nunito Sans 600 — digitando…</p>
          <p style={{ fontWeight: 700, color: "var(--azul)" }}>Nunito Sans 700 — Vamos começar</p>
          <p style={{ fontWeight: 800 }}>Nunito Sans 800 — negrito do balão</p>
        </main>
      </div>
    </div>
  );
}
