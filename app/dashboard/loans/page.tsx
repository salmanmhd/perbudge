import { getLoans, getMonthlyEmiTotal } from "@/lib/actions/loans";
import { LoansPanel } from "@/components/dashboard/loans-panel";
import { loanPayoffTrajectory } from "@/lib/finance";

export default async function LoansPage() {
  const [loans, monthlyTotal] = await Promise.all([
    getLoans(),
    getMonthlyEmiTotal(),
  ]);
  // Project the payoff on the server so month labels don't depend on client time.
  const trajectory = loanPayoffTrajectory(
    loans
      .filter((l) => l.status === "active")
      .map((l) => ({ name: l.name, emiAmount: l.emiAmount, remainingEmis: l.remainingEmis }))
  );
  return (
    <div className="p-4 pt-6 md:p-8 max-w-[900px] mx-auto w-full">
      <LoansPanel loans={loans} monthlyTotal={monthlyTotal} trajectory={trajectory} />
    </div>
  );
}
