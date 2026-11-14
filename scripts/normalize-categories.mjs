// One-off cleanup: old Telegram entries stored categories as lowercase ids
// ("food"), the app stores display labels ("Food"). This rewrites every
// transaction / budget whose category matches a user's category id or label
// case-insensitively to that category's exact label.
//
// Usage:  node --env-file=.env scripts/normalize-categories.mjs [--dry-run]
import mongoose from "mongoose";

const DEFAULTS = [
  ["food", "Food"],
  ["transport", "Transport"],
  ["rent", "Rent"],
  ["bills", "Bills"],
  ["entertainment", "Entertainment"],
  ["shopping", "Shopping"],
  ["health", "Health"],
  ["education", "Education"],
  ["salary", "Salary"],
  ["others", "Others"],
];

const dryRun = process.argv.includes("--dry-run");
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set (run with --env-file=.env)");
  process.exit(1);
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

await mongoose.connect(uri);
const db = mongoose.connection.db;
const users = db.collection("users");
const txs = db.collection("transactions");
const cats = db.collection("usercategories");

let txChanged = 0;
let budgetChanged = 0;

for await (const user of users.find({}, { projection: { _id: 1, categoryBudgets: 1 } })) {
  const own = await cats.find({ userId: user._id }).toArray();
  const pairs = own.length ? own.map((c) => [c.slug, c.label]) : DEFAULTS;

  for (const [slug, label] of pairs) {
    const names = [...new Set([slug, label])].map((n) => new RegExp(`^${esc(n)}$`, "i"));
    // Only rows whose spelling differs from the exact label.
    const filter = {
      userId: user._id,
      category: { $in: names, $ne: label },
    };
    if (dryRun) {
      txChanged += await txs.countDocuments(filter);
    } else {
      const r = await txs.updateMany(filter, { $set: { category: label } });
      txChanged += r.modifiedCount;
    }
  }

  // Budgets are keyed by lowercase label.
  if (user.categoryBudgets?.length) {
    let dirty = false;
    const next = user.categoryBudgets.map((b) => {
      const hit = pairs.find(
        ([slug, label]) =>
          b.category.toLowerCase() === slug || b.category.toLowerCase() === label.toLowerCase()
      );
      const key = hit ? hit[1].toLowerCase() : b.category.toLowerCase();
      if (key !== b.category) dirty = true;
      return { ...b, category: key };
    });
    if (dirty) {
      budgetChanged++;
      if (!dryRun) await users.updateOne({ _id: user._id }, { $set: { categoryBudgets: next } });
    }
  }
}

console.log(
  `${dryRun ? "[dry run] would update" : "Updated"} ${txChanged} transactions, ${budgetChanged} users' budgets`
);
await mongoose.disconnect();
