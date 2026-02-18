import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schema } from "@/lib/db";
import { createProjectId } from "@/lib/utils/id";
import { createProjectSchema } from "@/lib/validation/projects";
import { desc } from "drizzle-orm";

export async function GET() {
  const projects = db
    .select()
    .from(schema.projects)
    .orderBy(desc(schema.projects.updatedAt))
    .all();
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const project = {
    id: createProjectId(),
    name: parsed.data.name,
    description: parsed.data.description,
    workingDir: parsed.data.workingDir,
    status: "active" as const,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(schema.projects).values(project).run();
  return NextResponse.json(project, { status: 201 });
}
