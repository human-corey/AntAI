"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useStartTeam, useStopTeam } from "@/lib/api/hooks";
import { Play, Square } from "lucide-react";

interface StartTeamButtonProps {
  projectId: string;
  teamId: string;
  status: string;
}

export function StartTeamButton({ projectId, teamId, status }: StartTeamButtonProps) {
  const [promptOpen, setPromptOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  const { mutate: startTeam, isPending: isStarting } = useStartTeam(projectId, teamId);
  const { mutate: stopTeam, isPending: isStopping } = useStopTeam(projectId, teamId);

  const isRunning = status === "running" || status === "starting";

  const handleStart = () => {
    if (!prompt.trim()) return;
    startTeam(
      { prompt: prompt.trim() },
      {
        onSuccess: () => {
          setPromptOpen(false);
          setPrompt("");
        },
      }
    );
  };

  if (isRunning) {
    return (
      <Button
        size="sm"
        variant="destructive"
        onClick={() => stopTeam({})}
        disabled={isStopping}
        className="gap-1.5"
      >
        <Square className="h-3.5 w-3.5" />
        {isStopping ? "Stopping..." : "Stop Team"}
      </Button>
    );
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setPromptOpen(true)}
        disabled={isStarting}
        className="gap-1.5"
      >
        <Play className="h-3.5 w-3.5" />
        Start Team
      </Button>

      <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Start Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt</label>
              <Textarea
                value={prompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                placeholder="What should this team work on?"
                rows={4}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPromptOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStart} disabled={isStarting || !prompt.trim()}>
                {isStarting ? "Starting..." : "Start"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
