import { describe, expect, it } from 'vitest';
import { definition } from './catalog';
import { connected, placementProblem, ports, routePose, snapPiece, snapGroup } from './geometry';
import {
  activeLayout,
  available,
  emptyState,
  parseState,
  missingPieceIds,
  putPiece,
  setInventory,
  shoppingList,
  updateLayout,
  putPieces,
  transformPieces,
  removePieces,
  setPieceLocks,
  resetInventory,
  setAccessory,
  putBoard,
  removeBoard,
  layoutProblems,
  assignedRoom,
  assignRoom,
  putRoom,
  removeRoom,
} from './state';
import {
  createHistory,
  recordHistory,
  redoHistory,
  undoHistory,
  recordActivity,
  type Activity,
} from './history';
import { loadState, saveState, storageKey } from './storage';
import type { Board, Piece, PlannerState, Room } from './model';
import { roomProblems } from './rooms';
import {
  boardBounds,
  boardPath,
  containsBoard,
  joinedBoards,
  moveBoardCorner,
  rectangleBoard,
  snapBoard,
  validateBoard,
} from './baseboards';
import { compatibleProfiles, manufacturerProfile } from './profiles';
import { csvCell, csvExport, svgExport } from './exports';
import { translate } from './i18n';
import { loadPreferences } from './preferences';

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

describe('named rooms', () => {
  const room: Room = {
    id: 'room',
    name: 'Example room',
    shapes: [
      { name: 'Room outline', role: 'outline', shape: rectangleBoard('floor', 0, 0, 4000, 3000) },
      { name: 'Table', role: 'furniture', shape: rectangleBoard('table', 100, 100, 2000, 1000) },
    ],
  };
  it('shares a named room between ideas without moving track or boards and deletes references atomically', () => {
    const first = assignRoom(
      putRoom(
        putBoard(
          putPiece(stock(), piece('track', 200, 200)),
          rectangleBoard('board', 100, 100, 1000, 500),
        ),
        room,
      ),
      room.id,
    );
    const shared = {
      ...first,
      layouts: [...first.layouts, { ...activeLayout(first), id: 'other', name: 'Other idea' }],
    };
    const changed = putRoom(shared, {
      ...room,
      shapes: room.shapes.map((entry) => ({
        ...entry,
        shape: { ...entry.shape, x: entry.shape.x + 10 },
      })),
    });
    expect(changed.layouts).toEqual(shared.layouts);
    expect(assignedRoom({ ...changed, activeLayoutId: 'other' })?.shapes[1]?.shape.x).toBe(110);
    expect(shared.rooms[0]?.shapes[1]?.shape.x).toBe(100);
    const removed = removeRoom(changed, room.id);
    expect(removed.layouts.every((layout) => layout.roomId === undefined)).toBe(true);
    expect(removed.layouts[0]?.pieces).toEqual(first.layouts[0]?.pieces);
    expect(removed.layouts[1]?.boards).toEqual(first.layouts[0]?.boards);
    expect(undoHistory(recordHistory(createHistory(changed), removed)).current).toEqual(changed);
    expect(parseState(JSON.stringify(changed))).toEqual(changed);
  });
  it('migrates format 4 geometry and rejects dangling rooms, duplicate outlines and malformed furniture', () => {
    const initial = putBoard(emptyState('legacy'), rectangleBoard('board', 0, 0, 1000, 500));
    expect(parseState(JSON.stringify({ ...initial, rooms: undefined, version: 4 }))).toEqual(
      initial,
    );
    expect(() =>
      parseState(
        JSON.stringify({ ...initial, layouts: [{ ...activeLayout(initial), roomId: 'missing' }] }),
      ),
    ).toThrow(/room/);
    expect(() =>
      putRoom(initial, {
        ...room,
        shapes: [
          ...room.shapes,
          {
            name: 'Second outline',
            role: 'outline',
            shape: rectangleBoard('second', 0, 0, 100, 100),
          },
        ],
      }),
    ).toThrow(/one outline/);
    const valid = putRoom(initial, room);
    expect(() => parseState(JSON.stringify({ ...valid, rooms: [...valid.rooms, room] }))).toThrow(
      /Duplicate room/,
    );
    expect(() =>
      parseState(
        JSON.stringify({
          ...initial,
          rooms: [
            {
              ...room,
              shapes: [
                {
                  name: 'Bad furniture',
                  role: 'furniture',
                  shape: { id: 'bad', kind: 'circle', x: 0, y: 0, angle: 0, radius: -1 },
                },
              ],
            },
          ],
        }),
      ),
    ).toThrow(/radius/);
  });
  it('warns about room boundaries without preventing reference furniture or board placement', () => {
    const initial = putBoard(
      putPiece(stock(), piece('track', 5000, 5000)),
      rectangleBoard('outside', 5000, 5000, 500, 250),
    );
    const state = assignRoom(
      putRoom(initial, {
        ...room,
        shapes: [
          ...room.shapes,
          {
            name: 'Round table',
            role: 'furniture',
            shape: { id: 'round', kind: 'circle', x: 5000, y: 5000, angle: 0, radius: 200 },
          },
        ],
      }),
      room.id,
    );
    expect(roomProblems(state)).toEqual([
      'Baseboard extends outside the selected room.',
      'Track extends outside the selected room.',
      'Furniture extends outside the room outline.',
    ]);
    expect(roomProblems(assignRoom(state, ''))).toEqual([]);
    expect(activeLayout(state).pieces).toEqual(activeLayout(initial).pieces);
  });
  it('exports the selected room beneath boards and escapes furniture names', () => {
    const initial = putBoard(
      putPiece(stock(), piece('track', 200, 200)),
      rectangleBoard('board', 100, 100, 1000, 500),
    );
    const table = room.shapes.find((entry) => entry.role === 'furniture');
    const outline = room.shapes.find((entry) => entry.role === 'outline');
    if (!table || !outline) throw new Error('Expected room and furniture.');
    const selected = assignRoom(
      putRoom(initial, { ...room, shapes: [{ ...table, name: 'Table <example>' }, outline] }),
      room.id,
    );
    const drawing = svgExport(selected);
    expect(drawing).toContain('width="4040mm" height="3040mm"');
    expect(drawing.indexOf('data-room-shape="floor"')).toBeLessThan(
      drawing.indexOf('data-room-shape="table"'),
    );
    expect(drawing.indexOf('data-room-shape="table"')).toBeLessThan(
      drawing.indexOf('data-board="board"'),
    );
    expect(drawing).toContain('Table &lt;example&gt;');
    expect(drawing).not.toContain('Table <example>');
    expect(svgExport(assignRoom(selected, ''))).not.toContain('data-room-shape');
  });
});

