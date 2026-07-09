"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { updateBudgetPlan, type BudgetPlan } from "@/lib/actions/budget";
import { CATEGORIES } from "@/lib/categories";
import { CategoryIcon } from "@/components/category-icon";
import { formatINR } from "@/lib/finance";
import { Loader2, Pencil, Target, PiggyBank, Sparkles } from "lucide-react";

const BUCKET_META = {
  needs: { label: "Needs", hint: "Rent, food, bills, transport, health", color: "bg-primary" },
  wants: { label: "Wants", hint: "Shopping, entertainment, extras", color: "bg-amber-500" },
  savings: { label: "Savings", hint: "What stays with you", color: "bg-emerald-500" },
} as const;

export function BudgetPanel({ plan }: { plan: BudgetPlan }) {
  const router = useRouter();
  const hasIncome = plan.monthlyIncome > 0;
  const savingsRate =
    hasIncome && plan.monthlyIncome > 0
      ? Math.round((plan.projectedSavings / plan.monthlyIncome) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Budget Plan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plan with the 50/30/20 rule and per-category limits — tracked live.
          </p>
        </div>
        <EditPlanButton plan={plan} onDone={() => router.refresh()} />
      </div>

      {!hasIncome ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
          <Target className="h-9 w-9 mx-auto text-muted-foreground/40" />
          <p className="mt-3 font-medium">Set your monthly income to start</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Budgeting works off your take-home income. Add it and we&apos;ll build
            a 50/30/20 plan you can track against real spending.
          </p>
          <div className="mt-4 inline-block">
            <EditPlanButton plan={plan} onDone={() => router.refresh()} primary />
          </div>
        </div>
      ) : (
        <>
          {/* Income + projected savings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryStat label="Monthly income" value={formatINR(plan.monthlyIncome)} />
            <SummaryStat label="Spent so far" value={formatINR(plan.totalSpent)} />
            <SummaryStat
              label="Projected savings"
              value={formatINR(plan.projectedSavings)}
              tone={plan.projectedSavings >= 0 ? "good" : "bad"}
            />
            <SummaryStat
              label="Savings rate"
              value={`${savingsRate}%`}
              tone={savingsRate >= plan.savingsTargetPct ? "good" : "warn"}
              sub={`target ${plan.savingsTargetPct}%`}
            />
          </div>

          {/* 50/30/20 */}
          <div className="rounded-2xl border border-border/60 p-5 space-y-5">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">The 50 / 30 / 20 split</h2>
            </div>
            <div className="space-y-4">
              {plan.buckets.map((b) => {
                const meta = BUCKET_META[b.bucket];
                const value = b.bucket === "savings" ? plan.projectedSavings : b.spent;
                const pct =
                  b.targetAmount > 0
                    ? Math.round((Math.max(0, value) / b.targetAmount) * 100)
                    : 0;
                const over = b.bucket !== "savings" && value > b.targetAmount;
                const under = b.bucket === "savings" && value < b.targetAmount;
                return (
                  <div key={b.bucket} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <span className="text-sm font-medium">{meta.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {b.targetPct}% · {meta.hint}
                        </span>
                      </div>
                      <span className="text-sm font-mono">
                        <span
                          className={
                            over || under ? "text-amber-500 font-semibold" : ""
                          }
                        >
                          {formatINR(Math.max(0, value))}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          / {formatINR(b.targetAmount)}
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          over ? "bg-amber-500" : meta.color
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category budgets */}
          <div className="rounded-2xl border border-border/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Category limits</h2>
              </div>
              <CategoryBudgetsButton plan={plan} onDone={() => router.refresh()} />
            </div>

            {plan.categoryBudgets.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No category limits set yet. Add limits to catch overspending early.
              </p>
            ) : (
              <div className="space-y-3">
                {plan.categoryBudgets.map((cb) => {
                  const pct =
                    cb.limit > 0 ? Math.round((cb.spent / cb.limit) * 100) : 0;
                  const over = cb.spent > cb.limit;
                  return (
                    <div key={cb.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize flex items-center gap-2">
                          <CategoryIcon name={cb.category} colored className="h-4 w-4" />
                          {cb.category}
                        </span>
                        <span className="font-mono">
                          <span className={over ? "text-destructive font-semibold" : ""}>
                            {formatINR(cb.spent)}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            / {formatINR(cb.limit)}
                          </span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            over ? "bg-destructive" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Goals */}
          {plan.financialGoals && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <h2 className="font-semibold text-sm">Your goals</h2>
              </div>
              <p className="mt-2 text-sm text-foreground/90 leading-relaxed">
                {plan.financialGoals}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "bad" | "warn";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-500"
      : tone === "bad"
      ? "text-destructive"
      : tone === "warn"
      ? "text-amber-500"
      : "";
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </p>
      <p className={`mt-1 text-lg font-bold font-mono tracking-tight ${toneClass}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function EditPlanButton({
  plan,
  onDone,
  primary,
}: {
  plan: BudgetPlan;
  onDone: () => void;
  primary?: boolean;
}) {
  const [monthlyIncome, setIncome] = useState(
    plan.monthlyIncome ? String(plan.monthlyIncome) : ""
  );
  const [savingsTargetPct, setSavings] = useState(String(plan.savingsTargetPct));
  const [financialGoals, setGoals] = useState(plan.financialGoals || "");
  const [saving, setSaving] = useState(false);

  return (
    <ResponsiveModal
      title="Edit budget plan"
      description="Income, savings target, and goals."
      trigger={
        primary ? (
          <Button size="lg" className="rounded-xl gap-2">
            <Target className="h-4 w-4" /> Set income
          </Button>
        ) : (
          <Button variant="outline" size="lg" className="rounded-xl gap-2 shrink-0">
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        )
      }
    >
      {(close) => (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bp-income">Monthly take-home income</Label>
            <Input
              id="bp-income"
              inputMode="numeric"
              value={monthlyIncome}
              onChange={(e) => setIncome(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="60000"
              className="h-11 font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bp-savings">Savings target (% of income)</Label>
            <Input
              id="bp-savings"
              inputMode="numeric"
              value={savingsTargetPct}
              onChange={(e) =>
                setSavings(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))
              }
              placeholder="20"
              className="h-11 font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bp-goals">Financial goals</Label>
            <textarea
              id="bp-goals"
              value={financialGoals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="Save ₹5L for an emergency fund, clear the car loan by 2027…"
              rows={3}
              className="w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Perbudge&apos;s AI uses this to tailor advice to you.
            </p>
          </div>

          <Button
            className="w-full h-12 rounded-xl text-base"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              const res = await updateBudgetPlan({
                monthlyIncome: monthlyIncome ? Number(monthlyIncome) : 0,
                savingsTargetPct: savingsTargetPct ? Number(savingsTargetPct) : 20,
                financialGoals: financialGoals.trim(),
              });
              if (res.success) {
                close();
                onDone();
              } else {
                alert(res.error);
                setSaving(false);
              }
            }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save plan"}
          </Button>
        </div>
      )}
    </ResponsiveModal>
  );
}

function CategoryBudgetsButton({
  plan,
  onDone,
}: {
  plan: BudgetPlan;
  onDone: () => void;
}) {
  const initial: Record<string, string> = {};
  for (const cb of plan.categoryBudgets) initial[cb.category.toLowerCase()] = String(cb.limit);
  const [limits, setLimits] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);

  const expenseCats = CATEGORIES.filter((c) => c.id !== "salary");

  return (
    <ResponsiveModal
      title="Category limits"
      description="Set a monthly cap per category. Leave blank to skip."
      trigger={
        <Button variant="outline" size="sm" className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" /> Edit limits
        </Button>
      }
    >
      {(close) => (
        <div className="space-y-4">
          <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
            {expenseCats.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="text-sm flex-1 capitalize flex items-center gap-2">
                  <CategoryIcon name={c.id} colored className="h-4 w-4" />
                  {c.label}
                </span>
                <div className="relative w-32">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    inputMode="numeric"
                    value={limits[c.id] || ""}
                    onChange={(e) =>
                      setLimits((p) => ({
                        ...p,
                        [c.id]: e.target.value.replace(/[^0-9]/g, ""),
                      }))
                    }
                    placeholder="0"
                    className="h-10 pl-6 font-mono text-right"
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            className="w-full h-12 rounded-xl text-base"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              const categoryBudgets = Object.entries(limits)
                .filter(([, v]) => v && Number(v) > 0)
                .map(([category, v]) => ({ category, limit: Number(v) }));
              const res = await updateBudgetPlan({ categoryBudgets });
              if (res.success) {
                close();
                onDone();
              } else {
                alert(res.error);
                setSaving(false);
              }
            }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save limits"}
          </Button>
        </div>
      )}
    </ResponsiveModal>
  );
}
