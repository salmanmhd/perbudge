import { getBudgetPlan } from "@/lib/actions/budget";
import { BudgetPanel } from "@/components/dashboard/budget-panel";

export default async function BudgetPage() {
  const plan = await getBudgetPlan();
  return (
    <div className="p-4 pt-6 md:p-8 max-w-[900px] mx-auto w-full">
      <BudgetPanel plan={plan} />
    </div>
  );
}
