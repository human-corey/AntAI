import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { updateSettingsSchema } from "@/lib/validation/settings";
import type { AppSettings } from "@/lib/types";

const defaultSettings: AppSettings = {
  theme: "dark",
  defaultModel: "claude-sonnet-4-6",
  enableThinking: true,
  autoLayout: true,
  showMinimap: true,
  edgeAnimations: true,
  notificationSounds: false,
  logRetentionDays: 30,
};

function getSettings(): AppSettings {
  const rows = db.select().from(schema.settings).all();
  const settings = { ...defaultSettings };
  for (const row of rows) {
    if (row.key in settings) {
      (settings as Record<string, unknown>)[row.key] = row.value;
    }
  }
  return settings;
}

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date().toISOString();
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      const existing = db.select().from(schema.settings).where(eq(schema.settings.key, key)).get();
      if (existing) {
        db.update(schema.settings).set({ value: value as unknown, updatedAt: now }).where(eq(schema.settings.key, key)).run();
      } else {
        db.insert(schema.settings).values({ key, value: value as unknown, updatedAt: now }).run();
      }
    }
  }

  return NextResponse.json(getSettings());
}
