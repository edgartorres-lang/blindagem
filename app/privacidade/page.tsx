import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { CONSENT_VERSAO } from "@/lib/conversa";

export const metadata: Metadata = {
  title: "Política de Privacidade | Setor Norte Seguros",
  description: "Como a Setor Norte Seguros trata os dados pessoais informados no Estudo de Blindagem Profissional da Saúde.",
};

const ENCARREGADO = { nome: "Edgar Torres", email: "edgartorres@setornorteseguros.com.br" };
const FAIXA = "linear-gradient(90deg,#396C97 0 62%,#7DB85A 62% 84%,#4D4C4E 84% 100%)";

// "2026-09-27" → "27 de setembro de 2026"
const versaoLonga = new Date(`${CONSENT_VERSAO}T12:00:00Z`).toLocaleDateString("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Belem",
});

const h2: CSSProperties = {
  fontFamily: "var(--font-titulo)",
  fontWeight: 800,
  fontSize: 18,
  color: "#396C97",
  margin: "28px 0 8px",
  paddingBottom: 6,
  borderBottom: "2px solid #7DB85A",
};
const p: CSSProperties = { margin: "0 0 10px" };
const ul: CSSProperties = { margin: "0 0 10px", paddingLeft: 20 };
const td: CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #E6EBF0", verticalAlign: "top", textAlign: "left" };
const th: CSSProperties = { ...td, background: "#F2F6F9", color: "#396C97", fontWeight: 800, fontSize: 13 };

