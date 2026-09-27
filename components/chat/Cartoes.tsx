import { AGENDA_URL, CONSENT_INTRO, CONSENT_NOTA } from "@/lib/conversa";
import { IconArquivo, IconCalendario, IconCheck } from "../icons";
import { TextoRico } from "./Baloes";
import { FAIXA_TRICOLOR, SOMBRA } from "./tipos";

// ===== Cartão de consentimento =====

function Caixa({ marcado }: { marcado: boolean }) {
  return (
    <span
      style={{
        flex: "none",
        width: 22,
        height: 22,
        borderRadius: 5,
        border: `2px solid ${marcado ? "#396C97" : "#AEBAC1"}`,
        background: marcado ? "#396C97" : "#fff",
        display: "grid",
        placeItems: "center",
        marginTop: 1,
        color: "#fff",
      }}
    >
      {marcado && <IconCheck />}
    </span>
  );
}

interface ConsentProps {
  raio: string;
  time: string;
  email: string;
  whats: string;
  contatado: "contatado" | "contatada";
  cE: boolean;
  cW: boolean;
  travado: boolean;
  onToggleE: () => void;
  onToggleW: () => void;
  onConfirmar: () => void;
}

export function CartaoConsentimento(p: ConsentProps) {
  const cursor = p.travado ? "default" : "pointer";
  const opcao = {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    textAlign: "left",
    border: 0,
    padding: "8px 4px",
    borderRadius: 8,
    cursor,
    minHeight: 44,
  } as const;
  return (
    <div style={{ width: 320, maxWidth: "90%", background: "#fff", borderRadius: p.raio, boxShadow: SOMBRA, overflow: "hidden" }}>
      <div style={{ padding: "8px 10px 6px", fontSize: 15, lineHeight: 1.42, textWrap: "pretty" }}>{CONSENT_INTRO}</div>
      <div style={{ display: "flex", flexDirection: "column", padding: "2px 6px 4px" }}>
        <button type="button" role="checkbox" aria-checked={p.cE} aria-disabled={p.travado} onClick={p.onToggleE} className="sn-hv-clear" style={opcao}>
          <Caixa marcado={p.cE} />
          <span style={{ fontSize: 14, lineHeight: 1.4, color: "#1F2A33" }}>
            Autorizo receber o estudo e comunicações da Setor Norte Seguros no e-mail <b style={{ fontWeight: 700 }}>{p.email}</b>
          </span>
        </button>
        <button type="button" role="checkbox" aria-checked={p.cW} aria-disabled={p.travado} onClick={p.onToggleW} className="sn-hv-clear" style={opcao}>
          <Caixa marcado={p.cW} />
          <span style={{ fontSize: 14, lineHeight: 1.4, color: "#1F2A33" }}>
            Autorizo ser {p.contatado} pelo corretor por WhatsApp no número <b style={{ fontWeight: 700 }}>{p.whats}</b>
          </span>
        </button>
      </div>
      <div style={{ padding: "0 10px 8px", fontSize: 12, lineHeight: 1.4, color: "#667781" }}>
        {CONSENT_NOTA}{" "}
        <a href="/privacidade" target="_blank" rel="noopener" style={{ color: "#396C97", fontWeight: 700 }}>
          Política de privacidade
        </a>
        <span style={{ float: "right", marginLeft: 8, fontSize: 11 }}>{p.time}</span>
      </div>
      <button
        type="button"
        onClick={p.onConfirmar}
        disabled={p.travado}
        className="sn-hv"
        style={{
          width: "100%",
          border: 0,
          borderTop: "1px solid #E9EDEF",
          padding: 12,
          fontWeight: 700,
          fontSize: 15,
          color: "#396C97",
          cursor,
          opacity: p.travado ? 0.55 : 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 6,
        }}
      >
        <IconCheck size={16} width={2.4} />
        {p.travado ? "Confirmado" : "Confirmar"}
      </button>
    </div>
  );
}

// ===== Cartão do arquivo PDF =====

interface ArquivoProps {
  raio: string;
  time: string;
  primeiroNome: string;
  hoje: string;
  nomeArquivo: string;
  detalhe: string;
  onAbrir: () => void;
}

