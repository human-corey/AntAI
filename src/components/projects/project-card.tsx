"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Users, GitBranch, Clock } from "lucide-react";
import type { Project } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils/cn";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.id}/canvas`}
      className={cn(
        "group flex h-48 flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all",
        "hover:border-[var(--primary)] hover:shadow-lg hover:shadow-[var(--glow)]"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-[var(--card-foreground)] group-hover:text-[var(--primary)] transition-colors truncate">
          {project.name}
        </h3>
        <StatusBadge status={project.status} />
      </div>

      {project.description && (
        <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mb-auto">
          {project.description}
        </p>
      )}

      {!project.description && <div className="mb-auto" />}

      <div className="flex items-center gap-4 text-[10px] text-[var(--muted-foreground)] mt-3 pt-3 border-t border-[var(--border)]">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </Link>
  );
}