function Secao({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`}>
      <h2 id={`${id}-t`} style={h2}>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

const email = <a href={`mailto:${ENCARREGADO.email}`}>{ENCARREGADO.email}</a>;

export default function Privacidade() {
  return (
    <div style={{ minHeight: "100dvh", background: "#DCE3E8", padding: "0 0 32px" }}>
      <div style={{ height: 6, background: FAIXA }} />
      <main
        style={{
          maxWidth: 760,
          margin: "0 auto",
          background: "#fff",
          padding: "28px 22px 36px",
          fontSize: 15,
          lineHeight: 1.6,
          color: "#2B3640",
          boxShadow: "0 10px 40px rgba(20,40,60,.10)",
        }}
      >
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <img src="/logo.png" alt="Setor Norte Seguros" style={{ height: 40, width: "auto" }} />
          <a href="/" style={{ fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            ← Voltar ao estudo
          </a>
        </header>

        <p
          style={{
            fontFamily: "var(--font-titulo)",
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "#7DB85A",
            margin: "0 0 4px",
          }}
        >
          Estudo de Blindagem Profissional da Saúde
        </p>
        <h1 style={{ fontFamily: "var(--font-titulo)", fontWeight: 900, fontSize: 28, color: "#396C97", margin: "0 0 6px", lineHeight: 1.2 }}>
          Política de Privacidade
        </h1>
        <p style={{ ...p, color: "#5E6B76", fontSize: 13.5 }}>Versão de {versaoLonga}.</p>

        <p style={p}>
          Esta política explica como tratamos os dados pessoais que você informa na conversa do Estudo de Blindagem Profissional da Saúde, em{" "}
          <b>blindagem.setornorteseguros.com.br</b>, de acordo com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018, LGPD). Não
          vendemos seus dados.
        </p>

        <Secao id="controlador" titulo="1. Quem é o responsável pelos seus dados">
          <p style={p}>
            <b>Torres Norte Corretora de Seguros Ltda</b> (Setor Norte Seguros), CNPJ 11.903.619/0001-22, corretora registrada na SUSEP sob o nº
            202087923, com sede em Macapá (AP). Site: www.setornorteseguros.com.br.
          </p>
          <p style={p}>
            <b>Encarregado pelo tratamento de dados (DPO):</b> {ENCARREGADO.nome}, {email}. É com ele que você fala sobre qualquer assunto desta
            política.
          </p>
        </Secao>

        <Secao id="dados" titulo="2. Quais dados coletamos">
          <ul style={ul}>
            <li>
              <b>Informados por você na conversa:</b> nome completo, profissão, preferência de tratamento (feminino ou masculino), data de
              nascimento, renda mensal média, WhatsApp e e-mail.
            </li>
            <li>
              <b>Suas autorizações:</b> se autorizou receber o estudo e comunicações por e-mail e se autorizou o contato do corretor por WhatsApp,
              com data, hora e a versão do texto que você aceitou.
            </li>
            <li>
              <b>Dados técnicos:</b> endereço IP, tipo de navegador e aparelho (user agent) e a origem da visita (parâmetros de campanha, como
              utm_source e fbclid, quando você chega por um anúncio).
            </li>
            <li>
              <b>Cookies de medição:</b> identificadores do Meta Pixel (_fbp e _fbc), somente se você clicar em “Aceitar” no aviso de cookies.
            </li>
          </ul>
          <p style={p}>
            Não pedimos dados de saúde, CPF nem dados bancários. O estudo é destinado a pessoas de 18 a 50 anos; se a data informada estiver fora
            dessa faixa, os dados não são gravados.
          </p>
        </Secao>

        <Secao id="finalidades" titulo="3. Para que usamos e com qual base legal">
          <div style={{ overflowX: "auto", margin: "0 0 10px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 520 }}>
              <thead>
                <tr>
                  <th style={th}>Finalidade</th>
                  <th style={th}>Base legal (LGPD)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={td}>Calcular e montar o seu estudo em PDF, a seu pedido.</td>
                  <td style={td}>Procedimentos preliminares a um contrato, a pedido do titular (art. 7º, V).</td>
                </tr>
                <tr>
                  <td style={td}>Enviar o estudo e comunicações da Setor Norte Seguros por e-mail.</td>
                  <td style={td}>Consentimento (art. 7º, I), dado no cartão de autorização.</td>
                </tr>
                <tr>
                  <td style={td}>Contato do corretor por WhatsApp para apresentar e ajustar o plano.</td>
                  <td style={td}>Consentimento (art. 7º, I), dado no cartão de autorização.</td>
                </tr>
                <tr>
                  <td style={td}>Registrar o atendimento no nosso sistema de relacionamento (CRM) e acompanhar a consultoria.</td>
                  <td style={td}>Procedimentos preliminares a um contrato (art. 7º, V) e legítimo interesse (art. 7º, IX).</td>
                </tr>
                <tr>
                  <td style={td}>Medir o resultado dos nossos anúncios (Meta), inclusive pelo envio do evento “Lead” com e-mail e telefone criptografados (hash).</td>
                  <td style={td}>Legítimo interesse (art. 7º, IX). Os cookies do Pixel no seu navegador dependem do seu consentimento.</td>
                </tr>
                <tr>
                  <td style={td}>Prevenir fraudes e abusos (verificação anti-robô e limite de envios por endereço IP).</td>
                  <td style={td}>Legítimo interesse (art. 7º, IX).</td>
                </tr>
                <tr>
                  <td style={td}>Guardar a prova das suas autorizações e cumprir obrigações legais e regulatórias.</td>
                  <td style={td}>Cumprimento de obrigação legal ou regulatória (art. 7º, II) e exercício regular de direitos (art. 7º, VI).</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={p}>
            Os valores do estudo são uma simulação de referência. Nenhuma decisão sobre você é tomada de forma automatizada: a proposta definitiva
            depende da análise da seguradora e da conversa com o corretor.
          </p>
        </Secao>

        <Secao id="compartilhamento" titulo="4. Com quem os dados são compartilhados">
          <p style={p}>
            Usamos fornecedores que tratam os dados apenas para prestar o serviço a nós (operadores), sob contrato e com medidas de segurança:
          </p>
          <ul style={ul}>
            <li>
              <b>Vercel</b>: hospedagem do site.
            </li>
            <li>
              <b>Google (Google Workspace)</b>: armazenamento do PDF no Google Drive e registro do atendimento no Google Planilhas, com acesso
              restrito à equipe da Setor Norte.
            </li>
            <li>
              <b>Resend</b>: envio do e-mail com o estudo.
            </li>
            <li>
              <b>Cloudflare (Turnstile)</b> e <b>Upstash</b>: verificação anti-robô e controle de limite de envios.
            </li>
            <li>
              <b>n8n</b> e <b>RD Station CRM</b>: automação do aviso ao corretor e cadastro no nosso sistema de relacionamento.
            </li>
            <li>
              <b>Meta (Facebook e Instagram)</b>: medição de anúncios. O e-mail, o telefone, o nome, o sexo e a data de nascimento são enviados
              criptografados por hash (SHA-256), sem que a Meta receba esses dados em texto legível.
            </li>
          </ul>
          <p style={p}>
            Se você contratar um seguro ou plano de previdência, os dados necessários serão enviados à seguradora escolhida (por exemplo, Icatu
            Seguros S.A.) para a proposta. Também podemos compartilhar dados quando exigido por lei ou por autoridade competente.
          </p>
          <p style={p}>
            <b>Transferência internacional:</b> alguns desses fornecedores mantêm servidores fora do Brasil. Nesses casos, a transferência segue o
            art. 33 da LGPD, com cláusulas contratuais e garantias de proteção equivalentes.
          </p>
        </Secao>

        <Secao id="cookies" titulo="5. Cookies e armazenamento no navegador">
          <ul style={ul}>
            <li>
              <b>Meta Pixel (medição de anúncios):</b> só é carregado se você clicar em “Aceitar” no aviso de cookies. Se clicar em “Recusar”, o
              Pixel não é carregado.
            </li>
            <li>
              <b>Armazenamento necessário:</b> guardamos no seu navegador a sua escolha sobre cookies e, durante a visita, a origem da campanha
              (utm). Não são usados para identificar você.
            </li>
          </ul>
          <p style={p}>
            Para mudar sua escolha, apague os dados deste site nas configurações do navegador; o aviso aparecerá de novo na próxima visita.
          </p>
        </Secao>

        <Secao id="retencao" titulo="6. Por quanto tempo guardamos">
          <ul style={ul}>
            <li>
              <b>Quem não se tornou cliente:</b> até <b>2 anos</b> após o último contato. Depois disso, os dados e o PDF são excluídos.
            </li>
            <li>
              <b>Quem contratou:</b> pelo tempo do contrato e pelos prazos exigidos pela legislação e pela regulação de seguros (SUSEP).
            </li>
            <li>
              <b>Prova das autorizações:</b> pelo mesmo período dos dados a que se referem, para demonstrar que o tratamento foi autorizado.
            </li>
          </ul>
          <p style={p}>Se você pedir a exclusão, apagamos antes desses prazos, exceto o que a lei nos obrigar a guardar.</p>
        </Secao>

        <Secao id="direitos" titulo="7. Seus direitos e como exercê-los">
          <p style={p}>Pelo art. 18 da LGPD, você pode, a qualquer momento e sem custo:</p>
          <ul style={ul}>
            <li>confirmar se tratamos seus dados e acessá-los;</li>
            <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>pedir anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desacordo com a lei;</li>
            <li>pedir a portabilidade dos dados;</li>
            <li>pedir a eliminação dos dados tratados com base no seu consentimento;</li>
            <li>saber com quem compartilhamos seus dados;</li>
            <li>
              <b>retirar o seu consentimento</b> para e-mail ou WhatsApp;
            </li>
            <li>se opor a tratamento baseado em legítimo interesse, como a medição de anúncios.</li>
          </ul>
          <p style={p}>
            <b>Como pedir:</b> envie um e-mail para {email}. Para parar de receber e-mails, use também o link “Não quero mais receber e-mails” no
            rodapé de qualquer mensagem nossa. Para parar o contato por WhatsApp, basta responder ao corretor pedindo. Respondemos em até 15 dias.
          </p>
          <p style={p}>
            Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD), em www.gov.br/anpd.
          </p>
        </Secao>

        <Secao id="seguranca" titulo="8. Como protegemos seus dados">
          <p style={p}>
            A conexão com o site é criptografada (HTTPS). As chaves de acesso aos serviços ficam apenas no servidor, nunca no seu navegador. A
            planilha e a pasta dos estudos são privadas, com acesso restrito à equipe da Setor Norte, e os registros técnicos do servidor não
            guardam seus dados pessoais. Usamos verificação anti-robô e limite de envios para evitar abusos.
          </p>
        </Secao>

        <Secao id="alteracoes" titulo="9. Alterações desta política">
          <p style={p}>
            Podemos atualizar esta política. A versão vigente e a data ficam no topo desta página. Mudanças relevantes sobre o uso dos seus dados
            serão informadas antes de pedirmos uma nova autorização.
          </p>
        </Secao>

        <footer style={{ marginTop: 32, paddingTop: 12, borderTop: "1px solid #DDE4EA", fontSize: 12, color: "#6B7782" }}>
          <b style={{ color: "#396C97" }}>Torres Norte Corretora de Seguros Ltda</b> · CNPJ 11.903.619/0001-22 · SUSEP 202087923 ·
          www.setornorteseguros.com.br
        </footer>
      </main>
    </div>
  );
}
