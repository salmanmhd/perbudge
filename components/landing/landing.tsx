"use client";

import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Landmark,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  MessageSquareText,
  Wallet,
  Zap,
} from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { CountUp } from "@/components/landing/count-up";
import { TypingDemo } from "@/components/landing/typing-demo";

export function Landing() {
  return (
    <div className="kh-grain relative min-h-screen overflow-x-clip bg-[#f5f9f6] text-zinc-900 antialiased selection:bg-emerald-200 selection:text-emerald-950">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-emerald-950/5 bg-[#f5f9f6]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-900 font-bold text-white shadow-sm sm:h-9 sm:w-9">
              ₹
            </span>
            <span className="hidden text-base font-semibold tracking-tight min-[360px]:inline sm:text-lg">
              Kharcha
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 md:flex">
            <a href="#how" className="transition-colors hover:text-zinc-900">How it works</a>
            <a href="#everything" className="transition-colors hover:text-zinc-900">What it tracks</a>
            <a href="#ai" className="transition-colors hover:text-zinc-900">The AI</a>
          </nav>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/sign-in"
              className="rounded-full border border-emerald-950/10 bg-white/70 px-3.5 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-white sm:border-transparent sm:bg-transparent sm:px-4"
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-emerald-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md sm:px-4"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        {/* ── Hero ── */}
        <section className="relative isolate overflow-hidden">
          {/* aurora + grid */}
          <div className="kh-aurora" aria-hidden>
            <div className="kh-blob kh-blob-1 left-[-10%] top-[-20%] h-[38rem] w-[38rem] bg-[radial-gradient(circle,rgba(16,185,129,0.45),transparent_65%)]" />
            <div className="kh-blob kh-blob-2 right-[-15%] top-[-10%] h-[34rem] w-[34rem] bg-[radial-gradient(circle,rgba(45,212,191,0.38),transparent_65%)]" />
            <div className="kh-blob kh-blob-3 bottom-[-30%] left-[20%] h-[36rem] w-[36rem] bg-[radial-gradient(circle,rgba(163,230,53,0.22),transparent_65%)]" />
            <div className="kh-blob kh-blob-1 right-[10%] bottom-[-20%] h-[26rem] w-[26rem] bg-[radial-gradient(circle,rgba(251,191,36,0.18),transparent_65%)]" />
          </div>
          <div className="kh-grid pointer-events-none absolute inset-0 -z-10" aria-hidden />

          <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Copy */}
            <div className="kh-rise">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-white/60 px-3 py-1 text-sm font-medium text-emerald-800 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                AI money co-pilot · made for India
              </p>

              <h1 className="mt-6 text-[clamp(2.75rem,7vw,5rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-zinc-900">
                Your money,
                <br />
                finally{" "}
                <span className="relative whitespace-nowrap text-emerald-700">
                  on your side
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    height="12"
                    viewBox="0 0 300 12"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path
                      d="M2 8C60 3 120 3 180 6C230 8 270 7 298 4"
                      stroke="rgb(16 185 129)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                .
              </h1>

              <p className="mt-7 max-w-md text-lg leading-relaxed text-zinc-600">
                Log an expense in a sentence. Track cards, EMIs, and who owes whom.
                And get guidance that reads your real numbers — not another
                spreadsheet to babysit.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/sign-up"
                  className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-emerald-900 px-7 text-base font-semibold text-white shadow-lg shadow-emerald-900/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-900/30"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Start tracking free
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 left-0 z-0 w-1/4 bg-white/30 opacity-0 blur-md group-hover:opacity-100 group-hover:[animation:kh-sheen_0.9s_ease-out]" />
                </Link>
                <a
                  href="#how"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-emerald-950/10 bg-white/50 px-6 text-base font-medium text-zinc-700 backdrop-blur-sm transition-colors hover:bg-white"
                >
                  See how it works
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Your data stays yours
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-emerald-600" /> Logs in seconds
                </span>
              </div>
            </div>

            {/* Live demo */}
            <div className="kh-scale-in relative">
              <div className="kh-float-slow">
                <TypingDemo />
              </div>
              {/* floating accent chips */}
              <div className="kh-float absolute -left-3 top-6 hidden rounded-xl border border-emerald-950/8 bg-white/90 px-3 py-2 text-xs font-medium text-zinc-700 shadow-lg backdrop-blur sm:block" style={{ animationDelay: "1.2s" }}>
                <span className="font-mono text-emerald-600">+₹1,200</span> settled
              </div>
              <div className="kh-float absolute -right-2 bottom-4 hidden rounded-xl border border-emerald-950/8 bg-white/90 px-3 py-2 text-xs font-medium text-zinc-700 shadow-lg backdrop-blur sm:block" style={{ animationDelay: "0.5s" }}>
                🔥 <span className="text-zinc-500">12-day streak</span>
              </div>
            </div>
          </div>

          {/* stats bar */}
          <div className="relative z-10 mx-auto max-w-6xl px-5 pb-16 sm:px-8">
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-emerald-950/8 bg-white/60 p-2 backdrop-blur-sm sm:grid-cols-4">
              <Stat value={<CountUp value={3} suffix="s" />} label="to log an expense" />
              <Stat value={<CountUp value={6} />} label="money types tracked" />
              <Stat value="50/30/20" label="budgeting, built in" />
              <Stat value="Mon 9am" label="AI report in your inbox" />
            </div>
          </div>
        </section>

        {/* ── Three moves ── */}
        <section id="how" className="relative mx-auto max-w-6xl scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32">
          <Reveal className="max-w-2xl">
            <h2 className="text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
              Three simple moves. That&apos;s the whole app.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-zinc-600">
              Log what you spend, see where it goes, and ask what to do next.
              Everything else quietly handles itself.
            </p>
          </Reveal>

          <div className="mt-16 space-y-6">
            <MoveRow index="01 — Log" title="Add it before the moment passes." body="Tap a number and a category, or just type a sentence. No forms, no friction — the kind of quick you'll actually keep doing." reverse={false}>
              <LogVignette />
            </MoveRow>
            <MoveRow index="02 — See" title="Watch the month come into focus." body="Balance, income, and spending in clean, readable figures. A donut that shows where money really goes — no dense tables to decode." reverse>
              <SeeVignette />
            </MoveRow>
            <MoveRow index="03 — Ask" title="Get an answer before you spend." body="Kharcha reads your real income, EMIs, and habits, then tells you plainly what you can afford and where you're slipping." reverse={false}>
              <AskVignette />
            </MoveRow>
          </div>
        </section>

        {/* ── Everything (dark bento) ── */}
        <section id="everything" className="relative isolate scroll-mt-20 overflow-hidden bg-[#04241b] py-24 text-white sm:py-32">
          <div className="kh-aurora" aria-hidden>
            <div className="kh-blob kh-blob-2 left-[-10%] top-[-10%] h-[32rem] w-[32rem] bg-[radial-gradient(circle,rgba(16,185,129,0.35),transparent_65%)]" />
            <div className="kh-blob kh-blob-3 right-[-10%] bottom-[-20%] h-[30rem] w-[30rem] bg-[radial-gradient(circle,rgba(45,212,191,0.28),transparent_65%)]" />
          </div>
          <div className="kh-grid-dark absolute inset-0" aria-hidden />

          <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal className="max-w-2xl">
              <h2 className="text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
                Your whole financial life, in one calm place.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-emerald-100/70">
                Not just expenses. The card dues, the EMIs, the money a friend owes
                you, the client invoice that&apos;s late — all tracked, all visible.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <Reveal className="lg:col-span-3" delay={0}>
                <BentoCard>
                  <BentoLabel icon={CreditCard} text="Cards & accounts" />
                  <div className="mt-4 rounded-xl bg-black/20 p-4 ring-1 ring-inset ring-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-50">HDFC Millennia</span>
                      <span className="font-mono text-emerald-200/60">•••• 4242</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="kh-bar-grow h-full w-[34%] rounded-full bg-gradient-to-r from-emerald-400 to-teal-300" />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-emerald-300">34% used</span>
                      <span className="font-mono text-emerald-100/50">₹68,000 / ₹2,00,000</span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-emerald-100/65">
                    Utilisation, statement dues, and payment dates — before they surprise you.
                  </p>
                </BentoCard>
              </Reveal>

              <Reveal className="lg:col-span-3" delay={80}>
                <BentoCard>
                  <BentoLabel icon={Landmark} text="EMIs & loans" />
                  <div className="mt-4 space-y-3">
                    {[
                      { n: "Car Loan", done: 18, total: 36, pct: 50 },
                      { n: "Phone EMI", done: 7, total: 9, pct: 78 },
                    ].map((l) => (
                      <div key={l.n}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-emerald-50">{l.n}</span>
                          <span className="font-mono text-xs text-emerald-100/55">{l.done}/{l.total} paid</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                          <div className="kh-bar-grow h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300" style={{ width: `${l.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-emerald-100/65">
                    Every instalment&apos;s progress and monthly outflow, at a glance.
                  </p>
                </BentoCard>
              </Reveal>

              <Reveal className="lg:col-span-4" delay={0}>
                <BentoCard>
                  <BentoLabel icon={ArrowDownLeft} text="Money owed" />
                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    <OweChip positive name="Rahul owes you" note="Dinner split" amt="₹1,200" />
                    <OweChip positive={false} name="You owe Priya" note="Movie tickets" amt="₹500" />
                  </div>
                  <p className="mt-4 text-sm text-emerald-100/65">
                    Friends, family, and unpaid client invoices — settled cleanly, never forgotten.
                  </p>
                </BentoCard>
              </Reveal>

              <Reveal className="lg:col-span-2" delay={80}>
                <BentoCard>
                  <BentoLabel icon={Wallet} text="Budget" />
                  <div className="mt-4 space-y-2.5">
                    {[
                      { n: "Needs", pct: 48, c: "from-emerald-400 to-emerald-300" },
                      { n: "Wants", pct: 27, c: "from-amber-400 to-amber-300" },
                      { n: "Savings", pct: 25, c: "from-teal-300 to-emerald-200" },
                    ].map((b) => (
                      <div key={b.n} className="flex items-center gap-2">
                        <span className="w-14 text-xs text-emerald-100/70">{b.n}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div className={`kh-bar-grow h-full rounded-full bg-gradient-to-r ${b.c}`} style={{ width: `${b.pct}%` }} />
                        </div>
                        <span className="w-8 text-right font-mono text-xs text-emerald-100/55">{b.pct}%</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-emerald-100/65">The 50/30/20 rule, tracked live.</p>
                </BentoCard>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── AI section ── */}
        <section id="ai" className="relative mx-auto max-w-6xl scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
                <Sparkles className="h-3.5 w-3.5" /> The co-pilot
              </p>
              <h2 className="mt-6 text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
                Advice built on your{" "}
                <span className="text-emerald-700">actual numbers.</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-zinc-600">
                Most apps hand you charts and wish you luck. Kharcha reads your
                income, obligations, and habits, then tells you the two or three
                things that genuinely matter this week — and one thing to do about it.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Spots overspending before the month runs away from you",
                  "Answers “can I afford this?” with your real buffer",
                  "Lands a plain-English digest in your inbox every Monday",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-zinc-700">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={120} className="space-y-4">
              <div className="kh-ring-gradient rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-900">Dining is up 42% this week</h3>
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Watch</span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">
                      You&apos;ve spent ₹4,850 on food vs a ₹3,400 weekly average.
                    </p>
                    <p className="mt-2 text-sm">
                      <span className="font-medium text-emerald-700">Do this: </span>
                      <span className="text-zinc-600">Cook in twice this weekend to stay on your ₹14k budget.</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex justify-end">
                  <p className="max-w-[80%] rounded-2xl rounded-br-md bg-emerald-600 px-4 py-2.5 text-sm text-white shadow-sm">
                    Can I afford a ₹15,000 weekend trip this month?
                  </p>
                </div>
                <div className="mt-3 flex items-start gap-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                    <MessageSquareText className="h-3.5 w-3.5" />
                  </span>
                  <p className="max-w-[85%] rounded-2xl rounded-tl-md bg-zinc-100 px-4 py-2.5 text-sm text-zinc-700">
                    Yes — after rent, EMIs and your usual spend you&apos;ve got about{" "}
                    <span className="font-mono font-semibold text-emerald-700">₹18,400</span>{" "}
                    of buffer. Keep dining under ₹4k and you&apos;ll still hit your savings target.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Closing CTA ── */}
        <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#04241b] px-6 py-20 text-center sm:rounded-[2.5rem] sm:px-12 sm:py-28">
            <div className="kh-aurora" aria-hidden>
              <div className="kh-blob kh-blob-1 left-1/2 top-[-30%] h-[26rem] w-[26rem] -translate-x-1/2 bg-[radial-gradient(circle,rgba(16,185,129,0.4),transparent_65%)]" />
              <div className="kh-blob kh-blob-3 right-[5%] bottom-[-30%] h-[22rem] w-[22rem] bg-[radial-gradient(circle,rgba(45,212,191,0.3),transparent_65%)]" />
            </div>
            <div className="kh-grid-dark absolute inset-0" aria-hidden />
            <Reveal className="relative mx-auto max-w-2xl">
              <h2 className="text-balance text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-white">
                Start today. Understand everything.
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-lg text-emerald-100/75">
                Free to begin, quick to log, and genuinely useful from your very
                first expense. Your calmer relationship with money starts here.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/sign-up" className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-8 text-base font-semibold text-emerald-950 shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:shadow-xl">
                  <span className="relative z-10 flex items-center gap-2">
                    Create your free account
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
                <Link href="/sign-in" className="inline-flex h-12 items-center justify-center rounded-full px-6 text-base font-medium text-emerald-100 ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/10">
                  I already have an account
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-emerald-950/8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-zinc-500 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-900 text-xs font-bold text-white">₹</span>
            <span className="font-medium text-zinc-700">Kharcha</span>
          </div>
          <p>Built for everyday finance, shared homes, and calmer decisions.</p>
        </div>
      </footer>
    </div>
  );
}

/* ── Building blocks ── */

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl px-4 py-3 text-center transition-colors hover:bg-white/70">
      <p className="font-mono text-xl font-bold tracking-tight text-emerald-800">{value}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function MoveRow({
  index,
  title,
  body,
  reverse,
  children,
}: {
  index: string;
  title: string;
  body: string;
  reverse: boolean;
  children: React.ReactNode;
}) {
  return (
    <Reveal className="grid items-center gap-8 rounded-[1.75rem] border border-emerald-950/8 bg-white/70 p-6 backdrop-blur-sm transition-shadow hover:shadow-[0_20px_50px_-20px_rgba(6,78,59,0.25)] sm:p-8 lg:grid-cols-2 lg:gap-14 lg:p-10">
      <div className={reverse ? "lg:order-2" : ""}>
        <span className="font-mono text-sm font-semibold tracking-tight text-emerald-600">{index}</span>
        <h3 className="mt-3 text-balance text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{title}</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-600 sm:text-base">{body}</p>
      </div>
      <div className={`kh-float ${reverse ? "lg:order-1" : ""}`}>{children}</div>
    </Reveal>
  );
}

function BentoLabel({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
      <Icon className="h-4 w-4" /> {text}
    </div>
  );
}

function BentoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="kh-ring-gradient h-full rounded-2xl bg-white/[0.04] p-5 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/[0.07]">
      {children}
    </div>
  );
}

function OweChip({ positive, name, note, amt }: { positive: boolean; name: string; note: string; amt: string }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl p-3 ring-1 ring-inset ${positive ? "bg-emerald-500/10 ring-emerald-400/20" : "bg-rose-500/10 ring-rose-400/20"}`}>
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${positive ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
        {positive ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-emerald-50">{name}</p>
        <p className="text-xs text-emerald-200/55">{note}</p>
      </div>
      <span className={`font-mono text-sm font-semibold ${positive ? "text-emerald-300" : "text-rose-300"}`}>{amt}</span>
    </div>
  );
}

/* Log — numpad / category tap flow */
function LogVignette() {
  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-zinc-200/70 bg-white/90 p-5 shadow-[0_18px_50px_-20px_rgba(6,78,59,0.3)] backdrop-blur">
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Amount</p>
        <p className="mt-1 font-mono text-4xl font-bold tracking-tight text-zinc-900">₹1,850</p>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-1.5">
        {[
          { e: "🍔", l: "Food", on: false },
          { e: "🚕", l: "Transit", on: false },
          { e: "🛍️", l: "Shop", on: true },
          { e: "📱", l: "Bills", on: false },
          { e: "🎮", l: "Fun", on: false },
        ].map((c) => (
          <div key={c.l} className={`flex flex-col items-center gap-1 rounded-xl py-2.5 transition-colors ${c.on ? "bg-emerald-50 ring-2 ring-emerald-500" : "bg-zinc-50"}`}>
            <span className="text-lg">{c.e}</span>
            <span className="text-[10px] font-medium text-zinc-500">{c.l}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 text-center text-sm font-semibold text-white">Save transaction</div>
    </div>
  );
}

/* See — mini dashboard */
function SeeVignette() {
  const cats = [
    { l: "Rent", v: 18000, c: "#059669" },
    { l: "Food", v: 7200, c: "#f59e0b" },
    { l: "Transport", v: 3100, c: "#3b82f6" },
    { l: "Shopping", v: 2400, c: "#ec4899" },
  ];
  const total = cats.reduce((s, c) => s + c.v, 0);
  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-zinc-200/70 bg-white/90 p-5 shadow-[0_18px_50px_-20px_rgba(6,78,59,0.3)] backdrop-blur">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Net balance</p>
          <p className="mt-0.5 font-mono text-2xl font-bold tracking-tight text-zinc-900">
            <CountUp value={42300} prefix="₹" />
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">+12% saved</span>
      </div>
      <div className="mt-4 space-y-2">
        {cats.map((c) => (
          <div key={c.l} className="flex items-center gap-3">
            <span className="w-16 text-xs text-zinc-500">{c.l}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
              <div className="kh-bar-grow h-full rounded-full" style={{ width: `${(c.v / total) * 100}%`, background: c.c }} />
            </div>
            <span className="w-16 text-right font-mono text-xs font-medium text-zinc-600">₹{c.v.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Ask — AI chat */
function AskVignette() {
  return (
    <div className="mx-auto max-w-sm space-y-3 rounded-2xl border border-zinc-200/70 bg-white/90 p-5 shadow-[0_18px_50px_-20px_rgba(6,78,59,0.3)] backdrop-blur">
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-emerald-600 px-4 py-2.5 text-sm text-white">
          Where did most of my money go last month?
        </p>
      </div>
      <div className="flex items-start gap-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <p className="max-w-[85%] rounded-2xl rounded-tl-md bg-zinc-100 px-4 py-2.5 text-sm text-zinc-700">
          Rent took the biggest share at <span className="font-mono font-semibold text-zinc-900">₹18,000</span>, then food at ₹7,200. Food crept up ₹1,600 vs usual — worth a look.
        </p>
      </div>
    </div>
  );
}
