import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { createTemplateId } from "@/lib/utils/id";
import { importTemplateSchema } from "@/lib/validation/templates";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = importTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid template format", details: parsed.error.flatten() }, { status: 400 });
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
