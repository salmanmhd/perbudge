"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import {
  createLoan,
  updateLoan,
  payEmi,
  deleteLoan,
  type LoanView,
} from "@/lib/actions/loans";
import { formatINR, daysUntil, sanitizeAmountInput, sanitizeIntInput, type LoanTrajectory } from "@/lib/finance";
import { LoanTrajectoryChart } from "@/components/dashboard/loan-trajectory";
import {
  Plus,
  Loader2,
  Trash2,
  Landmark,
  Check,
  CalendarClock,
  Pencil,
} from "lucide-react";

export function LoansPanel({
  loans,
  monthlyTotal,
  trajectory,
}: {
  loans: LoanView[];
  monthlyTotal: number;
  trajectory: LoanTrajectory;
}) {
  const router = useRouter();
  const active = loans.filter((l) => l.status === "active");
  const closed = loans.filter((l) => l.status === "closed");
  const totalOutstanding = active.reduce((s, l) => s + l.outstanding, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            EMIs &amp; Loans
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every obligation in one place, with progress and due dates.
          </p>
        </div>
        <AddLoanButton onDone={() => router.refresh()} />
      </div>

      {/* Summary strip */}
      {active.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat label="Monthly EMI outflow" value={formatINR(monthlyTotal)} accent />
          <Stat label="Total outstanding" value={formatINR(totalOutstanding)} />
          <Stat
            label="Active loans"
            value={String(active.length)}
            className="col-span-2 md:col-span-1"
          />
        </div>
      )}

      {/* Payoff trajectory — how the debt melts month by month */}
      {active.length > 0 && <LoanTrajectoryChart trajectory={trajectory} />}

      {loans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
          <Landmark className="h-9 w-9 mx-auto text-muted-foreground/40" />
          <p className="mt-3 font-medium">No loans or EMIs tracked</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Add a home loan, car EMI, or gadget instalment to see payoff progress
            and never miss a due date.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((l) => (
            <LoanCard key={l._id} loan={l} onDone={() => router.refresh()} />
          ))}
          {closed.length > 0 && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4">
                Closed
              </p>
              {closed.map((l) => (
                <LoanCard key={l._id} loan={l} onDone={() => router.refresh()} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  className = "",
}: {
  label: string;
  value: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border/60 p-4 ${
        accent ? "bg-primary/5" : "bg-muted/30"
      } ${className}`}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-bold font-mono tracking-tight ${
          accent ? "text-primary" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function LoanCard({ loan, onDone }: { loan: LoanView; onDone: () => void }) {
  const [paying, setPaying] = useState(false);
  const due = daysUntil(new Date(loan.nextDueISO));
  const isClosed = loan.status === "closed";

  return (
    <div className="group rounded-2xl border border-border/60 bg-background p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold truncate">{loan.name}</p>
          <p className="text-xs text-muted-foreground">
            {loan.lender ? `${loan.lender} · ` : ""}
            {loan.emisPaid}/{loan.tenureMonths} EMIs paid
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold font-mono leading-tight">
            {formatINR(loan.emiAmount)}
          </p>
          <p className="text-[11px] text-muted-foreground">/ month</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-4 space-y-1.5">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${loan.progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {loan.progressPct}% paid off
          </span>
          <span className="text-muted-foreground">
            {isClosed ? (
              "Fully paid"
            ) : (
              <>
                {formatINR(loan.outstanding)} left
              </>
            )}
          </span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-4 flex items-center justify-between gap-2">
        {isClosed ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
            <Check className="h-3.5 w-3.5" /> Closed
          </span>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 text-xs ${
              due <= 3 ? "text-amber-500 font-medium" : "text-muted-foreground"
            }`}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            {due === 0
              ? "Due today"
              : due < 0
              ? `${Math.abs(due)}d overdue`
              : `Due in ${due}d`}
          </span>
        )}

        <div className="flex items-center gap-1">
          {!isClosed && (
            <Button
              size="sm"
              variant="outline"
              disabled={paying}
              onClick={async () => {
                setPaying(true);
                const res = await payEmi(loan._id);
                if (!res.success) {
                  alert(res.error);
                  setPaying(false);
                } else {
                  onDone();
                }
              }}
            >
              {paying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" /> Pay EMI
                </>
              )}
            </Button>
          )}
          <EditLoanButton loan={loan} onDone={onDone} />
          <button
            aria-label="Delete loan"
            onClick={async () => {
              if (!confirm(`Delete "${loan.name}"?`)) return;
              await deleteLoan(loan._id);
              onDone();
            }}
            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-muted"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddLoanButton({ onDone }: { onDone: () => void }) {
  return (
    <ResponsiveModal
      title="Add loan / EMI"
      description="Home, car, gadget, or personal loan."
      trigger={
        <Button size="lg" className="rounded-xl gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Add
        </Button>
      }
    >
      {(close) => (
        <LoanForm
          submitLabel="Add loan"
          onSubmit={createLoan}
          onDone={() => {
            close();
            onDone();
          }}
        />
      )}
    </ResponsiveModal>
  );
}

