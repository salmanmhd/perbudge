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
import {
  Send,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Unlink,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface TelegramSettingsProps {
  initialLinked: boolean;
}

export function TelegramSettings({ initialLinked }: TelegramSettingsProps) {
  const [isLinked, setIsLinked] = useState(initialLinked);
  const [connecting, setConnecting] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setMessage(null);

      const res = await fetch("/api/telegram/link", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to generate link");
      }

      // Open Telegram link in a new tab
      window.open(data.url, "_blank");

      setMessage({
        ok: true,
        text: "Opening Telegram... Tap 'Start' in the bot to connect your account.",
      });
    } catch (err: any) {
      setMessage({
        ok: false,
        text: err.message || "Failed to connect to Telegram.",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Are you sure you want to disconnect your Telegram account?")) {
      return;
    }

    try {
      setUnlinking(true);
      setMessage(null);

      const res = await fetch("/api/telegram/link", { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to unlink account");
      }

      setIsLinked(false);
      setMessage({
        ok: true,
        text: "Your Telegram account has been disconnected.",
      });
    } catch (err: any) {
      setMessage({
        ok: false,
        text: err.message || "Failed to disconnect Telegram.",
      });
    } finally {
      setUnlinking(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      setChecking(true);
      const res = await fetch("/api/telegram/link");
      const data = await res.json();

      if (res.ok) {
        setIsLinked(Boolean(data.isLinked));
        if (data.isLinked) {
          setMessage({
            ok: true,
            text: "✅ Connected successfully to Telegram!",
          });
        } else {
          setMessage({
            ok: false,
            text: "Not linked yet. Make sure to tap 'Start' inside Telegram.",
          });
        }
      }
    } catch (err: any) {
      setMessage({
        ok: false,
        text: "Failed to check status. Please try again.",
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card className="translucent-surface border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" /> Telegram Integration
          </CardTitle>
          {isLinked && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3" /> Connected
            </span>
          )}
        </div>
        <CardDescription>
          Log expenses in seconds directly from Telegram using shorthand commands like{" "}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">
            250 biryani
          </code>{" "}
          or{" "}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">
            150 coffee #food
          </code>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLinked ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Shorthand Tips
              </div>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li>
                  <code className="text-foreground font-mono">250 biryani</code> — logs ₹250
                  under biryani
                </li>
                <li>
                  <code className="text-foreground font-mono">150 coffee #food</code> — assigns
                  food category
                </li>
                <li>
                  <code className="text-foreground font-mono">500 petrol yest</code> — logs for
                  yesterday
                </li>
                <li>
                  <code className="text-foreground font-mono">/today</code> or{" "}
                  <code className="text-foreground font-mono">/month</code> — instant summary
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                Connected to Perbudge Telegram Bot.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleUnlink}
                disabled={unlinking}
              >
                {unlinking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="h-4 w-4" />
                )}
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Link your Telegram account</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Click the button below to start a chat with @perbudge_bot.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckStatus}
                  disabled={checking}
                  title="Check if Telegram was linked"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
                </Button>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={handleConnect}
                  disabled={connecting}
                >
                  {connecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  Connect Telegram Bot
                </Button>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div
            className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${
              message.ok
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {message.ok && <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
