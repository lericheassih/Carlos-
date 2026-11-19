"use client";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

// Palette catégorielle validée (ordre fixe, jamais recyclé)
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a"] as const;
const GRID = "#e8eaed";
const AXIS = { fontSize: 11, fill: "#616a75" };

type Row = Record<string, string | number | null>;
type SeriesDef = { key: string; label: string };

function fmtNum(v: number, unit?: string) {
  const s = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(v).replace(/[  ]/g, " ");
  return unit ? `${s} ${unit}` : s;
}
function compact(v: number) {
  if (Math.abs(v) >= 1_000_000) return `${fmtNum(v / 1_000_000)} M`;
  if (Math.abs(v) >= 1_000) return `${fmtNum(v / 1_000)} k`;
  return fmtNum(v);
}

function Tip({ active, payload, label, unit, labelFormatter }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; unit?: string; labelFormatter?: (l: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-medium text-ink">{labelFormatter ? labelFormatter(String(label)) : label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-muted">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-semibold tabular-nums text-ink">{fmtNum(Number(p.value), unit)}</span>
        </div>
      ))}
    </div>
  );
}

type Common = { data: Row[]; x: string; series: SeriesDef[]; unit?: string; height?: number; xFormatter?: (v: string) => string; tooltipLabel?: (v: string) => string };

export function TrendChart({ data, x, series, unit, height = 240, xFormatter, tooltipLabel, kind = "area" }: Common & { kind?: "area" | "line" }) {
  const many = series.length > 1;
  const Chart = kind === "area" ? AreaChart : LineChart;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`g-${s.key}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={SERIES[i]} stopOpacity={0.18} />
              <stop offset="100%" stopColor={SERIES[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey={x} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} tickFormatter={xFormatter} minTickGap={24} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={compact} allowDecimals={false} width={48} />
        <Tooltip content={<Tip unit={unit} labelFormatter={tooltipLabel ?? xFormatter} />} cursor={{ stroke: "#9aa3ad", strokeDasharray: "3 3" }} />
        {many && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#616a75" }} />}
        {series.map((s, i) =>
          kind === "area" ? (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={SERIES[i]} strokeWidth={2} fill={`url(#g-${s.key})`}
              dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} isAnimationActive={false} />
          ) : (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={SERIES[i]} strokeWidth={2} dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} isAnimationActive={false} />
          ),
        )}
      </Chart>
    </ResponsiveContainer>
  );
}

export function Bars({ data, x, series, unit, height = 240, xFormatter, tooltipLabel, layout = "horizontal" }: Common & { layout?: "horizontal" | "vertical" }) {
  const many = series.length > 1;
  const vertical = layout === "vertical";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={vertical ? "vertical" : "horizontal"} margin={{ top: 8, right: 8, bottom: 0, left: vertical ? 8 : -8 }} barGap={2} barCategoryGap="28%">
        <CartesianGrid vertical={vertical} horizontal={!vertical} stroke={GRID} />
        {vertical ? (
          <>
            <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={compact} allowDecimals={false} />
            <YAxis type="category" dataKey={x} tick={AXIS} tickLine={false} axisLine={false} width={120} tickFormatter={xFormatter} />
          </>
        ) : (
          <>
            <XAxis dataKey={x} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} tickFormatter={xFormatter} minTickGap={16} />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={compact} allowDecimals={false} width={48} />
          </>
        )}
        <Tooltip content={<Tip unit={unit} labelFormatter={tooltipLabel ?? xFormatter} />} cursor={{ fill: "rgba(15,23,42,0.04)" }} />
        {many && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#616a75" }} />}
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={SERIES[i]} radius={vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={36}
            stroke="#fff" strokeWidth={1} isAnimationActive={false} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
