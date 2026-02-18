"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Settings,
  BookTemplate,
  Bug,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/projects", label: "Projects", icon: LayoutGrid },
  { href: "/templates", label: "Templates", icon: BookTemplate },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-[var(--border)] bg-[var(--card)] transition-all duration-200",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-[var(--border)] px-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-sm shrink-0">
          A
        </div>
        {!collapsed && (
          <span className="font-semibold text-lg tracking-tight">AntAI</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              )}
              title={item.label}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--border)] p-2 space-y-1">
        <div className="flex items-center justify-between px-1">
          <ThemeToggle />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-[var(--muted)] transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-[var(--muted-foreground)]" />
            )}
          </button>
        </div>
        {!collapsed && (
          <div className="px-3 py-1">
            <p className="text-[10px] text-[var(--muted-foreground)]">
              AntAI v0.1.0
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
