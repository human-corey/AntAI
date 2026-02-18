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

export const createTeamSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).default(""),
  config: teamConfigSchema.default({ members: [] }),
  templateId: z.string().optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  config: teamConfigSchema.optional(),
  status: z.enum(["idle", "starting", "running", "stopping", "stopped", "error"]).optional(),
});

export const startTeamSchema = z.object({
  prompt: z.string().min(1, "Initial prompt is required"),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type StartTeamInput = z.infer<typeof startTeamSchema>;
