"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTemplate } from "@/lib/api/hooks";
import { Plus, Trash2 } from "lucide-react";

interface MemberDraft {
  name: string;
  role: string;
  model: string;
}

export function TemplateEditor() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<MemberDraft[]>([
    { name: "", role: "", model: "claude-sonnet-4-6" },
  ]);

  const { mutate: createTemplate, isPending } = useCreateTemplate();

  const addMember = () => {
    setMembers([...members, { name: "", role: "", model: "claude-sonnet-4-6" }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof MemberDraft, value: string) => {
    setMembers(members.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createTemplate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        config: {
          members: members.filter((m) => m.name.trim()).map((m) => ({
            name: m.name.trim(),
            role: m.role.trim() || m.name.trim(),
            model: m.model,
          })),
          tasks: [],
        },
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setDescription("");
          setMembers([{ name: "", role: "", model: "claude-sonnet-4-6" }]);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          New Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Members</label>
              <Button type="button" variant="outline" size="sm" onClick={addMember} className="h-7 gap-1 text-xs">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            {members.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={m.name}
                  onChange={(e) => updateMember(i, "name", e.target.value)}
                  placeholder="Name"
                  className="flex-1"
                />
                <Input
                  value={m.role}
                  onChange={(e) => updateMember(i, "role", e.target.value)}
                  placeholder="Role"
                  className="flex-1"
                />
                <Select value={m.model} onValueChange={(v) => updateMember(i, "model", v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-sonnet-4-6">Sonnet 4.6</SelectItem>
                    <SelectItem value="claude-opus-4-6">Opus 4.6</SelectItem>
                    <SelectItem value="claude-haiku-4-5-20251001">Haiku 4.5</SelectItem>
                  </SelectContent>
                </Select>
                {members.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeMember(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
