import { getLoans, getMonthlyEmiTotal } from "@/lib/actions/loans";
import { LoansPanel } from "@/components/dashboard/loans-panel";

export default async function LoansPage() {
  const [loans, monthlyTotal] = await Promise.all([
    getLoans(),
    getMonthlyEmiTotal(),
  ]);
  return (
    <div className="p-4 pt-6 md:p-8 max-w-[900px] mx-auto w-full">
      <LoansPanel loans={loans} monthlyTotal={monthlyTotal} />
    </div>
  );
}
