"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTransaction } from "@/lib/actions/transaction-db";

const formSchema = z.object({
  amount: z.coerce.number().min(0.01),
  category: z.string().min(1),
  type: z.enum(["income", "expense", "transfer"]),
  counterparty: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

type FormInput = z.input<typeof formSchema>;
type FormData = z.output<typeof formSchema>;

/** Prefill, e.g. from the AI parser. */
export type TransactionFormInitial = Partial<FormData> | null;

interface TransactionFormProps {
  initialData: TransactionFormInitial;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionForm({ initialData, onSuccess, onCancel }: TransactionFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: initialData?.amount || 0,
      category: initialData?.category || "",
      type: initialData?.type || "expense",
      counterparty: initialData?.counterparty || "",
      isRecurring: initialData?.isRecurring || false,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await createTransaction(data);
      if (result.success) {
        onSuccess();
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" step="0.01" {...register("amount")} />
          {errors.amount && <span className="text-xs text-destructive">{errors.amount.message as string}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <select 
            id="type" 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
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
        <Input id="category" {...register("category")} />
        {errors.category && <span className="text-xs text-destructive">{errors.category.message as string}</span>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="counterparty">Counterparty (Optional)</Label>
        <Input id="counterparty" placeholder="e.g., Rahul, Starbucks" {...register("counterparty")} />
      </div>

      <div className="flex items-center space-x-2">
        <input 
          type="checkbox" 
          id="isRecurring" 
          {...register("isRecurring")}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <Label htmlFor="isRecurring" className="text-sm font-normal">This is a recurring transaction</Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Back</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Confirm & Save"}
        </Button>
      </div>
    </form>
  );
}
