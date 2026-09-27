// Modelo de dados das 3 páginas do Estudo (textos já formatados), a partir das respostas da conversa.
// Puro: serve ao navegador (PDF com html2canvas) e, numa versão futura, ao servidor (@react-pdf).

import { APORTE, HMAX, calcularEstudo, type Estudo } from "./calc";
import { FUSO, dataBelem } from "./datas";
import { brl, brl0, capitalTxt, pct1, primeiroNome } from "./format";
import { carta, tituloProfissao, type Profissao, type Sexo } from "./profissoes";

export interface EntradaEstudo {
  nome: string;
  prof: Profissao;
  sexo: Sexo;
  idade: number;
  renda: number;
}

export interface LinhaCobertura {
  nome: string;
  descricao: string;
  capital: string;
  mensal: string;
}

export interface LinhaEvolucao {
  ano: number;
  idade: number;
  pago: string;
  reserva: string;
  saldo: string;
  positivo: boolean;
}

export interface ModeloEstudo {
  calc: Estudo;
  nome: string;
  primeiroNome: string;
  carta: string[];
  profLabel: string;
  idadeTxt: string;
  rendaTxt: string;
  aporteTxt: string;
  totalTxt: string;
  totalPct: string;
  protecaoTxt: string;
  essencialTxt: string;
  atitudeTxt: string;
  coberturas: LinhaCobertura[];
  rviCapital: string;
  rviMensal: string;
  payBig: string;
  payTxt: string;
  evolucao: LinhaEvolucao[];
  hojeLongo: string;
  hojeCurto: string;
}

/** "Macapá, 27 de setembro de 2026" (fuso America/Belem). */
export function dataLonga(d = new Date()) {
  return "Macapá, " + d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: FUSO });
}

export function montarEstudo(e: EntradaEstudo, agora = new Date()): ModeloEstudo {
  const S = calcularEstudo(e.idade, e.renda);
  const aporteTxt = brl(APORTE);
  const pay =
    S.payM !== null
      ? {
          big: `${Math.floor(S.payM / 12)}a ${S.payM % 12}m`,
          txt: `Com aporte de ${aporteTxt} e rentabilidade de 10,00% ao ano, a reserva alcança tudo o que foi pago (seguro + previdência) em ${Math.floor(S.payM / 12)} anos e ${S.payM % 12} meses, por volta dos ${e.idade + Math.floor(S.payM / 12)} anos de idade.`,
        }
      : {
          big: "Não recupera",
          txt: `Com aporte de ${aporteTxt} e rentabilidade de 10,00% ao ano, a reserva não alcança o total pago em ${HMAX} anos.`,
        };

  return {
    calc: S,
    nome: e.nome,
    primeiroNome: primeiroNome(e.nome),
    carta: carta(e.prof, e.sexo),
    profLabel: tituloProfissao(e.prof, e.sexo),
    idadeTxt: `${e.idade} anos`,
    rendaTxt: brl(e.renda),
    aporteTxt,
    totalTxt: brl(S.totalMensal),
    totalPct: pct1(S.totalMensal / e.renda),
    protecaoTxt: brl(S.protecaoMensal),
    essencialTxt: brl(S.essencialMensal),
    atitudeTxt: brl(S.rviMensal + APORTE),
    coberturas: S.coberturas.map((c) => ({
      nome: c.nome,
      descricao: c.descricao,
      capital: capitalTxt(c.capital, c.mensal),
      mensal: brl(c.premio),
    })),
    rviCapital: brl0(S.rviCapital) + "/mês",
    rviMensal: brl(S.rviMensal),
    payBig: pay.big,
    payTxt: pay.txt,
    evolucao: [5, 10, 15, 20, 25, 30]
      .filter((a) => a <= S.H)
      .map((a) => {
        const r = S.anos[a];
        const sd = r.res - r.pago;
        return {
          ano: a,
          idade: e.idade + a,
          pago: brl(r.pago),
          reserva: brl(r.res),
          saldo: (sd >= 0 ? "+" : "") + brl(sd),
          positivo: sd >= 0,
        };
      }),
    hojeLongo: dataLonga(agora),
    hojeCurto: dataBelem(agora),
  };
}

/** Nome do arquivo: "Estudo Blindagem - {Nome} - {AAAAMMDD}.pdf" (sem caracteres proibidos em arquivos). */
export const nomeArquivoEstudo = (nome: string, aaaammdd: string) =>
  `Estudo Blindagem - ${nome.replace(/[\\/:*?"<>|]/g, "").trim()} - ${aaaammdd}.pdf`;
