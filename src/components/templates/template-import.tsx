"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileJson } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function TemplateImport() {
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setImporting(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/templates/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (!res.ok) throw new Error("Import failed");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to import template");
    } finally {
      setImporting(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".json")) {
        handleFile(file);
      } else {
        setError("Please drop a .json file");
      }
    },
    [handleFile]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="h-3.5 w-3.5" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Import Template</DialogTitle>
        </DialogHeader>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging
              ? "border-[var(--primary)] bg-[var(--primary)]/5"
              : "border-[var(--border)]"
          )}
        >
          <FileJson className="h-8 w-8 mx-auto mb-3 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)] mb-3">
            Drag & drop a template JSON file, or
          </p>
          <label>
            <Button variant="outline" size="sm" disabled={importing} asChild>
              <span>{importing ? "Importing..." : "Browse Files"}</span>
            </Button>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
          {error && <p className="text-xs text-[var(--status-error)] mt-3">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
