// Validação do lead (zod). Usada no servidor; o formato do payload é montado em lib/lead-client.ts.

import { z } from "zod";
import { idadeEm, parseDataBR } from "./datas";
import { PROFISSOES } from "./profissoes";

const texto = (max: number) => z.string().trim().max(max);
const opcional = (max: number) => texto(max).optional().default("");

export const esquemaLead = z
  .object({
    nome: texto(120).refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, "nome incompleto"),
    prof: z.enum(PROFISSOES),
    sexo: z.enum(["F", "M"]),
    /** dd/mm/aaaa */
    nasc: z.string().trim(),
    renda: z.number().finite().min(500).max(200000),
    /** Só dígitos, 10 ou 11. */
    whats: z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().regex(/^\d{10,11}$/)),
    email: z.string().trim().toLowerCase().max(160).pipe(z.email()),
    consentEmail: z.boolean(),
    consentWhats: z.boolean(),
    consentVersao: texto(20),
    /** event_id compartilhado entre Pixel e CAPI. */
    eventId: z.string().regex(/^[A-Za-z0-9-]{8,64}$/),
    eventSourceUrl: opcional(500),
    cookiesAceitos: z.boolean().optional().default(false),
    fbp: opcional(200),
    fbc: opcional(300),
    utm_source: opcional(200),
    utm_medium: opcional(200),
    utm_campaign: opcional(200),
    utm_content: opcional(200),
    utm_term: opcional(200),
    fbclid: opcional(500),
  })
  .transform((d, ctx) => {
    const nasc = parseDataBR(d.nasc);
    if (!nasc) {
      ctx.addIssue({ code: "custom", path: ["nasc"], message: "data inválida" });
      return z.NEVER;
    }
    // Idade calculada no servidor (fuso America/Belem).
    const idade = idadeEm(nasc);
    if (idade < 18 || idade > 50) {
      ctx.addIssue({ code: "custom", path: ["nasc"], message: "idade fora de 18–50" });
      return z.NEVER;
    }
    return { ...d, nascCivil: nasc, idade };
  });

export type LeadValidado = z.output<typeof esquemaLead>;
export type LeadEntrada = z.input<typeof esquemaLead>;
