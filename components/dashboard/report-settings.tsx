"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { sendTestReport, setWeeklyReportEnabled } from "@/app/actions/report";
import { Mail, Loader2, Check, Send } from "lucide-react";

export function ReportSettings({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [toggling, setToggling] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const toggle = async () => {
    setToggling(true);
    const next = !enabled;
    setEnabled(next);
    await setWeeklyReportEnabled(next);
    setToggling(false);
  };

  const test = async () => {
    setSending(true);
    setStatus(null);
    const res = await sendTestReport();
    setStatus(
      res.success
        ? { ok: true, msg: `Sent to ${res.email}. Check your inbox.` }
        : { ok: false, msg: res.error || "Failed to send." }
    );
    setSending(false);
  };

  return (
    <Card className="translucent-surface border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" /> Weekly email report
        </CardTitle>
        <CardDescription>
          A Monday-morning digest of your spending, savings rate, and one thing to
          fix — written by Perbudge&apos;s AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Send me weekly reports</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Delivered every Monday at 9am.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={enabled}
            disabled={toggling}
            onClick={toggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? "bg-primary" : "bg-muted-foreground/30"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="border-t border-border/40" />

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-sm font-medium">Send a test now</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Preview the report in your own inbox.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 shrink-0"
            disabled={sending}
            onClick={test}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send test
          </Button>
        </div>

        {status && (
          <div
            className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${
              status.ok
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {status.ok && <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
            <span>{status.msg}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
