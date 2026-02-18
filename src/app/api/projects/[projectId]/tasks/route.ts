import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const tasks = db.select().from(schema.tasks).where(eq(schema.tasks.projectId, projectId)).orderBy(desc(schema.tasks.createdAt)).all();
  return NextResponse.json(tasks);
}
