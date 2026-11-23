import type { Route, TrackCategory, TrackDefinition } from './model';
import { manufacturerProfile, scaleProfile } from './profiles';

function track(
  code: string,
  name: string,
  routes: Route[],
  slug: string,
  category: TrackCategory,
  geometryNote?: string,
): TrackDefinition {
  return profileTrack(
    'hornby-oo',
    code,
    name,
    routes,
    `https://uk.hornby.com/products/${slug}-${code.toLowerCase()}`,
    category,
    geometryNote,
  );
}

// TODO: Add R460/R462/R463/R464 furniture after verified widths and curved footprints are available.
// Product lengths alone cannot support reliable placement or train-clearance checks.
export const catalog: readonly TrackDefinition[] = [
  track('R600', 'Straight', [{ kind: 'straight', length: 168 }], 'straight-track', 'straights'),
  track(
    'R601',
    'Double straight',
    [{ kind: 'straight', length: 335 }],
    'double-straight',
    'straights',
  ),
  track('R603', 'Long straight', [{ kind: 'straight', length: 670 }], 'long-straight', 'straights'),
  track(
    'R610',
    'Quarter straight',
    [{ kind: 'straight', length: 38 }],
    'quarter-straight',
    'straights',
  ),
  track(
    'R618',
    'Double isolating straight',
    [{ kind: 'straight', length: 168 }],
    'double-isolating-track',
    'straights',
  ),
  track('R8206', 'Power track', [{ kind: 'straight', length: 168 }], 'power-track', 'straights'),
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
    {
      code: 'R607',
      radius: 438,
      angle: 45,
      name: '2nd radius double',
      slug: 'double-curve-2nd-radius',
    },
    { code: 'R608', radius: 505, angle: 22.5, name: '3rd radius', slug: 'curve-3rd-radius' },
    {
      code: 'R609',
      radius: 505,
      angle: 45,
      name: '3rd radius double',
      slug: 'double-curve-3rd-radius',
    },
    {
      code: 'R643',
      radius: 438,
      angle: 11.25,
      name: '2nd radius half',
      slug: 'half-curve-2nd-radius',
    },
    {
      code: 'R628',
      radius: 852,
      angle: 11.25,
      name: 'Express / Y countercurve',
      slug: 'half-curve-33-large-radius',
    },
    { code: 'R8261', radius: 572, angle: 22.5, name: '4th radius', slug: 'curve-4th-radius' },
    {
      code: 'R8262',
      radius: 572,
      angle: 45,
      name: '4th radius double',
      slug: 'double-curve-4th-radius',
    },
  ].map(({ code, radius, angle, name, slug }) =>
    track(code, name, [{ kind: 'arc', radius, angle }], slug, 'curves'),
  ),
  track(
    'R8072',
    'Left-hand point',
    [
      { kind: 'straight', length: 168 },
      { kind: 'arc', radius: 438, angle: -22.5 },
    ],
    'left-hand-point',
    'points',
    'Idealised shared-origin branch, not manufacturer CAD.',
  ),
  track(
    'R8073',
    'Right-hand point',
    [
      { kind: 'straight', length: 168 },
      { kind: 'arc', radius: 438, angle: 22.5 },
    ],
    'right-hand-point',
    'points',
    'Idealised shared-origin branch, not manufacturer CAD.',
  ),
  ...([-1, 1] as const).map((sign) =>
    track(
      sign < 0 ? 'R8074' : 'R8075',
      `${sign < 0 ? 'Left' : 'Right'}-hand curved point`,
      [
        { kind: 'arc', radius: 438, angle: sign * 33.75 },
        {
          kind: 'compound',
          segments: [
            { kind: 'straight', length: 67 },
            { kind: 'arc', radius: 438, angle: sign * 22.5 },
          ],
        },
      ],
      `${sign < 0 ? 'left' : 'right'}-hand-curved-point`,
      'points',
      'Approximate 438 mm branches: 33.75 degrees and a 67 mm lead plus 22.5 degrees. Connector positions need physical verification.',
    ),
  ),
  track(
    'R8076',
    'Y point',
    [
      { kind: 'arc', radius: 852, angle: -11.25 },
      { kind: 'arc', radius: 852, angle: 11.25 },
    ],
    'y-point',
    'points',
    'Idealised symmetric 852 mm / 11.25 degree branches; verify the real connector positions.',
  ),
  ...([-1, 1] as const).map((sign) =>
    track(
      sign < 0 ? 'R8077' : 'R8078',
      `${sign < 0 ? 'Left' : 'Right'}-hand express point`,
      [
        { kind: 'straight', length: 245 },
        {
          kind: 'compound',
          segments: [
            { kind: 'straight', length: 245 - 852 * Math.sin(Math.PI / 16) },
            { kind: 'arc', radius: 852, angle: sign * 11.25 },
          ],
        },
      ],
      `${sign < 0 ? 'left' : 'right'}-hand-express-point`,
      'points',
      '245 mm straight; idealised lead and 852 mm / 11.25 degree branch, not manufacturer CAD.',
    ),
  ),
  ...([-1, 1] as const).map((sign) => {
    const angle = sign * 22.5;
    const radians = (angle * Math.PI) / 180;
    return track(
      sign < 0 ? 'R614' : 'R615',
      `${sign < 0 ? 'Left' : 'Right'}-hand diamond crossing`,
      [
        { kind: 'straight', length: 168 },
        {
          kind: 'straight',
          length: 181,
          start: {
            x: 84 - 90.5 * Math.cos(radians),
            y: -90.5 * Math.sin(radians),
            angle,
          },
        },
      ],
      `diamond-crossing-${sign < 0 ? 'left' : 'right'}-hand`,
      'misc',
      '168 mm and 181 mm routes at 22.5 degrees, centred analytically; verify frog and connector geometry.',
    );
  }),
  ...[
    {
      code: 'ST-200',
      length: 168,
      name: 'Straight',
      slug: 'st200-peco-setrack-oo-ho-track-c100-standard-straight',
    },
    {
      code: 'ST-201',
      length: 335,
      name: 'Double straight',
      slug: 'st201-peco-setrack-oo-ho-track-c100-double-straight',
    },
    {
      code: 'ST-202',
      length: 79,
      name: 'Short straight',
      slug: 'st202-peco-setrack-oo-ho-track-c100-short-straight',
    },
    { code: 'ST-203', length: 41, name: 'Special short straight', slug: 'special-short-straight' },
    {
      code: 'ST-204',
      length: 670,
      name: 'Long straight',
      slug: 'st204-peco-setrack-oo-ho-track-c100-long-straight',
    },
  ].map(({ code, length, name, slug }) =>
    profileTrack(
      'peco-setrack-oo',
      code,
      name,
      [{ kind: 'straight', length }],
      `https://peco-uk.com/products/${slug}`,
      'straights',
    ),
  ),
  profileTrack(
    'peco-setrack-oo',
    'ST-220',
    '1st radius',
    [{ kind: 'arc', radius: 371, angle: 22.5 }],
    'https://peco-uk.com/products/standard-curve-1st-radius',
    'curves',
  ),
  profileTrack(
    'peco-setrack-oo',
    'ST-221',
    '1st radius double',
    [{ kind: 'arc', radius: 371, angle: 45 }],
    'https://peco-uk.com/products/st221-peco-setrack-oo-ho-track-c100-no-1-radius-double-curve',
    'curves',
  ),
  ...[
    { code: '36-600', length: 168, name: 'Straight' },
    { code: '36-601', length: 335, name: 'Double straight' },
    { code: '36-603', length: 670, name: 'Long straight' },
    { code: '36-610', length: 38, name: 'Quarter straight' },
  ].map(({ code, length, name }) =>
    profileTrack(
      'bachmann-oo',
      code,
      name,
      [{ kind: 'straight', length }],
      'https://www.bachmann.co.uk/category/model-railway/branchline/ootrack',
      'straights',
    ),
  ),
  ...[
    { code: '36-606', radius: 438, angle: 22.5, name: '2nd radius' },
    { code: '36-607', radius: 438, angle: 45, name: '2nd radius double' },
    { code: '36-608', radius: 505, angle: 22.5, name: '3rd radius' },
    { code: '36-609', radius: 505, angle: 45, name: '3rd radius double' },
    { code: '36-643', radius: 438, angle: 11.25, name: '2nd radius half' },
  ].map(({ code, radius, angle, name }) =>
    profileTrack(
      'bachmann-oo',
      code,
      name,
      [{ kind: 'arc', radius, angle }],
      'https://www.bachmann.co.uk/category/model-railway/branchline/ootrack',
      'curves',
    ),
  ),
];

