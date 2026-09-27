import type { CSSProperties, ReactNode } from "react";
import type { ModeloEstudo } from "@/lib/estudo";
import { Grafico } from "./Grafico";

// As 3 páginas A4 do estudo (794 × 1123 px), fiéis aos blocos "Estudo p1/p2/p3" do protótipo.
// São renderizadas no visualizador e, fora da tela, para gerar o PDF com html2canvas.

const FAIXA = "linear-gradient(90deg,#396C97 0 62%,#7DB85A 62% 84%,#4D4C4E 84% 100%)";
const TITULO = "var(--font-titulo)";
const ASSINATURA_CONTATO = "(96) 98133-9955 · edgartorres@setornorteseguros.com.br";

function Pagina({ n, hoje, children }: { n: number; hoje: string; children: ReactNode }) {
  return (
    <div
      data-pagina-estudo={n}
      data-screen-label={`Estudo p${n}`}
      style={{
        width: 794,
        height: 1123,
        background: "#fff",
        color: "#1F2A33",
        padding: "52px 60px 0",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontSize: 13,
        flex: "none",
      }}
    >
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 8, background: FAIXA }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <img src="/logo.png" alt="Setor Norte Seguros" style={{ height: 44, width: "auto" }} />
        <span style={{ color: "#5E6B76", fontSize: 12.5, fontWeight: 600 }}>{hoje}</span>
      </div>
      {children}
      <div
        style={{
          marginTop: "auto",
          borderTop: "1px solid #DDE4EA",
          padding: "10px 0 18px",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 9.5,
          color: "#6B7782",
        }}
      >
        <span>
          <b style={{ color: "#396C97" }}>Torres Norte Corretora de Seguros Ltda</b> · CNPJ 11.903.619/0001-22 · SUSEP 202087923 ·
          www.setornorteseguros.com.br
        </span>
        <span>{n}/3</span>
      </div>
    </div>
  );
}

const h1: CSSProperties = { fontFamily: TITULO, fontSize: 25, fontWeight: 900, color: "#396C97", margin: 0 };
const sub: CSSProperties = { fontSize: 14, color: "#5E6B76", margin: "2px 0 16px" };
const h2: CSSProperties = {
  fontFamily: TITULO,
  fontSize: 14,
  fontWeight: 800,
  color: "#396C97",
  margin: "16px 0 7px",
  paddingBottom: 5,
  borderBottom: "2px solid #7DB85A",
};
const rotulo: CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: ".07em",
  textTransform: "uppercase",
  color: "#5E6B76",
};
const nota: CSSProperties = { display: "block", fontSize: 10.5, color: "#5E6B76" };
const grade3: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 130px 90px", padding: 6, borderBottom: "1px solid #E6EBF0" };
const grupo: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 90px",
  padding: 6,
  background: "#F2F6F9",
  color: "#396C97",
  fontWeight: 800,
  fontSize: 11.5,
};
const dir: CSSProperties = { textAlign: "right" };
const desc: CSSProperties = { display: "block", color: "#6B7782", fontSize: 10.5 };

function Dado({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #E6EBF0" }}>
      <span style={{ color: "#5E6B76" }}>{k}</span>
      <b>{v}</b>
    </div>
  );
}

function Assinatura() {
  return (
    <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 1 }}>
      <b style={{ fontFamily: TITULO, fontSize: 17, color: "#396C97" }}>Edgar Torres</b>
      <span style={{ fontSize: 12.5, color: "#5E6B76" }}>Corretor de seguros · Setor Norte Seguros</span>
      <span style={{ fontSize: 12.5, color: "#5E6B76" }}>{ASSINATURA_CONTATO}</span>
    </div>
  );
}

