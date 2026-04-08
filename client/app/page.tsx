"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
  TrendingUp,
  BarChart3,
  Zap,
  Target,
  ArrowRight,
  Check,
  Layers,
  Wallet,
} from "lucide-react"

// Refined animation variants for professional feel
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
}

const floatAnimation = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white dark:bg-slate-950">
      {/* Sophisticated background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-blue-100 opacity-40 blur-3xl dark:bg-blue-900 dark:opacity-20" />
        <div className="absolute bottom-20 left-0 h-80 w-80 rounded-full bg-cyan-100 opacity-30 blur-3xl dark:bg-cyan-900 dark:opacity-15" />
        <div className="absolute top-1/2 left-1/3 h-96 w-96 rounded-full bg-blue-50 opacity-20 blur-3xl dark:bg-slate-800 dark:opacity-10" />
      </div>

      {/* Navigation - Premium styling */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-200/50 bg-white/70 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <div className="rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 p-2">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              perbudge
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40">
                Get Started
              </Button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section - Premium */}
      <section className="relative min-h-screen w-full overflow-hidden px-6 pt-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid min-h-[calc(100vh-120px)] items-center gap-16 lg:grid-cols-2">
            {/* Left Content */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={fadeInUp}
                className="mb-6 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Join 10,000+ users managing their finances
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="mb-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl dark:text-white"
              >
                Master your{" "}
                <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 bg-clip-text text-transparent">
                  money
                </span>
                <br />
                with clarity
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="mb-8 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400"
              >
                Stop guessing about your finances. Get real-time insights,
                actionable guidance, and AI-powered planning—all designed to
                help you make smarter financial decisions with confidence.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <Link href="/register">
                  <Button
                    size="lg"
                    className="group h-12 bg-gradient-to-r from-blue-600 to-cyan-600 px-8 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:shadow-blue-600/40"
                  >
                    Start Free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 border-slate-300 text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-50 dark:hover:bg-slate-900"
                  >
                    View Demo
                  </Button>
                </Link>
              </motion.div>

              <motion.p
                variants={fadeInUp}
                className="mt-8 text-xs font-medium text-slate-500 dark:text-slate-500"
              >
                ✓ No credit card · ✓ Takes 30 seconds · ✓ Free forever
              </motion.p>
            </motion.div>

            {/* Right - Hero Visual */}
            <motion.div
              variants={slideInRight}
              initial="hidden"
              animate="visible"
              className="relative hidden h-full w-full lg:flex lg:items-center lg:justify-center"
            >
              <motion.div
                animate={floatAnimation}
                className="relative w-full max-w-md"
              >
                {/* Main card */}
                <div className="rounded-2xl border border-slate-200/60 bg-white/40 p-6 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/40 dark:shadow-slate-900/50">
                  {/* Header */}
                  <div className="mb-6 flex items-center justify-between">
                    <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                      <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                      <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                    </div>
                  </div>

                  {/* Chart area */}
                  <div className="mb-6 space-y-4">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Spending Overview
                    </div>
                    <div className="flex items-end justify-between gap-2 rounded-lg bg-slate-100/50 p-4 dark:bg-slate-800/50">
                      {[65, 45, 85, 55, 70, 40, 90].map((height, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            height: [
                              `${height}px`,
                              `${height + 20}px`,
                              `${height}px`,
                            ],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 0.1,
                          }}
                          className="flex-1 rounded-md bg-gradient-to-t from-blue-500 to-blue-400 opacity-80"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Income
                      </div>
                      <div className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                        ₹65,000
                      </div>
                    </div>
                    <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 p-4 dark:from-green-950/30 dark:to-emerald-950/30">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Saved
                      </div>
                      <div className="mt-2 text-lg font-bold text-green-600 dark:text-green-400">
                        ₹12,340
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating notification card */}
                <motion.div
                  animate={{
                    y: [0, 20, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: 0.5,
                  }}
                  className="absolute -right-4 -bottom-6 rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        Budget on track
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        -2% from target
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Premium Grid */}
      <section className="relative px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white"
            >
              Everything you need
              <br />
              to win with money
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-400"
            >
              Comprehensive tools built for modern financial life
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                icon: TrendingUp,
                title: "Smart Tracking",
                description:
                  "Log expenses with zero friction. See exactly where every rupee goes.",
              },
              {
                icon: BarChart3,
                title: "Real Insights",
                description:
                  "AI-powered analysis of your spending patterns and financial health.",
              },
              {
                icon: Target,
                title: "Smart Goals",
                description:
                  "Set budgets and watch your progress with intelligent tracking.",
              },
              {
                icon: Zap,
                title: "AI Guidance",
                description:
                  "Get personalized advice for loans, investments & savings.",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-slate-50/50 p-7 transition-all hover:border-blue-300/50 hover:bg-white hover:shadow-lg hover:shadow-blue-500/5 dark:border-slate-800/50 dark:bg-slate-900/50 dark:hover:border-cyan-500/30 dark:hover:bg-slate-900 dark:hover:shadow-cyan-500/5"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 p-2.5 dark:bg-blue-950">
                  <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="relative border-t border-slate-200/50 px-6 py-16 lg:px-8 dark:border-slate-800/50">
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-8 md:grid-cols-3"
          >
            {[
              { value: "10K+", label: "Active Users" },
              { value: "₹500Cr+", label: "Finances Tracked" },
              { value: "98%", label: "Recommend to Friends" },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center">
                <div className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Choose Section - Premium */}
      <section className="relative px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-12 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white"
            >
              Why perbudge stands out
            </motion.h2>

            <div className="grid gap-8 md:grid-cols-2">
              {[
                {
                  title: "Cross-Platform Sync",
                  description:
                    "Access your finances seamlessly across web, iOS, and Android. Your data stays synced in real-time.",
                },
                {
                  title: "No Vendor Lock-in",
                  description:
                    "Your financial data is yours. Export anytime, own your information completely.",
                },
                {
                  title: "AI Financial Coach",
                  description:
                    "Get personalized recommendations on budgeting, investing, and debt management.",
                },
                {
                  title: "Complete Loan Tracking",
                  description:
                    "Track all loans, EMIs, and amounts lent to friends. Never miss a payment.",
                },
                {
                  title: "Bank-Level Security",
                  description:
                    "Enterprise-grade encryption protects your sensitive financial information.",
                },
                {
                  title: "Lifetime Free Access",
                  description:
                    "No paywalls, no surprise charges. All core features are permanently free.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  whileInView="visible"
                  initial="hidden"
                  viewport={{ once: true }}
                  className="flex gap-4 rounded-xl border border-slate-200/50 bg-slate-50/50 p-6 dark:border-slate-800/50 dark:bg-slate-900/50"
                >
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA - Premium */}
      <section className="relative overflow-hidden px-6 py-32 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.h2
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl dark:text-white"
          >
            Your financial transformation{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              starts today
            </span>
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-10 text-lg text-slate-600 dark:text-slate-400"
          >
            Join thousands of users who have taken control of their finances.
            Start tracking, analyzing, and optimizing—completely free.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-4"
          >
            <Link href="/register">
              <Button
                size="lg"
                className="h-12 bg-gradient-to-r from-blue-600 to-cyan-600 px-8 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:shadow-blue-600/40"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-slate-300 px-8 text-base font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-50 dark:hover:bg-slate-900"
              >
                Sign In
              </Button>
            </Link>
          </motion.div>

          <motion.p
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-xs font-medium text-slate-500 dark:text-slate-500"
          >
            ✓ No credit card required · ✓ Takes 30 seconds · ✓ Full access to
            all features
          </motion.p>
        </motion.div>
      </section>

      {/* Footer - Professional */}
      <footer className="border-t border-slate-200/50 px-6 py-12 lg:px-8 dark:border-slate-800/50">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 p-2">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                perbudge
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              © 2026 perbudge. Taking control of finances, one transaction at a
              time.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
              >
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
