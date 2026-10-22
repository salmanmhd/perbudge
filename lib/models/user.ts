import mongoose, { Schema, Document, models } from "mongoose";

export type BudgetMethod = "50-30-20" | "zero-based" | "custom";

export interface ICategoryBudget {
  category: string;
  limit: number;
}

export interface IUser extends Document {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  /** Legacy single overall monthly spend cap (kept for backward compat) */
  monthlyBudget?: number;
  /** Typical monthly take-home income, used for budget planning & AI */
  monthlyIncome?: number;
  budgetMethod?: BudgetMethod;
  categoryBudgets?: ICategoryBudget[];
  /** Target % of income to save each month */
  savingsTargetPct?: number;
  /** Free-text goals the user is working toward, fed to the AI */
  financialGoals?: string;
  /** Whether the weekly AI email report is enabled */
  weeklyReportEnabled?: boolean;
  currency: string;
  telegramChatId?: number;
  telegramLinkToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategoryBudgetSchema = new Schema<ICategoryBudget>(
  {
    category: { type: String, required: true },
    limit: { type: Number, required: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    monthlyBudget: { type: Number },
    monthlyIncome: { type: Number },
    budgetMethod: {
      type: String,
      enum: ["50-30-20", "zero-based", "custom"],
      default: "50-30-20",
    },
    categoryBudgets: { type: [CategoryBudgetSchema], default: [] },
    savingsTargetPct: { type: Number, default: 20 },
    financialGoals: { type: String },
    weeklyReportEnabled: { type: Boolean, default: true },
    currency: { type: String, default: "INR" },
    telegramChatId: { type: Number, unique: true, sparse: true },
    telegramLinkToken: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

const User = models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