export function PaginasEstudo({ m }: { m: ModeloEstudo }) {
  return (
    <>
      {/* ===== Página 1: carta ===== */}
      <Pagina n={1} hoje={m.hojeLongo}>
        <p
          style={{
            fontFamily: TITULO,
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "#7DB85A",
            margin: "0 0 6px",
          }}
        >
          Blindagem Profissional da Saúde
        </p>
        <h1 style={{ fontFamily: TITULO, fontWeight: 900, fontSize: 27, color: "#396C97", margin: "0 0 22px" }}>Olá, {m.primeiroNome},</h1>
        {m.carta.map((p, i) => (
          <p key={i} lang="pt-BR" style={{ fontSize: 14.5, lineHeight: 1.72, margin: "0 0 14px", color: "#2B3640", textAlign: "justify", hyphens: "auto" }}>
            {p}
          </p>
        ))}
        <div style={{ marginTop: 10, fontSize: 14.5, color: "#2B3640" }}>Um abraço,</div>
        <Assinatura />
        <img src="/sym.png" alt="" style={{ position: "absolute", right: -40, bottom: 40, width: 250, opacity: 0.07 }} />
      </Pagina>

      {/* ===== Página 2: plano de proteção ===== */}
      <Pagina n={2} hoje={m.hojeLongo}>
        <h1 style={h1}>Seu plano de proteção</h1>
        <div style={sub}>preparado para {m.nome}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" }}>
          <Dado k="Idade" v={m.idadeTxt} />
          <Dado k="Profissão" v={m.profLabel} />
          <Dado k="Renda mensal informada" v={m.rendaTxt} />
          <Dado k="Aporte na previdência" v={m.aporteTxt} />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 1fr 1fr",
            border: "1px solid #DDE4EA",
            borderRadius: 10,
            overflow: "hidden",
            margin: "12px 0 4px",
          }}
        >
          <div style={{ padding: "10px 12px", background: "#EAF4E3" }}>
            <span style={rotulo}>Investimento mensal</span>
            <b style={{ fontFamily: TITULO, fontSize: 21, fontWeight: 900, color: "#4E8A2E" }}>{m.totalTxt}</b>
            <small style={nota}>{m.totalPct} da renda informada</small>
          </div>
          <div style={{ padding: "10px 12px", borderLeft: "1px solid #DDE4EA" }}>
            <span style={rotulo}>Proteção</span>
            <b style={{ fontFamily: TITULO, fontSize: 18, fontWeight: 900 }}>{m.protecaoTxt}</b>
            <small style={nota}>Seguro + renda por invalidez</small>
          </div>
          <div style={{ padding: "10px 12px", borderLeft: "1px solid #DDE4EA" }}>
            <span style={rotulo}>Previdência</span>
            <b style={{ fontFamily: TITULO, fontSize: 18, fontWeight: 900 }}>{m.aporteTxt}</b>
            <small style={nota}>Reserva sua, resgatável</small>
          </div>
        </div>

        <h2 style={h2}>Coberturas</h2>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
          <div
            style={{
              ...grade3,
              padding: "5px 6px",
              borderBottom: "1px solid #C9D3DC",
              color: "#5E6B76",
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: ".06em",
              textTransform: "uppercase",
            }}
          >
            <span>Cobertura</span>
            <span style={dir}>Capital</span>
            <span style={dir}>Por mês</span>
          </div>
          <div style={grupo}>
            <span>Icatu Essencial · seguro de vida individual</span>
            <span style={dir}>{m.essencialTxt}</span>
          </div>
          {m.coberturas.map((c) => (
            <div key={c.nome} style={grade3}>
              <span>
                {c.nome}
                <span style={desc}>{c.descricao}</span>
              </span>
              <span style={dir}>{c.capital}</span>
              <span style={dir}>{c.mensal}</span>
            </div>
          ))}
          <div style={grupo}>
            <span>Icatu Atitude+Simples · previdência com proteção, sem DPS</span>
            <span style={dir}>{m.atitudeTxt}</span>
          </div>
          <div style={grade3}>
            <span>
              Renda vitalícia por invalidez
              <span style={desc}>Invalidez total e permanente, por acidente ou doença. Paga todo mês, por toda a vida.</span>
            </span>
            <span style={dir}>{m.rviCapital}</span>
            <span style={dir}>{m.rviMensal}</span>
          </div>
          <div style={grade3}>
            <span>
              Acumulação de reserva (VGBL ou PGBL)
              <span style={desc}>Resgatável. Carência inicial de 60 dias para resgate ou portabilidade.</span>
            </span>
            <span style={dir}>—</span>
            <span style={dir}>{m.aporteTxt}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", padding: 6, fontWeight: 900, fontSize: 13 }}>
            <span>Total mensal</span>
            <span style={dir}>{m.totalTxt}</span>
          </div>
        </div>

        <h2 style={h2}>Como o plano funciona</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 18px", fontSize: 11, lineHeight: 1.45, color: "#2B3640" }}>
          <p style={{ margin: "0 0 4px" }}>
            <b>Se precisar parar por um tempo,</b> a DIT paga uma diária enquanto durar o afastamento, inclusive por LER/DORT/LTC, respeitada a
            franquia da apólice.
          </p>
          <p style={{ margin: "0 0 4px" }}>
            <b>Se não puder mais trabalhar,</b> a IPA paga o capital em caso de acidente e a renda vitalícia por invalidez paga todo mês, por
            acidente ou doença.
          </p>
          <p style={{ margin: "0 0 4px" }}>
            <b>No diagnóstico de uma doença grave,</b> o capital de doenças graves é pago de uma vez para o tratamento e a recuperação.
          </p>
          <p style={{ margin: "0 0 4px" }}>
            <b>Para a família,</b> o capital de vida e a assistência funeral evitam que custos e dívidas recaiam sobre quem fica.
          </p>
        </div>
      </Pagina>

      {/* ===== Página 3: recuperação do valor pago ===== */}
      <Pagina n={3} hoje={m.hojeLongo}>
        <h1 style={h1}>Recuperação do valor pago</h1>
        <div style={sub}>Quanto do que você paga volta como reserva de previdência</div>
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            background: "#F2F6F9",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 6,
          }}
        >
          <b style={{ fontFamily: TITULO, fontSize: 24, color: "#4E8A2E", whiteSpace: "nowrap" }}>{m.payBig}</b>
          <p style={{ margin: 0, fontSize: 12, color: "#2B3640" }}>{m.payTxt}</p>
        </div>
        <Grafico S={m.calc} />
        <div style={{ display: "flex", gap: 14, fontSize: 10.5, color: "#5E6B76", marginTop: 2 }}>
          <span>
            <Traco cor="#396C97" />
            Total pago acumulado
          </span>
          <span>
            <Traco cor="#4E8A2E" />
            Reserva acumulada
          </span>
          <span>Eixo horizontal: anos de contrato</span>
        </div>

        <h2 style={h2}>Evolução</h2>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 11 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "60px 60px 1fr 1fr 1fr",
              padding: "5px 4px",
              borderBottom: "1px solid #C9D3DC",
              color: "#5E6B76",
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: ".06em",
              textTransform: "uppercase",
            }}
          >
            <span>Ano</span>
            <span>Idade</span>
            <span style={dir}>Total pago</span>
            <span style={dir}>Reserva</span>
            <span style={dir}>Saldo</span>
          </div>
          {m.evolucao.map((e) => (
            <div
              key={e.ano}
              style={{
                display: "grid",
                gridTemplateColumns: "60px 60px 1fr 1fr 1fr",
                padding: "5px 4px",
                borderBottom: "1px solid #E6EBF0",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span>{e.ano}</span>
              <span>{e.idade}</span>
              <span style={dir}>{e.pago}</span>
              <span style={dir}>{e.reserva}</span>
              <span style={{ ...dir, color: e.positivo ? "#4E8A2E" : "#6B7782" }}>{e.saldo}</span>
            </div>
          ))}
        </div>

        <h2 style={h2}>Avisos importantes</h2>
        <div style={{ fontSize: 9.6, color: "#5E6B76", lineHeight: 1.45 }}>
          <p style={{ margin: "0 0 4px" }}>
            Este estudo é uma simulação de referência elaborada pela Setor Norte Seguros por faixa de idade e de renda. Não é proposta nem cotação
            oficial. Os valores definitivos dependem da análise de risco da seguradora, da profissão, da Declaração Pessoal de Saúde (quando
            exigida) e da data de contratação.
          </p>
          <p style={{ margin: "0 0 4px" }}>
            Seguro Icatu Essencial administrado por Icatu Seguros S.A., CNPJ 42.283.770/0001-39, Processo SUSEP nº 15414.605410/2025-13. Plano de
            previdência Atitude+Simples e cobertura de Renda por Invalidez administrados por Icatu Seguros S.A., Processo SUSEP nº
            15414.639505/2022-98. Os seguros obedecem às Condições Gerais e ao regulamento do plano, que devem ser lidos antes da contratação e
            estão disponíveis em www.susep.gov.br e www.icatuseguros.com.br. O registro do produto é automático e não representa aprovação ou
            recomendação por parte da SUSEP.
          </p>
          <p style={{ margin: "0 0 4px" }}>
            Prêmios, contribuições e coberturas são atualizados anualmente pelo IPCA e reajustados por idade no aniversário da apólice ou do
            certificado. A renda por invalidez tem carência de 12 meses, exceto para acidente pessoal. A rentabilidade usada na projeção (10,00%
            a.a. acima da inflação) é uma estimativa e não representa garantia de resultado; fundos de previdência não contam com garantia do FGC.
            O resgate está sujeito a imposto de renda conforme o regime tributário escolhido.
          </p>
          <p style={{ margin: "0 0 4px" }}>
            O segurado pode consultar a situação cadastral do corretor de seguros em www.susep.gov.br pelo registro SUSEP 202087923. SAC Icatu:
            0800 286 0110. Ouvidoria: 0800 286 0047.
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, marginTop: 14 }}>
          <div style={{ fontSize: 9.6, color: "#5E6B76", maxWidth: 300 }}>Estudo válido por 10 dias a partir de {m.hojeCurto}.</div>
          <div style={{ width: 320, borderTop: "1px solid #4D4C4E", paddingTop: 4, fontSize: 11, color: "#4D4C4E" }}>
            <b style={{ display: "block", fontFamily: TITULO, fontSize: 13.5, color: "#396C97" }}>Edgar Torres</b>
            Corretor de seguros · Setor Norte Seguros
            <br />
            {ASSINATURA_CONTATO}
          </div>
        </div>
      </Pagina>
    </>
  );
}

function Traco({ cor }: { cor: string }) {
  return (
    <i style={{ display: "inline-block", width: 12, height: 3, borderRadius: 2, verticalAlign: "middle", marginRight: 5, background: cor }} />
  );
}
