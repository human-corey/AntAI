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
import { Plus } from "lucide-react";

interface CreateProjectDialogProps {
  trigger?: React.ReactNode;
}

export function CreateProjectDialog({ trigger }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [workingDir, setWorkingDir] = useState(".");
  const createProject = useCreateProject();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createProject.mutate(
      { name: name.trim(), description: description.trim(), workingDir: workingDir.trim() },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setDescription("");
          setWorkingDir(".");
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
              Set up a new project to organize your agent teams.
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
            <div>
              <label className="text-sm font-medium mb-1.5 block">Working Directory</label>
              <Input
                value={workingDir}
                onChange={(e) => setWorkingDir(e.target.value)}
                placeholder="/path/to/project"
                required
              />
              <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                The directory where Claude CLI will run
              </p>
            </div>
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
