"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sun, Moon, Monitor, Download, Trash2 } from "lucide-react";
import { UserProfile } from "@clerk/nextjs";

export function SettingsPanel() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const handleExportData = async () => {
    alert("Data export feature will be available soon. Your data belongs to you.");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Appearance */}
      <Card className="translucent-surface border-0">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how Kharcha looks for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
                  theme === t.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/40 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="translucent-surface border-0">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Your data belongs to you. Export or delete it anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Export Data</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Download all your transactions as a CSV file.
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExportData}>
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
          <div className="border-t border-border/40" />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-destructive">
                Delete Account
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently delete your account and all data.
              </p>
            </div>
            <Button variant="destructive" size="sm" className="gap-2" disabled>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="translucent-surface border-0">
        <CardHeader>
          <CardTitle>About Kharcha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>AI-powered personal finance for Indian families.</p>
            <p className="text-xs">
              Track spending, credit cards, EMIs, money owed, and budgets — with
              an AI co-pilot and weekly email reports.
            </p>
            <p className="text-xs">Built with Next.js · Clerk · MongoDB · Gemini Flash</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
