import "server-only";
import { createHash } from "node:crypto";
import { envObrigatoria } from "./env";

/** 8 primeiros caracteres de sha256(email + data + LEAD_HASH_SALT). "data" = data_hora do lead. */
export function gerarLeadId(email: string, dataHora: string, salt = envObrigatoria("LEAD_HASH_SALT")): string {
  return createHash("sha256").update(email + dataHora + salt).digest("hex").slice(0, 8);
}
