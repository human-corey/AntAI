"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateProject } from "@/lib/api/hooks";
import { Plus, FolderOpen } from "lucide-react";

interface CreateProjectDialogProps {
  trigger?: React.ReactNode;
}

export function CreateProjectDialog({ trigger }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createProject = useCreateProject();

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createProject.mutate(
      { name: name.trim(), description: description.trim(), workingDir: "" },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setDescription("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="group flex h-48 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--border)] bg-transparent hover:border-[var(--primary)] hover:bg-[var(--card)] transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)] group-hover:bg-[var(--primary)] transition-colors">
              <Plus className="h-6 w-6 text-[var(--muted-foreground)] group-hover:text-[var(--primary-foreground)] transition-colors" />
            </div>
            <span className="text-sm font-medium text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
              Create New Project
            </span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              A dedicated directory will be created for this project where teams can store artifacts and code.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Project"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
              />
            </div>
            {slug && (
              <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
                <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate font-mono">data/projects/{slug}/</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProject.isPending || !name.trim()}>
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
