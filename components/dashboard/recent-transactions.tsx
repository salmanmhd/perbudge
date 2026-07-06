import { CreditCard, Banknote } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";

export function RecentTransactions({ transactions }: { transactions: any[] }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return "Today";
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return "Yesterday";
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
    }).format(d);
  };

  if (!transactions?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No recent transactions</p>
        <p className="text-xs mt-1">Tap + to add your first one</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx._id}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors duration-150"
        >
          {/* Category icon */}
          <div className="w-10 h-10 rounded-xl bg-muted/80 flex items-center justify-center shrink-0">
            <CategoryIcon name={tx.category} colored className="h-5 w-5" />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{tx.category}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {formatTime(tx.date)}
              </span>
              {tx.counterparty && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {tx.counterparty}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Payment mode icon */}
          <div className="shrink-0">
            {tx.paymentMode === "credit_card" ? (
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>

          {/* Amount */}
          <p
            className={`text-sm font-semibold font-mono shrink-0 ${
              tx.type === "income"
                ? "text-emerald-500"
                : tx.type === "expense"
                ? "text-destructive"
                : "text-foreground"
            }`}
          >
            {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
            {formatCurrency(tx.amount)}
          </p>
        </div>
      ))}
    </div>
  );
}

