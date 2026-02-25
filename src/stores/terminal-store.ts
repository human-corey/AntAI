type TerminalListener = (data: string) => void;

const MAX_BUFFER_SIZE = 256 * 1024; // 256KB per agent

const listeners = new Map<string, Set<TerminalListener>>();
/** Buffers terminal data so it can be replayed when a listener registers late (e.g. tab switch). */
const buffers = new Map<string, string[]>();
const bufferSizes = new Map<string, number>();

export const useTerminalStore = {
  getState() {
    return {
      addListener(agentId: string, cb: TerminalListener) {
        let set = listeners.get(agentId);
        if (!set) {
          set = new Set();
          listeners.set(agentId, set);
        }
        set.add(cb);

        // Replay buffered data to the new listener
        const buffer = buffers.get(agentId);
        if (buffer && buffer.length > 0) {
          const replay = buffer.join("");
          cb(replay);
        }
      },

      removeListener(agentId: string, cb: TerminalListener) {
        const set = listeners.get(agentId);
        if (set) {
          set.delete(cb);
          if (set.size === 0) listeners.delete(agentId);
        }
      },

      dispatch(agentId: string, data: string) {
        // Buffer the data
        let buffer = buffers.get(agentId);
        if (!buffer) {
          buffer = [];
          buffers.set(agentId, buffer);
          bufferSizes.set(agentId, 0);
        }
        buffer.push(data);
        const newSize = (bufferSizes.get(agentId) || 0) + data.length;
        bufferSizes.set(agentId, newSize);

        // Trim buffer if too large (drop oldest chunks)
        while (newSize > MAX_BUFFER_SIZE && buffer.length > 1) {
          const removed = buffer.shift()!;
          bufferSizes.set(agentId, (bufferSizes.get(agentId) || 0) - removed.length);
        }

        // Dispatch to live listeners
        const set = listeners.get(agentId);
        if (set) {
          for (const cb of set) cb(data);
        }
      },

      clearBuffer(agentId: string) {
        buffers.delete(agentId);
        bufferSizes.delete(agentId);
      },
    };
  },
};
