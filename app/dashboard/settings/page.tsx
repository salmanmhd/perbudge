import { SettingsPanel } from "@/components/dashboard/settings-panel";
import { ReportSettings } from "@/components/dashboard/report-settings";
import { getWeeklyReportEnabled } from "@/app/actions/report";

export default async function SettingsPage() {
  const weeklyEnabled = await getWeeklyReportEnabled();
  return (
    <div className="space-y-6 p-4 pt-6 md:p-8 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
      <ReportSettings initialEnabled={weeklyEnabled} />
      <SettingsPanel />
    </div>
  );
}
