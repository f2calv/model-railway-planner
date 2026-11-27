import { describe, expect, it } from 'vitest';
import {
  catalogBrands,
  catalogManufacturers,
  definition,
  filterCatalog,
  matchesCatalogQuery,
} from './catalog';
import { compatibleProfiles, gaugeGroups, manufacturerProfile, trackWidth } from './profiles';
import { connected, placementProblem, ports, snapPiece } from './geometry';
import { rectangleBoard } from './baseboards';
import { drawingLayers, svgExport } from './exports';
import { activeLayout, emptyState, parseState, putPiece, setInventory, used } from './state';
import type { Piece } from './model';

const piece = (id: string, trackId: string, x = 0, y = 0): Piece => ({
  id,
  trackId,
  x,
  y,
  angle: 0,
  flipped: false,
});

describe('gauge catalogs', () => {
  it('filters brands and track categories with case-insensitive text or literal-safe wildcards', () => {
    const curves = filterCatalog({ gauge: 'oo-ho', brand: 'Hornby', query: ' CuRvE ' });
    expect(curves.map((entry) => entry.code)).toEqual(expect.arrayContaining(['R606', 'R609']));
    expect(curves.some((entry) => entry.code === 'R600')).toBe(false);
    const codes = filterCatalog({ gauge: 'oo-ho', brand: 'Hornby', query: 'R60?' }).map(
      (entry) => entry.code,
    );
    expect(codes).toEqual(expect.arrayContaining(['R600', 'R609']));
    expect(codes).not.toContain('R610');
    expect(filterCatalog({ query: 'r6*radius*double' }).map((entry) => entry.code)).toContain(
      'R607',
    );
    expect(filterCatalog({ query: '.*[curve]' })).toEqual([]);
    expect(filterCatalog({ query: '   ' })).toHaveLength(filterCatalog().length);
    expect(matchesCatalogQuery(definition('hornby-oo-r600'), '*ger?de*')).toBe(true);
    const peco = filterCatalog({ brand: 'Peco' });
    expect(new Set(peco.map((entry) => entry.gaugeMm)).size).toBeGreaterThan(1);
    expect(catalogBrands().filter((brand) => brand === 'Peco')).toHaveLength(1);
  });

  it('searches translated names and category forms in every supported language without changing product names', () => {
    for (const query of [
      'curve',
      'curves',
      'Kurve',
      'Kurven',
      'courbe',
      'courbes',
      'curva',
      'curvas',
    ]) {
      const matches = filterCatalog({ gauge: 'oo-ho', brand: 'Hornby', query });
      expect(
        matches.map((entry) => entry.code),
        query,
      ).toContain('R606');
      expect(
        matches.map((entry) => entry.code),
        query,
      ).not.toContain('R600');
    }
    for (const query of [
      '2nd radius double',
      'Radius 2 doppelt',
      'Rayon 2 double',
      'Radio 2 doble',
      'Raggio 2 doppio',
    ]) {
      expect(
        filterCatalog({ brand: 'Hornby', query }).map((entry) => entry.code),
        query,
      ).toContain('R607');
    }
    for (const query of ['Gerade', 'Droit', 'Recta', 'Dritto']) {
      expect(matchesCatalogQuery(definition('hornby-oo-r600'), query), query).toBe(true);
      expect(matchesCatalogQuery(definition('hornby-oo-r606'), query), query).toBe(false);
    }
    expect(matchesCatalogQuery(definition('hornby-oo-r8241'), 'nume\u0301rique')).toBe(true);
    expect(matchesCatalogQuery(definition('hornby-oo-r8072'), 'DESV?O IZQUIERDO')).toBe(true);
    expect(definition('hornby-oo-r606').name).toBe('2nd radius');
  });

  it('derives manufacturers and piece lists only from the selected gauge', () => {
    for (const gauge of gaugeGroups) {
      const entries = filterCatalog({ gauge: gauge.id });
      expect(entries.length).toBeGreaterThan(0);
      expect(entries.every((entry) => entry.gaugeMm === gauge.gaugeMm)).toBe(true);
      expect(new Set(catalogManufacturers(gauge.id).map((profile) => profile.id))).toEqual(
        new Set(entries.map((entry) => entry.profileId)),
      );
    }
    expect(catalogManufacturers('g').map((profile) => profile.brand)).toEqual(['Peco']);
    expect(filterCatalog({ gauge: 'tt', profileId: 'hornby-oo' })).toEqual([]);
    expect(
      filterCatalog({ gauge: 'oo-ho', profileId: 'hornby-oo', query: ' r600 ' }).map(
        (entry) => entry.code,
      ),
    ).toEqual(['R600']);
    expect(() => filterCatalog({ gauge: 'unsupported' })).toThrow(/gauge/);
  });

  it('rejects joins across gauges while snapping equal-gauge starter straights normally', () => {
    const n = piece('n', 'peco-setrack-n-st-1');
    const tt = piece('tt', 'hornby-tt-tt8002', 87);
    expect(placementProblem(tt, [n], [])?.kind).toBe('connection');
    expect(
      compatibleProfiles(
        manufacturerProfile(definition(n.trackId).profileId),
        manufacturerProfile('hornby-tt'),
      ),
    ).toBe(false);
    const next = piece('next', n.trackId, 90, 2);
    const snapped = snapPiece(next, [n], 10);
    if (!snapped) throw new Error('Expected the N-gauge track to snap.');
    const target = ports(n)[1],
      own = ports(snapped.piece)[0];
    if (!target || !own) throw new Error('Missing straight connector.');
    expect(connected(target, own)).toBe(true);
    expect(placementProblem(snapped.piece, [n], [])).toBeNull();
  });

  it('keeps new gauge stock in backup interchange and uses gauge-scaled schematic footprints', () => {
    const g = piece('g', 'peco-setrack-g45-st-905');
    const initial = setInventory(emptyState('idea'), g.trackId, 1);
    const state = putPiece(initial, g);
    expect(used(activeLayout(state), g.trackId)).toBe(1);
    expect(parseState(JSON.stringify(state))).toEqual(state);
    expect(svgExport(state)).toContain(
      `stroke-width="${drawingLayers(false, false, 45)[0]?.width}"`,
    );
    const n = piece('n', 'peco-setrack-n-st-1', 10, 10);
    expect(placementProblem(n, [], [rectangleBoard('board', 0, 0, 110, 20)])).toBeNull();
    expect(placementProblem({ ...n, id: 'parallel', y: 30 }, [n], [])).toBeNull();
    expect(
      placementProblem(
        { ...n, trackId: 'hornby-oo-r600' },
        [],
        [rectangleBoard('board', 0, 0, 200, 20)],
      )?.kind,
    ).toBe('board');
    expect(definition(n.trackId).centresMm).toBeNull();
    expect(trackWidth(definition(n.trackId))).toBeLessThan(30);
    expect(definition('hornby-oo-r600').centresMm).toBe(67);
  });
});
