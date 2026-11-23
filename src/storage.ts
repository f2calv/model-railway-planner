import { emptyState, parseState } from './state';
import type { PlannerState } from './model';

export const storageKey = 'model-railway-planner.v1';
export type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;

export function loadState(storage: StoragePort, newId: string): PlannerState {
  const json = storage.getItem(storageKey);
  return json === null ? emptyState(newId) : parseState(json);
}

export function saveState(storage: StoragePort, state: PlannerState): void {
  const json = JSON.stringify(state);
  parseState(json);
  storage.setItem(storageKey, json);
}
