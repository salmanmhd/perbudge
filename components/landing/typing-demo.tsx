"use client";

import { useEffect, useState } from "react";
import { Sparkles, Check, Wallet } from "lucide-react";

interface Moment {
  text: string;
  emoji: string;
  bg: string;
  cat: string;
  sub: string;
  amount: string;
  positive: boolean;
  mode: string;
}

const MOMENTS: Moment[] = [
  {
    text: "Chai & samosa with the team, ₹240 on UPI",
    emoji: "🍔",
    bg: "bg-amber-100",
    cat: "Food",
    sub: "Team chai · just now",
    amount: "−₹240",
    positive: false,
    mode: "UPI",
  },
  {
    text: "Paid the car EMI, ₹15,000 this month",
    emoji: "🏦",
    bg: "bg-violet-100",
    cat: "EMI · Car Loan",
    sub: "18 of 36 paid",
    amount: "−₹15,000",
    positive: false,
    mode: "Auto-debit",
  },
  {
    text: "Rahul paid back the ₹1,200 he owed",
    emoji: "🤝",
    bg: "bg-emerald-100",
    cat: "Settled up",
    sub: "Rahul · dinner split",
    amount: "+₹1,200",
    positive: true,
    mode: "Cash",
  },
  {
    text: "Freelance invoice cleared, ₹40,000",
    emoji: "💼",
    bg: "bg-sky-100",
    cat: "Income",
    sub: "Client payment",
    amount: "+₹40,000",
    positive: true,
    mode: "Bank",
  },
];

export function TypingDemo() {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "hold">("typing");
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(
      typeof window !== "undefined" &&
        !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  const moment = MOMENTS[i];
  const complete = typed.length === moment.text.length;

  useEffect(() => {
    if (reduce) {
      setTyped(moment.text);
      const t = setTimeout(() => setI((p) => (p + 1) % MOMENTS.length), 3200);
      return () => clearTimeout(t);
    }
    if (phase === "typing") {
      if (typed.length < moment.text.length) {
        const t = setTimeout(
          () => setTyped(moment.text.slice(0, typed.length + 1)),
          38
        );
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("hold"), 200);
      return () => clearTimeout(t);
    }
    // hold → advance
    const t = setTimeout(() => {
      setI((p) => (p + 1) % MOMENTS.length);
      setTyped("");
      setPhase("typing");
    }, 1900);
    return () => clearTimeout(t);
  }, [typed, phase, i, moment.text, reduce]);

  const showCard = complete || reduce;

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Input bar */}
      <div className="kh-ring-gradient relative rounded-2xl bg-white/80 p-4 shadow-[0_20px_60px_-15px_rgba(6,78,59,0.35)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </span>
          <p className="min-h-[1.5rem] text-[15px] leading-6 text-zinc-700">
            {typed || (
              <span className="text-zinc-400">Just tell Kharcha what you spent…</span>
            )}
            {!reduce && !complete && (
              <span className="kh-caret ml-0.5 bg-emerald-500 align-middle" style={{ height: "1.1em" }}>
                &nbsp;
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Connector */}
      <div className="flex justify-center py-2.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-950/70 px-3 py-1 text-xs font-medium text-emerald-100 shadow-sm ring-1 ring-inset ring-white/10 transition-all duration-500 ${
            showCard ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
          }`}
        >
          <Sparkles className="h-3 w-3" /> understood in a blink
        </span>
      </div>

      {/* Parsed card (swaps by key) */}
      <div className="relative min-h-[104px]">
        <div
          key={i}
          className={`rounded-2xl bg-white p-4 shadow-[0_20px_60px_-15px_rgba(6,78,59,0.35)] transition-all duration-500 ${
            showCard
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-2 scale-[0.98]"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ${moment.bg}`}>
              {moment.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-900">{moment.cat}</p>
              <p className="truncate text-xs text-zinc-500">{moment.sub}</p>
            </div>
            <div className="text-right">
              <p
                className={`font-mono text-lg font-bold tracking-tight ${
                  moment.positive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {moment.amount}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                <Wallet className="h-3 w-3" /> {moment.mode}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-zinc-100 pt-2.5 text-xs text-emerald-600">
            <Check className="h-3.5 w-3.5" />
            Categorised, dated &amp; saved — automatically
          </div>
        </div>
      </div>
    </div>
  );
}
