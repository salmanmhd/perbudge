import mongoose, { Schema, Document, models } from "mongoose";

/** personal = friends/family IOUs, client = business receivables/payables */
export type LedgerKind = "personal" | "client";
/** receivable = they owe me (I gave / I'm owed), payable = I owe them (I took) */
export type LedgerDirection = "receivable" | "payable";
export type LedgerStatus = "open" | "settled";

export interface ILedger extends Document {
  userId: mongoose.Types.ObjectId;
  kind: LedgerKind;
  direction: LedgerDirection;
  counterpartyName: string;
  amount: number;
  /** Amount already settled (supports partial settlement) */
  settledAmount: number;
  description?: string;
  date: Date;
  dueDate?: Date;
  status: LedgerStatus;
  createdAt: Date;
  updatedAt: Date;
}

const LedgerSchema = new Schema<ILedger>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["personal", "client"], required: true },
    direction: { type: String, enum: ["receivable", "payable"], required: true },
    counterpartyName: { type: String, required: true },
    amount: { type: Number, required: true },
    settledAmount: { type: Number, default: 0 },
    description: { type: String },
    date: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date },
    status: { type: String, enum: ["open", "settled"], default: "open" },
  },
  { timestamps: true }
);

const Ledger = models.Ledger || mongoose.model<ILedger>("Ledger", LedgerSchema);

export default Ledger;
