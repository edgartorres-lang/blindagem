// Regras puras da conversa (sem React): etapas, textos exatos do protótipo, máscaras e validações.

import { brl, primeiroNome } from "./format";
import type { Sexo } from "./profissoes";

export type Etapa =
  | "intro"
  | "nome"
  | "prof"
  | "sexo"
  | "nasc"
  | "renda"
  | "whats"
  | "email"
  | "consent"
  | "gerando"
  | "fim"
  | "fora";

/** Ordem usada na barra de progresso. */
export const ORDEM: Etapa[] = ["intro", "nome", "prof", "sexo", "nasc", "renda", "whats", "email", "consent", "fim"];

export function progresso(etapa: Etapa): number {
  const idx = Math.max(0, ORDEM.indexOf(etapa === "gerando" ? "fim" : etapa));
  return Math.round((idx / (ORDEM.length - 1)) * 100);
}

/** Etapas em que o campo de digitação fica ativo. */
export const ETAPAS_TEXTO: Etapa[] = ["nome", "nasc", "renda", "whats", "email"];

export function placeholder(etapa: Etapa): string {
  const ph: Partial<Record<Etapa, string>> = {
    nome: "Digite seu nome completo",
    nasc: "dd/mm/aaaa",
    renda: "R$ 0,00",
    whats: "(00) 00000-0000",
    email: "seu@email.com",
  };
  return ph[etapa] ?? (etapa === "fim" || etapa === "fora" ? "Conversa concluída" : "Escolha uma opção acima");
}

export function inputMode(etapa: Etapa): "numeric" | "tel" | "email" | "text" {
  return ({ nasc: "numeric", renda: "numeric", whats: "tel", email: "email" } as const)[etapa as "nasc"] ?? "text";
}

/** Máscaras: data dd/mm/aaaa, renda em moeda (dígitos ÷ 100), WhatsApp (00) 00000-0000. */
export function mascara(etapa: Etapa, v: string): string {
  const dg = v.replace(/\D/g, "");
  if (etapa === "nasc") {
    const x = dg.slice(0, 8);
    return x.length > 4 ? `${x.slice(0, 2)}/${x.slice(2, 4)}/${x.slice(4)}` : x.length > 2 ? `${x.slice(0, 2)}/${x.slice(2)}` : x;
  }
  if (etapa === "whats") {
    const x = dg.slice(0, 11);
    if (!x) return "";
    if (x.length <= 2) return `(${x}`;
    if (x.length <= 6) return `(${x.slice(0, 2)}) ${x.slice(2)}`;
    if (x.length <= 10) return `(${x.slice(0, 2)}) ${x.slice(2, 6)}-${x.slice(6)}`;
    return `(${x.slice(0, 2)}) ${x.slice(2, 7)}-${x.slice(7)}`;
  }
  if (etapa === "renda") {
    const x = dg.replace(/^0+/, "").slice(0, 9);
    return x ? brl(Number(x) / 100) : "";
  }
  return v;
}

export const nomeValido = (v: string) => v.trim().split(/\s+/).length >= 2;
export const rendaDe = (v: string) => Number(v.replace(/\D/g, "")) / 100;
export const digitos = (v: string) => v.replace(/\D/g, "");
export const whatsValido = (v: string) => digitos(v).length >= 10;
export const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/** Tempo do indicador "digitando": min(1800, 550 + caracteres × 13) ms (+ extra). */
export const tempoDigitando = (texto: string | undefined, rapido: boolean, extra = 0) =>
  rapido ? 300 : Math.min(1800, 550 + (texto ?? "").length * 13) + extra;

/** "*texto*" vira negrito. */
export function segmentos(t: string) {
  return String(t || "")
    .split(/\*([^*]+)\*/)
    .map((s, i) => ({ t: s, b: i % 2 === 1 }))
    .filter((s) => s.t);
}

