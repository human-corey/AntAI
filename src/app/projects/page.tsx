"use client";

import { ProjectGrid } from "@/components/projects/project-grid";

export default function ProjectsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Manage your Claude Code agent teams
        </p>
      </div>
      <ProjectGrid />
    </div>
  );
}
