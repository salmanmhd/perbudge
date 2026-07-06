import { generateAiDigest } from "@/app/actions/chat";
import { FinancialHealth } from "@/components/dashboard/financial-health";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp } from "lucide-react";

export default async function InsightsPage() {
  const digest = await generateAiDigest();

  return (
    <div className="flex flex-col gap-6 p-4 pt-6 md:p-8 max-w-[900px] mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Insights</h1>
          <p className="text-sm text-muted-foreground">
            What your money is telling you this week.
          </p>
        </div>
      </div>

      {/* AI Weekly Digest */}
      <Card className="border-0 bg-primary/5 relative overflow-hidden shadow-sm">
        <div className="absolute -top-6 -right-6 opacity-[0.07] pointer-events-none">
          <Sparkles className="w-40 h-40" />
        </div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            Weekly Digest
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed space-y-2 relative">
          {digest.split("\n").filter(Boolean).map((line, i) => (
            <p key={i}>{line.replace(/\*\*/g, "")}</p>
          ))}
        </CardContent>
      </Card>

      {/* AI Financial Health check (client, runs on load) */}
      <FinancialHealth />
    </div>
  );
}
