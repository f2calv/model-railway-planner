import type { Route, TrackDefinition } from './model';

function track(code: string, name: string, routes: Route[], slug: string): TrackDefinition {
  return {
    id: `hornby-oo-${code.toLowerCase()}`,
    code,
    name,
    brand: 'Hornby',
    scale: 'OO',
    gaugeMm: 16.5,
    centresMm: 67,
    routes,
    source: `https://uk.hornby.com/products/${slug}-${code.toLowerCase()}`,
  };
}

export const catalog: readonly TrackDefinition[] = [
  track('R600', 'Straight', [{ kind: 'straight', length: 168 }], 'straight-track'),
  track('R601', 'Double straight', [{ kind: 'straight', length: 335 }], 'double-straight'),
  ...[
    { code: 'R604', radius: 371, angle: 22.5, name: '1st radius', slug: 'curve-1st-radius' },
    {
      code: 'R605',
      radius: 371,
      angle: 45,
      name: '1st radius double',
      slug: 'double-curve-1st-radius',
    },
    { code: 'R606', radius: 438, angle: 22.5, name: '2nd radius', slug: 'curve-2nd-radius' },
    { code: 'R608', radius: 505, angle: 22.5, name: '3rd radius', slug: 'curve-3rd-radius' },
    {
      code: 'R609',
      radius: 505,
      angle: 45,
      name: '3rd radius double',
      slug: 'double-curve-3rd-radius',
    },
  ].map(({ code, radius, angle, name, slug }) =>
    track(code, name, [{ kind: 'arc', radius, angle }], slug),
  ),
  track(
    'R8072',
    'Left-hand point',
    [
      { kind: 'straight', length: 168 },
      { kind: 'arc', radius: 438, angle: -22.5 },
    ],
    'left-hand-point',
  ),
  track(
    'R8073',
    'Right-hand point',
    [
      { kind: 'straight', length: 168 },
      { kind: 'arc', radius: 438, angle: 22.5 },
    ],
    'right-hand-point',
  ),
];

export function definition(id: string): TrackDefinition {
  const result = catalog.find((entry) => entry.id === id);
  if (!result)
    throw new Error('Unknown track catalog entry. This file may need a newer app version.');
  return result;
}
