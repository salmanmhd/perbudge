"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { useCategories } from "@/components/categories/categories-provider";
import { categoriesForType, findCategory } from "@/lib/categories";
import { updateTransaction } from "@/lib/actions/transaction-db";

type TxType = "income" | "expense" | "transfer";
type PayMode = "cash" | "credit_card";

export interface EditableTransaction {
  _id: string;
  amount: number;
  category: string;
  type: TxType;
  paymentMode?: PayMode;
  note?: string;
  counterparty?: string;
  date: string;
  isRecurring: boolean;
}

/** Local yyyy-MM-dd for a date string. */
function toLocalISO(dateString: string) {
  const d = new Date(dateString);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const selectCls =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function EditTransactionDialog({
  tx,
  compact,
}: {
  tx: EditableTransaction;
  /** Icon-only trigger (desktop table row). */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      title="Edit transaction"
      trigger={
        compact ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Edit transaction"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-8 text-muted-foreground gap-1">
            <Pencil className="h-3.5 w-3.5" />
            <span className="text-xs">Edit</span>
          </Button>
        )
      }
    >
      {/* Remount the form each time it opens so it starts from the saved values. */}
      {open && <EditForm tx={tx} onDone={() => setOpen(false)} />}
    </ResponsiveModal>
  );
}

function EditForm({ tx, onDone }: { tx: EditableTransaction; onDone: () => void }) {
  const router = useRouter();
  const allCategories = useCategories();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<TxType>(tx.type);
  const [amount, setAmount] = useState(String(tx.amount));
  const [category, setCategory] = useState(
    findCategory(allCategories, tx.category)?.label ?? tx.category
  );
  const [note, setNote] = useState(tx.note ?? "");
  const [counterparty, setCounterparty] = useState(tx.counterparty ?? "");
  const [paymentMode, setPaymentMode] = useState<PayMode>(tx.paymentMode ?? "cash");
  const [date, setDate] = useState(toLocalISO(tx.date));
  const [isRecurring, setIsRecurring] = useState(tx.isRecurring);

  const options = useMemo(() => {
    const list = categoriesForType(allCategories, type === "income" ? "income" : "expense");
    // Keep the current value selectable even if it was deleted or is another type.
    return list.some((c) => c.label.toLowerCase() === category.toLowerCase())
      ? list
      : [{ id: "__current", label: category }, ...list];
  }, [allCategories, type, category]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter an amount greater than 0");
      return;
    }
    setError(null);

    // Keep the original time of day; only move the calendar date.
    let newDate: string | undefined;
    if (date !== toLocalISO(tx.date)) {
      const orig = new Date(tx.date);
      const [y, m, d] = date.split("-").map(Number);
      newDate = new Date(y, m - 1, d, orig.getHours(), orig.getMinutes()).toISOString();
    }

    startTransition(async () => {
      const res = await updateTransaction(tx._id, {
        type,
        amount: value,
        category,
        note: note.trim(),
        counterparty: counterparty.trim(),
        paymentMode,
        isRecurring,
        ...(newDate ? { date: newDate } : {}),
      });
      if (!res.success) {
        setError(res.error || "Couldn't save changes");
        return;
      }
      onDone();
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
        {(["expense", "income", "transfer"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-md py-1.5 text-sm capitalize transition-colors ${
              type === t ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="edit-amount">Amount (₹)</Label>
          <Input
            id="edit-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-date">Date</Label>
          <DatePicker id="edit-date" value={date} onChange={setDate} disableFuture />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-category">Category</Label>
        <select
          id="edit-category"
          className={selectCls}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {options.map((c) => (
            <option key={c.id} value={c.label}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-note">Note</Label>
        <Input id="edit-note" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="edit-counterparty">Counterparty</Label>
          <Input
            id="edit-counterparty"
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-mode">Paid with</Label>
          <select
            id="edit-mode"
            className={selectCls}
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value as PayMode)}
          >
            <option value="cash">Cash / UPI</option>
            <option value="credit_card">Credit card</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="h-4 w-4"
        />
        Recurring
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onDone} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
