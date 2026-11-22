import { describe, expect, it } from 'vitest';
import { connected, joinedBoards, placementProblem, ports, routePose, snapPiece } from './geometry';
import {
  activeLayout,
  available,
  emptyState,
  parseState,
  putPiece,
  setInventory,
  updateLayout,
} from './state';
import { loadState, saveState, storageKey } from './storage';
import type { Piece, PlannerState } from './model';

const straightId = 'hornby-oo-r600';
const curveId = 'hornby-oo-r605';
const piece = (id: string, x = 0, y = 0, angle = 0, trackId = straightId): Piece => ({
  id,
  x,
  y,
  angle,
  trackId,
  flipped: false,
});
const stock = (id = straightId, count = 10) => setInventory(emptyState('first'), id, count);

describe('real geometry and snapping', () => {
  it('uses analytic curved endpoints and mirrored tangent angles', () => {
    const end = routePose({ kind: 'arc', radius: 438, angle: 22.5 }, 1);
    expect(end.x).toBeCloseTo(167.615343, 4);
    expect(end.y).toBeCloseTo(33.340765, 4);
    const normal = ports(piece('curve', 0, 0, 0, 'hornby-oo-r606'))[1];
    const mirrored = ports({ ...piece('curve', 0, 0, 0, 'hornby-oo-r606'), flipped: true })[1];
    expect(normal?.angle).toBe(22.5);
    expect(mirrored?.angle).toBe(337.5);
    expect(mirrored?.y).toBeCloseTo(-end.y);
  });

  it('snaps position AND tangent after arbitrary rotation', () => {
    const anchor = piece('a', 100, 100, 37);
    const end = ports(anchor)[1];
    if (!end) throw new Error('Missing test connector');
    const candidate = piece('b', end.x + 3, end.y - 2, 10);
    const result = snapPiece(candidate, [anchor], 12);
    expect(result).not.toBeNull();
    if (!result) throw new Error('Expected a snapped piece.');
    expect(result.piece.angle).toBeCloseTo(37);
    const start = ports(result.piece)[0];
    if (!start) throw new Error('Missing connector');
    expect(connected(start, end)).toBe(true);
  });

  it('preserves mirrored connector geometry during snapping', () => {
    const anchor = piece('a');
    const candidate = { ...piece('b', 170, 2, 0, 'hornby-oo-r606'), flipped: true };
    const result = snapPiece(candidate, [anchor], 10);
    expect(result?.piece.x).toBeCloseTo(168);
    if (!result) throw new Error('Expected a snapped piece.');
    expect(ports(result.piece)[1]?.y).toBeLessThan(0);
  });

  it('does not snap to an already occupied connector', () => {
    const anchor = piece('a');
    const attached = piece('b', 168);
    expect(snapPiece(piece('c', 168, 0, 90), [anchor, attached], 10)).toBeNull();
  });

  it('closes a full eight-piece first-radius circuit without positional drift', () => {
    let state = stock(curveId, 8);
    let next = piece('curve-0', 0, 0, 0, curveId);
    for (let i = 0; i < 8; i++) {
      state = putPiece(state, next);
      const endpoint = ports(next)[1];
      if (!endpoint) throw new Error('Missing endpoint');
      next = { ...next, id: `curve-${i + 1}`, ...endpoint };
    }
    expect(next.x).toBeCloseTo(0, 8);
    expect(next.y).toBeCloseTo(0, 8);
    expect(activeLayout(state).pieces).toHaveLength(8);
  });
});

