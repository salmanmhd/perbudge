import mongoose, { Schema, Document, models } from "mongoose";

export type PaymentMode = "cash" | "credit_card";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  category: string;
  type: "income" | "expense" | "transfer";
  paymentMode: PaymentMode;
  /** Optional link to a specific account/card (drives credit-card tracking) */
  accountId?: mongoose.Types.ObjectId;
  note?: string;
  tags: string[];
  counterparty?: string;
  date: Date;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    type: { type: String, enum: ["income", "expense", "transfer"], required: true },
    paymentMode: { type: String, enum: ["cash", "credit_card"], default: "cash" },
    accountId: { type: Schema.Types.ObjectId, ref: "Account" },
    note: { type: String },
    tags: { type: [String], default: [] },
    counterparty: { type: String },
    date: { type: Date, required: true, default: Date.now },
    isRecurring: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Transaction = models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
