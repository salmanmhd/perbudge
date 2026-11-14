import type { InsightTone, SpendingInsight } from "@/lib/spending-insights";
import { AlertTriangle, CheckCircle2, Lightbulb, Siren, Sparkles } from "lucide-react";

const TONE: Record<InsightTone, { icon: typeof Siren; cls: string }> = {
  urgent: { icon: Siren, cls: "text-destructive bg-destructive/10" },
  watch: { icon: AlertTriangle, cls: "text-amber-600 dark:text-amber-500 bg-amber-500/10" },
  good: { icon: CheckCircle2, cls: "text-emerald-600 dark:text-emerald-500 bg-emerald-500/10" },
  info: { icon: Lightbulb, cls: "text-primary bg-primary/10" },
};

export function SpendingInsights({
  insights,
  limit,
}: {
  insights: SpendingInsight[];
  limit?: number;
}) {
  const list = limit ? insights.slice(0, limit) : insights;
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/30 p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <h2 className="text-xs font-semibold uppercase tracking-wider">Spending insights</h2>
      </div>
      {list.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing notable yet. Insights appear as your history builds up.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((i) => {
            const t = TONE[i.tone];
            const Icon = t.icon;
            return (
              <li key={i.id} className="flex gap-3">
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${t.cls}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{i.title}</p>
                  <p className="text-xs text-muted-foreground">{i.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
