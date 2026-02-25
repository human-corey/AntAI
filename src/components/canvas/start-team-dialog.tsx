"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Play, Loader2 } from "lucide-react";
import { useCreateTeam, useStartTeam } from "@/lib/api/hooks";
import { createClientLogger } from "@/lib/client-logger";

const log = createClientLogger("StartTeam");

interface StartTeamDialogProps {
  projectId: string;
}

export function StartTeamDialog({ projectId }: StartTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [teamName, setTeamName] = useState("My Team");
  const [prompt, setPrompt] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "starting">("form");

  const createTeam = useCreateTeam(projectId);
  const startTeam = useStartTeam(projectId, teamId || "");

  const handleStart = async () => {
    if (!prompt.trim()) return;

    setStep("starting");
    log.info("Creating team", { name: teamName, projectId });

    try {
      // Step 1: Create team
      const team = await createTeam.mutateAsync({
        name: teamName,
        config: { members: [] },
      });
      log.info("Team created", { teamId: team.id });

      setTeamId(team.id);

      // Step 2: Start team with prompt
      // Need to use fetch directly since useStartTeam needs the teamId at hook level
      const res = await fetch(
        `/api/projects/${projectId}/teams/${team.id}/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompt.trim() }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed: ${res.status}`);
      }

      log.info("Team started", { teamId: team.id });

      // Reset and close
      setOpen(false);
      setTeamName("My Team");
      setPrompt("");
      setStep("form");
      setTeamId(null);
    } catch (err) {
      log.error("Failed to start team", { error: String(err) });
      setStep("form");
    }
  };

  const isLoading = step === "starting";

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setStep("form"); } }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Play className="h-3.5 w-3.5" />
          Start Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a New Team</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label htmlFor="team-name" className="text-sm font-medium">Team Name</label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="prompt" className="text-sm font-medium">Prompt</label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What should the team lead work on?"
              rows={4}
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStart}
              disabled={!prompt.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  Start
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
