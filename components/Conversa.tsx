"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  ETAPAS_TEXTO,
  T,
  emailValido,
  inputMode,
  mascara,
  mensagemFinal,
  nomeValido,
  placeholder,
  progresso,
  rendaDe,
  respostaConsentimento,
  tempoDigitando,
  whatsValido,
  type Etapa,
} from "@/lib/conversa";
import { aaaammddBelem, dataBelem, horaBelem, idadeEm, parseDataBR } from "@/lib/datas";
import { montarEstudo, nomeArquivoEstudo } from "@/lib/estudo";
import { primeiroNome } from "@/lib/format";
import { assinarEscolhaCookies, lerEscolhaCookies } from "@/lib/cookies";
import { contextoMedicaoPadrao, enviarLead, type DadosConversa, type ResultadoEnvio } from "@/lib/lead-client";
import { iniciarPixel, rastrear, rastrearLead } from "@/lib/pixel";
import { baixarBlob, gerarPdf, tamanhoTxt, type PdfGerado } from "@/lib/pdf";
import { PROF, type Profissao, type Sexo } from "@/lib/profissoes";
import { preCarregarTurnstile } from "@/lib/turnstile-client";
import { capturarUtms } from "@/lib/utm";
import { BarraDigitacao } from "./chat/BarraDigitacao";
import { BalaoBot, BalaoUsuario, BotoesResposta, Digitando, LinhaMsg } from "./chat/Baloes";
import { Cabecalho } from "./chat/Cabecalho";
import { CartaoArquivo, CartaoConsentimento, CartaoConsultoria } from "./chat/Cartoes";
import { FolhaProfissoes } from "./chat/FolhaProfissoes";
import { CookieBanner } from "./CookieBanner";
import { IconCadeado } from "./icons";
import { PaginasEstudo } from "./pdf/PaginasEstudo";
import { Visualizador } from "./pdf/Visualizador";
import { SOMBRA, type Botao, type Fala, type Msg } from "./chat/tipos";

const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Dados = Partial<DadosConversa>;

