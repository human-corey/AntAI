import { z } from "zod";

export const updateTaskSchema = z.object({
  subject: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "blocked", "failed"]).optional(),
  agentId: z.string().nullable().optional(),
  blockedBy: z.array(z.string()).optional(),
  blocks: z.array(z.string()).optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
