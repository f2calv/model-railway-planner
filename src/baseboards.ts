import type { Board, Vec } from './model';

const radians = (angle: number) => (angle * Math.PI) / 180;
const degrees = (angle: number) => ((((angle * 180) / Math.PI) % 360) + 360) % 360;
const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
const cross = (a: Vec, b: Vec, c: Vec) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
const polar = (radius: number, angle: number): Vec => ({
  x: radius * Math.cos(radians(angle)),
  y: radius * Math.sin(radians(angle)),
});
const tolerance = 0.1;

export function boardWorld(board: Board, point: Vec): Vec {
  const c = Math.cos(radians(board.angle)),
    s = Math.sin(radians(board.angle));
  return { x: board.x + point.x * c - point.y * s, y: board.y + point.x * s + point.y * c };
}

export function boardLocal(board: Board, point: Vec): Vec {
  const c = Math.cos(radians(board.angle)),
    s = Math.sin(radians(board.angle));
  const dx = point.x - board.x,
    dy = point.y - board.y;
  return { x: dx * c + dy * s, y: -dx * s + dy * c };
}

export function rectangleBoard(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
): Board {
  if (![width, height].every((n) => Number.isFinite(n) && n > 0))
    throw new Error('Baseboard dimensions must be positive.');
  return {
    id,
    x,
    y,
    angle: 0,
    kind: 'polygon',
    points: [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ],
  };
}

export function validateBoard(board: Board): void {
  if (
    !board.id.trim() ||
    board.id.length > 120 ||
    ![board.x, board.y, board.angle].every((n) => Number.isFinite(n) && Math.abs(n) <= 1e7)
  )
    throw new Error('Invalid baseboard identifier or position.');
  if (board.kind !== 'polygon') {
    if (!Number.isFinite(board.radius) || board.radius < 1 || board.radius > 100000)
      throw new Error('Baseboard radius must be between 1 and 100000 mm.');
    if (
      board.kind === 'arc' &&
      (!Number.isFinite(board.innerRadius) ||
        board.innerRadius < 0 ||
        board.innerRadius >= board.radius ||
        !Number.isFinite(board.sweep) ||
        board.sweep < 1 ||
        board.sweep > 360)
    )
      throw new Error(
        'Arc needs an inner radius below its outer radius and a sweep from 1 to 360 degrees.',
      );
    return;
  }
  const points = board.points;
  if (
    points.length < 3 ||
    points.length > 16 ||
    points.some((p) => ![p.x, p.y].every((n) => Number.isFinite(n) && Math.abs(n) <= 100000))
  )
    throw new Error('Baseboard polygons need 3 to 16 finite corners.');
  // Consistent strict turns also reject crossed, concave and collapsed corner edits.
  let sign = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length],
      c = points[(i + 2) % points.length];
    if (!a || !b || !c) throw new Error('Missing baseboard corner.');
    const turn = cross(a, b, c);
    if (distance(a, b) < 1 || Math.abs(turn) < 1e-6)
      throw new Error('Baseboard corners must form a non-collapsed convex polygon.');
    if (sign && Math.sign(turn) !== sign)
      throw new Error('Baseboard corners must form a non-collapsed convex polygon.');
    sign = Math.sign(turn);
  }
  for (let i = 0; i < points.length; i++)
    for (let j = i + 2; j < points.length; j++) {
      if (i === 0 && j === points.length - 1) continue;
      const a = points[i],
        b = points[(i + 1) % points.length];
      const c = points[j],
        d = points[(j + 1) % points.length];
      if (a && b && c && d && lineIntersection(a, b, c, d))
        throw new Error('Baseboard edges cannot cross.');
    }
}

export function containsBoard(board: Board, world: Vec): boolean {
  const point = boardLocal(board, world);
  if (board.kind === 'polygon') {
    let sign = 0;
    for (let i = 0; i < board.points.length; i++) {
      const a = board.points[i],
        b = board.points[(i + 1) % board.points.length];
      if (!a || !b) throw new Error('Missing baseboard corner.');
      const turn = cross(a, b, point);
      if (Math.abs(turn) < 1e-7) continue;
      if (sign && Math.sign(turn) !== sign) return false;
      sign = Math.sign(turn);
    }
    return true;
  }
  const radius = Math.hypot(point.x, point.y);
  if (radius > board.radius + 1e-7) return false;
  if (board.kind === 'circle') return true;
  if (radius < board.innerRadius - 1e-7) return false;
  return (
    radius < 1e-7 ||
    board.sweep === 360 ||
    degrees(Math.atan2(point.y, point.x)) <= board.sweep + 1e-7
  );
}

type Boundary =
  | { kind: 'line'; a: Vec; b: Vec }
  | { kind: 'arc'; centre: Vec; radius: number; start: number; sweep: number };

