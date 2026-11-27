import { describe, expect, it } from 'vitest';
import { definition } from './catalog';
import { ports } from './geometry';
import { analyzePower, attachPowerAccessory } from './power';
import type { Layout, Piece } from './model';
import {
  activeLayout,
  available,
  emptyState,
  missingPieceIds,
  parseState,
  putPiece,
  setAccessory,
  setElectrical,
  setInventory,
  setPieceLocks,
  shoppingList,
  updateLayout,
  used,
} from './state';
import { csvExport } from './exports';
import { createHistory, recordHistory, undoHistory } from './history';

const track = (id: string, code = 'R600', x = 0): Piece => ({
  id,
  trackId: `hornby-oo-${code.toLowerCase()}`,
  x,
  y: 0,
  angle: 0,
  flipped: false,
});
const fed = (piece: Piece, kind: 'native' | 'manual' = 'manual', port = 0): Piece => ({
  ...piece,
  electrical: { ...piece.electrical, feed: { kind, port, connected: true } },
});
function follow(piece: Piece, port: number, id: string, code = 'R600'): Piece {
  const terminal = ports(piece)[port];
  if (!terminal) throw new Error('Missing test connector.');
  return { ...track(id, code), ...terminal };
}
const layout = (pieces: Piece[], powerMode: 'dc' | 'dcc' = 'dcc'): Layout => ({
  id: 'idea',
  name: 'Example idea',
  boards: [],
  pieces,
  powerMode,
});
function points(): Piece[] {
  const point = { ...track('point', 'R8072'), electrical: { pointRoute: 0 as const } };
  return [
    fed(track('source', 'R8241', -168), 'native'),
    point,
    follow(point, 1, 'main'),
    follow(point, 2, 'siding'),
  ];
}
const statuses = (idea: Layout, id: string) =>
  analyzePower(idea)
    .routes.filter((route) => route.pieceId === id)
    .map((route) => route.status);

