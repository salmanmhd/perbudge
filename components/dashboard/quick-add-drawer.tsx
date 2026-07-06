"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTransaction } from "@/lib/actions/transaction-db";
import { getAccounts, type AccountView } from "@/lib/actions/accounts";
import { parseTransactionNLP } from "@/app/actions/transaction";
import { CATEGORIES } from "@/lib/categories";
import { CategoryIcon } from "@/components/category-icon";
import { DatePicker } from "@/components/ui/date-picker";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Check,
  Loader2,
  Sparkles,
  ArrowRight,
  CreditCard,
  Banknote,
  ArrowLeft,
  Delete,
} from "lucide-react";
import type { PaymentMode } from "@/lib/models/transaction";

interface QuickAddDrawerProps {
  children?: React.ReactNode;
  triggerShortcut?: boolean;
}

type Step = "amount" | "category" | "details" | "success";

export function QuickAddDrawer({ children, triggerShortcut }: QuickAddDrawerProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!triggerShortcut) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (e.key === "a" || e.key === "A" || e.key === "n" || e.key === "N") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [triggerShortcut, open]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      resetForm();
    }
  };

  // ── Form State ──
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense" | "transfer">("expense");
  const [category, setCategory] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [accountId, setAccountId] = useState<string>("");
  const [cards, setCards] = useState<AccountView[]>([]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lazily load the user's credit cards the first time a card is chosen.
  useEffect(() => {
    if (paymentMode === "credit_card" && cards.length === 0) {
      getAccounts().then((accs) =>
        setCards(accs.filter((a) => a.type === "credit_card"))
      );
    }
  }, [paymentMode, cards.length]);

  // ── NLP State ──
  const [nlpMode, setNlpMode] = useState(false);
  const [nlpText, setNlpText] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const router = useRouter();

  const resetForm = useCallback(() => {
    setStep("amount");
    setAmount("");
    setType("expense");
    setCategory("");
    setPaymentMode("cash");
    setAccountId("");
    setNote("");
    setDate(new Date().toISOString().split("T")[0]);
    setNlpMode(false);
    setNlpText("");
    setIsSubmitting(false);
    setIsParsing(false);
  }, []);

  const handleNlpParse = async () => {
    if (!nlpText.trim()) return;
    setIsParsing(true);
    const result = await parseTransactionNLP(nlpText);
    if (result.success && result.data) {
      setAmount(String(result.data.amount));
      setCategory(result.data.category);
      setType(result.data.type);
      if (result.data.paymentMode) setPaymentMode(result.data.paymentMode);
      setNlpMode(false);
      setStep("details"); // Skip to details for confirmation
    } else {
      // Fallback: go to manual
      setNlpMode(false);
    }
    setIsParsing(false);
  };

  const visibleCategories = useMemo(
    () =>
      CATEGORIES.filter((c) =>
        type === "income" ? c.id === "salary" || c.id === "others" : c.id !== "salary"
      ),
    [type]
  );

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setStep("details");
  };

  const handleNumpad = (key: string | number) => {
    if (key === "backspace") {
      setAmount((prev) => prev.slice(0, -1));
    } else if (key === ".") {
      if (!amount.includes(".")) setAmount((prev) => prev + ".");
    } else {
      if (amount === "0" && key !== ".") {
        setAmount(String(key));
      } else if (amount.length < 8) {
        setAmount((prev) => prev + String(key));
      }
    }
  };

  const handleSubmit = async () => {
    if (!amount || !category) return;
    setIsSubmitting(true);

    const result = await createTransaction({
      amount: parseFloat(amount),
      category,
      type,
      paymentMode,
      accountId: paymentMode === "credit_card" && accountId ? accountId : undefined,
      note: note || undefined,
      isRecurring: false,
      date,
    });

    if (result.success) {
      setStep("success");
      router.refresh();
    } else {
      alert(result.error || "Failed to save transaction.");
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    resetForm();
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  // Keep a fresh submit reference for the keyboard handler (avoids stale note/date).
  const submitRef = useRef<() => void>(() => {});
  submitRef.current = () => {
    if (!isSubmitting) handleSubmit();
  };

  // ── Physical-keyboard support (great on laptop) ──
  useEffect(() => {
    if (!open || nlpMode || step === "success") return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const inField =
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable;

      if (step === "amount") {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          handleNumpad(Number(e.key));
        } else if (e.key === ".") {
          e.preventDefault();
          handleNumpad(".");
        } else if (e.key === "Backspace") {
          e.preventDefault();
          handleNumpad("backspace");
        } else if (e.key === "Enter" && amount && parseFloat(amount) > 0) {
          e.preventDefault();
          setStep("category");
        }
      } else if (step === "category") {
        if (inField) return;
        // 1–9 selects the first nine categories, 0 selects the tenth.
        const idx = e.key === "0" ? 9 : /^[1-9]$/.test(e.key) ? Number(e.key) - 1 : -1;
        if (idx >= 0 && visibleCategories[idx]) {
          e.preventDefault();
          handleCategorySelect(visibleCategories[idx].label);
        } else if (e.key === "Backspace" || e.key === "ArrowLeft") {
          e.preventDefault();
          setStep("amount");
        }
      } else if (step === "details") {
        if (e.key === "Enter") {
          e.preventDefault();
          submitRef.current();
        } else if ((e.key === "Backspace" || e.key === "ArrowLeft") && !inField) {
          e.preventDefault();
          setStep("category");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nlpMode, step, amount, visibleCategories]);

  const content = (
    <div className="px-1 pb-2">
      {/* ── NLP Mode ── */}
      {nlpMode && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="text-center space-y-1">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mx-auto">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Type naturally</h3>
            <p className="text-sm text-muted-foreground">
              &quot;Paid 500 for lunch&quot; or &quot;Got salary 50000&quot;
            </p>
          </div>
          <Input
            autoFocus
            value={nlpText}
            onChange={(e) => setNlpText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleNlpParse();
              }
            }}
            placeholder="Describe your transaction..."
            className="text-base h-12"
            disabled={isParsing}
          />
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setNlpMode(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleNlpParse}
              disabled={isParsing || !nlpText.trim()}
              className="flex-1"
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Parsing...
                </>
              ) : (
                "Parse"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 1: Amount ── */}
      {!nlpMode && step === "amount" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Add Transaction</h3>
            <button
              onClick={() => setNlpMode(true)}
              className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" /> Type naturally with AI
            </button>
          </div>

          {/* Type selector */}
          <div className="flex rounded-lg bg-muted p-1 gap-1">
            {(["expense", "income", "transfer"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-md text-sm font-medium capitalize transition-all duration-200 ${
                  type === t
                    ? t === "income"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : t === "expense"
                      ? "bg-destructive text-white shadow-sm"
                      : "bg-blue-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount Display */}
          <div className="text-center space-y-4">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Amount</span>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-4xl text-muted-foreground">₹</span>
              <div
                className={`text-6xl font-bold text-center w-full max-w-[200px] font-mono tracking-tighter ${!amount ? "text-muted-foreground/30" : "text-foreground"}`}
              >
                {amount || "0"}
              </div>
            </div>
          </div>

          {/* Custom Numpad */}
          <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto mb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "backspace"].map((key) => (
              <Button
                key={key}
                variant="outline"
                className="h-14 text-2xl font-normal rounded-2xl bg-muted/20 border-border/50 hover:bg-muted/50 transition-colors"
                onClick={() => handleNumpad(key)}
              >
                {key === "backspace" ? <Delete className="h-6 w-6" /> : key}
              </Button>
            ))}
          </div>

          <Button
            onClick={() => setStep("category")}
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full h-12 text-base rounded-xl"
          >
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          {isDesktop && (
            <p className="text-center text-xs text-muted-foreground">
              Type the amount ·{" "}
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                Enter
              </kbd>{" "}
              to continue
            </p>
          )}
        </div>
      )}

      {/* ── Step 2: Category ── */}
      {!nlpMode && step === "category" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep("amount")}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-semibold">Pick a category</h3>
            {isDesktop && (
              <span className="ml-auto text-xs text-muted-foreground">
                Press{" "}
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                  1–9
                </kbd>
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {visibleCategories.map((cat, idx) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.label)}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
                  category === cat.label
                    ? "bg-primary/15 ring-2 ring-primary"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                {isDesktop && idx < 10 && (
                  <span className="absolute left-1.5 top-1.5 font-mono text-[9px] font-semibold leading-none text-muted-foreground/50">
                    {(idx + 1) % 10}
                  </span>
                )}
                <CategoryIcon name={cat.id} colored className="h-6 w-6" />
                <span className="text-[11px] font-medium leading-tight text-center">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 3: Details & Confirm ── */}
      {!nlpMode && step === "details" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep("category")}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-semibold">Confirm details</h3>
          </div>

          {/* Summary bar */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-background">
              <CategoryIcon name={category} colored className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-medium">{category}</p>
              <p className="text-xs text-muted-foreground capitalize">{type}</p>
            </div>
            <p className="text-xl font-bold font-mono">
              ₹{parseFloat(amount).toLocaleString("en-IN")}
            </p>
          </div>

          {/* Payment mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Payment Mode
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setPaymentMode("cash")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  paymentMode === "cash"
                    ? "bg-primary/15 text-primary ring-2 ring-primary"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                <Banknote className="h-4 w-4" /> Cash
              </button>
              <button
                onClick={() => setPaymentMode("credit_card")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  paymentMode === "credit_card"
                    ? "bg-primary/15 text-primary ring-2 ring-primary"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                <CreditCard className="h-4 w-4" /> Credit Card
              </button>
            </div>
          </div>

          {/* Card picker (only when Credit Card + cards exist) */}
          {paymentMode === "credit_card" && cards.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Which card?
              </label>
              <div className="flex flex-wrap gap-2">
                {cards.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() =>
                      setAccountId((prev) => (prev === c._id ? "" : c._id))
                    }
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      accountId === c._id
                        ? "bg-primary/15 text-primary ring-2 ring-primary"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    {c.name}
                    {c.last4 ? (
                      <span className="font-mono text-xs opacity-70">
                        ·{c.last4}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Note (optional)
            </label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a quick note..."
              className="h-10"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Date
            </label>
            <DatePicker value={date} onChange={setDate} disableFuture />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 text-base rounded-xl"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              "Save Transaction"
            )}
          </Button>
          {isDesktop && !isSubmitting && (
            <p className="text-center text-xs text-muted-foreground">
              Press{" "}
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                Enter
              </kbd>{" "}
              to save
            </p>
          )}
        </div>
      )}

      {/* ── Success ── */}
      {step === "success" && (
        <div className="flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 animate-in zoom-in duration-500">
            <Check className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-xl font-semibold">Saved!</h3>
          <p className="text-muted-foreground text-sm mt-1">
            ₹{parseFloat(amount).toLocaleString("en-IN")} • {category}
          </p>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={handleClose} className="rounded-xl">
              Done
            </Button>
            <Button onClick={handleAddAnother} className="rounded-xl">
              Add Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {children && <DialogTrigger asChild>{children}</DialogTrigger>}
        <DialogContent className="sm:max-w-[440px] p-6 shadow-2xl rounded-3xl border-border/60">
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      {children && <DrawerTrigger asChild>{children}</DrawerTrigger>}
      <DrawerContent className="px-4 pb-6 pt-4 border-t-border/60 shadow-2xl rounded-t-3xl">
        <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-4" />
        {content}
      </DrawerContent>
    </Drawer>
  );
}
