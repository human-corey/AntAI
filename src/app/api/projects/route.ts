import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schema } from "@/lib/db";
import { createProjectId } from "@/lib/utils/id";
import { createProjectSchema } from "@/lib/validation/projects";
import { desc } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { PROJECTS_BASE_DIR } from "@/lib/constants";

export async function GET() {
  const projects = db
    .select()
    .from(schema.projects)
    .orderBy(desc(schema.projects.updatedAt))
    .all();
  return NextResponse.json(projects);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
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

  const id = createProjectId();
  const now = new Date().toISOString();

  // Auto-create project directory if no workingDir provided
  let workingDir = parsed.data.workingDir?.trim();
  if (!workingDir) {
    const slug = slugify(parsed.data.name) || id;
    const projectDir = path.resolve(process.cwd(), PROJECTS_BASE_DIR, slug);
    fs.mkdirSync(projectDir, { recursive: true });
    workingDir = projectDir;
  }

  const project = {
    id,
    name: parsed.data.name,
    description: parsed.data.description,
    workingDir,
    status: "active" as const,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(schema.projects).values(project).run();
  return NextResponse.json(project, { status: 201 });
}
