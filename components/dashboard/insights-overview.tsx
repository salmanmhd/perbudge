import { formatINR } from "@/lib/finance";
import type { FinancialPosition, VitalTone } from "@/lib/actions/insights";
import { Landmark, CreditCard, ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";

const TONE: Record<VitalTone, { text: string; dot: string }> = {
  good: { text: "text-emerald-600 dark:text-emerald-500", dot: "bg-emerald-500" },
  watch: { text: "text-amber-600 dark:text-amber-500", dot: "bg-amber-500" },
  urgent: { text: "text-destructive", dot: "bg-destructive" },
};

export function InsightsOverview({ position }: { position: FinancialPosition }) {
  const obligations = position.payable + position.loansOutstanding + position.cardDues;
  const owed = position.receivable;
  const scale = Math.max(obligations, owed, 1);

  return (
    <div className="space-y-4">
      {/* ── Financial position ── */}
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Scale className="h-4 w-4" />
          <h2 className="text-xs font-semibold uppercase tracking-wider">
            Financial position
          </h2>
        </div>

        <p
          className={`mt-3 text-3xl md:text-4xl font-bold font-mono tracking-tight ${
            position.netPosition >= 0
              ? "text-emerald-600 dark:text-emerald-500"
              : "text-destructive"
          }`}
        >
          {formatINR(position.netPosition)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground max-w-md">
          What you&apos;d have left after collecting what&apos;s owed to you and
          clearing every due — excludes savings &amp; investments.
        </p>

        {/* Owed vs obligations bars */}
        <div className="mt-5 space-y-3">
          <PositionBar
            label="Owed to you"
            value={owed}
            scale={scale}
            color="bg-emerald-500"
            icon={<ArrowDownLeft className="h-3.5 w-3.5" />}
          />
          <PositionBar
            label="What you owe"
            value={obligations}
            scale={scale}
            color="bg-destructive"
            icon={<ArrowUpRight className="h-3.5 w-3.5" />}
          />
        </div>

        {/* Obligation breakdown */}
        {obligations > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
            {position.loansOutstanding > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5" /> Loans{" "}
                <span className="font-mono text-foreground">
                  {formatINR(position.loansOutstanding)}
                </span>
              </span>
            )}
            {position.cardDues > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" /> Card dues{" "}
                <span className="font-mono text-foreground">
                  {formatINR(position.cardDues)}
                </span>
              </span>
            )}
            {position.payable > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <ArrowUpRight className="h-3.5 w-3.5" /> You owe{" "}
                <span className="font-mono text-foreground">
                  {formatINR(position.payable)}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Vitals ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {position.vitals.map((v) => (
          <div key={v.key} className="rounded-2xl border border-border/60 bg-background p-4">
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${TONE[v.tone].dot}`} />
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {v.label}
              </p>
            </div>
            <p className={`mt-1.5 text-xl font-bold font-mono tracking-tight ${TONE[v.tone].text}`}>
              {v.display}
            </p>
            {v.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{v.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PositionBar({
  label,
  value,
  scale,
  color,
  icon,
}: {
  label: string;
  value: number;
  scale: number;
  color: string;
  icon: React.ReactNode;
}) {
  const pct = Math.round((value / scale) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-mono font-medium">{formatINR(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.max(value > 0 ? 4 : 0, pct)}%` }}
        />
      </div>
    </div>
  );
}
