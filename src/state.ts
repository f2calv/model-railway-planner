import { catalog, definition } from './catalog';
import { joinedBoards, placementProblem } from './geometry';
import type { Layout, Piece, PlannerState } from './model';

export function emptyState(id: string): PlannerState {
  return {
    version: 1,
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
  return (state.inventory[trackId] ?? 0) - used(activeLayout(state), trackId);
}

export function putPiece(state: PlannerState, piece: Piece): PlannerState {
  definition(piece.trackId);
  if (![piece.x, piece.y, piece.angle].every(Number.isFinite))
    throw new Error('Position must be finite.');
  const layout = activeLayout(state);
  const existing = layout.pieces.find((p) => p.id === piece.id);
  if (existing && existing.trackId !== piece.trackId)
    throw new Error('Cannot change the type of an existing piece.');
  if (!existing && available(state, piece.trackId) <= 0)
    throw new Error('All owned pieces of this type are used in this layout.');
  const others = layout.pieces.filter((entry) => entry.id !== piece.id);
  const problem = placementProblem(piece, others, layout.boards);
  if (problem) throw new Error(problem.message);
  return updateLayout(state, { ...layout, pieces: [...others, piece] });
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
  if (state.layouts.some((layout) => used(layout, id) > quantity))
    throw new Error('A saved layout uses more than this quantity. Remove its extra pieces first.');
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
  if (data['version'] !== 1)
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
      return {
        id: text(p['id']),
        trackId,
        x: number(p['x']),
        y: number(p['y']),
        angle: number(p['angle']),
        flipped: p['flipped'],
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
    for (const entry of catalog) {
      if (used(layout, entry.id) > (inventory[entry.id] ?? 0))
        throw new Error('Backup layout exceeds owned inventory.');
    }
    return layout;
  });
  if (new Set(layouts.map((l) => l.id)).size !== layouts.length)
    throw new Error('Duplicate layout identifiers.');
  const state: PlannerState = {
    version: 1,
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
