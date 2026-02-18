type TerminalListener = (data: string) => void;

const listeners = new Map<string, Set<TerminalListener>>();

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
      },

      removeListener(agentId: string, cb: TerminalListener) {
        const set = listeners.get(agentId);
        if (set) {
          set.delete(cb);
          if (set.size === 0) listeners.delete(agentId);
        }
      },

      dispatch(agentId: string, data: string) {
        const set = listeners.get(agentId);
        if (set) {
          for (const cb of set) cb(data);
        }
      },
    };
  },
};