function EditLoanButton({ loan, onDone }: { loan: LoanView; onDone: () => void }) {
  return (
    <ResponsiveModal
      title="Edit loan / EMI"
      description="Fix details or revise the EMI count."
      trigger={
        <button
          aria-label="Edit loan"
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
        >
          <Pencil className="h-4 w-4" />
        </button>
      }
    >
      {(close) => (
        <LoanForm
          loan={loan}
          submitLabel="Save changes"
          onSubmit={(data) => updateLoan(loan._id, data)}
          onDone={() => {
            close();
            onDone();
          }}
        />
      )}
    </ResponsiveModal>
  );
}

/** Shared add/edit form. Pre-fills from `loan` when editing. */
function LoanForm({
  loan,
  submitLabel,
  onSubmit,
  onDone,
}: {
  loan?: LoanView;
  submitLabel: string;
  onSubmit: (data: {
    name: string;
    lender?: string;
    principal: number;
    emiAmount: number;
    tenureMonths: number;
    emisPaid: number;
    dueDay: number;
  }) => Promise<{ success: boolean; error?: string }>;
  onDone: () => void;
}) {
  const [name, setName] = useState(loan?.name ?? "");
  const [lender, setLender] = useState(loan?.lender ?? "");
  const [principal, setPrincipal] = useState(loan ? String(loan.principal) : "");
  const [emiAmount, setEmiAmount] = useState(loan ? String(loan.emiAmount) : "");
  const [tenureMonths, setTenureMonths] = useState(loan ? String(loan.tenureMonths) : "");
  const [emisPaid, setEmisPaid] = useState(loan ? String(loan.emisPaid) : "");
  const [dueDay, setDueDay] = useState(loan ? String(loan.dueDay) : "");
  const [saving, setSaving] = useState(false);

  const num = (s: string) => (s ? Number(s) : 0);
  const valid =
    name.trim() && num(emiAmount) > 0 && num(tenureMonths) > 0 && num(dueDay) >= 1;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="ln-name">Name</Label>
          <Input
            id="ln-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Car Loan"
            className="h-11"
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="ln-lender">Lender (optional)</Label>
          <Input
            id="ln-lender"
            value={lender}
            onChange={(e) => setLender(e.target.value)}
            placeholder="HDFC Bank"
            className="h-11"
          />
        </div>
        <NumField
          id="ln-emi"
          label="Monthly EMI"
          value={emiAmount}
          onChange={setEmiAmount}
          placeholder="15000"
          decimal
        />
        <NumField
          id="ln-due"
          label="Due day (1–31)"
          value={dueDay}
          onChange={(v) => setDueDay(sanitizeIntInput(v, 2))}
          placeholder="5"
        />
        <NumField
          id="ln-tenure"
          label="Total EMIs"
          value={tenureMonths}
          onChange={(v) => setTenureMonths(sanitizeIntInput(v))}
          placeholder="36"
        />
        <NumField
          id="ln-paid"
          label="EMIs paid"
          value={emisPaid}
          onChange={(v) => setEmisPaid(sanitizeIntInput(v))}
          placeholder="0"
        />
        <NumField
          id="ln-principal"
          label="Principal (optional)"
          value={principal}
          onChange={setPrincipal}
          placeholder="500000"
          decimal
          className="col-span-2"
        />
      </div>

      <Button
        className="w-full h-12 rounded-xl text-base"
        disabled={saving || !valid}
        onClick={async () => {
          setSaving(true);
          const res = await onSubmit({
            name: name.trim(),
            lender: lender.trim() || undefined,
            principal: num(principal) || num(emiAmount) * num(tenureMonths),
            emiAmount: num(emiAmount),
            tenureMonths: num(tenureMonths),
            emisPaid: num(emisPaid),
            dueDay: num(dueDay),
          });
          if (res.success) {
            onDone();
          } else {
            alert(res.error);
            setSaving(false);
          }
        }}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
      </Button>
    </div>
  );
}

function NumField({
  id,
  label,
  value,
  onChange,
  placeholder,
  className = "",
  decimal = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
  /** Allow up to 2 decimal places (money fields); otherwise digits only. */
  decimal?: boolean;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode={decimal ? "decimal" : "numeric"}
        value={value}
        onChange={(e) =>
          onChange(
            decimal
              ? sanitizeAmountInput(e.target.value)
              : sanitizeIntInput(e.target.value)
          )
        }
        placeholder={placeholder}
        className="h-11 font-mono"
      />
    </div>
  );
}
