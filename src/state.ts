import { catalog, definition } from './catalog';
import { joinedBoards, placementProblem } from './geometry';
import type { Layout, Piece, PlannerState } from './model';

export function emptyState(id: string): PlannerState {
  return {
    version: 2,
    inventory: Object.fromEntries(catalog.map((track) => [track.id, 0])),
    layouts: [{ id, name: 'My first layout', pieces: [], boards: [] }],
    activeLayoutId: id,
  };
}

export function activeLayout(state: PlannerState): Layout {
  const layout = state.layouts.find((entry) => entry.id === state.activeLayoutId);
  if (!layout) throw new Error('Active layout does not exist.');
  return layout;
}

export function used(layout: Layout, trackId: string): number {
  return layout.pieces.filter((piece) => piece.trackId === trackId).length;
}

export function available(state: PlannerState, trackId: string): number {
  return Math.max(0, (state.inventory[trackId] ?? 0) - used(activeLayout(state), trackId));
}

export function shoppingList(state: PlannerState): { trackId: string; quantity: number }[] {
  const layout = activeLayout(state);
  return catalog.flatMap((track) => {
    const quantity = used(layout, track.id) - (state.inventory[track.id] ?? 0);
    return quantity > 0 ? [{ trackId: track.id, quantity }] : [];
  });
}

export function missingPieceIds(state: PlannerState): Set<string> {
  const usedCounts = new Map<string, number>();
  return new Set(
    activeLayout(state).pieces.flatMap((piece) => {
      const count = (usedCounts.get(piece.trackId) ?? 0) + 1;
      usedCounts.set(piece.trackId, count);
      return count > (state.inventory[piece.trackId] ?? 0) ? [piece.id] : [];
    }),
  );
}

export function putPiece(state: PlannerState, piece: Piece): PlannerState {
  return putPieces(state, [piece]);
}

export function putPieces(state: PlannerState, pieces: readonly Piece[]): PlannerState {
  if (!pieces.length || new Set(pieces.map((piece) => piece.id)).size !== pieces.length)
    throw new Error('Provide one or more pieces with unique identifiers.');
  const layout = activeLayout(state);
  const replacements = new Map(pieces.map((piece) => [piece.id, piece]));
  for (const piece of pieces) {
    definition(piece.trackId);
    if (![piece.x, piece.y, piece.angle].every(Number.isFinite))
      throw new Error('Position must be finite.');
    const existing = layout.pieces.find((entry) => entry.id === piece.id);
    if (existing && existing.trackId !== piece.trackId)
      throw new Error('Cannot change the type of an existing piece.');
    if (
      existing?.locked &&
      (existing.x !== piece.x ||
        existing.y !== piece.y ||
        existing.angle !== piece.angle ||
        existing.flipped !== piece.flipped ||
        existing.locked !== piece.locked)
    )
      throw new Error('Unlock the selected pieces before moving or deleting them.');
  }
  const next = {
    ...layout,
    pieces: [
      ...layout.pieces.map((entry) => replacements.get(entry.id) ?? entry),
      ...pieces.filter((piece) => !layout.pieces.some((entry) => entry.id === piece.id)),
    ],
  };
  for (const piece of pieces) {
    const problem = placementProblem(
      piece,
      next.pieces.filter((entry) => entry.id !== piece.id),
      next.boards,
    );
    if (problem) throw new Error(problem.message);
  }
  return updateLayout(state, next);
}

function selection(state: PlannerState, ids: readonly string[]): Piece[] {
  const selectedIds = new Set(ids);
  if (!ids.length || selectedIds.size !== ids.length)
    throw new Error('Select one or more distinct pieces.');
  const pieces = activeLayout(state).pieces.filter((piece) => selectedIds.has(piece.id));
  if (pieces.length !== ids.length) throw new Error('Some selected pieces no longer exist.');
  return pieces;
}

export function transformPieces(
  state: PlannerState,
  ids: readonly string[],
  transform: (piece: Piece) => Piece,
): PlannerState {
  const pieces = selection(state, ids);
  if (pieces.some((piece) => piece.locked))
    throw new Error('Unlock the selected pieces before moving or deleting them.');
  return putPieces(
    state,
    pieces.map((piece) => {
      const next = transform(piece);
      if (next.id !== piece.id) throw new Error('Cannot change a piece identifier.');
      return next;
    }),
  );
}

export function removePieces(state: PlannerState, ids: readonly string[]): PlannerState {
  const pieces = selection(state, ids);
  if (pieces.some((piece) => piece.locked))
    throw new Error('Unlock the selected pieces before moving or deleting them.');
  const selectedIds = new Set(ids);
  const layout = activeLayout(state);
  return updateLayout(state, {
    ...layout,
    pieces: layout.pieces.filter((piece) => !selectedIds.has(piece.id)),
  });
}

