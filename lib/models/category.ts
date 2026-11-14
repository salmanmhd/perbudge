import mongoose, { Schema, Document, models } from "mongoose";

export type CategoryKind = "expense" | "income" | "both";

export interface IUserCategory extends Document {
  userId: mongoose.Types.ObjectId;
  /** Stable slug, unique per user (e.g. "food", "pet-care"). */
  slug: string;
  label: string;
  /** lucide-react icon name, resolved via ICON_REGISTRY */
  icon: string;
  color: string;
  kind: CategoryKind;
  order: number;
  /** Came from the built-in defaults (still editable). */
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserCategorySchema = new Schema<IUserCategory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    slug: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    icon: { type: String, default: "Receipt" },
    color: { type: String, default: "oklch(0.60 0.08 260)" },
    kind: { type: String, enum: ["expense", "income", "both"], default: "expense" },
    order: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserCategorySchema.index({ userId: 1, slug: 1 }, { unique: true });

const UserCategory =
  (models.UserCategory as mongoose.Model<IUserCategory> | undefined) ?? mongoose.model<IUserCategory>("UserCategory", UserCategorySchema);

export default UserCategory;
