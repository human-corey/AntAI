import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { createTeamId } from "@/lib/utils/id";
import { createTeamSchema } from "@/lib/validation/teams";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const teams = db.select().from(schema.teams).where(eq(schema.teams.projectId, projectId)).orderBy(desc(schema.teams.updatedAt)).all();
  return NextResponse.json(teams);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const body = await req.json();
  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  // If templateId, load template config
  let config = parsed.data.config;
  if (parsed.data.templateId) {
    const template = db.select().from(schema.templates).where(eq(schema.templates.id, parsed.data.templateId)).get();
    if (template) {
      config = template.config;
    }
  }

  const now = new Date().toISOString();
  const team = {
    id: createTeamId(),
    projectId,
    name: parsed.data.name,
    description: parsed.data.description,
    status: "idle" as const,
    config,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(schema.teams).values(team).run();
  return NextResponse.json(team, { status: 201 });
}
