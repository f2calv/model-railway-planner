import type { TrackDefinition } from './model';

export interface ScaleProfile {
  id: string;
  scale: string;
  ratio: number | null;
  gaugeMm: number;
  planningCentresMm: number | null;
  clearanceSource: string | null;
}

export const gaugeGroups = [
  { id: 'z', label: 'Z', gaugeMm: 6.5 },
  { id: 'n', label: 'N', gaugeMm: 9 },
  { id: 'tt', label: 'TT', gaugeMm: 12 },
  { id: 'oo-ho', label: 'OO/H0', gaugeMm: 16.5 },
  { id: 'o', label: 'O', gaugeMm: 32 },
  { id: 'g', label: 'G', gaugeMm: 45 },
] as const;

export interface ManufacturerProfile {
  id: string;
  brand: string;
  scaleProfileId: string;
  railCode: number | null;
  electricalSystem: 'two-rail' | 'three-rail';
}

export const scaleProfiles: readonly ScaleProfile[] = [
  {
    id: 'oo-hornby-envelope',
    scale: 'OO',
    ratio: 76,
    gaugeMm: 16.5,
    planningCentresMm: 67,
    clearanceSource: 'https://support.hornby.com/hc/en-gb/article_attachments/10406061442332',
  },
  ...[
    { id: 'z', scale: 'Z', ratio: 220, gaugeMm: 6.5 },
    { id: 'n-uk', scale: 'N', ratio: 148, gaugeMm: 9 },
    { id: 'tt', scale: 'TT', ratio: 120, gaugeMm: 12 },
    { id: 'o-uk', scale: 'O', ratio: 43.5, gaugeMm: 32 },
    { id: 'g45', scale: 'G45', ratio: null, gaugeMm: 45 },
  ].map((profile) => ({ ...profile, planningCentresMm: null, clearanceSource: null })),
];

export const manufacturerProfiles: readonly ManufacturerProfile[] = [
  {
    id: 'hornby-oo',
    brand: 'Hornby',
    scaleProfileId: 'oo-hornby-envelope',
    railCode: null,
    electricalSystem: 'two-rail',
  },
  {
    id: 'peco-setrack-oo',
    brand: 'Peco',
    scaleProfileId: 'oo-hornby-envelope',
    railCode: 100,
    electricalSystem: 'two-rail',
  },
  {
    id: 'bachmann-oo',
    brand: 'Bachmann',
    scaleProfileId: 'oo-hornby-envelope',
    railCode: null,
    electricalSystem: 'two-rail',
  },
  {
    id: 'marklin-z',
    brand: 'Märklin',
    scaleProfileId: 'z',
    railCode: null,
    electricalSystem: 'two-rail',
  },
  {
    id: 'peco-setrack-n',
    brand: 'Peco',
    scaleProfileId: 'n-uk',
    railCode: 80,
    electricalSystem: 'two-rail',
  },
  {
    id: 'hornby-tt',
    brand: 'Hornby',
    scaleProfileId: 'tt',
    railCode: 80,
    electricalSystem: 'two-rail',
  },
  {
    id: 'peco-setrack-o',
    brand: 'Peco',
    scaleProfileId: 'o-uk',
    railCode: 124,
    electricalSystem: 'two-rail',
  },
  {
    id: 'peco-setrack-g45',
    brand: 'Peco',
    scaleProfileId: 'g45',
    railCode: 250,
    electricalSystem: 'two-rail',
  },
];

export function trackWidth(entry: TrackDefinition): number {
  return (30 * entry.gaugeMm) / 16.5;
}

export function scaleProfile(id: string): ScaleProfile {
  const profile = scaleProfiles.find((entry) => entry.id === id);
  if (!profile) throw new Error('Unknown scale profile.');
  return profile;
}

export function manufacturerProfile(id: string): ManufacturerProfile {
  const profile = manufacturerProfiles.find((entry) => entry.id === id);
  if (!profile) throw new Error('Unknown manufacturer profile.');
  return profile;
}

export function compatibleProfiles(a: ManufacturerProfile, b: ManufacturerProfile): boolean {
  return (
    scaleProfile(a.scaleProfileId).gaugeMm === scaleProfile(b.scaleProfileId).gaugeMm &&
    a.electricalSystem === b.electricalSystem &&
    (a.railCode === null || b.railCode === null || a.railCode === b.railCode)
  );
}

export function planningCompatible(a: TrackDefinition, b: TrackDefinition): boolean {
  return (
    a.gaugeMm === b.gaugeMm &&
    compatibleProfiles(manufacturerProfile(a.profileId), manufacturerProfile(b.profileId))
  );
}
