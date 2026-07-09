"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatINR, type LoanTrajectory } from "@/lib/finance";
import { CalendarCheck, TrendingDown, Wallet, PartyPopper } from "lucide-react";

const compact = (n: number) =>
  n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`;

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg space-y-0.5">
      <p className="text-xs text-muted-foreground">{p?.label}</p>
      <p className="text-sm font-semibold font-mono">{formatINR(p?.outstanding ?? 0)} left</p>
      <p className="text-[11px] text-muted-foreground font-mono">
        Paying {formatINR(p?.outflow ?? 0)}/mo
      </p>
    </div>
  );
}

export function LoanTrajectoryChart({ trajectory }: { trajectory: LoanTrajectory }) {
  const { points, freedEvents, debtFreeLabel, monthsToDebtFree, currentMonthlyOutflow, totalOutstanding } = trajectory;
  if (points.length < 2) return null;

  const years = Math.floor(monthsToDebtFree / 12);
  const months = monthsToDebtFree % 12;
  const durationText = [years ? `${years}y` : "", months ? `${months}m` : ""].filter(Boolean).join(" ") || "—";
  const maxOutflow = Math.max(...points.map((p) => p.outflow));

  return (
    <div className="rounded-2xl border border-border/60 p-5 space-y-5">
      <div className="flex items-center gap-2">
        <TrendingDown className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Payoff trajectory</h2>
      </div>

      {/* Milestone stats */}
      <div className="grid grid-cols-3 gap-3">
        <Milestone icon={CalendarCheck} label="Debt-free by" value={debtFreeLabel ?? "—"} accent />
        <Milestone icon={TrendingDown} label="Time to clear" value={durationText} />
        <Milestone icon={Wallet} label="Paying now" value={`${formatINR(currentMonthlyOutflow)}`} sub="/mo" />
      </div>

      {/* Chart: outstanding (area) + monthly outflow (step line) */}
      <div className="w-full h-[240px] md:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="ltOutstanding" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={36}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={compact}
              width={40}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, Math.ceil((maxOutflow * 1.6) / 1000) * 1000]}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={compact}
              width={36}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="outstanding"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#ltOutstanding)"
            />
            <Line
              yAxisId="right"
              type="stepAfter"
              dataKey="outflow"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground -mt-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--primary)" }} /> Balance left
          <span className="font-mono">({formatINR(totalOutstanding)})</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--chart-2)" }} /> Monthly payment
        </span>
      </div>

      {/* Freed-EMI timeline */}
      {freedEvents.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            As each loan clears, cash frees up
          </p>
          <div className="space-y-2">
            {freedEvents.map((e, i) => (
              <div
                key={e.name + i}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{e.name}</p>
                  <p className="text-xs text-muted-foreground">clears {e.label}</p>
                </div>
                <span className="shrink-0 text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-500">
                  +{formatINR(e.emiFreed)}/mo
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-2.5 text-sm">
              <PartyPopper className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">Debt-free by {debtFreeLabel}</span>
              <span className="ml-auto font-mono font-semibold text-emerald-600 dark:text-emerald-500">
                +{formatINR(currentMonthlyOutflow)}/mo back
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Milestone({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof CalendarCheck;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-primary/25 bg-primary/5" : "border-border/60 bg-muted/30"}`}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <p className="text-[11px] uppercase tracking-wider font-medium">{label}</p>
      </div>
      <p className={`mt-1 text-lg font-bold font-mono tracking-tight ${accent ? "text-primary" : ""}`}>
        {value}
        {sub && <span className="text-xs text-muted-foreground font-sans font-normal">{sub}</span>}
      </p>
    </div>
  );
}
