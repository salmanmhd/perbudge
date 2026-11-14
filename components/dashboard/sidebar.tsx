"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import {
  LayoutDashboard,
  Sparkles,
  PlusCircle,
  List,
  Settings,
  MessageSquare,
  Moon,
  Sun,
  CreditCard,
  Landmark,
  Users,
  PiggyBank,
  MoreHorizontal,
  X,
} from "lucide-react"
import { useState } from "react"
import { useIsClient } from "@/hooks/use-media-query"
import { QuickAddDrawer } from "@/components/dashboard/quick-add-drawer"
import { Drawer, DrawerContent } from "@/components/ui/drawer"

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
}

const PRIMARY: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transactions", icon: List },
]

const MONEY: NavItem[] = [
  { href: "/dashboard/accounts", label: "Accounts & Cards", icon: CreditCard },
  { href: "/dashboard/loans", label: "EMIs & Loans", icon: Landmark },
  { href: "/dashboard/owed", label: "Money Owed", icon: Users },
  { href: "/dashboard/budget", label: "Budget", icon: PiggyBank },
]

const AI: NavItem[] = [
  { href: "/dashboard/insights", label: "Insights", icon: Sparkles },
  { href: "/dashboard/ask-ai", label: "Ask AI", icon: MessageSquare },
]


function useIsActive() {
  const pathname = usePathname()
  return (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href)
}

export function DashboardNavigation() {
  const isActive = useIsActive()
  const pathname = usePathname()
  const mounted = useIsClient()
  // The "More" drawer is open for the page it was opened on; navigating closes it.
  const [moreOpenOn, setMoreOpenOn] = useState<string | null>(null)
  const moreOpen = moreOpenOn === pathname
  const setMoreOpen = (open: boolean) => setMoreOpenOn(open ? pathname : null)
  const { resolvedTheme, setTheme } = useTheme()


  const renderLink = (item: NavItem, expandLabel = true) => (
    <Link
      key={item.href}
      href={item.href}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        isActive(item.href)
          ? "bg-primary/15 text-primary shadow-sm"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      <span
        className={
          expandLabel
            ? "whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            : "whitespace-nowrap"
        }
      >
        {item.label}
      </span>
    </Link>
  )

  return (
    <>
      {/* ── Desktop Sidebar (Hover Expand) ── */}
      <aside className="group z-50 hidden w-16 shrink-0 flex-col overflow-hidden border-r border-border/40 bg-background/95 shadow-[2px_0_15px_-3px_rgba(0,0,0,0.1)] backdrop-blur-xl transition-[width] duration-300 ease-in-out hover:w-64 md:fixed md:top-0 md:left-0 md:flex md:h-screen">
        <div className="flex h-16 w-64 shrink-0 items-center border-b border-border/40 px-4">
          <Link href="/dashboard" className="flex w-full items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">
                ₹
              </span>
            </div>
            <span className="text-xl font-bold tracking-tight whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Perbudge
            </span>
          </Link>
        </div>

        <nav className="w-64 flex-1 space-y-1 overflow-x-hidden overflow-y-auto px-2 py-4">
          {PRIMARY.map((i) => renderLink(i))}

          {/* Add (center action) */}
          <QuickAddDrawer triggerShortcut>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary transition-all duration-200 hover:bg-primary/10">
              <PlusCircle className="h-5 w-5 shrink-0" />
              <span className="whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Add transaction
              </span>
            </button>
          </QuickAddDrawer>

          <div className="mx-3 my-2 border-t border-border/40" />
          {MONEY.map((i) => renderLink(i))}
          <div className="mx-3 my-2 border-t border-border/40" />
          {AI.map((i) => renderLink(i))}
        </nav>

        <div className="flex w-64 shrink-0 flex-col gap-1 border-t border-border/40 p-2">
          {renderLink({
            href: "/dashboard/settings",
            label: "Settings",
            icon: Settings,
          })}
          {mounted && (
            <button
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5 shrink-0" />
              ) : (
                <Moon className="h-5 w-5 shrink-0" />
              )}
              <span className="whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
              </span>
            </button>
          )}
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="shrink-0">
              <UserButton />
            </div>
            <span className="text-sm font-medium whitespace-nowrap text-muted-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Account
            </span>
          </div>
        </div>
      </aside>

      {/* Spacer for desktop since sidebar is fixed */}
      <div className="hidden w-16 shrink-0 md:block" />

      {/* ── Mobile Bottom Tab Bar ── */}
      <div className="pb-safe fixed right-0 bottom-0 left-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur-md md:hidden">
        <nav className="flex h-16 items-center justify-around">
          <MobileTab item={PRIMARY[0]} isActive={isActive} />
          <MobileTab item={PRIMARY[1]} isActive={isActive} />

          {/* Center Add */}
          <QuickAddDrawer>
            <button className="flex h-full flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium">
              <div className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-[0_0_15px_-3px_var(--primary)] ring-4 ring-background">
                <PlusCircle className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="mt-0.5">Add</span>
            </button>
          </QuickAddDrawer>

          <MobileTab item={MONEY[3]} isActive={isActive} />

          {/* More */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex h-full flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        </nav>
      </div>

      {/* Mobile "More" sheet */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent className="rounded-t-3xl px-4 pt-4 pb-8 md:hidden">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button
              onClick={() => setMoreOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              ...MONEY,
              ...AI,
              {
                href: "/dashboard/settings",
                label: "Settings",
                icon: Settings,
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors ${
                  isActive(item.href)
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/50 text-foreground hover:bg-muted/50"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs leading-tight font-medium">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
          {mounted && (
            <button
              onClick={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-border/50 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

function MobileTab({
  item,
  isActive,
}: {
  item: NavItem
  isActive: (href: string) => boolean
}) {
  const active = isActive(item.href)
  return (
    <Link
      href={item.href}
      className={`flex h-full flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <item.icon className="h-5 w-5" />
      <span className="whitespace-nowrap">{item.label}</span>
    </Link>
  )
}
