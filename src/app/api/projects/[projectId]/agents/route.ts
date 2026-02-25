import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;

  const teams = db.select({ id: schema.teams.id }).from(schema.teams).where(eq(schema.teams.projectId, projectId)).all();
  if (teams.length === 0) {
    return NextResponse.json([]);
  }

  const teamIds = teams.map((t) => t.id);
  const agents = db.select().from(schema.agents).where(inArray(schema.agents.teamId, teamIds)).all();

  return NextResponse.json(agents);
}
