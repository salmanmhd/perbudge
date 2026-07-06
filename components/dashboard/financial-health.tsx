"use client";

import { useState, useEffect, useCallback } from "react";
import { analyzeFinances, type FinancialIssue } from "@/app/actions/chat";
import {
  AlertTriangle,
  Eye,
  CheckCircle2,
  RefreshCw,
  Stethoscope,
} from "lucide-react";

const SEVERITY = {
  urgent: {
    icon: AlertTriangle,
    ring: "border-destructive/30",
    bg: "bg-destructive/5",
    chip: "bg-destructive/15 text-destructive",
    label: "Urgent",
  },
  watch: {
    icon: Eye,
    ring: "border-amber-500/30",
    bg: "bg-amber-500/5",
    chip: "bg-amber-500/15 text-amber-600 dark:text-amber-500",
    label: "Watch",
  },
  good: {
    icon: CheckCircle2,
    ring: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-500",
    label: "Good",
  },
} as const;

const ORDER = { urgent: 0, watch: 1, good: 2 };

export function FinancialHealth() {
  const [issues, setIssues] = useState<FinancialIssue[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await analyzeFinances();
    if (res.success) {
      setIssues(
        [...res.issues].sort((a, b) => ORDER[a.severity] - ORDER[b.severity])
      );
    } else {
      setError(res.error || "Analysis failed.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Financial health check</h2>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Analysing…" : "Re-run"}
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/50 p-5 animate-pulse"
            >
              <div className="h-4 w-40 bg-muted rounded" />
              <div className="mt-3 h-3 w-full bg-muted/70 rounded" />
              <div className="mt-2 h-3 w-2/3 bg-muted/70 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-border/60 p-6 text-center text-sm text-muted-foreground">
          {error}
        </div>
      )}

      {!loading && issues && issues.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center">
          <p className="text-sm font-medium">Not enough data to analyse yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Log some transactions and set your income on the Budget page.
          </p>
        </div>
      )}

      {!loading && issues && issues.length > 0 && (
        <div className="space-y-3">
          {issues.map((issue, i) => {
            const s = SEVERITY[issue.severity] || SEVERITY.watch;
            const Icon = s.icon;
            return (
              <div
                key={i}
                className={`rounded-2xl border ${s.ring} ${s.bg} p-5`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.chip}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{issue.title}</h3>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${s.chip}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-foreground/85 leading-relaxed">
                      {issue.detail}
                    </p>
                    <p className="mt-2 text-sm">
                      <span className="font-medium text-primary">Do this: </span>
                      <span className="text-foreground/85">{issue.action}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
