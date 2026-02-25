import { create } from "zustand";
import type { TranscriptEntry } from "@/lib/claude/types";
import { MAX_TRANSCRIPT_ENTRIES } from "@/lib/constants";

interface TranscriptState {
  entries: Record<string, TranscriptEntry[]>;
  addEntry: (agentId: string, entry: TranscriptEntry) => void;
  removeEntry: (agentId: string, entryId: string) => void;
  clearEntries: (agentId: string) => void;
  seedEntries: (agentId: string, entries: TranscriptEntry[]) => void;
}

export const useTranscriptStore = create<TranscriptState>((set) => ({
  entries: {},

  addEntry: (agentId, entry) =>
    set((s) => {
      const current = s.entries[agentId] || [];
      // Upsert: if entry with same ID exists, replace it in-place (for streaming deltas)
      const existingIdx = current.findIndex((e) => e.id === entry.id);
      if (existingIdx >= 0) {
        const updated = [...current];
        updated[existingIdx] = entry;
        return { entries: { ...s.entries, [agentId]: updated } };
      }
      // Otherwise append with cap
      const updated =
        current.length >= MAX_TRANSCRIPT_ENTRIES
          ? [...current.slice(current.length - MAX_TRANSCRIPT_ENTRIES + 1), entry]
          : [...current, entry];
      return { entries: { ...s.entries, [agentId]: updated } };
    }),

  removeEntry: (agentId, entryId) =>
    set((s) => {
      const current = s.entries[agentId];
      if (!current) return s;
      return { entries: { ...s.entries, [agentId]: current.filter((e) => e.id !== entryId) } };
    }),

  clearEntries: (agentId) =>
    set((s) => ({
      entries: { ...s.entries, [agentId]: [] },
    })),

  seedEntries: (agentId, newEntries) =>
    set((s) => {
      // Only seed if the store has no entries yet for this agent
      const current = s.entries[agentId];
      if (current && current.length > 0) return s;
      return { entries: { ...s.entries, [agentId]: newEntries } };
    }),
}));
