import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "100", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  const logs = db.select().from(schema.logEntries).where(eq(schema.logEntries.projectId, projectId)).orderBy(desc(schema.logEntries.createdAt)).limit(limit).offset(offset).all();
  return NextResponse.json(logs);
}
