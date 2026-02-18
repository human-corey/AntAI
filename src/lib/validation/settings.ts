import { z } from "zod";

export const updateSettingsSchema = z.object({
  theme: z.enum(["dark", "light", "system"]).optional(),
  claudeCliPath: z.string().nullable().optional(),
  defaultModel: z.string().optional(),
  enableThinking: z.boolean().optional(),
  autoLayout: z.boolean().optional(),
  showMinimap: z.boolean().optional(),
  edgeAnimations: z.boolean().optional(),
  notificationSounds: z.boolean().optional(),
  logRetentionDays: z.number().int().min(1).max(365).optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
