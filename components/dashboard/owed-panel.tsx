"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import {
  createLedgerEntry,
  settleLedgerEntry,
  deleteLedgerEntry,
  type LedgerSummary,
  type LedgerView,
} from "@/lib/actions/ledger";
import type { LedgerKind, LedgerDirection } from "@/lib/models/ledger";
import { formatINR, daysUntil, sanitizeAmountInput } from "@/lib/finance";
import {
  Plus,
  Loader2,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Briefcase,
  Check,
} from "lucide-react";

export function OwedPanel({
  personal,
  client,
}: {
  personal: LedgerSummary;
  client: LedgerSummary;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<LedgerKind>("personal");
  const data = tab === "personal" ? personal : client;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Money Owed
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Friends, family, and client dues — who owes whom, settled cleanly.
          </p>
        </div>
        <AddOwedButton kind={tab} onDone={() => router.refresh()} />
      </div>

      {/* Net position */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500">
            <ArrowDownLeft className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              You&apos;ll receive
            </span>
          </div>
          <p className="mt-1 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-500">
            {formatINR(data.totalReceivable)}
          </p>
        </div>
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-center gap-1.5 text-destructive">
            <ArrowUpRight className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              You owe
            </span>
          </div>
          <p className="mt-1 text-xl font-bold font-mono text-destructive">
            {formatINR(data.totalPayable)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-muted p-1 gap-1 max-w-xs">
        {(
          [
            { k: "personal" as const, label: "Friends & Family", icon: Users },
            { k: "client" as const, label: "Clients", icon: Briefcase },
          ]
        ).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.k
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {data.entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
          {tab === "personal" ? (
            <Users className="h-9 w-9 mx-auto text-muted-foreground/40" />
          ) : (
            <Briefcase className="h-9 w-9 mx-auto text-muted-foreground/40" />
          )}
          <p className="mt-3 font-medium">
            {tab === "personal" ? "No IOUs tracked" : "No client dues tracked"}
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {tab === "personal"
              ? "Lent a friend money or borrowed some? Track it here so nobody forgets."
              : "Add pending client invoices to keep receivables visible and chase-able."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {data.entries.map((e) => (
            <OwedRow key={e._id} entry={e} onDone={() => router.refresh()} />
          ))}
        </div>
      )}
    </div>
  );
}

function OwedRow({ entry, onDone }: { entry: LedgerView; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const settled = entry.status === "settled";
  const receivable = entry.direction === "receivable";
  const due = entry.dueDate ? daysUntil(new Date(entry.dueDate)) : null;

  return (
    <div
      className={`group flex items-center gap-3 rounded-2xl border p-4 transition-colors ${
        settled ? "border-border/40 opacity-60" : "border-border/60"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          receivable
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-500"
            : "bg-destructive/15 text-destructive"
        }`}
      >
        {receivable ? (
          <ArrowDownLeft className="h-4 w-4" />
        ) : (
          <ArrowUpRight className="h-4 w-4" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{entry.counterpartyName}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{receivable ? "owes you" : "you owe"}</span>
          {entry.description && (
            <>
              <span>·</span>
              <span className="truncate">{entry.description}</span>
            </>
          )}
          {!settled && due !== null && (
            <>
              <span>·</span>
              <span className={due < 0 ? "text-amber-500" : ""}>
                {due < 0 ? `${Math.abs(due)}d overdue` : `due in ${due}d`}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p
          className={`font-bold font-mono ${
            receivable
              ? "text-emerald-600 dark:text-emerald-500"
              : "text-destructive"
          }`}
        >
          {formatINR(entry.outstanding)}
        </p>
        {entry.settledAmount > 0 && !settled && (
          <p className="text-[11px] text-muted-foreground">
            {formatINR(entry.settledAmount)} settled
          </p>
        )}
      </div>

      {settled ? (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-medium shrink-0">
          <Check className="h-3.5 w-3.5" /> Settled
        </span>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const res = await settleLedgerEntry(entry._id);
              if (!res.success) {
                alert(res.error);
                setBusy(false);
              } else onDone();
            }}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Settle"}
          </Button>
          <button
            aria-label="Delete"
            onClick={async () => {
              if (!confirm("Delete this entry?")) return;
              await deleteLedgerEntry(entry._id);
              onDone();
            }}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function AddOwedButton({
  kind,
  onDone,
}: {
  kind: LedgerKind;
  onDone: () => void;
}) {
  const [direction, setDirection] = useState<LedgerDirection>("receivable");
  const [counterpartyName, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setDirection("receivable");
    setName("");
    setAmount("");
    setDescription("");
    setDueDate("");
    setSaving(false);
  };

  const isClient = kind === "client";

  return (
    <ResponsiveModal
      title={isClient ? "Add client due" : "Add an IOU"}
      description={
        isClient
          ? "Track a pending client payment."
          : "Money you lent or borrowed."
      }
      trigger={
        <Button size="lg" className="rounded-xl gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Add
        </Button>
      }
    >
      {(close) => (
        <div className="space-y-4">
          {/* Direction */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection("receivable")}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                direction === "receivable"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
                  : "border-border/50 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <ArrowDownLeft className="h-4 w-4" />
              {isClient ? "They owe me" : "I lent"}
            </button>
            <button
              type="button"
              onClick={() => setDirection("payable")}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                direction === "payable"
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-border/50 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              {isClient ? "I owe them" : "I borrowed"}
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ow-name">
              {isClient ? "Client name" : "Person's name"}
            </Label>
            <Input
              id="ow-name"
              value={counterpartyName}
              onChange={(e) => setName(e.target.value)}
              placeholder={isClient ? "Acme Corp" : "Rahul"}
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ow-amount">Amount</Label>
              <Input
                id="ow-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
                placeholder="2000"
                className="h-11 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ow-due">Due date (optional)</Label>
              <DatePicker
                id="ow-due"
                value={dueDate}
                onChange={setDueDate}
                placeholder="Pick a date"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ow-desc">Note (optional)</Label>
            <Input
              id="ow-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isClient ? "Invoice #1024" : "Dinner split"}
              className="h-11"
            />
          </div>

          <Button
            className="w-full h-12 rounded-xl text-base"
            disabled={saving || !counterpartyName.trim() || !amount}
            onClick={async () => {
              setSaving(true);
              const res = await createLedgerEntry({
                kind,
                direction,
                counterpartyName: counterpartyName.trim(),
                amount: parseFloat(amount),
                description: description.trim() || undefined,
                dueDate: dueDate || undefined,
              });
              if (res.success) {
                reset();
                close();
                onDone();
              } else {
                alert(res.error);
                setSaving(false);
              }
            }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      )}
    </ResponsiveModal>
  );
}
