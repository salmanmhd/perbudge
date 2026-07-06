import Link from "next/link";
import { formatINR } from "@/lib/finance";
import { Landmark, CreditCard, Users, ChevronRight } from "lucide-react";

interface MoneyMapProps {
  emiTotal: number;
  cardsDue: number;
  receivable: number;
  payable: number;
}

/**
 * Compact overview strip tying together the obligation/relationship data
 * that lives on dedicated pages. Only renders tiles that have signal.
 */
export function MoneyMap({ emiTotal, cardsDue, receivable, payable }: MoneyMapProps) {
  const tiles = [
    emiTotal > 0 && {
      href: "/dashboard/loans",
      icon: Landmark,
      label: "Monthly EMIs",
      value: formatINR(emiTotal),
      tone: "text-foreground",
    },
    cardsDue > 0 && {
      href: "/dashboard/accounts",
      icon: CreditCard,
      label: "Card dues (cycle)",
      value: formatINR(cardsDue),
      tone: "text-foreground",
    },
    (receivable > 0 || payable > 0) && {
      href: "/dashboard/owed",
      icon: Users,
      label: receivable >= payable ? "Owed to you" : "You owe",
      value: formatINR(receivable >= payable ? receivable : payable),
      tone:
        receivable >= payable
          ? "text-emerald-500"
          : "text-destructive",
    },
  ].filter(Boolean) as {
    href: string;
    icon: typeof Landmark;
    label: string;
    value: string;
    tone: string;
  }[];

  if (tiles.length === 0) return null;

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-4 hover:border-primary/30 hover:bg-muted/30 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <t.icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {t.label}
            </p>
            <p className={`text-lg font-bold font-mono tracking-tight ${t.tone}`}>
              {t.value}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </Link>
      ))}
    </div>
  );
}
