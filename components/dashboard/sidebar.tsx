"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
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
} from "lucide-react";
import { useState, useEffect } from "react";
import { QuickAddDrawer } from "@/components/dashboard/quick-add-drawer";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const PRIMARY: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transactions", icon: List },
];

const MONEY: NavItem[] = [
  { href: "/dashboard/accounts", label: "Accounts & Cards", icon: CreditCard },
  { href: "/dashboard/loans", label: "EMIs & Loans", icon: Landmark },
  { href: "/dashboard/owed", label: "Money Owed", icon: Users },
  { href: "/dashboard/budget", label: "Budget", icon: PiggyBank },
];

const AI: NavItem[] = [
  { href: "/dashboard/insights", label: "Insights", icon: Sparkles },
  { href: "/dashboard/ask-ai", label: "Ask AI", icon: MessageSquare },
];

const ALL = [...PRIMARY, ...MONEY, ...AI];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);
}

export function DashboardNavigation() {
  const isActive = useIsActive();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);
  useEffect(() => setMoreOpen(false), [pathname]);

  const renderLink = (item: NavItem, expandLabel = true) => (
    <Link
      key={item.href}
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full ${
        isActive(item.href)
          ? "bg-primary/15 text-primary shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      <span
        className={
          expandLabel
            ? "opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap"
            : "whitespace-nowrap"
        }
      >
        {item.label}
      </span>
    </Link>
  );

  return (
    <>
      {/* ── Desktop Sidebar (Hover Expand) ── */}
      <aside className="hidden md:flex md:fixed md:top-0 md:left-0 md:h-screen group w-16 hover:w-64 transition-[width] duration-300 ease-in-out shrink-0 flex-col border-r border-border/40 bg-background/95 backdrop-blur-xl z-50 overflow-hidden shadow-[2px_0_15px_-3px_rgba(0,0,0,0.1)]">
        <div className="h-16 flex items-center px-4 border-b border-border/40 w-64 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm">₹</span>
            </div>
            <span className="font-bold text-xl tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Kharcha
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden w-64">
          {PRIMARY.map((i) => renderLink(i))}

          {/* Add (center action) */}
          <QuickAddDrawer triggerShortcut>
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-200 text-primary hover:bg-primary/10">
              <PlusCircle className="h-5 w-5 shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                Add transaction
              </span>
            </button>
          </QuickAddDrawer>

          <div className="my-2 border-t border-border/40 mx-3" />
          {MONEY.map((i) => renderLink(i))}
          <div className="my-2 border-t border-border/40 mx-3" />
          {AI.map((i) => renderLink(i))}
        </nav>

        <div className="flex flex-col gap-1 p-2 border-t border-border/40 w-64 shrink-0">
          {renderLink({ href: "/dashboard/settings", label: "Settings", icon: Settings })}
          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5 shrink-0" />
              ) : (
                <Moon className="h-5 w-5 shrink-0" />
              )}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
              </span>
            </button>
          )}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
            <div className="shrink-0">
              <UserButton />
            </div>
            <span className="text-sm font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Account
            </span>
          </div>
        </div>
      </aside>

      {/* Spacer for desktop since sidebar is fixed */}
      <div className="hidden md:block w-16 shrink-0" />

      {/* ── Mobile Bottom Tab Bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur-md pb-safe">
        <nav className="flex items-center justify-around h-16">
          <MobileTab item={PRIMARY[0]} isActive={isActive} />
          <MobileTab item={PRIMARY[1]} isActive={isActive} />

          {/* Center Add */}
          <QuickAddDrawer>
            <button className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-medium">
              <div className="w-12 h-12 -mt-6 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_-3px_var(--primary)] ring-4 ring-background">
                <PlusCircle className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="mt-0.5">Add</span>
            </button>
          </QuickAddDrawer>

          <MobileTab item={MONEY[3]} isActive={isActive} />

          {/* More */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        </nav>
      </div>

      {/* Mobile "More" sheet */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent className="px-4 pb-8 pt-4 rounded-t-3xl md:hidden">
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-4" />
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button
              onClick={() => setMoreOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {[...MONEY, ...AI, { href: "/dashboard/settings", label: "Settings", icon: Settings }].map(
              (item) => (
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
                  <span className="text-xs font-medium leading-tight">
                    {item.label}
                  </span>
                </Link>
              )
            )}
          </div>
          {mounted && (
            <button
              onClick={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
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
  );
}

function MobileTab({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: (href: string) => boolean;
}) {
  const active = isActive(item.href);
  return (
    <Link
      href={item.href}
      className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-medium transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <item.icon className="h-5 w-5" />
      <span className="whitespace-nowrap">{item.label}</span>
    </Link>
  );
}
