"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/overview", label: "Overview" },
  { href: "/risk-events", label: "Risk Events" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/supply-chain", label: "Supply Chain" },
  { href: "/alerts", label: "Alerts" },
  { href: "/incidents", label: "Incidents" },
  { href: "/analytics", label: "Analytics" },
  { href: "/reports", label: "Reports" },
] as const;

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/40 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Resilinc Lite</p>
          <h1 className="text-base font-semibold text-slate-900">Mac Risk Operations Console</h1>
        </div>
        <nav className="mac-surface flex flex-wrap items-center gap-2 rounded-2xl p-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-700 hover:bg-white/80",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/logout"
            className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
          >
            Sign out
          </Link>
        </nav>
      </div>
    </header>
  );
}
