"use client";

import { TemplateGallery } from "@/components/templates/template-gallery";
import { TemplateEditor } from "@/components/templates/template-editor";
import { TemplateImport } from "@/components/templates/template-import";

export default function TemplatesPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Templates</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Reusable team configurations for common workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TemplateImport />
          <TemplateEditor />
        </div>
      </div>
      <TemplateGallery />
    </div>
  );
}
