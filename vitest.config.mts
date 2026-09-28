import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const raiz = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": raiz("."),
      // "server-only" lança erro fora de um ambiente de servidor React; nos testes vira um módulo vazio.
      "server-only": raiz("./tests/stubs/server-only.ts"),
    },
  },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