export function setPieceLocks(
  state: PlannerState,
  ids: readonly string[],
  locked: boolean,
): PlannerState {
  selection(state, ids);
  const selectedIds = new Set(ids);
  const layout = activeLayout(state);
  return updateLayout(state, {
    ...layout,
    pieces: layout.pieces.map((piece) =>
      selectedIds.has(piece.id) ? { ...piece, locked } : piece,
    ),
  });
}

export function resetInventory(state: PlannerState): PlannerState {
  return { ...state, inventory: Object.fromEntries(catalog.map((track) => [track.id, 0])) };
}

export function updateLayout(state: PlannerState, layout: Layout): PlannerState {
  return {
    ...state,
    layouts: state.layouts.map((entry) => (entry.id === layout.id ? layout : entry)),
  };
}

export function setInventory(state: PlannerState, id: string, quantity: number): PlannerState {
  definition(id);
  if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 9999)
    throw new Error('Inventory must be a whole number between 0 and 9999.');
  return { ...state, inventory: { ...state.inventory, [id]: quantity } };
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error('Invalid planner backup structure.');
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 120)
    throw new Error('Invalid or excessively long name/identifier.');
  return value;
}

function number(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 1e7)
    throw new Error('Invalid numeric value in backup.');
  return value;
}

export function parseState(json: string): PlannerState {
  if (json.length > 4_000_000) throw new Error('Backup exceeds the 4 MB import limit.');
  const data = record(JSON.parse(json));
  if (data['version'] !== 1 && data['version'] !== 2)
    throw new Error('Unsupported backup version. Your original data has not been changed.');
  const rawInventory = record(data['inventory']);
  const inventory: Record<string, number> = {};
  for (const [id, value] of Object.entries(rawInventory)) {
    definition(id);
    const n = number(value);
    if (!Number.isSafeInteger(n) || n < 0 || n > 9999)
      throw new Error('Invalid inventory in backup.');
    inventory[id] = n;
  }
  const rawLayouts = data['layouts'];
  if (!Array.isArray(rawLayouts) || !rawLayouts.length || rawLayouts.length > 100)
    throw new Error('Backup must contain between 1 and 100 layouts.');
  const layouts = rawLayouts.map((value): Layout => {
    const raw = record(value);
    const rawPieces = raw['pieces'];
    const rawBoards = raw['boards'];
    if (
      !Array.isArray(rawPieces) ||
      rawPieces.length > 2000 ||
      !Array.isArray(rawBoards) ||
      rawBoards.length > 50
    )
      throw new Error('Invalid or excessively large layout.');
    const pieces = rawPieces.map((value): Piece => {
      const p = record(value);
      const trackId = text(p['trackId']);
      definition(trackId);
      if (typeof p['flipped'] !== 'boolean') throw new Error('Invalid track orientation.');
      if (p['locked'] !== undefined && typeof p['locked'] !== 'boolean')
        throw new Error('Invalid piece lock in backup.');
      return {
        id: text(p['id']),
        trackId,
        x: number(p['x']),
        y: number(p['y']),
        angle: number(p['angle']),
        flipped: p['flipped'],
        ...(typeof p['locked'] === 'boolean' ? { locked: p['locked'] } : {}),
      };
    });
    if (new Set(pieces.map((p) => p.id)).size !== pieces.length)
      throw new Error('Duplicate piece identifiers.');
    const boards = rawBoards.map((value) => {
      const b = record(value);
      const width = number(b['width']);
      const height = number(b['height']);
      if (width <= 0 || height <= 0) throw new Error('Baseboard dimensions must be positive.');
      return { x: number(b['x']), y: number(b['y']), width, height };
    });
    if (!joinedBoards(boards))
      throw new Error('Baseboard rectangles must share an edge or overlap.');
    const layout = { id: text(raw['id']), name: text(raw['name']), pieces, boards };
    return layout;
  });
  if (new Set(layouts.map((l) => l.id)).size !== layouts.length)
    throw new Error('Duplicate layout identifiers.');
  const state: PlannerState = {
    version: 2,
    inventory,
    layouts,
    activeLayoutId: text(data['activeLayoutId']),
  };
  activeLayout(state);
  return state;
}

export function layoutProblems(layout: Layout): string[] {
  return [
    ...new Set(
      layout.pieces.flatMap((piece, index) => {
        const problem = placementProblem(piece, layout.pieces.slice(0, index), layout.boards);
        return problem ? [problem.message] : [];
      }),
    ),
  ];
}
