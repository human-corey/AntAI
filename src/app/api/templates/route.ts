import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { createTemplateId } from "@/lib/utils/id";
import { createTemplateSchema } from "@/lib/validation/templates";

export async function GET() {
  const templates = db.select().from(schema.templates).orderBy(desc(schema.templates.updatedAt)).all();
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date().toISOString();
  const template = {
    id: createTemplateId(),
    name: parsed.data.name,
    description: parsed.data.description,
    config: parsed.data.config,
    tags: parsed.data.tags,
    isBuiltIn: false,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(schema.templates).values(template).run();
  return NextResponse.json(template, { status: 201 });
}
