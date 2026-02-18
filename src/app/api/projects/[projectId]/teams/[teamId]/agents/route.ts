import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ projectId: string; teamId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { teamId } = await params;
  const agents = db.select().from(schema.agents).where(eq(schema.agents.teamId, teamId)).all();
  return NextResponse.json(agents);
}
