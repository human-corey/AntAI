"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Network, ListTodo, ScrollText, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const tabs = [
  { segment: "canvas", label: "Canvas", icon: Network },
  { segment: "tasks", label: "Tasks", icon: ListTodo },
  { segment: "logs", label: "Logs", icon: ScrollText },
  { segment: "settings", label: "Settings", icon: Settings },
];

export function ProjectTabs() {
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.projectId as string;
  const basePath = `/projects/${projectId}`;

  return (
    <div className="flex h-10 items-center gap-1 px-4">
      {tabs.map((tab) => {
        const href = `${basePath}/${tab.segment}`;
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={tab.segment}
            href={href}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-[var(--muted)] text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
