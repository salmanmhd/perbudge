"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DailyData {
  date: string;
  amount: number;
  label: string;
}

import type { ChartTooltipProps } from "@/lib/chart-types";

interface SpendingChartProps {
  data: DailyData[];
}

function CustomTooltip({ active, payload }: ChartTooltipProps<DailyData>) {
  if (!active || !payload?.length) return null;

  const amount = payload[0].value ?? 0;
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{payload[0]?.payload?.label}</p>
      <p className="text-sm font-semibold font-mono">{formattedAmount}</p>
    </div>
  );
}

export function SpendingChart({ data }: SpendingChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        No spending data available
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="w-full h-[220px] md:h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--border)"
            opacity={0.5}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
            }
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
          <Bar
            dataKey="amount"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          >
            {data.map((entry) => (
              <Cell
                key={entry.date}
                fill={
                  entry.date === today
                    ? "var(--primary)"
                    : entry.amount > 0
                    ? "var(--chart-3)"
                    : "var(--muted)"
                }
                opacity={entry.date === today ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
