import { AiChat } from "@/components/dashboard/ai-chat";
import { Sparkles, ShieldCheck } from "lucide-react";

export default function AskAIPage() {
  return (
    <div className="flex flex-col h-[calc(100dvh-5.5rem)] md:h-[calc(100dvh-2rem)] max-w-5xl mx-auto w-full p-3 sm:p-5 md:p-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 shrink-0">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Ask AI Co-pilot
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3 h-3" /> Live Context
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Trained on your real spending, budgets, EMIs, and monthly take-home income.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border/40">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Private & securely scoped</span>
        </div>
      </div>

      {/* Main Full-Height Chat Interface */}
      <div className="flex-1 min-h-0 w-full flex flex-col">
        <AiChat />
      </div>
    </div>
  );
}
