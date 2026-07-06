"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getCategoryColor } from "@/lib/categories";
import { CategoryIcon } from "@/components/category-icon";

interface CategoryData {
  name: string;
  value: number;
  count: number;
}

interface CategoryDonutProps {
  data: CategoryData[];
}

const CHART_COLORS = [
  "oklch(0.75 0.18 55)",   // food - warm orange
  "oklch(0.70 0.15 250)",  // transport - blue
  "oklch(0.68 0.18 20)",   // shopping - coral
  "oklch(0.72 0.16 200)",  // bills - cyan
  "oklch(0.70 0.20 330)",  // entertainment - pink
  "oklch(0.72 0.15 150)",  // health - teal
  "oklch(0.65 0.14 270)",  // education - purple
  "oklch(0.60 0.08 260)",  // others - gray
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const { name, value } = payload[0].payload;
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-medium flex items-center gap-1.5 capitalize">
        <CategoryIcon name={name} colored className="h-3.5 w-3.5" /> {name}
      </p>
      <p className="text-sm font-semibold font-mono">{formatted}</p>
    </div>
  );
}

export function CategoryDonut({ data }: CategoryDonutProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        No expense data this month
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-4">
      {/* Donut chart */}
      <div className="w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={getCategoryColor(entry.name) || CHART_COLORS[index % CHART_COLORS.length]}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {data.slice(0, 6).map((item, index) => {
          const percent = ((item.value / total) * 100).toFixed(1);
          return (
            <div key={item.name} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    getCategoryColor(item.name) || CHART_COLORS[index % CHART_COLORS.length],
                }}
              />
              <span className="text-sm flex-1 truncate flex items-center gap-1.5 capitalize">
                <CategoryIcon name={item.name} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {item.name}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {percent}%
              </span>
              <span className="text-sm font-medium font-mono w-[80px] text-right">
                {formatCurrency(item.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
