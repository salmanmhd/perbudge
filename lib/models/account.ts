import mongoose, { Schema, Document, models } from "mongoose";

export type AccountType = "cash" | "bank" | "credit_card" | "wallet";

export interface IAccount extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: AccountType;
  /** For credit cards */
  creditLimit?: number;
  /** Day of month the statement is generated (1-31) */
  billingCycleDay?: number;
  /** Day of month the payment is due (1-31) */
  dueDay?: number;
  /** Last 4 digits, purely cosmetic */
  last4?: string;
  /** Opening/manual balance for bank & wallet (informational) */
  openingBalance?: number;
  color?: string;
  isDefault: boolean;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["cash", "bank", "credit_card", "wallet"],
      required: true,
    },
    creditLimit: { type: Number },
    billingCycleDay: { type: Number, min: 1, max: 31 },
    dueDay: { type: Number, min: 1, max: 31 },
    last4: { type: String },
    openingBalance: { type: Number, default: 0 },
    color: { type: String },
    isDefault: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Account =
  models.Account || mongoose.model<IAccount>("Account", AccountSchema);

export default Account;