function profileTrack(
  profileId: string,
  code: string,
  name: string,
  routes: Route[],
  source: string,
  category: TrackCategory,
  geometryNote?: string,
): TrackDefinition {
  const profile = manufacturerProfile(profileId);
  const scale = scaleProfile(profile.scaleProfileId);
  return {
    id: `${profileId}-${code.toLowerCase()}`,
    profileId,
    brand: profile.brand,
    scale: scale.scale,
    gaugeMm: scale.gaugeMm,
    centresMm: scale.planningCentresMm,
    code,
    name,
    routes,
    source,
    category,
    ...(geometryNote ? { geometryNote } : {}),
  };
}

export function trackSize(entry: TrackDefinition): string {
  const segmentSize = (route: Route): string => {
    if (route.kind === 'straight') return `${Math.round(route.length * 10) / 10} mm`;
    if (route.kind === 'arc') return `R${route.radius} mm / ${Math.abs(route.angle)} degrees`;
    return route.segments.map(segmentSize).join(' + ');
  };
  return entry.routes.map(segmentSize).join(' | ');
}

export function definition(id: string): TrackDefinition {
  const result = catalog.find((entry) => entry.id === id);
  if (!result)
    throw new Error('Unknown track catalog entry. This file may need a newer app version.');
  return result;
}
