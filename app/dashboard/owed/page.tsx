import { getLedger } from "@/lib/actions/ledger";
import { OwedPanel } from "@/components/dashboard/owed-panel";

export default async function OwedPage() {
  const [personal, client] = await Promise.all([
    getLedger("personal"),
    getLedger("client"),
  ]);
  return (
    <div className="p-4 pt-6 md:p-8 max-w-[900px] mx-auto w-full">
      <OwedPanel personal={personal} client={client} />
    </div>
  );
}
