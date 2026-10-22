"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Send,
  Sparkles,
  Bot,
  CheckCheck,
  RotateCcw,
  Undo2,
  Calendar,
  Tag,
  ShieldCheck,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Reveal } from "@/components/landing/reveal";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  meta?: {
    amount?: string;
    category?: string;
    dateLabel?: string;
    buttons?: string[];
  };
}

const PRESET_CONVERSATION: ChatMessage[] = [
  {
    id: "msg-1",
    sender: "user",
    text: "250 biryani",
    time: "2:14 PM",
  },
  {
    id: "msg-2",
    sender: "bot",
    text: "✅ Saved ₹250 — biryani • Food",
    time: "2:14 PM",
    meta: {
      buttons: ["🔄 Change Category", "❌ Undo"],
    },
  },
  {
    id: "msg-3",
    sender: "user",
    text: "500 petrol #travel yest",
    time: "2:15 PM",
  },
  {
    id: "msg-4",
    sender: "bot",
    text: "✅ Saved ₹500 — petrol • Transport (Yesterday)",
    time: "2:15 PM",
    meta: {
      buttons: ["🔄 Change Category", "❌ Undo"],
    },
  },
  {
    id: "msg-5",
    sender: "user",
    text: "/analysis",
    time: "2:16 PM",
  },
  {
    id: "msg-6",
    sender: "bot",
    text: "📊 Financial Breakdown — October\n\n💰 Total Spent: ₹24,850 (18 expenses)\n🔥 Top Category: Rent (₹18,000 • 72%)\n\n• Rent: ₹18,000 (72%)\n• Food: ₹4,850 (20%)\n• Transport: ₹2,000 (8%)\n\n🤖 AI Co-pilot: Dining is on pace! Keep food under ₹6k to meet your savings target.",
    time: "2:16 PM",
  },
];

