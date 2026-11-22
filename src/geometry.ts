import { definition } from './catalog';
import type { Board, Piece, Pose, Problem, Route, Vec } from './model';

const radians = (degrees: number) => (degrees * Math.PI) / 180;
export const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
export const normalize = (angle: number) => ((angle % 360) + 360) % 360;
const angleDifference = (a: number, b: number) => Math.abs(((normalize(a - b) + 180) % 360) - 180);

export function routePose(route: Route, t: number): Pose {
  if (route.kind === 'straight') return { x: route.length * t, y: 0, angle: 0 };
  const angle = route.angle * t;
  return {
    x: route.radius * Math.sin(radians(Math.abs(angle))),
    y: Math.sign(angle) * route.radius * (1 - Math.cos(radians(angle))),
    angle,
  };
}

export function world(piece: Piece, point: Pose): Pose {
  const sign = piece.flipped ? -1 : 1;
  const c = Math.cos(radians(piece.angle));
  const s = Math.sin(radians(piece.angle));
  return {
    x: piece.x + point.x * c - point.y * sign * s,
    y: piece.y + point.x * s + point.y * sign * c,
    angle: normalize(piece.angle + point.angle * sign),
  };
}

export function ports(piece: Piece): Pose[] {
  return [
    world(piece, { x: 0, y: 0, angle: 180 }),
    ...definition(piece.trackId).routes.map((route) => world(piece, routePose(route, 1))),
  ];
}

export function connected(a: Pose, b: Pose): boolean {
  return distance(a, b) < 0.25 && angleDifference(a.angle, b.angle + 180) < 0.1;
}

export function samples(piece: Piece): Pose[][] {
  return definition(piece.trackId).routes.map((route) => {
    const length =
      route.kind === 'straight' ? route.length : route.radius * radians(Math.abs(route.angle));
    const steps = Math.ceil(length / 5);
    return Array.from({ length: steps + 1 }, (_, i) => world(piece, routePose(route, i / steps)));
  });
}

export function pathData(route: Route): string {
  const end = routePose(route, 1);
  return route.kind === 'straight'
    ? `M0,0 L${end.x},${end.y}`
    : `M0,0 A${route.radius},${route.radius} 0 0 ${route.angle > 0 ? 1 : 0} ${end.x},${end.y}`;
}

export interface Snap {
  piece: Piece;
  target: Pose;
}

export function snapPiece(
  candidate: Piece,
  others: readonly Piece[],
  threshold: number,
): Snap | null {
  const ownPorts = ports(candidate);
  const targets = others.flatMap((other) =>
    ports(other).filter(
      (port) =>
        !others.some((peer) => peer.id !== other.id && ports(peer).some((p) => connected(p, port))),
    ),
  );
  const localPorts = ports({ ...candidate, x: 0, y: 0, angle: 0 });
  let best: Snap | null = null;
  let bestDistance = threshold;
  ownPorts.forEach((own, index) => {
    const local = localPorts[index];
    if (!local) return;
    for (const target of targets) {
      const d = distance(own, target);
      if (d >= bestDistance) continue;
      const angle = normalize(target.angle + 180 - local.angle);
      // localPorts already includes mirroring; rotate that offset without mirroring twice.
      const rotated = world(
        { ...candidate, x: 0, y: 0, angle, flipped: false },
        { ...local, angle: 0 },
      );
      best = {
        piece: { ...candidate, angle, x: target.x - rotated.x, y: target.y - rotated.y },
        target,
      };
      bestDistance = d;
    }
  });
  return best;
}

function inBoard(p: Vec, boards: readonly Board[]): boolean {
  return boards.some(
    (board) =>
      p.x >= board.x &&
      p.x <= board.x + board.width &&
      p.y >= board.y &&
      p.y <= board.y + board.height,
  );
}

export function joinedBoards(boards: readonly Board[]): boolean {
  if (boards.length < 2) return true;
  const seen = new Set<number>([0]);
  for (let changed = true; changed;) {
    changed = false;
    boards.forEach((a, i) => {
      if (!seen.has(i)) return;
      boards.forEach((b, j) => {
        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        if (!seen.has(j) && overlapX >= 0 && overlapY >= 0 && (overlapX > 0 || overlapY > 0)) {
          seen.add(j);
          changed = true;
        }
      });
    });
  }
  return seen.size === boards.length;
}

