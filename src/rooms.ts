import { boardBounds, containsBoard } from './baseboards';
import { placementProblem } from './geometry';
import type { Board, PlannerState, Vec } from './model';
import { activeLayout, assignedRoom } from './state';

function outlineSamples(board: Board): Vec[] {
  const points: Vec[] = [];
  const angle = (board.angle * Math.PI) / 180;
  const include = (point: Vec) =>
    points.push({
      x: board.x + point.x * Math.cos(angle) - point.y * Math.sin(angle),
      y: board.y + point.x * Math.sin(angle) + point.y * Math.cos(angle),
    });
  if (board.kind === 'polygon') {
    board.points.forEach((a, i) => {
      const b = board.points[(i + 1) % board.points.length];
      if (!b) throw new Error('Missing shape corner.');
      for (let j = 0; j <= 32; j++)
        include({ x: a.x + ((b.x - a.x) * j) / 32, y: a.y + ((b.y - a.y) * j) / 32 });
    });
  } else roundOutlineSamples(board).forEach(include);
  const bounds = boardBounds(board);
  const centre = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  if (containsBoard(board, centre)) points.push(centre);
  return points;
}

function roundOutlineSamples(board: Exclude<Board, { kind: 'polygon' }>): Vec[] {
  const sweep = board.kind === 'circle' ? 360 : board.sweep;
  const radii = board.kind === 'circle' ? [board.radius] : [board.radius, board.innerRadius];
  const points = radii.flatMap((radius) =>
    Array.from({ length: 73 }, (_, i) => {
      const radians = (((sweep * i) / 72) * Math.PI) / 180;
      return { x: radius * Math.cos(radians), y: radius * Math.sin(radians) };
    }),
  );
  if (board.kind === 'arc' && sweep < 360)
    for (const degrees of [0, sweep])
      for (let i = 0; i <= 32; i++) {
        const radius = board.innerRadius + ((board.radius - board.innerRadius) * i) / 32;
        points.push({
          x: radius * Math.cos((degrees * Math.PI) / 180),
          y: radius * Math.sin((degrees * Math.PI) / 180),
        });
      }
  return points;
}

export function roomProblems(state: PlannerState): string[] {
  const room = assignedRoom(state);
  if (!room) return [];
  const outline = room.shapes.find((entry) => entry.role === 'outline')?.shape;
  if (!outline)
    return ['The selected room has no outline. Add a room outline to check dimensions.'];
  const layout = activeLayout(state);
  const outside = (board: Board) =>
    outlineSamples(board).some((point) => !containsBoard(outline, point));
  return [
    ...(layout.boards.some(outside) ? ['Baseboard extends outside the selected room.'] : []),
    ...(layout.pieces.some((piece) => placementProblem(piece, [], [outline])?.kind === 'board')
      ? ['Track extends outside the selected room.']
      : []),
    ...(room.shapes.some((entry) => entry.role === 'furniture' && outside(entry.shape))
      ? ['Furniture extends outside the room outline.']
      : []),
  ];
}
