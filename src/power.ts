import { definition } from './catalog';
import { connected, ports, routePose, world } from './geometry';
import { planningCompatible } from './profiles';
import type { ElectricalSettings, Layout, Piece } from './model';

export type PowerStatus = 'powered' | 'unpowered' | 'partial' | 'unverified';
export interface PowerRoute {
  pieceId: string;
  route: number;
  status: PowerStatus;
}
export interface PowerAnalysis {
  routes: PowerRoute[];
  warnings: string[];
  feeds: number;
}
export const powerAccessoryIds = ['hornby-oo-r602', 'hornby-oo-r8242', 'hornby-oo-r8232'] as const;

export function powerSupplies(piece: Piece): { id: string; quantity: number }[] {
  const settings = piece.electrical;
  return [
    ...(settings?.feed?.kind === 'r602' ? [{ id: powerAccessoryIds[0], quantity: 1 }] : []),
    ...(settings?.feed?.kind === 'r8242' ? [{ id: powerAccessoryIds[1], quantity: 1 }] : []),
    ...(settings?.bypass === 'clips' ? [{ id: powerAccessoryIds[2], quantity: 2 }] : []),
  ];
}

export function validateElectrical(piece: Piece): void {
  const settings = piece.electrical;
  if (!settings) return;
  const entry = definition(piece.trackId);
  const terminals = ports(piece);
  if (entry.attachment)
    throw new Error('Power settings belong on track, not a free-standing accessory.');
  if (
    settings.pointRoute !== undefined &&
    (entry.electrical?.behavior !== 'turnout' ||
      (settings.pointRoute !== 0 && settings.pointRoute !== 1))
  )
    throw new Error('Choose a supported point route.');
  if (
    settings.bypass !== undefined &&
    (entry.electrical?.behavior !== 'turnout' || !['clips', 'soldered'].includes(settings.bypass))
  )
    throw new Error('Point bypasses require a supported Hornby point.');
  const feed = settings.feed;
  if (!feed) return;
  if (
    !['native', 'r602', 'r8242', 'manual'].includes(feed.kind) ||
    typeof feed.connected !== 'boolean' ||
    !Number.isInteger(feed.port) ||
    feed.port < 0 ||
    feed.port >= terminals.length
  )
    throw new Error('Choose a valid power feed connector.');
  if (feed.kind === 'native' && !entry.electrical?.nativeFeed)
    throw new Error('Native feeds require R8206 or R8241 power track.');
  if (
    (feed.kind === 'r602' || feed.kind === 'r8242') &&
    !['hornby-oo-r600', 'hornby-oo-r601'].includes(piece.trackId)
  )
    throw new Error(
      'Clip placement is modelled on R600 and R601 only. Verify physical fit elsewhere and use a manual feed.',
    );
}

export function attachPowerAccessory(piece: Piece, id: string): ElectricalSettings {
  const settings = { ...piece.electrical };
  switch (id) {
    case 'hornby-oo-r602':
      settings.feed = { kind: 'r602', port: 0, connected: false };
      break;
    case 'hornby-oo-r8242':
      settings.feed = { kind: 'r8242', port: 0, connected: false };
      break;
    case 'hornby-oo-r8232':
      settings.bypass = 'clips';
      break;
    default:
      throw new Error('Unknown power accessory.');
  }
  validateElectrical({ ...piece, electrical: settings });
  return settings;
}

