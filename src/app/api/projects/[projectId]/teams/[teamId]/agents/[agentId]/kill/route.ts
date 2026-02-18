import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ projectId: string; teamId: string; agentId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { agentId } = await params;
  const agent = db.select().from(schema.agents).where(eq(schema.agents.id, agentId)).get();
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  // Actual kill handled by ProcessManager in Phase 3
  db.update(schema.agents).set({ status: "stopped", stoppedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).where(eq(schema.agents.id, agentId)).run();
  return NextResponse.json({ ok: true, agentId });
}
