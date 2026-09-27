import type { Estudo } from "@/lib/calc";

// Gráfico da página 3: total pago acumulado × reserva, até o horizonte H (igual ao protótipo).
export function Grafico({ S }: { S: Estudo }) {
  const W = 674;
  const Ht = 190;
  const pl = 58;
  const pr = 12;
  const pt = 10;
  const pb = 26;
  const H = S.H;
  const data = S.anos.slice(0, H + 1);
  const max = Math.max(...data.map((d) => Math.max(d.pago, d.res)), 1);
  const nice = (v: number) => {
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const f = v / p;
    return ([1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10].find((s) => f <= s) ?? 10) * p;
  };
  const top = nice(max);
  const x = (a: number) => pl + ((W - pl - pr) * a) / H;
  const y = (v: number) => pt + (Ht - pt - pb) * (1 - v / top);
  const lab = (t: number) =>
    t >= 1e6
      ? (t / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mi"
      : t >= 1e3
        ? (t / 1e3).toLocaleString("pt-BR", { maximumFractionDigits: 0 }) + " mil"
        : "0";
  const ts = { fill: "#6B7782", fontSize: 10.5, fontFamily: "Nunito Sans, sans-serif" };
  const path = (q: "pago" | "res") => data.map((d, i) => `${i ? "L" : "M"}${x(d.a).toFixed(1)},${y(d[q]).toFixed(1)}`).join("");
  const passo = H <= 15 ? 1 : 5;
  const anosX: number[] = [];
  for (let a = 0; a <= H; a += passo) anosX.push(a);
  const pv = S.payM !== null && S.payM / 12 <= H ? S.payM / 12 : null;

  return (
    <svg viewBox={`0 0 ${W} ${Ht}`} width="100%" role="img" aria-label="Total pago e reserva acumulada por ano">
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const t = f * top;
        return (
          <g key={i}>
            <line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} stroke="#E1E7EC" />
            <text x={pl - 8} y={y(t) + 4} textAnchor="end" style={ts}>
              {lab(t)}
            </text>
          </g>
        );
      })}
      {anosX.map((a) => (
        <text key={a} x={x(a)} y={Ht - 8} textAnchor="middle" style={ts}>
          {a}
        </text>
      ))}
      <path d={path("pago")} fill="none" stroke="#396C97" strokeWidth={2.5} />
      <path d={path("res")} fill="none" stroke="#4E8A2E" strokeWidth={2.5} />
      {pv !== null && (
        <>
          <line x1={x(pv)} x2={x(pv)} y1={pt} y2={Ht - pb} stroke="#4E8A2E" strokeDasharray="4 4" />
          <circle cx={x(pv)} cy={y(data[Math.min(Math.ceil(pv), H)].res)} r={5} fill="#4E8A2E" />
        </>
      )}
    </svg>
  );
}