describe('geometric baseboards', () => {
  it('contains rotated polygons and circular sectors without filling an arc strip hole', () => {
    const polygon = { ...rectangleBoard('rotated', 100, 0, 200, 100), angle: 90 };
    expect(containsBoard(polygon, { x: 50, y: 100 })).toBe(true);
    expect(containsBoard(polygon, { x: 150, y: 100 })).toBe(false);
    expect(boardBounds(polygon).width).toBeCloseTo(100);
    expect(boardBounds(polygon).height).toBeCloseTo(200);
    const arc: Board = {
      id: 'arc',
      kind: 'arc',
      x: 0,
      y: 0,
      angle: 0,
      radius: 500,
      innerRadius: 250,
      sweep: 90,
    };
    expect(containsBoard(arc, { x: 300, y: 300 })).toBe(true);
    expect(containsBoard(arc, { x: 0, y: 0 })).toBe(false);
    expect(containsBoard(arc, { x: -300, y: 300 })).toBe(false);
    expect(containsBoard({ ...arc, angle: 90 }, { x: -300, y: 300 })).toBe(true);
    const ring = { ...arc, sweep: 360 };
    expect(containsBoard(ring, { x: -300, y: -300 })).toBe(true);
    expect(boardPath(ring).match(/ A/g)).toHaveLength(4);
    expect(placementProblem(piece('track', -84, 0), [], [ring])?.kind).toBe('board');
  });

  it('joins tangent circles and intersecting edges but reports genuine gaps and separate islands', () => {
    const circle: Board = { id: 'one', kind: 'circle', x: 0, y: 0, angle: 0, radius: 100 };
    const second = { ...circle, id: 'two', x: Math.SQRT2 * 100, y: Math.SQRT2 * 100 };
    expect(joinedBoards([circle, second])).toBe(true);
    expect(joinedBoards([circle, { ...second, x: second.x + 1 }])).toBe(false);
    const ring: Board = { ...circle, kind: 'arc', innerRadius: 60, sweep: 360 };
    expect(joinedBoards([ring, { ...circle, id: 'island', radius: 20 }])).toBe(false);
    const angle = (33 * Math.PI) / 180;
    for (const gap of [0, 0.05, 0.11]) {
      const edge = {
        ...rectangleBoard('edge', 0, 0, 20, 20),
        x: (100 + gap) * Math.cos(angle) + 10 * Math.sin(angle),
        y: (100 + gap) * Math.sin(angle) - 10 * Math.cos(angle),
        angle: 33,
      };
      expect(joinedBoards([circle, edge]), `rotated edge gap ${gap} mm`).toBe(gap <= 0.1);
    }
    expect(
      joinedBoards([
        rectangleBoard('a', -200, -10, 400, 20),
        rectangleBoard('b', -10, -200, 20, 400),
      ]),
    ).toBe(true);
  });

  it('snaps board edges in model units without rotating or changing dimensions', () => {
    const base = rectangleBoard('base', 0, 0, 1000, 500);
    const candidate = rectangleBoard('next', 1010, 0, 500, 500);
    const result = snapBoard(candidate, [base], 15);
    expect(result.x).toBe(1000);
    expect(result.y).toBe(0);
    expect(result.angle).toBe(candidate.angle);
    expect(joinedBoards([base, result])).toBe(true);
    expect(snapBoard(candidate, [base], 5)).toEqual(candidate);
  });

  it('turns a rectangle into a trapezoid while rejecting crossed or collapsed corners', () => {
    const board = rectangleBoard('board', 0, 0, 100, 100);
    const trapezoid = moveBoardCorner(board, 1, { x: 70, y: 0 });
    expect(containsBoard(trapezoid, { x: 80, y: 10 })).toBe(false);
    expect(containsBoard(trapezoid, { x: 80, y: 90 })).toBe(true);
    expect(() => moveBoardCorner(board, 1, { x: -10, y: 110 })).toThrow(/convex|cross/);
    expect(() => moveBoardCorner(board, 1, { x: 0, y: 0 })).toThrow(/convex/);
    expect(() =>
      validateBoard({
        id: 'bad',
        kind: 'arc',
        x: 0,
        y: 0,
        angle: 0,
        radius: 100,
        innerRadius: 100,
        sweep: 90,
      }),
    ).toThrow(/inner radius/);
  });

  it('lets board edits expose warnings without moving track, and restores the entire edit through history', () => {
    const track = putPiece(stock(), piece('track', 50, 100));
    const board = rectangleBoard('board', 0, 0, 500, 500);
    const before = putBoard(track, board);
    const next = putBoard(before, { ...board, x: 2000 });
    expect(activeLayout(next).pieces).toEqual(activeLayout(before).pieces);
    expect(layoutProblems(activeLayout(next))).toContain(
      'Track footprint must stay inside the baseboard.',
    );
    const history = recordHistory(createHistory(before), next);
    expect(undoHistory(history).current).toEqual(before);
    expect(parseState(JSON.stringify(next))).toEqual(next);
    expect(activeLayout(removeBoard(next, board.id)).pieces).toEqual(activeLayout(track).pieces);
  });

  it('migrates old rectangles to stable polygon IDs and rejects invalid new shape references', () => {
    const state = emptyState('legacy');
    for (const version of [1, 2, 3]) {
      const migrated = parseState(
        JSON.stringify({
          ...state,
          rooms: undefined,
          version,
          layouts: [{ ...activeLayout(state), boards: [{ x: 0, y: 0, width: 1000, height: 500 }] }],
        }),
      );
      expect(activeLayout(migrated).boards).toEqual([
        rectangleBoard('legacy-board-1', 0, 0, 1000, 500),
      ]);
      expect(parseState(JSON.stringify(migrated))).toEqual(migrated);
    }
    const board = rectangleBoard('same', 0, 0, 100, 100);
    const invalid = { ...state, layouts: [{ ...activeLayout(state), boards: [board, board] }] };
    expect(() => parseState(JSON.stringify(invalid))).toThrow(/Duplicate baseboard/);
    expect(() =>
      parseState(
        JSON.stringify({
          ...state,
          layouts: [
            {
              ...activeLayout(state),
              boards: [{ ...board, kind: 'unknown' }],
            },
          ],
        }),
      ),
    ).toThrow(/Unknown baseboard/);
    expect(
      svgExport(
        putBoard(state, {
          id: 'ring',
          kind: 'arc',
          x: 0,
          y: 0,
          angle: 20,
          radius: 500,
          innerRadius: 250,
          sweep: 360,
        }),
      ),
    ).toContain('fill-rule="evenodd"');
  });
});

