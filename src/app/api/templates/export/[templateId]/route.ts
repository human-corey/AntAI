import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ templateId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { templateId } = await params;
  const template = db.select().from(schema.templates).where(eq(schema.templates.id, templateId)).get();
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const exportData = {
    name: template.name,
    description: template.description,
    config: template.config,
    tags: template.tags,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${template.name.replace(/[^a-zA-Z0-9-_]/g, "_")}.json"`,
    },
  });
}
