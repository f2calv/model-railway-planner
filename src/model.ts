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
  attachment?: { minLengthMm: number };
  electrical?: {
    behavior: 'continuous' | 'turnout' | 'isolating' | 'independent' | 'unverified';
    nativeFeed?: 'dc' | 'dcc';
    accessory?: 'dc-feed' | 'dcc-feed' | 'point-clips';
  };
}

export interface ElectricalSettings {
  feed?: { kind: 'native' | 'r602' | 'r8242' | 'manual'; port: number; connected: boolean };
  pointRoute?: 0 | 1;
  bypass?: 'clips' | 'soldered';
}

export interface Piece extends Pose {
  id: string;
  trackId: string;
  flipped: boolean;
  locked?: boolean;
  accessories?: string[];
  electrical?: ElectricalSettings;
}

export type Board = Pose & { id: string } & (
    | { kind: 'polygon'; points: Vec[] }
    | { kind: 'circle'; radius: number }
    | { kind: 'arc'; radius: number; innerRadius: number; sweep: number }
  );

export interface Layout {
  id: string;
  name: string;
  pieces: Piece[];
  boards: Board[];
  roomId?: string;
  powerMode?: 'dc' | 'dcc';
}

export interface RoomShape {
  name: string;
  role: 'outline' | 'furniture';
  shape: Board;
}

export interface Room {
  id: string;
  name: string;
  shapes: RoomShape[];
}

export interface PlannerState {
  version: 6;
  rooms: Room[];
  inventory: Record<string, number>;
  layouts: Layout[];
  activeLayoutId: string;
}

export interface Problem {
  kind: 'overlap' | 'spacing' | 'board' | 'connection';
  message: string;
}
