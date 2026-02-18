"use client";

import { useTemplates, useDeleteTemplate } from "@/lib/api/hooks";
import { TemplateCard } from "./template-card";
import { TemplateImport } from "./template-import";
import { EmptyState } from "@/components/shared/empty-state";
import { GridSkeleton } from "@/components/shared/loading-skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Layers } from "lucide-react";
import { useState } from "react";

export function TemplateGallery() {
  const { data: templates, isLoading } = useTemplates();
  const { mutate: deleteTemplate } = useDeleteTemplate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleExport = async (templateId: string) => {
    try {
      const res = await fetch(`/api/templates/export/${templateId}`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.name || "template"}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silently fail
    }
  };

  if (isLoading) return <GridSkeleton count={6} />;

  if (!templates || templates.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="No templates yet"
        description="Import a template or save a running team as a template."
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            onUse={() => {/* TODO: navigate to create team with template */}}
            onExport={() => handleExport(t.id)}
            onDelete={() => setDeleteId(t.id)}
          />
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Template"
        description="This template will be permanently deleted."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) {
            deleteTemplate(deleteId);
            setDeleteId(null);
          }
        }}
      />
    </>
  );
}
