"use client";

import { useState, useEffect, useCallback } from "react";
import { getBudgetCoaching, type BudgetTip } from "@/lib/actions/budget-ai";
import {
  AlertTriangle,
  Eye,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

const TONE = {
  urgent: { icon: AlertTriangle, chip: "bg-destructive/15 text-destructive", ring: "border-destructive/30", bg: "bg-destructive/5", label: "Act now" },
  watch: { icon: Eye, chip: "bg-amber-500/15 text-amber-600 dark:text-amber-500", ring: "border-amber-500/30", bg: "bg-amber-500/5", label: "Watch" },
  good: { icon: CheckCircle2, chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-500", ring: "border-emerald-500/30", bg: "bg-emerald-500/5", label: "On track" },
} as const;

const ORDER = { urgent: 0, watch: 1, good: 2 };

export function BudgetCoach() {
  const [tips, setTips] = useState<BudgetTip[] | null>(null);
  const [onTrack, setOnTrack] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getBudgetCoaching();
    setOnTrack(res.onTrack);
    if (res.success) {
      setTips([...res.tips].sort((a, b) => ORDER[a.tone] - ORDER[b.tone]));
    } else {
      setError(res.error || "Coaching unavailable.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <h2 className="font-semibold text-sm">Budget coach</h2>
          {onTrack !== null && !loading && (
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                onTrack ? TONE.good.chip : TONE.urgent.chip
              }`}
            >
              {onTrack ? "On track" : "Over pace"}
            </span>
          )}
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Thinking…" : "Re-run"}
        </button>
      </div>

      {loading && (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl bg-background/60 p-4 animate-pulse">
              <div className="h-3.5 w-40 bg-muted rounded" />
              <div className="mt-2.5 h-3 w-full bg-muted/70 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-muted-foreground">{error}</p>
      )}

      {!loading && tips && tips.length > 0 && (
        <div className="space-y-2.5">
          {tips.map((tip, i) => {
            const t = TONE[tip.tone] || TONE.watch;
            const Icon = t.icon;
            return (
              <div key={i} className={`rounded-xl border ${t.ring} ${t.bg} p-4`}>
                <div className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${t.chip}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm">{tip.title}</h3>
                    <p className="mt-1 text-sm text-foreground/85 leading-relaxed">
                      {tip.detail}
                    </p>
                    <p className="mt-1.5 text-sm">
                      <span className="font-medium text-primary">Do this: </span>
                      <span className="text-foreground/85">{tip.action}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && tips && tips.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">
          Not enough spending yet this month to coach on. Log a few transactions
          and check back.
        </p>
      )}
    </div>
  );
}
