export interface Botao {
  label: string;
  v: string;
  /** Ícone de lista ("Ver profissões"). */
  list?: boolean;
  /** Ícone de responder ("No feminino/masculino"). */
  reply?: boolean;
}

export type TipoMsg = "text" | "doc" | "consent" | "cta";

export interface Msg {
  id: number;
  from: "bot" | "user";
  type: TipoMsg;
  text?: string;
  time: string;
  buttons?: Botao[];
  /** Cartão de consultoria com o botão "Abrir meu estudo". */
  docBtn?: boolean;
}

/** Item a ser "dito" pelo bot (antes de receber id e hora). */
export type Fala = Omit<Msg, "id" | "time" | "from" | "type"> & { type?: TipoMsg; extra?: number };

export const SOMBRA = "0 1px .5px rgba(11,20,26,.13)";
export const FAIXA_TRICOLOR = "linear-gradient(90deg,#396C97 0 62%,#7DB85A 62% 84%,#4D4C4E 84% 100%)";
