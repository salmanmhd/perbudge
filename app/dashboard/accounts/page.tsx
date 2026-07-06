import { getAccounts } from "@/lib/actions/accounts";
import { AccountsPanel } from "@/components/dashboard/accounts-panel";

export default async function AccountsPage() {
  const accounts = await getAccounts();
  return (
    <div className="p-4 pt-6 md:p-8 max-w-[1100px] mx-auto w-full">
      <AccountsPanel accounts={accounts} />
    </div>
  );
}