function boundaries(board: Board): Boundary[] {
  if (board.kind === 'polygon')
    return board.points.map((point, i) => {
      const end = board.points[(i + 1) % board.points.length];
      if (!end) throw new Error('Missing baseboard corner.');
      return { kind: 'line', a: boardWorld(board, point), b: boardWorld(board, end) };
    });
  const sweep = board.kind === 'circle' ? 360 : board.sweep;
  const result: Boundary[] = [
    {
      kind: 'arc',
      centre: { x: board.x, y: board.y },
      radius: board.radius,
      start: board.angle,
      sweep,
    },
  ];
  if (board.kind === 'arc') {
    if (board.innerRadius)
      result.push({
        kind: 'arc',
        centre: { x: board.x, y: board.y },
        radius: board.innerRadius,
        start: board.angle,
        sweep,
      });
    if (sweep !== 360)
      for (const angle of [0, sweep])
        result.push({
          kind: 'line',
          a: boardWorld(board, polar(board.innerRadius, angle)),
          b: boardWorld(board, polar(board.radius, angle)),
        });
  }
  return result;
}

function onArc(arc: Extract<Boundary, { kind: 'arc' }>, point: Vec): boolean {
  const angle = degrees(
    Math.atan2(point.y - arc.centre.y, point.x - arc.centre.x) - radians(arc.start),
  );
  return arc.sweep === 360 || angle <= arc.sweep + 1e-7 || angle >= 360 - 1e-7;
}

function boundaryFeatures(edge: Boundary): Vec[] {
  if (edge.kind === 'line') return [edge.a, edge.b];
  const angles = [edge.start, edge.start + edge.sweep, 0, 90, 180, 270];
  return angles
    .map((angle) => {
      const p = polar(edge.radius, angle);
      return { x: edge.centre.x + p.x, y: edge.centre.y + p.y };
    })
    .filter((point) => onArc(edge, point));
}

export function boardFeatures(board: Board): Vec[] {
  return boundaries(board).flatMap(boundaryFeatures);
}

export function boardBounds(board: Board) {
  const points = boardFeatures(board);
  return {
    x: Math.min(...points.map((p) => p.x)),
    y: Math.min(...points.map((p) => p.y)),
    width: Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x)),
    height: Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y)),
  };
}

function nearest(edge: Boundary, point: Vec): Vec {
  if (edge.kind === 'line') {
    const dx = edge.b.x - edge.a.x,
      dy = edge.b.y - edge.a.y;
    const t = Math.max(
      0,
      Math.min(1, ((point.x - edge.a.x) * dx + (point.y - edge.a.y) * dy) / (dx * dx + dy * dy)),
    );
    return { x: edge.a.x + t * dx, y: edge.a.y + t * dy };
  }
  const angle = Math.atan2(point.y - edge.centre.y, point.x - edge.centre.x);
  const result = {
    x: edge.centre.x + edge.radius * Math.cos(angle),
    y: edge.centre.y + edge.radius * Math.sin(angle),
  };
  if (onArc(edge, result)) return result;
  const features = boundaryFeatures(edge);
  const closest = features.sort((a, b) => distance(a, point) - distance(b, point))[0];
  if (!closest) throw new Error('Missing arc endpoint.');
  return closest;
}

function lineIntersection(a: Vec, b: Vec, c: Vec, d: Vec): boolean {
  return cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0;
}

function lineArc(
  line: Extract<Boundary, { kind: 'line' }>,
  arc: Extract<Boundary, { kind: 'arc' }>,
): boolean {
  const closest = nearest(line, arc.centre);
  if (Math.abs(distance(closest, arc.centre) - arc.radius) <= tolerance && onArc(arc, closest))
    return true;
  const dx = line.b.x - line.a.x,
    dy = line.b.y - line.a.y;
  const x = line.a.x - arc.centre.x,
    y = line.a.y - arc.centre.y;
  const a = dx * dx + dy * dy,
    b = 2 * (x * dx + y * dy);
  const c = x * x + y * y - arc.radius * arc.radius;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return false;
  return [-1, 1].some((sign) => {
    const t = (-b + sign * Math.sqrt(discriminant)) / (2 * a);
    return t >= 0 && t <= 1 && onArc(arc, { x: line.a.x + t * dx, y: line.a.y + t * dy });
  });
}

function arcsIntersect(
  a: Extract<Boundary, { kind: 'arc' }>,
  b: Extract<Boundary, { kind: 'arc' }>,
): boolean {
  const d = distance(a.centre, b.centre);
  if (
    d === 0 ||
    d > a.radius + b.radius + tolerance ||
    d < Math.abs(a.radius - b.radius) - tolerance
  )
    return false;
  const along = (a.radius * a.radius - b.radius * b.radius + d * d) / (2 * d);
  const height = Math.sqrt(Math.max(0, a.radius * a.radius - along * along));
  const ux = (b.centre.x - a.centre.x) / d,
    uy = (b.centre.y - a.centre.y) / d;
  return [-1, 1].some((sign) => {
    const point = {
      x: a.centre.x + along * ux - sign * height * uy,
      y: a.centre.y + along * uy + sign * height * ux,
    };
    return onArc(a, point) && onArc(b, point);
  });
}

