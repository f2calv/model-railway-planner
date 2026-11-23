import type { PlannerState } from './model';

export interface Activity {
  at: Date;
  message: string;
}

export function recordActivity(entries: readonly Activity[], entry: Activity): readonly Activity[] {
  return [...entries, entry].slice(-300);
}

export interface History {
  current: PlannerState;
  past: readonly PlannerState[];
  future: readonly PlannerState[];
}

export function createHistory(current: PlannerState): History {
  return { current, past: [], future: [] };
}

export function recordHistory(history: History, next: PlannerState): History {
  if (JSON.stringify(history.current) === JSON.stringify(next)) return history;
  return {
    current: next,
    past: [...history.past, history.current].slice(-100),
    future: [],
  };
}

export function undoHistory(history: History): History {
  const previous = history.past.at(-1);
  if (!previous) throw new Error('Nothing to undo.');
  return {
    current: previous,
    past: history.past.slice(0, -1),
    future: [history.current, ...history.future],
  };
}

export function redoHistory(history: History): History {
  const next = history.future[0];
  if (!next) throw new Error('Nothing to redo.');
  return {
    current: next,
    past: [...history.past, history.current].slice(-100),
    future: history.future.slice(1),
  };
}
