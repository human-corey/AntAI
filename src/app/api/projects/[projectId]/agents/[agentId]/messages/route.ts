import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, or, asc } from "drizzle-orm";
import type { TranscriptEntry } from "@/lib/claude/types";

type Params = { params: Promise<{ projectId: string; agentId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { agentId } = await params;

  // Fetch messages where this agent sent or received them
  const rows = db
    .select()
    .from(schema.messages)
    .where(
      or(
        eq(schema.messages.fromAgentId, agentId),
        eq(schema.messages.toAgentId, agentId)
      )
    )
    .orderBy(asc(schema.messages.createdAt))
    .all();

  // Convert DB rows to TranscriptEntry format for the transcript store
  const entries: TranscriptEntry[] = rows.map((row) => ({
    id: row.id,
    timestamp: row.createdAt,
    type: row.type === "user" ? "user_message"
      : row.type === "tool_use" ? "tool_use"
      : row.type === "tool_result" ? "tool_result"
      : "message",
    content: row.content,
  }));

  return NextResponse.json(entries);
}