export function CartaoArquivo(p: ArquivoProps) {
  const linha = (w: string) => <div style={{ height: 4, borderRadius: 2, background: "#E6EBF0", width: w }} />;
  return (
    <div style={{ width: 290, maxWidth: "86%", background: "#fff", borderRadius: p.raio, padding: 4, boxShadow: SOMBRA }}>
      <button
        type="button"
        onClick={p.onAbrir}
        aria-label="Abrir estudo"
        style={{ display: "block", width: "100%", border: 0, padding: 0, background: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div
          style={{
            height: 132,
            borderRadius: "6px 6px 0 0",
            background: "#fff",
            border: "1px solid #E6EBF0",
            borderBottom: 0,
            overflow: "hidden",
            position: "relative",
            padding: "14px 16px",
          }}
        >
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 4, background: FAIXA_TRICOLOR }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <img src="/logo.png" alt="Setor Norte Seguros" style={{ height: 20, width: "auto" }} />
            <span style={{ fontSize: 7, color: "#5E6B76" }}>{p.hoje}</span>
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: "var(--font-titulo)",
              fontWeight: 800,
              fontSize: 6.5,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: "#7DB85A",
            }}
          >
            Blindagem Profissional da Saúde
          </div>
          <div style={{ fontFamily: "var(--font-titulo)", fontWeight: 900, fontSize: 14, color: "#396C97", marginTop: 2 }}>Olá, {p.primeiroNome},</div>
          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
            {linha("100%")}
            {linha("94%")}
            {linha("97%")}
            {linha("70%")}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F5F6F6", borderRadius: "0 0 6px 6px", padding: 10 }}>
          <div
            style={{
              width: 30,
              height: 36,
              borderRadius: 3,
              background: "#E5484D",
              color: "#fff",
              fontSize: 8.5,
              fontWeight: 800,
              display: "grid",
              placeItems: "end center",
              paddingBottom: 5,
              flex: "none",
            }}
          >
            PDF
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111B21", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.nomeArquivo}
            </span>
            <span style={{ fontSize: 12, color: "#667781" }}>{p.detalhe}</span>
          </div>
        </div>
      </button>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "3px 4px 0" }}>
        <span style={{ fontSize: 11, color: "#667781" }}>{p.time}</span>
      </div>
    </div>
  );
}

// ===== Cartão de consultoria =====

interface ConsultoriaProps {
  raio: string;
  time: string;
  texto: string;
  docBtn: boolean;
  onAbrirEstudo: () => void;
}

export function CartaoConsultoria(p: ConsultoriaProps) {
  const acao = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    borderTop: "1px solid #E9EDEF",
    padding: 12,
    fontWeight: 700,
    fontSize: 15,
    color: "#396C97",
  } as const;
  return (
    <div style={{ width: 320, maxWidth: "90%", background: "#fff", borderRadius: p.raio, boxShadow: SOMBRA, overflow: "hidden" }}>
      <div style={{ height: 6, background: FAIXA_TRICOLOR }} />
      <div style={{ padding: "10px 10px 4px" }}>
        <div style={{ fontFamily: "var(--font-titulo)", fontWeight: 800, fontSize: 16, color: "#1F2A33", marginBottom: 3 }}>Consultoria personalizada</div>
        <div style={{ fontSize: 15, lineHeight: 1.42, textWrap: "pretty" }}>
          <TextoRico texto={p.texto} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <span style={{ fontSize: 12.5, color: "#667781" }}>30 min · on-line · sem custo</span>
          <span style={{ fontSize: 11, color: "#667781" }}>{p.time}</span>
        </div>
      </div>
      <a href={AGENDA_URL} target="_blank" rel="noopener" className="sn-hv" style={{ ...acao, textDecoration: "none" }}>
        <IconCalendario />
        Agendar consultoria
      </a>
      {p.docBtn && (
        <button type="button" onClick={p.onAbrirEstudo} className="sn-hv" style={{ ...acao, width: "100%", border: 0, borderTop: acao.borderTop, cursor: "pointer" }}>
          <IconArquivo />
          Abrir meu estudo
        </button>
      )}
    </div>
  );
}
