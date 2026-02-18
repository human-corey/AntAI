"use client";

import { useParams, useRouter } from "next/navigation";
import { useProject, useUpdateProject, useDeleteProject } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Separator } from "@/components/ui/separator";

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { data: project, isLoading } = useProject(projectId);
  const updateProject = useUpdateProject(projectId);
  const deleteProject = useDeleteProject(projectId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [workingDir, setWorkingDir] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
      setWorkingDir(project.workingDir);
    }
  }, [project]);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!project) return <div className="p-6">Project not found</div>;

  const handleSave = () => {
    updateProject.mutate({ name, description, workingDir });
  };

  const handleDelete = () => {
    deleteProject.mutate(undefined, {
      onSuccess: () => router.push("/projects"),
    });
  };

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-xl font-semibold mb-6">Project Settings</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Description</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Working Directory</label>
          <Input value={workingDir} onChange={(e) => setWorkingDir(e.target.value)} />
        </div>
        <Button onClick={handleSave} disabled={updateProject.isPending}>
          {updateProject.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Separator className="my-8" />

      <div className="space-y-3">
        <h3 className="text-lg font-medium text-[var(--destructive)]">Danger Zone</h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          Permanently delete this project and all its data.
        </p>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
          Delete Project
        </Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Project"
        description={`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
