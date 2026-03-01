import { create } from "zustand";

export const useBoardStore = create((set) => ({
  tool: "pencil",
  setTool: (tool) => set({ tool }),

  elements: [],
  history: [],
  redoStack: [],
  cursors: {},

  addElement: (el) =>
    set((state) => {
      const exists = state.elements.find((e) => e.id === el.id);
      if (exists) return state;

      return {
        elements: [...state.elements, el],
        history: [...state.history, el],
        redoStack: [],
      };
    }),

  removeById: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      history: state.history.filter((el) => el.id !== id),
    })),

  undo: () => {
    let removed = null;

    set((state) => {
      if (state.history.length === 0) return state;

      removed = state.history[state.history.length - 1];

      return {
        elements: state.elements.filter((el) => el.id !== removed.id),
        history: state.history.slice(0, -1),
        redoStack: [...state.redoStack, removed],
      };
    });

    return removed;
  },

  redo: () => {
    let restored = null;

    set((state) => {
      if (state.redoStack.length === 0) return state;

      restored = state.redoStack[state.redoStack.length - 1];

      return {
        elements: [...state.elements, restored],
        history: [...state.history, restored],
        redoStack: state.redoStack.slice(0, -1),
      };
    });

    return restored;
  },

  updateCursor: (id, pos) =>
    set((state) => ({
      cursors: { ...state.cursors, [id]: pos },
    })),
}));