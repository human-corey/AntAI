import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ projectId: string; teamId: string; agentId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { agentId } = await params;
  const body = await req.json();
  const { message } = body;
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const agent = db.select().from(schema.agents).where(eq(schema.agents.id, agentId)).get();
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  // Actual sending handled by ProcessManager in Phase 3
  return NextResponse.json({ ok: true, agentId, message });
}
