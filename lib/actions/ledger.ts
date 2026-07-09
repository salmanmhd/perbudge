"use server";

import { revalidatePath } from "next/cache";
import { ensureUserInDb } from "@/lib/actions/dashboard-data";
import Ledger from "@/lib/models/ledger";
import { ledgerOutstanding, round2 } from "@/lib/finance";
import type {
  LedgerKind,
  LedgerDirection,
} from "@/lib/models/ledger";

export interface LedgerView {
  _id: string;
  kind: LedgerKind;
  direction: LedgerDirection;
  counterpartyName: string;
  amount: number;
  settledAmount: number;
  outstanding: number;
  description?: string;
  date: string;
  dueDate?: string;
  status: "open" | "settled";
}

export interface LedgerSummary {
  entries: LedgerView[];
  totalReceivable: number; // people/clients owe me (open)
  totalPayable: number; // I owe (open)
  net: number; // receivable - payable
}

function toView(e: any): LedgerView {
  return {
    _id: String(e._id),
    kind: e.kind,
    direction: e.direction,
    counterpartyName: e.counterpartyName,
    amount: e.amount,
    settledAmount: e.settledAmount,
    outstanding: ledgerOutstanding(e),
    description: e.description,
    date: new Date(e.date).toISOString(),
    dueDate: e.dueDate ? new Date(e.dueDate).toISOString() : undefined,
    status: e.status,
  };
}

export async function getLedger(kind?: LedgerKind): Promise<LedgerSummary> {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId)
    return { entries: [], totalReceivable: 0, totalPayable: 0, net: 0 };

  const query: any = { userId: userObjectId };
  if (kind) query.kind = kind;

  const rows = await Ledger.find(query)
    .sort({ status: 1, dueDate: 1, date: -1 })
    .lean();

  const entries = (rows as any[]).map(toView);

  let totalReceivable = 0;
  let totalPayable = 0;
  for (const e of entries) {
    if (e.status === "settled") continue;
    if (e.direction === "receivable") totalReceivable += e.outstanding;
    else totalPayable += e.outstanding;
  }

  return {
    entries,
    totalReceivable,
    totalPayable,
    net: totalReceivable - totalPayable,
  };
}

export async function createLedgerEntry(data: {
  kind: LedgerKind;
  direction: LedgerDirection;
  counterpartyName: string;
  amount: number;
  description?: string;
  date?: string;
  dueDate?: string;
}) {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };

  try {
    await Ledger.create({
      userId: userObjectId,
      kind: data.kind,
      direction: data.direction,
      counterpartyName: data.counterpartyName,
      amount: round2(Number(data.amount)),
      settledAmount: 0,
      description: data.description,
      date: data.date ? new Date(data.date) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      status: "open",
    });
    revalidatePath("/dashboard/owed");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("createLedgerEntry error:", error);
    return { success: false, error: error.message || "Failed to add entry." };
  }
}

/** Settle part or all of an entry. Omit amount to settle in full. */
export async function settleLedgerEntry(id: string, amount?: number) {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };

  const entry = await Ledger.findOne({ _id: id, userId: userObjectId });
  if (!entry) return { success: false, error: "Entry not found" };

  if (amount === undefined) {
    entry.settledAmount = entry.amount;
  } else {
    entry.settledAmount = Math.min(entry.amount, entry.settledAmount + amount);
  }
  if (entry.settledAmount >= entry.amount) entry.status = "settled";
  await entry.save();

  revalidatePath("/dashboard/owed");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteLedgerEntry(id: string) {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };
  await Ledger.deleteOne({ _id: id, userId: userObjectId });
  revalidatePath("/dashboard/owed");
  return { success: true };
}