export function analyzePower(layout: Layout): PowerAnalysis {
  if (!layout.powerMode) return { routes: [], warnings: [], feeds: 0 };
  const definite = new Map<string, Set<string>>();
  const possible = new Map<string, Set<string>>();
  const roots = new Set<string>();
  const warnings = new Set<string>();
  const terminals = layout.pieces.map((piece) => ({ piece, ports: ports(piece) }));
  const node = (id: string, port: number) => `${id}:${port}`;
  const peersByNode = new Map<string, string[]>();
  for (const { piece, ports: own } of terminals) {
    own.forEach((port, index) => {
      const peers = terminals.flatMap((other) =>
        other.piece.id === piece.id ||
        !planningCompatible(definition(piece.trackId), definition(other.piece.trackId))
          ? []
          : other.ports.flatMap((candidate, i) =>
              connected(port, candidate) ? [node(other.piece.id, i)] : [],
            ),
      );
      peersByNode.set(node(piece.id, index), peers);
    });
  }
  const link = (graph: Map<string, Set<string>>, a: string, b: string) => {
    if (!graph.has(a)) graph.set(a, new Set());
    if (!graph.has(b)) graph.set(b, new Set());
    graph.get(a)?.add(b);
    graph.get(b)?.add(a);
  };
  const join = (a: string, b: string, certain = true) => {
    link(possible, a, b);
    if (certain) link(definite, a, b);
  };
  const routePorts = (piece: Piece, route: number): [number, number] => {
    const definitionRoute = definition(piece.trackId).routes[route];
    if (!definitionRoute) throw new Error('Missing electrical route.');
    const piecePorts = ports(piece);
    const start = world(piece, {
      ...routePose(definitionRoute, 0),
      angle: routePose(definitionRoute, 0).angle + 180,
    });
    const end = world(piece, routePose(definitionRoute, 1));
    const find = (target: typeof start) =>
      piecePorts.findIndex(
        (port) =>
          Math.hypot(port.x - target.x, port.y - target.y) < 0.25 &&
          Math.abs(((port.angle - target.angle + 540) % 360) - 180) < 0.1,
      );
    const a = find(start),
      b = find(end);
    if (a < 0 || b < 0) throw new Error('Electrical route has no matching connector.');
    return [a, b];
  };
  for (const { piece, ports: own } of terminals) {
    validateElectrical(piece);
    const entry = definition(piece.trackId),
      settings = piece.electrical;
    const behavior = entry.electrical?.behavior ?? 'unverified';
    own.forEach((_, index) => {
      const peers = peersByNode.get(node(piece.id, index)) ?? [];
      if (peers.length > 1)
        warnings.add('Ambiguous connector joins prevent a reliable power result.');
      for (const peer of peers)
        join(
          node(piece.id, index),
          peer,
          peers.length === 1 && peersByNode.get(peer)?.length === 1,
        );
    });
    entry.routes.forEach((_, route) => {
      const [a, b] = routePorts(piece, route);
      if (behavior === 'isolating') return;
      if (behavior === 'turnout') {
        if (settings?.bypass || settings?.pointRoute === route)
          join(node(piece.id, a), node(piece.id, b));
        else if (settings?.pointRoute === undefined)
          join(node(piece.id, a), node(piece.id, b), false);
      } else join(node(piece.id, a), node(piece.id, b), behavior !== 'unverified');
    });
    if (behavior === 'unverified') {
      for (let i = 1; i < own.length; i++) join(node(piece.id, 0), node(piece.id, i), false);
    }
    if (
      layout.powerMode === 'dcc' &&
      (entry.electrical?.nativeFeed === 'dc' || settings?.feed?.kind === 'r602')
    )
      warnings.add(
        'Factory R8206/R602 DC hardware is not DCC-compatible. Verify the actual hardware.',
      );
    const feed = settings?.feed;
    if (feed?.connected) {
      const kind: 'dc' | 'dcc' | undefined =
        feed.kind === 'manual'
          ? layout.powerMode
          : feed.kind === 'native'
            ? entry.electrical?.nativeFeed
            : feed.kind === 'r602'
              ? 'dc'
              : 'dcc';
      if (kind !== layout.powerMode)
        warnings.add('A connected feed does not match the selected DC/DCC system and is ignored.');
      else roots.add(node(piece.id, feed.port));
    }
  }
  const reachable = (graph: Map<string, Set<string>>) => {
    const visited = new Set(roots),
      queue = [...roots];
    for (let i = 0; i < queue.length; i++)
      for (const peer of graph.get(queue[i] ?? '') ?? [])
        if (!visited.has(peer)) {
          visited.add(peer);
          queue.push(peer);
        }
    return visited;
  };
  const live = reachable(definite),
    maybe = reachable(possible);
  const routes: PowerRoute[] = layout.pieces.flatMap((piece) => {
    const entry = definition(piece.trackId);
    return entry.routes.map((_, route): PowerRoute => {
      const [a, b] = routePorts(piece, route);
      const start = node(piece.id, a),
        end = node(piece.id, b);
      let status: PowerStatus;
      if ((entry.electrical?.behavior ?? 'unverified') === 'unverified') status = 'unverified';
      else if (entry.electrical?.behavior === 'turnout') {
        if (!piece.electrical?.bypass && piece.electrical?.pointRoute === undefined)
          status = 'unverified';
        else status = live.has(end) ? 'powered' : maybe.has(end) ? 'unverified' : 'unpowered';
      } else if (live.has(start) && live.has(end)) status = 'powered';
      else if (maybe.has(start) || maybe.has(end)) {
        status =
          entry.electrical?.behavior === 'isolating' && (live.has(start) || live.has(end))
            ? 'partial'
            : 'unverified';
      } else status = 'unpowered';
      return { pieceId: piece.id, route, status };
    });
  });
  if (!roots.size) warnings.add('No compatible connected power feed is marked.');
  if (
    layout.powerMode === 'dcc' &&
    routes.some((route) => route.status === 'unpowered' || route.status === 'partial')
  )
    warnings.add(
      'DCC has unpowered or partially powered routes. Check feeds, point positions and bypasses.',
    );
  if (routes.some((route) => route.status === 'unverified'))
    warnings.add(
      'Some routes have unverified electrical continuity. This is not an all-powered result.',
    );
  return { routes, warnings: [...warnings], feeds: roots.size };
}