describe('track power planning', () => {
  it('is optional and never treats an unmarked native power track as a connected controller', () => {
    const piece = track('source', 'R8241');
    const unconfigured = layout([piece]);
    delete unconfigured.powerMode;
    expect(analyzePower(unconfigured)).toEqual({ routes: [], warnings: [], feeds: 0 });
    expect(statuses(layout([piece]), piece.id)).toEqual(['unpowered']);
    const disconnected = {
      ...fed(piece, 'native'),
      electrical: { feed: { kind: 'native' as const, port: 0, connected: false } },
    };
    expect(analyzePower(layout([disconnected])).feeds).toBe(0);
    expect(statuses(layout([fed(piece, 'native')]), piece.id)).toEqual(['powered']);
  });

  it('keeps known inactive DC sidings dead and warns about them in DCC mode', () => {
    const pieces = points();
    pieces[0] = fed(track('source', 'R8206', -168), 'native');
    const dc = layout(pieces, 'dc');
    expect(statuses(dc, 'point')).toEqual(['powered', 'unpowered']);
    expect(statuses(dc, 'siding')).toEqual(['unpowered']);
    expect(analyzePower(dc).warnings).toEqual([]);
    const dcc = layout(points());
    expect(analyzePower(dcc).warnings.join(' ')).toMatch(/unpowered or partially/);
    expect(analyzePower(layout(pieces)).feeds).toBe(0);
    expect(analyzePower(layout(pieces)).warnings.join(' ')).toMatch(/not DCC-compatible/);
  });

  it('makes unknown point positions uncertain; a clip pair or declared soldered bypass powers both routes', () => {
    const pieces = points().map((piece) =>
      piece.id === 'point' ? track('point', 'R8072') : piece,
    );
    expect(statuses(layout(pieces), 'point')).toEqual(['unverified', 'unverified']);
    expect(statuses(layout(pieces), 'siding')).toEqual(['unverified']);
    expect(
      statuses(
        layout(
          pieces.map((piece) =>
            piece.id === 'main' || piece.id === 'siding' ? fed(piece) : piece,
          ),
        ),
        'point',
      ),
    ).toEqual(['unverified', 'unverified']);
    for (const bypass of ['clips', 'soldered'] as const) {
      const idea = layout(
        pieces.map((piece) =>
          piece.id === 'point' ? { ...piece, electrical: { bypass } } : piece,
        ),
      );
      expect(analyzePower(idea).routes.every((route) => route.status === 'powered')).toBe(true);
      expect(analyzePower(idea).warnings).toEqual([]);
    }
  });

  it.each(['R8073', 'R8074', 'R8076', 'R8078'])(
    'maps selected and isolated %s routes through rotated compound/handed geometry',
    (code) => {
      const point: Piece = {
        ...track('point', code),
        angle: 37,
        flipped: true,
        electrical: { pointRoute: 1 },
      };
      const idea = layout([
        fed(follow(point, 0, 'source', 'R8241'), 'native'),
        point,
        follow(point, 1, 'main'),
        follow(point, 2, 'siding'),
      ]);
      expect(statuses(idea, 'point')).toEqual(['unpowered', 'powered']);
      expect(statuses(idea, 'main')).toEqual(['unpowered']);
      expect(statuses(idea, 'siding')).toEqual(['powered']);
    },
  );

  it('accepts a separate same-controller siding feed without inventing a point bypass', () => {
    const idea = layout(
      points().map((piece) => (piece.id === 'siding' ? fed(piece, 'manual', 1) : piece)),
    );
    expect(analyzePower(idea).feeds).toBe(2);
    expect(analyzePower(idea).routes.every((route) => route.status === 'powered')).toBe(true);
  });

  it.each(['R636', 'R614', 'R615'])(
    'keeps %s crossing routes independent after rotation and reflection',
    (code) => {
      const crossing = { ...track('crossing', code), angle: 37, flipped: true };
      const first = follow(crossing, 2, 'first');
      const second = follow(crossing, 3, 'second');
      const idea = layout([fed(crossing), first, second]);
      expect(statuses(idea, 'crossing')).toEqual(['powered', 'unpowered']);
      expect(statuses(idea, 'first')).toEqual(['powered']);
      expect(statuses(idea, 'second')).toEqual(['unpowered']);
      expect(statuses(layout([fed(crossing, 'manual', 3)]), 'crossing')).toEqual([
        'unpowered',
        'powered',
      ]);
    },
  );

  it('does not propagate through R618; separate feeds may power both isolated halves', () => {
    const source = fed(track('source', 'R8241'), 'native');
    const isolator = track('isolation', 'R618', 168),
      tail = track('tail', 'R600', 336);
    const idea = layout([source, isolator, tail]);
    expect(statuses(idea, 'isolation')).toEqual(['partial']);
    expect(statuses(idea, 'tail')).toEqual(['unpowered']);
    const both = layout([source, isolator, fed(tail)]);
    expect(statuses(both, 'isolation')).toEqual(['powered']);
    expect(statuses(both, 'tail')).toEqual(['powered']);
  });

  it('never certifies unknown electrical behavior or ambiguous imported joints', () => {
    const entry = definition('hornby-oo-r600'),
      original = entry.electrical;
    delete entry.electrical;
    try {
      const idea = layout([fed(track('unknown')), track('tail', 'R601', 168)]);
      expect(statuses(idea, 'unknown')).toEqual(['unverified']);
      expect(statuses(idea, 'tail')).toEqual(['unverified']);
    } finally {
      if (original) entry.electrical = original;
    }
    const ambiguous = layout([
      fed(track('source', 'R8241')),
      track('a', 'R600', 168),
      track('b', 'R601', 168),
    ]);
    expect(statuses(ambiguous, 'a')).toEqual(['unverified']);
    expect(statuses(ambiguous, 'b')).toEqual(['unverified']);
    expect(analyzePower(ambiguous).warnings.join(' ')).toMatch(/Ambiguous/);
  });

  it('uses two individual R8232 clips per pair, preserves R645 and counts feed clips even before connection', () => {
    const point = track('point', 'R8072');
    let state = updateLayout(emptyState('idea'), layout([point, track('straight', 'R600', 500)]));
    state = setInventory(state, 'hornby-oo-r8232', 1);
    state = setElectrical(state, point.id, attachPowerAccessory(point, 'hornby-oo-r8232'));
    state = setAccessory(state, 'straight', 'hornby-oo-r645', true);
    state = setElectrical(
      state,
      'straight',
      attachPowerAccessory(track('straight'), 'hornby-oo-r8242'),
    );
    expect(used(activeLayout(state), 'hornby-oo-r8232')).toBe(2);
    expect(available(state, 'hornby-oo-r8232')).toBe(0);
    expect(missingPieceIds(state, 'hornby-oo-r8232')).toEqual(new Set(['point']));
    expect(shoppingList(state)).toContainEqual({ trackId: 'hornby-oo-r8232', quantity: 1 });
    expect(shoppingList(state)).toContainEqual({ trackId: 'hornby-oo-r8242', quantity: 1 });
    expect(shoppingList(state)).toContainEqual({ trackId: 'hornby-oo-r645', quantity: 1 });
    expect(csvExport(state, true)).toContain('R8232');
    const history = recordHistory(
      createHistory(state),
      setElectrical(state, 'point', { bypass: 'soldered' }),
    );
    expect(undoHistory(history).current).toEqual(state);
    expect(parseState(JSON.stringify(state))).toEqual(state);
  });

  it('validates electrical imports, future formats, clip hosts and locked-piece changes', () => {
    const initial = updateLayout(emptyState('idea'), layout([track('point', 'R8072')]));
    const locked = setPieceLocks(initial, ['point'], true);
    expect(() => setElectrical(locked, 'point', { bypass: 'clips' })).toThrow(/Unlock/);
    expect(() =>
      putPiece(locked, { ...track('point', 'R8072'), locked: true, electrical: { pointRoute: 1 } }),
    ).toThrow(/Unlock/);
    expect(() =>
      setElectrical(initial, 'point', { feed: { kind: 'manual', port: 3, connected: true } }),
    ).toThrow(/connector/);
    expect(() => attachPowerAccessory(track('straight', 'R603'), 'hornby-oo-r602')).toThrow(
      /modelled on R600/,
    );
    expect(() => attachPowerAccessory(track('straight'), 'hornby-oo-r8232')).toThrow(
      /supported Hornby point/,
    );
    const configured = setElectrical(initial, 'point', { bypass: 'clips' });
    expect(() => parseState(JSON.stringify({ ...configured, version: 5 }))).toThrow(/format 6/);
    expect(() => parseState(JSON.stringify({ ...initial, version: 7 }))).toThrow(/version/);
    const legacy = {
      ...initial,
      version: 5,
      layouts: [{ ...activeLayout(initial), powerMode: undefined }],
    };
    expect(parseState(JSON.stringify(legacy)).version).toBe(6);
    for (const feed of [
      { kind: 'unknown', port: 0, connected: true },
      { kind: 'manual', port: 0.5, connected: true },
      { kind: 'manual', port: 0, connected: 'true' },
    ]) {
      const bad = {
        ...initial,
        layouts: [
          {
            ...activeLayout(initial),
            pieces: [{ ...track('point', 'R8072'), electrical: { feed } }],
          },
        ],
      };
      expect(() => parseState(JSON.stringify(bad))).toThrow();
    }
  });
});