function boundariesTouch(a: Boundary, b: Boundary): boolean {
  if (
    boundaryFeatures(a).some((p) => distance(p, nearest(b, p)) <= tolerance) ||
    boundaryFeatures(b).some((p) => distance(p, nearest(a, p)) <= tolerance)
  )
    return true;
  if (a.kind === 'line' && b.kind === 'line') return lineIntersection(a.a, a.b, b.a, b.b);
  if (a.kind === 'arc' && b.kind === 'arc') return arcsIntersect(a, b);
  if (a.kind === 'line' && b.kind === 'arc') return lineArc(a, b);
  if (a.kind === 'arc' && b.kind === 'line') return lineArc(b, a);
  return false;
}

function boardsTouch(a: Board, b: Board): boolean {
  const x = boardBounds(a),
    y = boardBounds(b);
  if (
    x.x > y.x + y.width + tolerance ||
    y.x > x.x + x.width + tolerance ||
    x.y > y.y + y.height + tolerance ||
    y.y > x.y + x.height + tolerance
  )
    return false;
  return (
    boardFeatures(a).some((p) => containsBoard(b, p)) ||
    boardFeatures(b).some((p) => containsBoard(a, p)) ||
    boundaries(a).some((first) => boundaries(b).some((second) => boundariesTouch(first, second)))
  );
}

export function joinedBoards(boards: readonly Board[]): boolean {
  if (boards.length < 2) return true;
  const seen = new Set<number>([0]);
  const queue = [0];
  while (queue.length) {
    const index = queue.shift();
    const board = index === undefined ? undefined : boards[index];
    if (!board) throw new Error('Missing baseboard.');
    boards.forEach((other, i) => {
      if (!seen.has(i) && boardsTouch(board, other)) {
        seen.add(i);
        queue.push(i);
      }
    });
  }
  return seen.size === boards.length;
}

export function snapBoard(candidate: Board, others: readonly Board[], threshold: number): Board {
  let offset: Vec = { x: 0, y: 0 },
    best = threshold;
  const consider = (from: Vec, to: Vec) => {
    const gap = distance(from, to);
    if (gap < best) {
      best = gap;
      offset = { x: to.x - from.x, y: to.y - from.y };
    }
  };
  const own = boundaries(candidate);
  for (const other of others) {
    if (other.id === candidate.id) continue;
    const target = boundaries(other);
    for (const a of own)
      for (const b of target) {
        for (const point of boundaryFeatures(a)) consider(point, nearest(b, point));
        for (const point of boundaryFeatures(b)) consider(nearest(a, point), point);
      }
  }
  return { ...candidate, x: candidate.x + offset.x, y: candidate.y + offset.y };
}

export function moveBoardCorner(board: Board, index: number, world: Vec): Board {
  if (board.kind !== 'polygon' || !board.points[index]) throw new Error('Select a polygon corner.');
  const next: Board = {
    ...board,
    points: board.points.map((p, i) => (i === index ? boardLocal(board, world) : p)),
  };
  validateBoard(next);
  return next;
}

export function snapBoardPoint(point: Vec, boards: readonly Board[], threshold: number): Vec {
  let result = point,
    best = threshold;
  for (const board of boards)
    for (const edge of boundaries(board)) {
      const candidate = nearest(edge, point);
      const gap = distance(point, candidate);
      if (gap < best) {
        result = candidate;
        best = gap;
      }
    }
  return result;
}

function arcCommands(radius: number, start: number, sweep: number): string {
  const steps = Math.ceil(Math.abs(sweep) / 180);
  let result = '';
  for (let i = 1; i <= steps; i++) {
    const end = polar(radius, start + (sweep * i) / steps);
    result += ` A${radius},${radius} 0 0 ${sweep > 0 ? 1 : 0} ${end.x},${end.y}`;
  }
  return result;
}

export function boardPath(board: Board): string {
  if (board.kind === 'polygon')
    return board.points.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ') + ' Z';
  const sweep = board.kind === 'circle' ? 360 : board.sweep;
  let path = `M${board.radius},0` + arcCommands(board.radius, 0, sweep);
  if (board.kind === 'arc' && board.innerRadius) {
    const end = polar(board.innerRadius, sweep);
    path += ` L${end.x},${end.y}` + arcCommands(board.innerRadius, sweep, -sweep);
  } else if (sweep !== 360) path += ' L0,0';
  return path + ' Z';
}

export const boardPresets = [
  { name: '1000 x 500 mm', width: 1000, height: 500 },
  { name: '1000 x 250 mm', width: 1000, height: 250 },
  { name: '500 x 500 mm', width: 500, height: 500 },
  { name: '500 x 250 mm', width: 500, height: 250 },
  { name: '250 x 250 mm', width: 250, height: 250 },
  { name: '250 mm right triangle', width: 250, height: 250, triangle: true },
] as const;
