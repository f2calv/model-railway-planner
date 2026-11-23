import type { TrackDefinition } from './model';

export interface ScaleProfile {
  id: string;
  scale: string;
  ratio: number;
  gaugeMm: number;
  planningCentresMm: number;
  clearanceSource: string;
}

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
];

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
