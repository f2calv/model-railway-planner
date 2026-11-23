export interface Vec {
  x: number;
  y: number;
}

export interface Pose extends Vec {
  angle: number;
}

export type Segment =
  { kind: 'straight'; length: number } | { kind: 'arc'; radius: number; angle: number };

export type Route = (Segment | { kind: 'compound'; segments: readonly Segment[] }) & {
  start?: Pose;
};

export type TrackCategory = 'straights' | 'curves' | 'points' | 'misc';

export interface TrackDefinition {
  id: string;
  code: string;
  name: string;
  brand: string;
  profileId: string;
  scale: string;
  gaugeMm: number;
  centresMm: number;
  routes: readonly Route[];
  source: string;
  category: TrackCategory;
  geometryNote?: string;
}

export interface Piece extends Pose {
  id: string;
  trackId: string;
  flipped: boolean;
  locked?: boolean;
}

export interface Board extends Vec {
  width: number;
  height: number;
}

export interface Layout {
  id: string;
  name: string;
  pieces: Piece[];
  boards: Board[];
}

export interface PlannerState {
  version: 2;
  inventory: Record<string, number>;
  layouts: Layout[];
  activeLayoutId: string;
}

export interface Problem {
  kind: 'overlap' | 'spacing' | 'board' | 'connection';
  message: string;
}
