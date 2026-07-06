"use client";

import { Wallet, TrendingDown, AlertTriangle } from "lucide-react";

interface TodayHeroProps {
  totalSpent: number;
  totalEarned: number;
  transactionCount: number;
  monthlyBudget: number | null;
  monthlyExpense: number;
}

export function TodayHero({
  totalSpent,
  transactionCount,
  monthlyBudget,
  monthlyExpense,
}: TodayHeroProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const budgetPercent = monthlyBudget
    ? Math.min((monthlyExpense / monthlyBudget) * 100, 100)
    : 0;

  const budgetWarning = budgetPercent >= 80;
  const budgetDanger = budgetPercent >= 95;

  // SVG progress ring parameters
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (budgetPercent / 100) * circumference;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-5">
        {/* Left: greeting + today's spend */}
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">{today}</p>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              {greeting}
            </h2>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Spent today</span>
            </div>
            <p className="text-3xl md:text-4xl font-bold font-mono tracking-tight">
              {formatCurrency(totalSpent)}
            </p>
            <p className="text-xs text-muted-foreground">
              {transactionCount} transaction{transactionCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Right: budget progress ring */}
        {monthlyBudget && monthlyBudget > 0 && (
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-[140px] h-[140px]">
              <svg
                className="w-full h-full -rotate-90"
                viewBox="0 0 120 120"
              >
                {/* Background ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  className="text-muted/30"
                  strokeWidth="8"
                />
                {/* Progress ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  className={`transition-all duration-1000 ease-out ${
                    budgetDanger
                      ? "text-destructive"
                      : budgetWarning
                      ? "text-amber-500"
                      : "text-primary"
                  }`}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{
                    transition: "stroke-dashoffset 1s ease-out",
                  }}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">
                  {Math.round(budgetPercent)}%
                </span>
                <span className="text-[10px] text-muted-foreground">of budget</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                {formatCurrency(monthlyExpense)} / {formatCurrency(monthlyBudget)}
              </p>
              {budgetWarning && (
                <p className={`text-[11px] font-medium mt-0.5 inline-flex items-center gap-1 ${budgetDanger ? "text-destructive" : "text-amber-500"}`}>
                  <AlertTriangle className="h-3 w-3" />
                  {budgetDanger ? "Budget exceeded!" : "Nearing budget limit"}
                </p>
              )}
            </div>
          </div>
        )}

        {/* No budget set */}
        {(!monthlyBudget || monthlyBudget <= 0) && (
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30">
            <Wallet className="h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground text-center">
              Set a monthly budget<br />in Settings
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
