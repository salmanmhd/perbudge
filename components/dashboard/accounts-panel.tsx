"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import {
  createAccount,
  archiveAccount,
  type AccountView,
} from "@/lib/actions/accounts";
import type { AccountType } from "@/lib/models/account";
import { formatINR, daysUntil } from "@/lib/finance";
import {
  Plus,
  CreditCard,
  Wallet,
  Landmark,
  Banknote,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: typeof Wallet }[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "bank", label: "Bank", icon: Landmark },
  { value: "credit_card", label: "Credit Card", icon: CreditCard },
  { value: "wallet", label: "Wallet", icon: Wallet },
];

function utilizationTone(pct: number) {
  if (pct >= 75) return { bar: "bg-destructive", text: "text-destructive" };
  if (pct >= 40) return { bar: "bg-amber-500", text: "text-amber-500" };
  return { bar: "bg-emerald-500", text: "text-emerald-500" };
}

export function AccountsPanel({ accounts }: { accounts: AccountView[] }) {
  const router = useRouter();
  const cards = accounts.filter((a) => a.type === "credit_card");
  const others = accounts.filter((a) => a.type !== "credit_card");

  const totalDue = cards.reduce((s, c) => s + (c.cycleSpend || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cards, banks, and wallets — with live credit-card dues.
          </p>
        </div>
        <AddAccountButton onDone={() => router.refresh()} />
      </div>

      {/* Credit cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Credit Cards
          </h2>
          {totalDue > 0 && (
            <span className="text-xs text-muted-foreground">
              Total statement due{" "}
              <span className="font-mono font-semibold text-foreground">
                {formatINR(totalDue)}
              </span>
            </span>
          )}
        </div>

        {cards.length === 0 ? (
          <EmptyRow
            icon={CreditCard}
            text="No credit cards yet"
            hint="Add a card to track spending, utilization, and payment due dates."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((c) => {
              const pct = c.utilizationPct ?? 0;
              const tone = utilizationTone(pct);
              const due = c.nextDueISO ? daysUntil(new Date(c.nextDueISO)) : null;
              return (
                <div
                  key={c._id}
                  className="group relative rounded-2xl border border-border/60 bg-gradient-to-br from-muted/40 to-background p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold leading-tight">{c.name}</p>
                        {c.last4 && (
                          <p className="text-xs text-muted-foreground font-mono">
                            •••• {c.last4}
                          </p>
                        )}
                      </div>
                    </div>
                    <DeleteAccountButton id={c._id} onDone={() => router.refresh()} />
                  </div>

                  <div className="mt-5 space-y-1.5">
                    <div className="flex items-end justify-between">
                      <span className="text-xs text-muted-foreground">
                        This cycle
                      </span>
                      <span className="text-lg font-bold font-mono">
                        {formatINR(c.cycleSpend || 0)}
                      </span>
                    </div>
                    {c.creditLimit ? (
                      <>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${tone.bar}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-medium ${tone.text}`}>
                            {pct}% used
                          </span>
                          <span className="text-muted-foreground font-mono">
                            of {formatINR(c.creditLimit)}
                          </span>
                        </div>
                      </>
                    ) : null}
                  </div>

                  {due !== null && (
                    <div className="mt-4 flex items-center gap-1.5 text-xs">
                      {due <= 5 ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      ) : null}
                      <span className="text-muted-foreground">
                        Payment due{" "}
                        {due === 0
                          ? "today"
                          : due < 0
                          ? `${Math.abs(due)}d overdue`
                          : `in ${due} day${due === 1 ? "" : "s"}`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Other accounts */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Cash · Bank · Wallet
        </h2>
        {others.length === 0 ? (
          <EmptyRow
            icon={Wallet}
            text="No other accounts"
            hint="Optional — add bank or wallet accounts to organise where money sits."
          />
        ) : (
          <div className="divide-y divide-border/50 rounded-2xl border border-border/60 overflow-hidden">
            {others.map((a) => {
              const Icon =
                ACCOUNT_TYPES.find((t) => t.value === a.type)?.icon || Wallet;
              return (
                <div
                  key={a._id}
                  className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {a.type}
                      {a.isDefault ? " · default" : ""}
                    </p>
                  </div>
                  <DeleteAccountButton id={a._id} onDone={() => router.refresh()} />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyRow({
  icon: Icon,
  text,
  hint,
}: {
  icon: typeof Wallet;
  text: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center">
      <Icon className="h-8 w-8 mx-auto text-muted-foreground/40" />
      <p className="mt-3 text-sm font-medium">{text}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">{hint}</p>
    </div>
  );
}

function DeleteAccountButton({ id, onDone }: { id: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      aria-label="Remove account"
      disabled={busy}
      onClick={async () => {
        if (!confirm("Remove this account? Its transactions are kept.")) return;
        setBusy(true);
        await archiveAccount(id);
        onDone();
      }}
      className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 -m-1"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}

function AddAccountButton({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("credit_card");
  const [creditLimit, setCreditLimit] = useState("");
  const [billingCycleDay, setBillingCycleDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [last4, setLast4] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setType("credit_card");
    setCreditLimit("");
    setBillingCycleDay("");
    setDueDay("");
    setLast4("");
    setSaving(false);
  };

  return (
    <ResponsiveModal
      title="Add account"
      description="Track a card, bank, or wallet."
      trigger={
        <Button size="lg" className="rounded-xl gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Add
        </Button>
      }
    >
      {(close) => (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    type === t.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acc-name">Name</Label>
            <Input
              id="acc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "credit_card" ? "HDFC Millennia" : "SBI Savings"}
              className="h-11"
            />
          </div>

          {type === "credit_card" && (
            <div className="space-y-4 rounded-2xl bg-muted/40 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cc-limit">Credit limit</Label>
                  <Input
                    id="cc-limit"
                    inputMode="numeric"
                    value={creditLimit}
                    onChange={(e) =>
                      setCreditLimit(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="200000"
                    className="h-11 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cc-last4">Last 4</Label>
                  <Input
                    id="cc-last4"
                    inputMode="numeric"
                    maxLength={4}
                    value={last4}
                    onChange={(e) => setLast4(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="4242"
                    className="h-11 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cc-bill">Statement day</Label>
                  <Input
                    id="cc-bill"
                    inputMode="numeric"
                    value={billingCycleDay}
                    onChange={(e) =>
                      setBillingCycleDay(
                        e.target.value.replace(/[^0-9]/g, "").slice(0, 2)
                      )
                    }
                    placeholder="1–31"
                    className="h-11 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cc-due">Due day</Label>
                  <Input
                    id="cc-due"
                    inputMode="numeric"
                    value={dueDay}
                    onChange={(e) =>
                      setDueDay(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))
                    }
                    placeholder="1–31"
                    className="h-11 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <Button
            className="w-full h-12 rounded-xl text-base"
            disabled={saving || !name.trim()}
            onClick={async () => {
              setSaving(true);
              const res = await createAccount({
                name: name.trim(),
                type,
                creditLimit: creditLimit ? Number(creditLimit) : undefined,
                billingCycleDay: billingCycleDay ? Number(billingCycleDay) : undefined,
                dueDay: dueDay ? Number(dueDay) : undefined,
                last4: last4 || undefined,
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
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add account"}
          </Button>
        </div>
      )}
    </ResponsiveModal>
  );
}
