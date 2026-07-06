"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronLeft, ChevronRight, CreditCard, Banknote } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { deleteTransaction } from "@/lib/actions/transaction-list";
import { useRouter } from "next/navigation";

interface Transaction {
  _id: string;
  amount: number;
  category: string;
  type: "income" | "expense" | "transfer";
  paymentMode?: "cash" | "credit_card";
  note?: string;
  counterparty?: string;
  date: string;
  isRecurring: boolean;
}

interface TransactionTableProps {
  transactions: Transaction[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export function TransactionTable({
  transactions,
  total,
  totalPages,
  currentPage,
}: TransactionTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    startTransition(async () => {
      await deleteTransaction(id);
      router.refresh();
    });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(page));
    router.push(`/dashboard/transactions?${params.toString()}`);
  };

  if (!transactions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-lg">No transactions found</p>
        <p className="text-muted-foreground text-sm mt-1">
          Start by adding your first income or expense.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push("/dashboard/add")}
        >
          Add Transaction
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Mobile Card View (hidden on md and up) ── */}
      <div className="md:hidden space-y-3">
        {transactions.map((tx) => (
          <div key={tx._id} className="p-4 rounded-xl border border-border/40 bg-card flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted/80 flex items-center justify-center shrink-0">
                  <CategoryIcon name={tx.category} colored className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">{tx.category}</p>
                  {tx.note && (
                    <p className="text-xs text-muted-foreground">{tx.note}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                    {tx.counterparty && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <p className="text-xs text-muted-foreground">{tx.counterparty}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className={`font-mono font-medium ${tx.type === "income" ? "text-emerald-500" : tx.type === "expense" ? "text-destructive" : ""}`}>
                  {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                  {formatCurrency(tx.amount)}
                </p>
                <div className="flex items-center gap-1.5 justify-end">
                  {tx.paymentMode === "credit_card" ? (
                    <CreditCard className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Banknote className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                    tx.type === "income" ? "bg-emerald-500/10 text-emerald-500" : tx.type === "expense" ? "bg-destructive/10 text-destructive" : "bg-blue-500/10 text-blue-500"
                  }`}>
                    {tx.type}
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-border/40 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground hover:text-destructive gap-1"
                onClick={() => handleDelete(tx._id)}
                disabled={isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="text-xs">Delete</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop Table View (hidden on small screens) ── */}
      <div className="hidden md:block rounded-lg border border-border/40 overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx._id} className="group">
                <TableCell className="text-muted-foreground text-xs">
                  {formatDate(tx.date)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CategoryIcon name={tx.category} colored className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-medium">{tx.category}</p>
                      {tx.note && <p className="text-xs text-muted-foreground">{tx.note}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {tx.counterparty || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.type === "income"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : tx.type === "expense"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {tx.type}
                    </span>
                    {tx.paymentMode === "credit_card" ? (
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell
                  className={`text-right font-mono font-medium ${
                    tx.type === "income"
                      ? "text-emerald-500"
                      : tx.type === "expense"
                      ? "text-destructive"
                      : ""
                  }`}
                >
                  {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                  {formatCurrency(tx.amount)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(tx._id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-2">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 20 + 1}–
            {Math.min(currentPage * 20, total)} of {total}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