describe('clearance and baseboards', () => {
  it('permits connected straights but blocks duplicates, crossings and insufficient parallel spacing', () => {
    const anchor = piece('a');
    expect(placementProblem(piece('b', 168), [anchor], [])).toBeNull();
    expect(placementProblem(piece('b'), [anchor], [])?.kind).toBe('overlap');
    expect(placementProblem(piece('b', 84, -84, 90), [anchor], [])?.kind).toBe('overlap');
    expect(placementProblem(piece('b', 0, 66.4), [anchor], [])?.kind).toBe('spacing');
    expect(placementProblem(piece('b', 0, 67), [anchor], [])).toBeNull();
  });

  it('rejects a third piece at an occupied connector', () => {
    expect(placementProblem(piece('c', 168), [piece('a'), piece('b', 168)], [])).not.toBeNull();
  });

  it('allows standard point exits and their countercurve fan', () => {
    const point = piece('point', 0, 0, 0, 'hornby-oo-r8073');
    const branch = ports(point)[2];
    if (!branch) throw new Error('Missing branch');
    const continuation = {
      ...piece('curve', branch.x, branch.y, branch.angle, 'hornby-oo-r606'),
      flipped: true,
    };
    const straight = piece('straight', 168);
    expect(placementProblem(straight, [point], [])).toBeNull();
    expect(placementProblem(continuation, [point, straight], [])).toBeNull();
  });

  it('uses the union of joined rectangles without treating their shared seam as an edge', () => {
    const boards = [
      { x: 0, y: 0, width: 200, height: 200 },
      { x: 200, y: 0, width: 200, height: 200 },
    ];
    expect(joinedBoards(boards)).toBe(true);
    expect(placementProblem(piece('a', 150, 100), [], boards)).toBeNull();
    expect(placementProblem(piece('a', 150, 5), [], boards)?.kind).toBe('board');
    expect(
      joinedBoards([
        { x: 0, y: 0, width: 200, height: 200 },
        { x: 200, y: 200, width: 200, height: 200 },
      ]),
    ).toBe(false);
  });
});

describe('inventory and durable documents', () => {
  it('rejects an invalid snapshot before overwriting a valid backup', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    saveState(storage, stock());
    const before = values.get(storageKey);
    expect(() => saveState(storage, { ...stock(), layouts: [] })).toThrow(/layouts/);
    expect(values.get(storageKey)).toBe(before);
  });
  it('rejects over-allocation atomically and releases stock on deletion', () => {
    const before = putPiece(stock(straightId, 1), piece('a'));
    expect(available(before, straightId)).toBe(0);
    expect(() => putPiece(before, piece('b', 168))).toThrow(/used/);
    expect(activeLayout(before).pieces).toHaveLength(1);
    expect(
      available(updateLayout(before, { ...activeLayout(before), pieces: [] }), straightId),
    ).toBe(1);
  });

  it('uses stock independently per layout and prevents reductions below any saved idea', () => {
    const first = putPiece(stock(straightId, 1), piece('a'));
    const next: PlannerState = {
      ...first,
      layouts: [...first.layouts, { id: 'second', name: 'Idea two', pieces: [], boards: [] }],
      activeLayoutId: 'second',
    };
    expect(available(next, straightId)).toBe(1);
    expect(() => setInventory(next, straightId, 0)).toThrow(/saved layout/);
    expect(() => setInventory(next, straightId, 1.5)).toThrow(/whole number/);
  });

  it('validates imported nested references, stock, IDs, numbers and versions', () => {
    const state = putPiece(stock(), piece('a'));
    expect(parseState(JSON.stringify(state))).toEqual(state);
    expect(() => parseState(JSON.stringify({ ...state, version: 2 }))).toThrow(/version/);
    expect(() => parseState(JSON.stringify({ ...state, inventory: { [straightId]: 0 } }))).toThrow(
      /inventory/,
    );
    expect(() =>
      parseState(
        JSON.stringify({
          ...state,
          layouts: [{ ...activeLayout(state), pieces: [{ ...piece('a'), trackId: 'unknown' }] }],
        }),
      ),
    ).toThrow(/Unknown/);
    expect(() =>
      parseState(
        JSON.stringify({
          ...state,
          layouts: [{ ...activeLayout(state), pieces: [piece('a'), piece('a', 168)] }],
        }),
      ),
    ).toThrow(/Duplicate/);
    expect(() =>
      parseState(
        JSON.stringify({
          ...state,
          layouts: [{ ...activeLayout(state), pieces: [{ ...piece('a'), x: null }] }],
        }),
      ),
    ).toThrow(/numeric/);
  });

  it('distinguishes absent, malformed and inaccessible storage and never overwrites bad reads', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    expect(loadState(storage, 'first')).toEqual(emptyState('first'));
    saveState(storage, stock());
    expect(loadState(storage, 'ignored').inventory[straightId]).toBe(10);
    values.set(storageKey, '{bad json');
    expect(() => loadState(storage, 'new')).toThrow();
    expect(values.get(storageKey)).toBe('{bad json');
    expect(() =>
      loadState(
        {
          ...storage,
          getItem: () => {
            throw new Error('denied');
          },
        },
        'new',
      ),
    ).toThrow('denied');
    expect(() =>
      saveState(
        {
          ...storage,
          setItem: () => {
            throw new Error('quota');
          },
        },
        stock(),
      ),
    ).toThrow('quota');
  });
});
