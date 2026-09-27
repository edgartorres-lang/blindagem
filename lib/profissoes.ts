// Profissões atendidas (lista fechada) e textos da carta por profissão × sexo.
// Fonte: prototipo/Cotador Conversa.dc.html (PROF) e referencia/cotador-blindagem-saude.html.

export const PROFISSOES = ["dent", "enf", "fisio", "fono", "psi", "to"] as const;
export type Profissao = (typeof PROFISSOES)[number];
export type Sexo = "F" | "M";

export interface DadosProfissao {
  /** Rótulo na folha de profissões. */
  label: string;
  /** Título no masculino / feminino (PDF e planilha). */
  M: string;
  F: string;
  /** Abertura da carta. */
  ab: string;
  /** Rotina. */
  rot: string;
  /** Imprevisto de exemplo. */
  imp: string;
}

export const PROF: Record<Profissao, DadosProfissao> = {
  dent: {
    label: "Dentista",
    M: "Dentista",
    F: "Dentista",
    ab: "Todos os dias, você usa a precisão das suas mãos para devolver saúde, conforto e confiança ao sorriso de outras pessoas. As suas mãos são o seu grande instrumento de trabalho.",
    rot: "a sua rotina exige precisão, postura e horas seguidas de concentração",
    imp: "uma tendinite no punho",
  },
  enf: {
    label: "Enfermagem",
    M: "Enfermeiro",
    F: "Enfermeira",
    ab: "Todos os dias, você está ao lado de quem mais precisa, cuidando com as mãos, com a atenção e com o corpo inteiro. O seu corpo é o seu grande instrumento de trabalho.",
    rot: "a sua rotina exige muito fisicamente, entre plantões, atendimentos e horas em pé",
    imp: "uma lesão na coluna durante um plantão",
  },
  fisio: {
    label: "Fisioterapia",
    M: "Fisioterapeuta",
    F: "Fisioterapeuta",
    ab: "Todos os dias, você usa suas próprias mãos para trazer alívio, cura e qualidade de vida para outras pessoas. O seu corpo é o seu grande instrumento de trabalho.",
    rot: "a sua rotina exige muito fisicamente",
    imp: "uma lesão por esforço no punho",
  },
  fono: {
    label: "Fonoaudiologia",
    M: "Fonoaudiólogo",
    F: "Fonoaudióloga",
    ab: "Todos os dias, você ajuda outras pessoas a falar, ouvir e se expressar melhor, e cada pequena conquista delas passa pelo seu cuidado. A sua saúde é o que sustenta cada atendimento.",
    rot: "a sua agenda depende de você estar presente, sessão após sessão",
    imp: "uma cirurgia que exija semanas de repouso",
  },
  psi: {
    label: "Psicologia",
    M: "Psicólogo",
    F: "Psicóloga",
    ab: "Todos os dias, você acolhe as histórias de outras pessoas e ajuda cada uma a encontrar o próprio caminho. A sua presença é o seu grande instrumento de trabalho.",
    rot: "a sua agenda depende de você estar presente, sessão após sessão",
    imp: "uma cirurgia ou uma fratura que exija semanas de repouso",
  },
  to: {
    label: "Terapia ocupacional",
    M: "Terapeuta ocupacional",
    F: "Terapeuta ocupacional",
    ab: "Todos os dias, você ajuda outras pessoas a reconquistar autonomia e a fazer por conta própria aquilo que importa para elas. O seu corpo é o seu grande instrumento de trabalho.",
    rot: "a sua rotina exige muito fisicamente",
    imp: "uma lesão no ombro",
  },
};

/** Título da profissão conforme o tratamento escolhido. */
export const tituloProfissao = (p: Profissao, sexo: Sexo) => PROF[p][sexo];

/** Carta do PDF (página 1), montada por modelo: profissão × sexo. */
export function carta(p: Profissao, sexo: Sexo): string[] {
  const P = PROF[p];
  const ela = sexo === "F";
  return [
    `${P.ab} Mas, em meio a tanta dedicação ao outro, vale uma reflexão: quem cuida de você se precisar de uma pausa?`,
    `Sabemos que ${P.rot}, e que um imprevisto, como ${P.imp}, pode exigir que você se afaste dos atendimentos por um tempo. Uma pausa na agenda para cuidar de si mesm${ela ? "a" : "o"} não deveria virar preocupação na hora de pagar as contas.`,
    `Foi pensando na sua realidade que desenhamos um caminho de proteção sob medida. Se você precisar de um tempo para se recuperar, ou tiver que enfrentar um desafio de saúde mais delicado, o seu único foco deve ser a sua recuperação. Queremos que você tenha a tranquilidade de saber que a sua independência financeira estará preservada, aconteça o que acontecer.`,
    `Esse cuidado também chega a quem é essencial para você, para que a sua família tenha apoio e segurança em qualquer cenário. E, enquanto você protege o seu presente, uma parte desse esforço vira uma reserva para o seu amanhã, guardada para você usar quando e como fizer mais sentido.`,
    `Você dedica os seus dias a cuidar dos seus pacientes. O meu papel é garantir que você continue fazendo isso com a mente tranquila, sabendo que você e a sua família também estão em boas mãos.`,
  ];
}
