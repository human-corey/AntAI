"use client";

import type { Template } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Download, Trash2 } from "lucide-react";

interface TemplateCardProps {
  template: Template;
  onUse?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
}

export function TemplateCard({ template, onUse, onExport, onDelete }: TemplateCardProps) {
  const config = template.config as { members?: { name: string; role: string }[] };
  const memberCount = config?.members?.length ?? 0;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--primary)]/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium">{template.name}</h3>
          {template.description && (
            <p className="text-xs text-[var(--muted-foreground)] mt-1">{template.description}</p>
          )}
        </div>
        {template.isBuiltIn && (
          <Badge variant="secondary" className="text-[10px]">
            Built-in
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        <Bot className="h-3 w-3 text-[var(--muted-foreground)]" />
        <span className="text-xs text-[var(--muted-foreground)]">
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </span>
      </div>

      {config?.members && config.members.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {config.members.slice(0, 4).map((m, i) => (
            <Badge key={i} variant="outline" className="text-[10px]">
              {m.role || m.name}
            </Badge>
          ))}
          {config.members.length > 4 && (
            <Badge variant="outline" className="text-[10px]">
              +{config.members.length - 4}
            </Badge>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {onUse && (
          <Button size="sm" className="h-7 text-xs flex-1" onClick={onUse}>
            Use Template
          </Button>
        )}
        {onExport && (
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={onExport}>
            <Download className="h-3 w-3" />
          </Button>
        )}
        {onDelete && !template.isBuiltIn && (
          <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-[var(--status-error)]" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
