"use client";

import { useProjects } from "@/lib/api/hooks";
import { ProjectCard } from "./project-card";
import { CreateProjectDialog } from "./create-project-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { GridSkeleton } from "@/components/shared/loading-skeleton";
import { LayoutGrid } from "lucide-react";

export function ProjectGrid() {
  const { data: projects, isLoading, error } = useProjects();

  if (isLoading) return <GridSkeleton count={4} />;
  if (error) return <div className="text-[var(--destructive)]">Failed to load projects</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <CreateProjectDialog />

      {projects?.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}

      {projects?.length === 0 && (
        <div className="col-span-full">
          <EmptyState
            icon={LayoutGrid}
            title="No projects yet"
            description="Create your first project to start orchestrating Claude Code agent teams with a visual canvas."
          />
        </div>
      )}
    </div>
  );
}