// ===== Textos exatos do protótipo =====
export const T = {
  intro: [
    "Olá! Aqui é o assistente virtual da *Setor Norte Seguros*.",
    "Vou fazer algumas perguntas rápidas para montar o seu *Estudo de Blindagem Profissional da Saúde*, um plano de proteção para quem vive de atender pacientes.",
    "Leva cerca de 2 minutos. No final, você recebe o estudo em PDF e pode agendar uma consultoria gratuita. Vamos começar?",
  ],
  botaoComecar: "Vamos começar",
  perguntaNome: "Qual é o seu nome completo?",
  retryNome: "Pode me dizer o seu nome completo? Ele vai no seu estudo.",
  perguntaProf: (nome: string) => `Prazer, ${primeiroNome(nome)}! Qual é a sua profissão?`,
  botaoProf: "Ver profissões",
  perguntaSexo: "Para personalizar a carta que acompanha o estudo, prefere que eu escreva no feminino ou no masculino?",
  botaoF: "No feminino",
  botaoM: "No masculino",
  perguntaNasc: "Anotado. Qual é a sua data de nascimento?",
  retryNasc: "Não reconheci essa data. Pode digitar no formato dd/mm/aaaa?",
  foraPerfil: "Este estudo on-line atende profissionais de 18 a 50 anos. Para o seu caso, o melhor caminho é conversar direto com o nosso corretor, que monta um plano sob medida.",
  foraPerfilCta: "Agende uma conversa com o corretor *Edgar Torres*. Ele analisa a sua situação e apresenta as opções disponíveis para a sua idade.",
  perguntaRenda: ["Qual é, em média, a sua renda mensal com os atendimentos?", "É ela que define quanto você recebe se precisar se afastar do trabalho."],
  retryRenda: "Pode informar a renda em reais? Por exemplo, R$ 5.500,00.",
  perguntaWhats: "Obrigado. Agora me diga para onde enviar o estudo. Qual é o seu WhatsApp com DDD?",
  retryWhats: "Esse número parece incompleto. Pode digitar com DDD?",
  perguntaEmail: "E qual é o seu e-mail?",
  retryEmail: "Esse e-mail não parece válido. Pode conferir?",
  ultimoPasso: "Último passo antes de enviar.",
  montando: "Obrigado! Estou montando o seu estudo com base nas suas respostas.",
  ctaFinal: "O estudo traz valores de referência. Na consultoria, o corretor *Edgar Torres* revisa cada proteção com você e ajusta o plano à sua realidade antes de qualquer contratação.",
  erroEnvio: "Não consegui enviar agora. Tente de novo em instantes.",
  erroLimite: "Recebemos muitas solicitações deste dispositivo. Tente novamente mais tarde ou fale com o corretor.",
};

export function respostaConsentimento(cE: boolean, cW: boolean) {
  return cE && cW
    ? "Autorizo o contato por e-mail e WhatsApp."
    : cE
      ? "Autorizo só o contato por e-mail."
      : cW
        ? "Autorizo só o contato por WhatsApp."
        : "Prefiro não autorizar contato.";
}

export function mensagemFinal(nome: string, email: string, whats: string, cE: boolean, cW: boolean) {
  // O sistema só envia o PDF por e-mail. O contato por WhatsApp é feito pelo corretor (via n8n).
  const corretor = `O corretor *Edgar Torres* vai falar com você pelo WhatsApp *${whats}*.`;
  const env =
    cE && cW
      ? `Enviei uma cópia para *${email}*. ${corretor}`
      : cE
        ? `Enviei uma cópia para *${email}*.`
        : cW
          ? `${corretor} Toque no arquivo para abrir ou baixar.`
          : "Toque no arquivo para abrir ou baixar.";
  return `Pronto, ${primeiroNome(nome)}! O seu estudo está aqui em cima. ${env}`;
}

// ===== Consentimento LGPD (texto exato gravado como prova) =====
export const CONSENT_VERSAO = "2026-09-27";
export const CONSENT_INTRO =
  "Para enviar o estudo e falar com você depois, preciso da sua autorização, conforme a Lei Geral de Proteção de Dados (LGPD).";
export const consentEmailTexto = (email: string) =>
  `Autorizo receber o estudo e comunicações da Setor Norte Seguros no e-mail ${email}`;
export const consentWhatsTexto = (whats: string, sexo: Sexo | undefined) =>
  `Autorizo ser ${sexo === "F" ? "contatada" : "contatado"} pelo corretor por WhatsApp no número ${whats}`;
export const CONSENT_NOTA = "Você pode retirar a autorização quando quiser.";

export const AGENDA_URL = "https://calendar.app.google/a7VPtRQcGx5wVE529";
