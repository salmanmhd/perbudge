import mongoose, { Schema, Document, models } from "mongoose";

export type LoanStatus = "active" | "closed";

export interface ILoan extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  lender?: string;
  /** Total principal borrowed */
  principal: number;
  /** Monthly EMI amount */
  emiAmount: number;
  /** Annual interest rate, informational */
  interestRate?: number;
  /** Total number of EMIs in the tenure */
  tenureMonths: number;
  /** Number of EMIs already paid */
  emisPaid: number;
  /** Day of month the EMI is auto-debited (1-31) */
  dueDay: number;
  startDate: Date;
  category?: string;
  status: LoanStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    lender: { type: String },
    principal: { type: Number, required: true },
    emiAmount: { type: Number, required: true },
    interestRate: { type: Number },
    tenureMonths: { type: Number, required: true, min: 1 },
    emisPaid: { type: Number, default: 0, min: 0 },
    dueDay: { type: Number, required: true, min: 1, max: 31 },
    startDate: { type: Date, required: true, default: Date.now },
    category: { type: String },
    status: { type: String, enum: ["active", "closed"], default: "active" },
    notes: { type: String },
  },
  { timestamps: true }
);

const Loan = models.Loan || mongoose.model<ILoan>("Loan", LoanSchema);

export default Loan;