describe('group transactions and history', () => {
  it('counts attached crossings separately and keeps them through moves, backups and undo', () => {
    const accessoryId = 'hornby-oo-r645';
    const initial = putPiece(stock(), piece('a'));
    const attached = setAccessory(initial, 'a', accessoryId, true);
    expect(activeLayout(attached).pieces).toHaveLength(1);
    const host = activeLayout(attached).pieces[0];
    if (!host) throw new Error('Expected the accessory host.');
    expect(ports(host)).toHaveLength(2);
    expect(shoppingList(attached)).toEqual([{ trackId: accessoryId, quantity: 1 }]);
    const moved = transformPieces(attached, ['a'], (p) => ({ ...p, x: 200, angle: 90 }));
    expect(parseState(JSON.stringify(moved))).toEqual(moved);
    expect(activeLayout(moved).pieces[0]?.accessories).toEqual([accessoryId]);
    const history = recordHistory(createHistory(initial), moved);
    expect(undoHistory(history).current).toEqual(initial);
    expect(redoHistory(undoHistory(history)).current).toEqual(moved);
    expect(svgExport(moved)).toContain(`data-accessory="${accessoryId}"`);
    expect(csvExport({ ...moved, inventory: {} }, true)).toContain(
      '"R645","Single-track level crossing","0","1","1"',
    );
    const owned = setInventory(attached, accessoryId, 1);
    expect(missingPieceIds(owned, accessoryId).size).toBe(0);
    expect(missingPieceIds(attached, accessoryId).has('a')).toBe(true);
    expect(shoppingList(setAccessory(owned, 'a', accessoryId, false))).toEqual([]);
    expect(available(removePieces(owned, ['a']), accessoryId)).toBe(1);
  });

  it('rejects free-standing, incompatible, duplicated and locked accessory changes', () => {
    const accessoryId = 'hornby-oo-r645';
    const initial = putPiece(stock(), piece('a'));
    expect(() => putPiece(initial, piece('accessory', 0, 300, 0, accessoryId))).toThrow(/attached/);
    for (const trackId of [curveId, 'hornby-oo-r610', 'hornby-oo-r636']) {
      const state = putPiece(emptyState('test'), piece('a', 0, 0, 0, trackId));
      expect(() => setAccessory(state, 'a', accessoryId, true)).toThrow(/compatible/);
    }
    const locked = setPieceLocks(initial, ['a'], true);
    expect(() => setAccessory(locked, 'a', accessoryId, true)).toThrow(/Unlock/);
    const attached = setAccessory(initial, 'a', accessoryId, true);
    const invalid = {
      ...attached,
      layouts: [
        {
          ...activeLayout(attached),
          pieces: [{ ...piece('a'), accessories: [accessoryId, accessoryId] }],
        },
      ],
    };
    expect(() => parseState(JSON.stringify(invalid))).toThrow(/accessories/);
    expect(() => parseState(JSON.stringify({ ...attached, version: 2 }))).toThrow(/format 3/);
    expect(parseState(JSON.stringify({ ...initial, rooms: undefined, version: 2 })).version).toBe(
      6,
    );
  });

  it('places a double-track crossing as one item with four usable connectors', () => {
    const crossing = piece('crossing', 0, 0, 0, 'hornby-oo-r636');
    expect(ports(crossing)).toEqual([
      { x: 0, y: 0, angle: 180 },
      { x: 0, y: 67, angle: 180 },
      { x: 168, y: 0, angle: 0 },
      { x: 168, y: 67, angle: 0 },
    ]);
    const state = putPieces(emptyState('test'), [crossing, piece('a', 168), piece('b', 168, 67)]);
    expect(shoppingList(state).find((item) => item.trackId === crossing.trackId)?.quantity).toBe(1);
    const power = piece('power', 170, 2, 0, 'hornby-oo-r8241');
    const snapped = snapPiece(power, [crossing], 10);
    expect(snapped?.piece.x).toBe(168);
    expect(snapped?.piece.y).toBe(0);
    expect(ports(power)[1]?.x).toBe(338);
  });

  it('keeps the latest 300 local activity entries independently of document undo', () => {
    let entries: readonly Activity[] = [];
    for (let i = 0; i < 302; i++)
      entries = recordActivity(entries, { at: new Date(0), message: String(i) });
    expect(entries).toHaveLength(300);
    expect(entries[0]?.message).toBe('2');
    expect(entries.at(-1)?.message).toBe('301');
  });
  it('migrates legacy backups to a format older clients cannot overwrite while retaining their content', () => {
    const initial = putPiece(stock(), piece('a'));
    expect(parseState(JSON.stringify({ ...initial, rooms: undefined, version: 1 }))).toEqual(
      initial,
    );
    expect(initial.version).toBe(6);
  });
  it('moves a connected group atomically past its original positions and rejects a collision', () => {
    const initial = putPieces(stock(), [piece('a'), piece('b', 168), piece('obstacle', 0, 300)]);
    const moved = transformPieces(initial, ['a', 'b'], (p) => ({ ...p, x: p.x + 168 }));
    expect(activeLayout(moved).pieces.map((p) => [p.id, p.x])).toEqual([
      ['a', 168],
      ['b', 336],
      ['obstacle', 0],
    ]);
    expect(() => transformPieces(initial, ['a', 'b'], (p) => ({ ...p, y: 300 }))).toThrow(
      /overlaps/,
    );
    expect(activeLayout(initial).pieces[0]?.y).toBe(0);
  });

  describe('catalog profiles, translations and interchange', () => {
    it('joins verified mixed-brand geometry without treating unknown rail codes as certification', () => {
      const hornby = piece('a');
      const peco = piece('b', 170, 2, 0, 'peco-setrack-oo-st-200');
      const result = snapPiece(peco, [hornby], 10);
      if (!result) throw new Error('Expected compatible planning connectors.');
      const end = ports(hornby)[1];
      const start = ports(result.piece)[0];
      if (!end || !start) throw new Error('Missing test connectors.');
      expect(connected(end, start)).toBe(true);
      const profile = manufacturerProfile('peco-setrack-oo');
      expect(compatibleProfiles(profile, { ...profile, railCode: 75 })).toBe(false);
      expect(compatibleProfiles(profile, { ...profile, electricalSystem: 'three-rail' })).toBe(
        false,
      );
      expect(compatibleProfiles(profile, manufacturerProfile('bachmann-oo'))).toBe(true);
    });

    it('snaps a rigid group using only exposed connectors without changing its orientation or spacing', () => {
      const candidates = [piece('a', 170, 2), piece('b', 338, 2)];
      const snapped = snapGroup(candidates, [piece('anchor')], 10);
      expect(snapped.map((p) => [p.x, p.y, p.angle])).toEqual([
        [168, 0, 0],
        [336, 0, 0],
      ]);
      const noRotation = snapGroup(candidates, [piece('anchor', 168, -168, 90)], 10);
      expect(noRotation).toEqual(candidates);
    });

    it('exports safe standalone SVG and shopping CSV rather than browser previews or executable titles', () => {
      const state = putPieces(stock(straightId, 1), [piece('a'), piece('b', 168)]);
      const named = updateLayout(state, {
        ...activeLayout(state),
        name: 'Sketch <script>example</script>',
      });
      const svg = svgExport(named);
      expect(svg).toContain('Sketch &lt;script&gt;example&lt;/script&gt;');
      expect(svg).not.toContain('<script>');
      expect(svg).toContain('width="416mm"');
      const csv = csvExport(state, true);
      expect(csv.trim().split('\r\n')).toHaveLength(2);
      expect(csv).toContain('"Hornby","OO","R600","Straight","1","2","1"');
      expect(csvCell(' =SUM(1,2)')).toBe('"\' =SUM(1,2)"');
      expect(csvCell('a,"b"')).toBe('"a,""b"""');
    });

    it('translates dynamic quantities and geometry while rejecting malformed persisted preferences', () => {
      expect(translate('Place R600 Straight', 'de')).toBe('R600 Gerade platzieren');
      expect(translate('R438 mm / 22.5 degrees', 'fr')).toBe('R438 mm / 22.5 degrés');
      expect(translate('Removed: R600. Saved on this device.', 'it')).toBe(
        'Rimosso: R600. Salvato su questo dispositivo.',
      );
      expect(() =>
        loadPreferences({
          getItem: () => '{"version":1,"language":"de","sounds":"yes","confirmDelete":true}',
        }),
      ).toThrow(/preferences/);
    });
  });

  it('protects every locked group member and round-trips locks without changing old backups', () => {
    const initial = putPieces(stock(), [piece('a'), piece('b', 168)]);
    expect(parseState(JSON.stringify(initial))).toEqual(initial);
    const locked = setPieceLocks(initial, ['b'], true);
    expect(parseState(JSON.stringify(locked))).toEqual(locked);
    expect(() => transformPieces(locked, ['a', 'b'], (p) => ({ ...p, y: 100 }))).toThrow(/Unlock/);
    expect(() => removePieces(locked, ['a', 'b'])).toThrow(/Unlock/);
    expect(() => putPiece(locked, { ...piece('b', 168), locked: false })).toThrow(/Unlock/);
    const unlocked = setPieceLocks(locked, ['b'], false);
    expect(activeLayout(removePieces(unlocked, ['a', 'b'])).pieces).toHaveLength(0);
    expect(() =>
      parseState(JSON.stringify(locked).replace('"locked":true', '"locked":"yes"')),
    ).toThrow(/lock/);
  });

  it('undoes a group deletion and inventory reset together, and discards redo after another edit', () => {
    const initial = putPieces(stock(straightId, 1), [piece('a'), piece('b', 168)]);
    let history = recordHistory(createHistory(initial), removePieces(initial, ['a', 'b']));
    history = recordHistory(history, resetInventory(history.current));
    history = undoHistory(undoHistory(history));
    expect(history.current).toEqual(initial);
    expect(shoppingList(history.current)).toEqual([{ trackId: straightId, quantity: 1 }]);
    expect(activeLayout(redoHistory(history).current).pieces).toHaveLength(0);
    history = recordHistory(history, setInventory(history.current, straightId, 4));
    expect(history.future).toHaveLength(0);
    expect(() => redoHistory(history)).toThrow(/Nothing to redo/);
  });

  it('retains exactly the newest 100 undo steps', () => {
    let history = createHistory(stock(straightId, 0));
    for (let quantity = 1; quantity <= 101; quantity++)
      history = recordHistory(history, setInventory(history.current, straightId, quantity));
    for (let i = 0; i < 100; i++) history = undoHistory(history);
    expect(history.current.inventory[straightId]).toBe(1);
    expect(() => undoHistory(history)).toThrow(/Nothing to undo/);
  });
});

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

  it('exposes four independent crossing connectors and snaps either route', () => {
    const crossing = piece('crossing', 0, 0, 31, 'hornby-oo-r615');
    const endpoints = ports(crossing);
    expect(endpoints).toHaveLength(4);
    for (const endpoint of endpoints) {
      const candidate = piece('attached', endpoint.x + 1, endpoint.y + 1, endpoint.angle);
      const result = snapPiece(candidate, [crossing], 5);
      expect(result).not.toBeNull();
      if (!result) throw new Error('Expected crossing snap.');
      expect(ports(result.piece).some((port) => connected(port, endpoint))).toBe(true);
    }
  });

  it('models compound point branches with continuous endpoint tangents', () => {
    const entry = definition('hornby-oo-r8078');
    const branch = entry.routes[1];
    if (!branch) throw new Error('Missing branch.');
    const end = routePose(branch, 1);
    expect(end.x).toBeCloseTo(245, 8);
    expect(end.angle).toBeCloseTo(11.25, 8);
    const point = piece('point', 0, 0, 0, entry.id);
    const endpoint = ports(point)[2];
    if (!endpoint) throw new Error('Missing branch endpoint.');
    const result = snapPiece(piece('next', endpoint.x + 2, endpoint.y), [point], 5);
    expect(result?.piece.angle).toBeCloseTo(11.25);
  });

  it('closes a fourth-radius circuit using the nominal 572 mm radius', () => {
    let next = piece('curve', 0, 0, 0, 'hornby-oo-r8262');
    for (let i = 0; i < 8; i++) {
      const endpoint = ports(next)[1];
      if (!endpoint) throw new Error('Missing endpoint.');
      next = { ...next, ...endpoint };
    }
    expect(next.x).toBeCloseTo(0, 8);
    expect(next.y).toBeCloseTo(0, 8);
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

  it.each(['r8074', 'r8075', 'r8076', 'r8077', 'r8078', 'r614', 'r615'])(
    'permits a continuation snapped to every connector of %s',
    (code) => {
      const special = piece('special', 300, 300, 19, `hornby-oo-${code}`);
      for (const endpoint of ports(special)) {
        const candidate = piece('continuation', endpoint.x + 1, endpoint.y + 1, endpoint.angle);
        const snap = snapPiece(candidate, [special], 5);
        if (!snap) throw new Error('Expected a connector snap.');
        expect(placementProblem(snap.piece, [special], [])).toBeNull();
      }
    },
  );

  it('uses the union of joined rectangles without treating their shared seam as an edge', () => {
    const boards = [rectangleBoard('one', 0, 0, 200, 200), rectangleBoard('two', 200, 0, 200, 200)];
    expect(joinedBoards(boards)).toBe(true);
    expect(placementProblem(piece('a', 150, 100), [], boards)).toBeNull();
    expect(placementProblem(piece('a', 150, 5), [], boards)?.kind).toBe('board');
    expect(
      joinedBoards([
        rectangleBoard('one', 0, 0, 200, 200),
        rectangleBoard('two', 200, 200, 200, 200),
      ]),
    ).toBe(true);
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
  it('allows missing stock and updates shopping quantities on deletion and purchase', () => {
    const before = putPiece(stock(straightId, 1), piece('a'));
    expect(available(before, straightId)).toBe(0);
    const over = putPiece(before, piece('b', 168));
    expect(shoppingList(over)).toEqual([{ trackId: straightId, quantity: 1 }]);
    expect(missingPieceIds(over)).toEqual(new Set(['b']));
    const moved = putPiece(over, piece('a', 0, 200));
    expect(missingPieceIds(moved)).toEqual(new Set(['b']));
    expect(shoppingList(setInventory(over, straightId, 2))).toEqual([]);
    expect(
      shoppingList(
        updateLayout(over, {
          ...activeLayout(over),
          pieces: [piece('a')],
        }),
      ),
    ).toEqual([]);
    expect(
      available(updateLayout(before, { ...activeLayout(before), pieces: [] }), straightId),
    ).toBe(1);
  });

  it('uses stock independently per layout and permits reductions below saved ideas', () => {
    const first = putPiece(stock(straightId, 1), piece('a'));
    const next: PlannerState = {
      ...first,
      layouts: [...first.layouts, { id: 'second', name: 'Idea two', pieces: [], boards: [] }],
      activeLayoutId: 'second',
    };
    expect(available(next, straightId)).toBe(1);
    const reduced = setInventory(next, straightId, 0);
    expect(shoppingList(reduced)).toEqual([]);
    expect(shoppingList({ ...reduced, activeLayoutId: 'first' })).toEqual([
      { trackId: straightId, quantity: 1 },
    ]);
    expect(() => setInventory(next, straightId, 1.5)).toThrow(/whole number/);
  });

  it('validates imported nested references, stock, IDs, numbers and versions', () => {
    const state = putPiece(stock(), piece('a'));
    expect(parseState(JSON.stringify(state))).toEqual(state);
    expect(() => parseState(JSON.stringify({ ...state, version: 7 }))).toThrow(/version/);
    const shortfall = parseState(JSON.stringify({ ...state, inventory: { [straightId]: 0 } }));
    expect(shoppingList(shortfall)).toEqual([{ trackId: straightId, quantity: 1 }]);
    expect(parseState(JSON.stringify({ ...state, inventory: {} })).layouts).toEqual(state.layouts);
    expect(() => parseState(JSON.stringify({ ...state, inventory: { [straightId]: -1 } }))).toThrow(
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