export default function Conversa() {
  // ----- estado de tela -----
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTypingState] = useState(false);
  const [etapa, setEtapaState] = useState<Etapa>("intro");
  const [input, setInput] = useState("");
  const [d, setDadosState] = useState<Dados>({});
  const [cE, setCE] = useState(false);
  const [cW, setCW] = useState(false);
  const [cLocked, setCLocked] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [sel, setSel] = useState<Profissao | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pdf, setPdf] = useState<PdfGerado | null>(null);
  const [preview, setPreview] = useState(false);
  const [zoom, setZoom] = useState(0.45);

  // ----- espelhos para as rotinas assíncronas (sempre o valor mais recente) -----
  const etapaRef = useRef<Etapa>("intro");
  const typingRef = useRef(false);
  const dRef = useRef<Dados>({});
  const activeRef = useRef<number | null>(null);
  const gen = useRef(0);
  const nid = useRef(1);
  const rapido = useRef(false);

  const phoneRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const conteudoRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const honeypotRef = useRef<HTMLInputElement>(null);

  // Cookies de medição: o Pixel só carrega depois de "Aceitar". No servidor, "ssr" (não mostra o banner).
  const escolhaCookies = useSyncExternalStore(assinarEscolhaCookies, lerEscolhaCookies, () => "ssr" as const);
  useEffect(() => {
    if (escolhaCookies === "aceito") iniciarPixel();
  }, [escolhaCookies]);

  const setEtapa = (e: Etapa) => {
    etapaRef.current = e;
    setEtapaState(e);
  };
  const setTyping = (t: boolean) => {
    typingRef.current = t;
    setTypingState(t);
  };
  const setAtivo = (id: number | null) => {
    activeRef.current = id;
    setActive(id);
  };
  const setDados = (patch: Dados) => {
    dRef.current = { ...dRef.current, ...patch };
    setDadosState(dRef.current);
  };

  const push = useCallback((m: Omit<Msg, "id" | "time">) => {
    const msg: Msg = { id: nid.current++, time: horaBelem(), ...m };
    setMsgs((s) => [...s, msg]);
    return msg.id;
  }, []);

  const user = (text: string) => push({ from: "user", type: "text", text });

  /** Fala do bot com indicador "digitando". Retorna false se a conversa foi reiniciada no meio. */
  const say = useCallback(
    async (items: Fala[]) => {
      const g = gen.current;
      for (const { extra, type = "text", ...it } of items) {
        setTyping(true);
        await esperar(tempoDigitando(it.text, rapido.current, extra));
        if (g !== gen.current) return false;
        setTyping(false);
        const id = push({ from: "bot", type, ...it });
        if (it.buttons || type === "consent") setAtivo(id);
        await esperar(rapido.current ? 60 : 200);
        if (g !== gen.current) return false;
      }
      return true;
    },
    [push],
  );

  const focar = () =>
    setTimeout(() => {
      const i = inputRef.current;
      if (i && !i.disabled) i.focus();
    }, 50);

  const ask = async (e: Etapa, items: Fala[]) => {
    setEtapa(e);
    setAtivo(null);
    if (await say(items)) focar();
  };

  const retry = (text: string) => {
    say([{ text }]).then(focar);
  };

  // ----- início / recomeçar -----
  const run = useCallback(async () => {
    gen.current++;
    nid.current = 1;
    setMsgs([]);
    setTyping(false);
    setEtapa("intro");
    setInput("");
    dRef.current = {};
    setDadosState({});
    setCE(false);
    setCW(false);
    setCLocked(false);
    setSheet(false);
    setSel(null);
    setAtivo(null);
    setPdf(null);
    setPreview(false);
    const g = gen.current;
    await esperar(250);
    if (g !== gen.current) return;
    await say([{ text: T.intro[0] }, { text: T.intro[1] }, { text: T.intro[2], buttons: [{ label: T.botaoComecar, v: "go" }] }]);
  }, [say]);

  useEffect(() => {
    try {
      rapido.current = new URLSearchParams(window.location.search).get("velocidade") === "rapida";
    } catch {}
    capturarUtms();
    preCarregarTurnstile();
    run();
    return () => {
      gen.current++; // cancela falas pendentes (inclusive no duplo mount do StrictMode)
      clearTimeout(toastTimer.current);
    };
  }, [run]);

  // Rola para o fim sempre que o conteúdo do chat cresce (nova mensagem, "digitando", cartões).
  useEffect(() => {
    const el = scrollRef.current;
    const conteudo = conteudoRef.current;
    if (!el || !conteudo) return;
    const ro = new ResizeObserver(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }));
    ro.observe(conteudo);
    return () => ro.disconnect();
  }, []);

  // ----- respostas rápidas -----
  const pick = (id: number, b: Botao) => {
    if (id !== activeRef.current) return;
    const e = etapaRef.current;
    if (e === "intro") {
      rastrear("ViewContent", { content_name: "Estudo Blindagem" });
      user(b.label);
      ask("nome", [{ text: T.perguntaNome }]);
    } else if (e === "prof") {
      setSheet(true);
    } else if (e === "sexo") {
      user(b.label);
      setDados({ sexo: b.v as Sexo });
      ask("nasc", [{ text: T.perguntaNasc }]);
    }
  };

  const enviarProf = () => {
    if (!sel) return;
    setSheet(false);
    setDados({ prof: sel });
    user(PROF[sel].label);
    ask("sexo", [
      {
        text: T.perguntaSexo,
        buttons: [
          { label: T.botaoF, v: "F", reply: true },
          { label: T.botaoM, v: "M", reply: true },
        ],
      },
    ]);
  };

  // ----- campo de texto -----
  const submit = () => {
    const v = input.trim();
    const e = etapaRef.current;
    if (!v || typingRef.current || !ETAPAS_TEXTO.includes(e)) return;
    setInput("");
    user(v);

    if (e === "nome") {
      if (!nomeValido(v)) return retry(T.retryNome);
      setDados({ nome: v });
      return ask("prof", [{ text: T.perguntaProf(v), buttons: [{ label: T.botaoProf, v: "open", list: true }] }]);
    }
    if (e === "nasc") {
      const nasc = parseDataBR(v);
      if (!nasc) return retry(T.retryNasc);
      const idade = idadeEm(nasc);
      if (idade < 18 || idade > 50) {
        setEtapa("fora");
        setAtivo(null);
        setDados({ nasc: v, idade });
        // Decisão: fora do perfil NÃO é gravado (ainda não há contato nem consentimento LGPD).
        return void say([{ text: T.foraPerfil }, { type: "cta", text: T.foraPerfilCta }]);
      }
      setDados({ nasc: v, idade });
      return ask("renda", [{ text: T.perguntaRenda[0] }, { text: T.perguntaRenda[1] }]);
    }
    if (e === "renda") {
      const r = rendaDe(v);
      if (!(r > 0)) return retry(T.retryRenda);
      setDados({ renda: r });
      return ask("whats", [{ text: T.perguntaWhats }]);
    }
    if (e === "whats") {
      if (!whatsValido(v)) return retry(T.retryWhats);
      setDados({ whats: v });
      return ask("email", [{ text: T.perguntaEmail }]);
    }
    if (e === "email") {
      if (!emailValido(v)) return retry(T.retryEmail);
      setDados({ email: v });
      return ask("consent", [{ text: T.ultimoPasso }, { type: "consent" }]);
    }
  };

  // ----- consentimento → envio → estudo -----
  const confirmarConsentimento = async () => {
    if (cLocked || etapaRef.current !== "consent") return;
    const consentId = activeRef.current;
    const dados = dRef.current as DadosConversa;
    const g = gen.current;
    setCLocked(true);
    setAtivo(null);
    setEtapa("gerando");
    user(respostaConsentimento(cE, cW));
    if (!(await say([{ text: T.montando }]))) return;

    // Enquanto gera o PDF e envia (Turnstile → PDF → POST /api/lead), fica o "digitando".
    // O cartão do arquivo mantém o tempo mínimo do protótipo (+1600 ms).
    setTyping(true);
    const gerarEEnviar = async (): Promise<ResultadoEnvio> => {
      const stage = stageRef.current;
      if (!stage) throw new Error("Páginas do estudo não montadas");
      const gerado = await gerarPdf(stage);
      if (g !== gen.current) return { ok: false, motivo: "erro" };
      setPdf(gerado);
      // Só em desenvolvimento: permite inspecionar o último PDF pelo console.
      if (process.env.NODE_ENV !== "production") (window as unknown as { __estudoPdf?: Blob }).__estudoPdf = gerado.blob;
      return enviarLead(dados, { email: cE, whatsapp: cW }, gerado.blob, {
        honeypot: honeypotRef.current?.value ?? "",
        medicao: contextoMedicaoPadrao(lerEscolhaCookies() === "aceito"),
        nomeArquivo: nomeArquivoEstudo(dados.nome, aaaammddBelem()),
      });
    };
    const [res] = await Promise.all([
      gerarEEnviar().catch((err): ResultadoEnvio => {
        console.error("Falha ao gerar/enviar o estudo", err instanceof Error ? err.message : err);
        return { ok: false, motivo: "erro" };
      }),
      esperar(tempoDigitando(undefined, rapido.current, 1600)),
    ]);
    if (g !== gen.current) return;
    setTyping(false);

    if (!res.ok) {
      await say([{ text: res.motivo === "limite" ? T.erroLimite : T.erroEnvio }]);
      if (g !== gen.current) return;
      // Destrava o cartão para uma nova tentativa.
      setCLocked(false);
      setEtapa("consent");
      setAtivo(consentId);
      return;
    }

    // Pixel: Lead com o mesmo eventID enviado à CAPI (deduplicação) e o valor calculado no servidor.
    rastrearLead(res.totalMensal, res.eventId);
    push({ from: "bot", type: "doc" });
    await esperar(rapido.current ? 60 : 200);
    if (g !== gen.current) return;
    setEtapa("fim");
    await say([
      { text: mensagemFinal(dados.nome, dados.email, dados.whats, cE, cW) },
      { type: "cta", docBtn: true, text: T.ctaFinal },
    ]);
  };

  const mostrarToast = (t: string) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const abrirEstudo = () => {
    const w = phoneRef.current?.clientWidth ?? 390;
    setZoom(Math.min(1, (w - 44) / 794));
    setPreview(true);
  };

  const baixar = () => {
    if (!pdf) return;
    baixarBlob(pdf.blob, nomeArquivo);
    mostrarToast("Estudo salvo em Downloads");
  };

  const voltar = () => {
    if (window.history.length > 1) window.history.back();
  };

  // Modelo das páginas do estudo (disponível quando os dados de cálculo estão completos).
  const modelo = useMemo(
    () =>
      d.nome && d.prof && d.sexo && d.idade !== undefined && d.renda
        ? montarEstudo({ nome: d.nome, prof: d.prof, sexo: d.sexo, idade: d.idade, renda: d.renda })
        : null,
    [d.nome, d.prof, d.sexo, d.idade, d.renda],
  );
  const nomeArquivo = nomeArquivoEstudo(d.nome ?? "", aaaammddBelem());

  // ----- render -----
  const composerOff = !ETAPAS_TEXTO.includes(etapa) || typing;

  return (
    <div style={{ minHeight: "100dvh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div
        ref={phoneRef}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 430,
          height: "min(100dvh, 920px)",
          display: "flex",
          flexDirection: "column",
          background: "#EFEAE2",
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(20,40,60,.18)",
        }}
      >
        <Cabecalho digitando={typing} progresso={progresso(etapa)} onVoltar={voltar} onRecomecar={run} />

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "12px 12px 8px", display: "flex", flexDirection: "column" }}>
          <div ref={conteudoRef} style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              alignSelf: "center",
              background: "#fff",
              color: "#54656F",
              fontSize: 12.5,
              fontWeight: 700,
              padding: "5px 12px",
              borderRadius: 8,
              boxShadow: SOMBRA,
              marginBottom: 8,
            }}
          >
            Hoje
          </div>
          <div
            style={{
              alignSelf: "center",
              maxWidth: 320,
              textAlign: "center",
              background: "#FFEECD",
              color: "#54656F",
              fontSize: 12.5,
              lineHeight: 1.45,
              padding: "7px 12px",
              borderRadius: 8,
              boxShadow: SOMBRA,
              marginBottom: 8,
              textWrap: "pretty",
            }}
          >
            <IconCadeado />
            Seus dados são usados para montar o seu estudo e para o contato da Setor Norte. Não vendemos seus dados.
          </div>

          <div role="log" aria-live="polite" style={{ display: "contents" }}>
            {msgs.map((m, i) => {
              const prev = msgs[i - 1];
              const primeiro = !prev || prev.from !== m.from;
              const bot = m.from === "bot";
              const raio = primeiro ? (bot ? "0 8px 8px 8px" : "8px 0 8px 8px") : "8px";
              return (
                <LinhaMsg key={m.id} bot={bot} primeiro={primeiro}>
                  {bot && m.type === "text" && <BalaoBot texto={m.text ?? ""} time={m.time} raio={raio} />}
                  {!bot && m.type === "text" && <BalaoUsuario texto={m.text ?? ""} time={m.time} raio={raio} />}
                  {m.type === "doc" && (
                    <CartaoArquivo
                      raio={raio}
                      time={m.time}
                      primeiroNome={primeiroNome(d.nome ?? "")}
                      hoje={dataBelem()}
                      nomeArquivo={nomeArquivo}
                      detalhe={pdf ? `3 páginas · PDF · ${tamanhoTxt(pdf.tamanho)}` : "3 páginas · PDF"}
                      onAbrir={abrirEstudo}
                    />
                  )}
                  {m.type === "consent" && (
                    <CartaoConsentimento
                      raio={raio}
                      time={m.time}
                      email={d.email ?? ""}
                      whats={d.whats ?? ""}
                      contatado={d.sexo === "F" ? "contatada" : "contatado"}
                      cE={cE}
                      cW={cW}
                      travado={cLocked}
                      onToggleE={() => !cLocked && setCE((x) => !x)}
                      onToggleW={() => !cLocked && setCW((x) => !x)}
                      onConfirmar={confirmarConsentimento}
                    />
                  )}
                  {m.type === "cta" && (
                    <CartaoConsultoria raio={raio} time={m.time} texto={m.text ?? ""} docBtn={!!m.docBtn} onAbrirEstudo={abrirEstudo} />
                  )}
                  {m.buttons && m.buttons.length > 0 && (
                    <BotoesResposta botoes={m.buttons} ativo={m.id === active} onPick={(b) => pick(m.id, b)} />
                  )}
                </LinhaMsg>
              );
            })}
          </div>

          {typing && <Digitando />}
          </div>
        </div>

        <BarraDigitacao
          inputRef={inputRef}
          valor={input}
          placeholder={placeholder(etapa)}
          inputMode={inputMode(etapa)}
          desligado={composerOff}
          onChange={(v) => setInput(mascara(etapaRef.current, v))}
          onEnviar={submit}
        />

        {sheet && (
          <FolhaProfissoes selecionada={sel} onSelecionar={setSel} onEnviar={enviarProf} onFechar={() => setSheet(false)} />
        )}

        {escolhaCookies === null && !preview && <CookieBanner />}

        {preview && modelo && (
          <Visualizador nomeArquivo={nomeArquivo} zoom={zoom} onFechar={() => setPreview(false)} onBaixar={baixar}>
            <PaginasEstudo m={modelo} />
          </Visualizador>
        )}

        {toast && (
          <div
            role="status"
            style={{
              position: "absolute",
              left: "50%",
              bottom: 84,
              transform: "translateX(-50%)",
              zIndex: 8,
              background: "#111B21",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              padding: "10px 16px",
              borderRadius: 22,
              whiteSpace: "nowrap",
              animation: "snIn .2s ease-out",
            }}
          >
            {toast}
          </div>
        )}
      </div>
      {/* Honeypot anti-robô: invisível para pessoas; se vier preenchido, o servidor descarta o lead. */}
      <input
        ref={honeypotRef}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: -10000, width: 1, height: 1, opacity: 0 }}
      />
      {/* Páginas do estudo fora da tela, usadas para gerar o PDF. */}
      {modelo && (
        <div ref={stageRef} aria-hidden="true" style={{ position: "fixed", left: -10000, top: 0, width: 794, pointerEvents: "none" }}>
          <PaginasEstudo m={modelo} />
        </div>
      )}
    </div>
  );
}
