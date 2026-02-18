import { z } from "zod";

const teamMemberConfigSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
});

const teamConfigSchema = z.object({
  leadModel: z.string().optional(),
  leadSystemPrompt: z.string().optional(),
  members: z.array(teamMemberConfigSchema).default([]),
  initialTasks: z.array(z.string()).optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).default(""),
  config: teamConfigSchema,
  tags: z.array(z.string()).default([]),
});

export const importTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(""),
  config: teamConfigSchema,
  tags: z.array(z.string()).default([]),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type ImportTemplateInput = z.infer<typeof importTemplateSchema>;