export function TelegramShowcase() {
  const [messages, setMessages] = useState<ChatMessage[]>(PRESET_CONVERSATION);
  const [activeTab, setActiveTab] = useState<"demo" | "features">("demo");
  const [inputVal, setInputVal] = useState("");

  const handleSimulateSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      time: "Just now",
    };

    let botReplyText = "";
    let buttons: string[] | undefined = undefined;

    const lower = text.toLowerCase().trim();
    if (lower === "/today") {
      botReplyText = "📅 Today's Expenses\nTotal: ₹750 (2 expenses)\n• ₹250 — biryani (Food)\n• ₹500 — petrol (Transport)";
    } else if (lower === "/last") {
      botReplyText = "🕒 Your Last 5 Expenses\n1. ₹500 — petrol • Transport (Yesterday)\n2. ₹250 — biryani • Food (Today)\n3. ₹1,200 — wifi • Bills (18 Oct)";
    } else if (lower === "/analysis") {
      botReplyText = "📊 Financial Breakdown — October\n💰 Total: ₹24,850\n🔥 Top Category: Rent (72%)\n🤖 AI Tip: Keep weekend dining light to lock in savings.";
    } else {
      const match = text.match(/\d+/);
      const amount = match ? match[0] : "150";
      const desc = text.replace(/\d+/, "").replace(/#\w+/, "").trim() || "Expense";
      const cat = text.includes("#") ? text.match(/#(\w+)/)?.[1] || "Others" : "Others";
      botReplyText = `✅ Saved ₹${amount} — ${desc} • ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
      buttons = ["🔄 Change Category", "❌ Undo"];
    }

    const botReply: ChatMessage = {
      id: `b-${Date.now()}`,
      sender: "bot",
      text: botReplyText,
      time: "Just now",
      meta: { buttons },
    };

    setMessages((prev) => [...prev, userMsg, botReply]);
    setInputVal("");
  };

  const handleReset = () => {
    setMessages(PRESET_CONVERSATION);
  };

  return (
    <section id="telegram" className="relative mx-auto max-w-6xl scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32">
      {/* Section Header */}
      <Reveal className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-600/20 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-800">
          <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
          <span>New Feature · Stateless Telegram Bot</span>
        </div>

        <h2 className="mt-5 text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-zinc-900">
          Log an expense in 3 seconds.{" "}
          <span className="text-sky-700">Without opening the app.</span>
        </h2>

        <p className="mt-4 text-lg leading-relaxed text-zinc-600">
          Just paid the chaiwala? Stepped out of a cab? Text <code className="rounded bg-zinc-200/60 px-1.5 py-0.5 font-mono text-zinc-800 text-base">250 biryani</code> or <code className="rounded bg-zinc-200/60 px-1.5 py-0.5 font-mono text-zinc-800 text-base">500 petrol yest</code> to <strong>@perbudge_bot</strong>. It auto-categorizes, updates your budget, and stays in sync with your web dashboard.
        </p>
      </Reveal>

      {/* Main Grid: Telegram Chat Mockup + Benefits */}
      <div className="mt-14 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        {/* Left: Realistic Telegram Phone / Chat Mockup */}
        <Reveal delay={60} className="relative">
          <div className="relative mx-auto max-w-md overflow-hidden rounded-[2.25rem] border-[6px] border-zinc-800 bg-[#0e1621] text-white shadow-2xl shadow-sky-950/20">
            {/* Phone Top Speaker & Camera Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 h-3.5 w-24 rounded-full bg-zinc-800/80 z-20" />

            {/* Telegram Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#17212b] px-4 pt-6 pb-3 z-10">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-teal-400 font-bold text-white shadow-md">
                  <span>₹</span>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#17212b] bg-emerald-500" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-sm leading-tight text-white">
                    <span>Perbudge Bot</span>
                    <span className="inline-flex items-center justify-center rounded-full bg-sky-400 text-white w-3.5 h-3.5 text-[9px]">
                      ✓
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">@perbudge_bot · bot</p>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                title="Reset demo chat"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex flex-col space-y-3 p-4 bg-[#0e1621] min-h-[380px] max-h-[460px] overflow-y-auto">
              <div className="mx-auto my-1 rounded-full bg-white/10 px-3 py-0.5 text-[10px] text-zinc-400 font-medium tracking-wide">
                Today
              </div>

              {messages.map((m) => {
                const isUser = m.sender === "user";

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                        isUser
                          ? "bg-[#2b5278] text-white rounded-br-xs"
                          : "bg-[#182533] text-zinc-100 rounded-bl-xs border border-white/5"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.text}</p>

                      {/* Telegram Inline Buttons */}
                      {m.meta?.buttons && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5 pt-1 border-t border-white/10">
                          {m.meta.buttons.map((btn, bIdx) => (
                            <span
                              key={bIdx}
                              className="rounded-lg bg-white/10 hover:bg-white/15 px-2.5 py-1 text-[10px] font-medium text-sky-300 transition-colors cursor-default"
                            >
                              {btn}
                            </span>
                          ))}
                        </div>
                      )}

                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${
                          isUser ? "text-sky-200/70" : "text-zinc-500"
                        }`}
                      >
                        <span>{m.time}</span>
                        {isUser && <CheckCheck className="h-3 w-3 text-sky-300" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Test Prompt Chips inside Mockup */}
            <div className="border-t border-white/5 bg-[#17212b]/60 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-zinc-400 shrink-0 text-[10px] uppercase font-bold tracking-wider">Try:</span>
              <button
                onClick={() => handleSimulateSend("150 coffee #food")}
                className="shrink-0 rounded-full bg-white/10 hover:bg-sky-500/20 hover:text-sky-300 px-2.5 py-0.5 text-zinc-300 transition-colors"
              >
                150 coffee #food
              </button>
              <button
                onClick={() => handleSimulateSend("/today")}
                className="shrink-0 rounded-full bg-white/10 hover:bg-sky-500/20 hover:text-sky-300 px-2.5 py-0.5 text-zinc-300 transition-colors"
              >
                /today
              </button>
              <button
                onClick={() => handleSimulateSend("/last")}
                className="shrink-0 rounded-full bg-white/10 hover:bg-sky-500/20 hover:text-sky-300 px-2.5 py-0.5 text-zinc-300 transition-colors"
              >
                /last
              </button>
            </div>

            {/* Input Bar inside Mockup */}
            <div className="border-t border-white/10 bg-[#17212b] p-2.5 flex items-center gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSimulateSend(inputVal)}
                placeholder="Message @perbudge_bot..."
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
              />
              <button
                onClick={() => handleSimulateSend(inputVal)}
                disabled={!inputVal.trim()}
                className="h-8 w-8 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-sky-400 transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5 ml-0.5" />
              </button>
            </div>
          </div>

          {/* Floating Accents */}
          <div className="kh-float absolute -bottom-4 -left-4 hidden sm:flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl backdrop-blur-md">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold text-zinc-900">Zero App Launch Time</p>
              <p className="text-[11px] text-zinc-500">Log right from your messaging app</p>
            </div>
          </div>
        </Reveal>

        {/* Right: Feature Value Pillars */}
        <div className="space-y-6">
          <Reveal delay={100}>
            <div className="group rounded-2xl border border-emerald-950/8 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-sky-300 hover:shadow-md">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <Send className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">Instant Shorthand Logging</h3>
                  <p className="mt-1 text-sm text-zinc-600 leading-relaxed">
                    Type plain text like <code className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-900">250 biryani</code> or <code className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-900">1200 wifi #bills</code>. Perbudge extracts the amount, description, and category automatically.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="group rounded-2xl border border-emerald-950/8 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-sky-300 hover:shadow-md">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Calendar className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">Offline & Date Backdating</h3>
                  <p className="mt-1 text-sm text-zinc-600 leading-relaxed">
                    Forgot to log petrol yesterday? Add <code className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-900">yest</code> or a date like <code className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-900">18/10</code> to backdate smoothly without clicking around calendars.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={220}>
            <div className="group rounded-2xl border border-emerald-950/8 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-sky-300 hover:shadow-md">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">Inline Keyboards & Instant Breakdown</h3>
                  <p className="mt-1 text-sm text-zinc-600 leading-relaxed">
                    Tap inline buttons to change a category or undo an entry instantly. Text <code className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-900">/analysis</code> anytime to get a monthly spending breakdown and AI observation right inside Telegram.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={280}>
            <div className="pt-2">
              <Link
                href="/sign-up"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-900 px-6 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 hover:bg-emerald-800 transition-all"
              >
                <span>Get started with Telegram Bot</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
