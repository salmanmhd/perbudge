"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { parseTransactionNLP } from "@/app/actions/transaction";
import { createTransaction } from "@/lib/actions/transaction-db";
import { Sparkles, Loader2, PenLine, ArrowLeft, Check } from "lucide-react";

const formSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  type: z.enum(["income", "expense", "transfer"]),
  counterparty: z.string().optional(),
  isRecurring: z.boolean().default(false),
  date: z.string().optional(),
});

type FormInput = z.input<typeof formSchema>;
type FormData = z.output<typeof formSchema>;

export function AddTransactionForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "nlp" | "manual">("choose");
  const [nlpText, setNlpText] = useState("");
  const [isParsingNlp, setIsParsingNlp] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      category: "",
      type: "expense" as const,
      counterparty: "",
      isRecurring: false,
      date: new Date().toISOString().split("T")[0],
    },
  });

  const handleNlpParse = async () => {
    if (!nlpText.trim()) return;
    setIsParsingNlp(true);
    const result = await parseTransactionNLP(nlpText);
    if (result.success && result.data) {
      setValue("amount", result.data.amount);
      setValue("category", result.data.category);
      setValue("type", result.data.type);
      if (result.data.counterparty) setValue("counterparty", result.data.counterparty);
      setValue("isRecurring", result.data.isRecurring);
      setMode("manual"); // show form with pre-filled data
    } else {
      alert(result.error || "Could not parse. Try the manual form.");
    }
    setIsParsingNlp(false);
  };

  const onSubmit = async (data: FormData) => {
    const result = await createTransaction({
      amount: data.amount,
      category: data.category,
      type: data.type,
      counterparty: data.counterparty,
      isRecurring: data.isRecurring,
    });

    if (result.success) {
      setSaved(true);
      setTimeout(() => {
        router.push("/dashboard/transactions");
        router.refresh();
      }, 800);
    } else {
      alert(result.error || "Failed to save transaction.");
    }
  };

  const handleAddAnother = () => {
    reset();
    setSaved(false);
    setNlpText("");
    setMode("choose");
  };

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-semibold">Transaction Saved!</h3>
        <p className="text-muted-foreground text-sm mt-1">Redirecting to transactions...</p>
        <Button variant="ghost" className="mt-4" onClick={handleAddAnother}>
          Add Another
        </Button>
      </div>
    );
  }

  // Step 1: Choose input method
  if (mode === "choose") {
    return (
      <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card
          className="translucent-surface border-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200 group"
          onClick={() => setMode("nlp")}
        >
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/25 transition-colors">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg">AI Input</CardTitle>
            <CardDescription>
              Just type naturally. &quot;Paid 500 to Rahul for lunch&quot;
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="translucent-surface border-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200 group"
          onClick={() => setMode("manual")}
        >
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-2 group-hover:bg-muted/80 transition-colors">
              <PenLine className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">Manual Entry</CardTitle>
            <CardDescription>
              Fill in amount, category, and type yourself.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Step 2a: NLP mode
  if (mode === "nlp") {
    return (
      <div className="max-w-lg mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <Button variant="ghost" size="sm" onClick={() => setMode("choose")} className="gap-1">
          <ArrowLeft className="h-3 w-3" /> Back
        </Button>
        <Card className="translucent-surface border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Describe your transaction
            </CardTitle>
            <CardDescription>
              Type naturally. Our AI will extract the details for you to confirm.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              autoFocus
              placeholder="e.g., Got salary 50000, spent 200 on chai, paid Rahul 1500 for dinner"
              value={nlpText}
              onChange={(e) => setNlpText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleNlpParse();
                }
              }}
              disabled={isParsingNlp}
              className="text-base"
            />
            <Button
              onClick={handleNlpParse}
              disabled={isParsingNlp || !nlpText.trim()}
              className="w-full"
            >
              {isParsingNlp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Parsing...
                </>
              ) : (
                "Parse & Continue"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2b/3: Manual form (also used after NLP pre-fill)
  return (
    <div className="max-w-lg mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Button variant="ghost" size="sm" onClick={() => setMode("choose")} className="gap-1">
        <ArrowLeft className="h-3 w-3" /> Back
      </Button>
      <Card className="translucent-surface border-0">
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>Review and confirm the details below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register("amount")}
                  className="text-lg font-mono"
                />
                {errors.amount && (
                  <p className="text-xs text-destructive">{errors.amount.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  {...register("type")}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Food, Transport, Salary"
                {...register("category")}
              />
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="counterparty">Counterparty (optional)</Label>
              <Input
                id="counterparty"
                placeholder="e.g., Rahul, Zomato, Office"
                {...register("counterparty")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...register("date")} />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("isRecurring")}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Recurring</span>
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Save Transaction"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
