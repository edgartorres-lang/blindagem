import type { Metadata, Viewport } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
import "./globals.css";

// Nunito 700/800/900 (títulos e marca) e Nunito Sans 400/600/700/800 (texto), como no protótipo.
// next/font hospeda as fontes no próprio domínio (sem requisição ao Google em runtime).
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://blindagem.setornorteseguros.com.br"),
  title: "Estudo de Blindagem Profissional da Saúde | Setor Norte Seguros",
  description:
    "Converse com a Setor Norte Seguros e receba em minutos o seu Estudo de Blindagem Profissional da Saúde em PDF.",
  icons: { icon: "/sym.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} ${nunitoSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