function pointSegment(p: Vec, a: Vec, b: Vec): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}

function segmentDistance(a: Vec, b: Vec, c: Vec, d: Vec): number {
  const cross = (u: Vec, v: Vec, w: Vec) => (v.x - u.x) * (w.y - u.y) - (v.y - u.y) * (w.x - u.x);
  if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) return 0;
  return Math.min(
    pointSegment(a, c, d),
    pointSegment(b, c, d),
    pointSegment(c, a, b),
    pointSegment(d, a, b),
  );
}

export function placementProblem(
  candidate: Piece,
  others: readonly Piece[],
  boards: readonly Board[],
): Problem | null {
  const routes = samples(candidate);
  if (
    boards.length &&
    routes.flat().some((p) =>
      Array.from({ length: 8 }, (_, i) => ({
        x: p.x + 15 * Math.cos((i * Math.PI) / 4),
        y: p.y + 15 * Math.sin((i * Math.PI) / 4),
      })).some((edge) => !inBoard(edge, boards)),
    )
  )
    return { kind: 'board', message: 'Track footprint must stay inside the baseboard.' };

  const candidatePorts = ports(candidate);
  for (const port of candidatePorts) {
    const matches = others.flatMap((p) => ports(p)).filter((p) => connected(port, p));
    if (matches.length > 1)
      return { kind: 'connection', message: 'That connector is already occupied.' };
  }
  for (const other of others) {
    const otherPorts = ports(other);
    const joints = candidatePorts.filter((a) => otherPorts.some((b) => connected(a, b)));
    const commonPoint = others.find(
      (p) =>
        p.id !== other.id &&
        definition(p.trackId).routes.length > 1 &&
        ports(p).some((port) => candidatePorts.some((a) => connected(a, port))) &&
        ports(p).some((port) => otherPorts.some((b) => connected(b, port))),
    );
    const fanPorts = commonPoint ? ports(commonPoint) : [];
    const separation = Math.max(
      definition(candidate.trackId).centresMm,
      definition(other.trackId).centresMm,
    );
    for (const aRoute of routes) {
      for (const bRoute of samples(other)) {
        for (let i = 1; i < aRoute.length; i++) {
          const a = aRoute[i - 1];
          const b = aRoute[i];
          if (!a || !b) continue;
          for (let j = 1; j < bRoute.length; j++) {
            const c = bRoute[j - 1];
            const d = bRoute[j];
            if (!c || !d) continue;
            const gap = segmentDistance(a, b, c, d);
            const nearJoint = joints.some(
              (port) =>
                Math.max(distance(a, port), distance(b, port)) <= separation &&
                Math.max(distance(c, port), distance(d, port)) <= separation,
            );
            if (nearJoint) continue;
            if (gap < 29.9)
              return {
                kind: 'overlap',
                message: 'Track overlaps another piece or crosses it at the same level.',
              };
            const delta = angleDifference(b.angle, d.angle);
            const length = distance(a, b);
            const projection = (p: Vec) =>
              ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / length;
            const overlap =
              Math.min(length, Math.max(projection(c), projection(d))) -
              Math.max(0, Math.min(projection(c), projection(d)));
            const parallel = (delta < 20 || delta > 160) && overlap > 0.1;
            const nearTurnout =
              (definition(candidate.trackId).routes.length > 1 ||
                definition(other.trackId).routes.length > 1) &&
              joints.some(
                (port) => distance(a, port) < separation * 3 && distance(c, port) < separation * 3,
              );
            const nearFan =
              fanPorts.some((p) => distance(a, p) < separation * 3) &&
              fanPorts.some((p) => distance(c, p) < separation * 3);
            if (parallel && gap < separation - 0.5 && !nearFan && !nearTurnout) {
              return {
                kind: 'spacing',
                message: `Parallel tracks need ${separation} mm between centres. Check rolling-stock clearance on curves.`,
              };
            }
          }
        }
      }
    }
  }
  return null;
}
