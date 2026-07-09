import { getFinancialPosition } from "@/lib/actions/insights";
import { InsightsOverview } from "@/components/dashboard/insights-overview";
import { FinancialHealth } from "@/components/dashboard/financial-health";
import { TrendingUp } from "lucide-react";

export default async function InsightsPage() {
  const position = await getFinancialPosition();

  return (
    <div className="flex flex-col gap-6 p-4 pt-6 md:p-8 max-w-[900px] mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Insights</h1>
          <p className="text-sm text-muted-foreground">
            Your real financial position, read plainly.
          </p>
        </div>
      </div>

      {position && position.hasData ? (
        <>
          {/* Computed position + vitals — grounded, not guesswork */}
          <InsightsOverview position={position} />

          {/* AI findings — prioritised problems, risks, and wins */}
          <div className="pt-2">
            <FinancialHealth />
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
          <p className="font-medium">Nothing to analyse yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Log a few transactions and set your income on the Budget page. Your
            position, vitals, and AI insights will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
