import { catalogCategories } from './catalog';
import type { TrackCategory } from './model';
import { gaugeGroups } from './profiles';
import { storageKey } from './storage';

export const pageSettingsKey = `${storageKey}.page-settings`;
export const pagePanels = [
  'controls-help',
  'activity',
  'board-module-presets',
  'board-corner-details',
  'room-board-corner-details',
] as const;

export interface CatalogPageSettings {
  gauge: string;
  brand: string;
  query: string;
}

export interface BrowserPageSettings extends CatalogPageSettings {
  ownedOnly: boolean;
}

export interface ViewportSettings {
  x: number;
  y: number;
  k: number;
}

export interface PageSettings {
  version: 1;
  page: 'planner' | 'catalog';
  catalog: CatalogPageSettings;
  browser: BrowserPageSettings;
  openCategories: TrackCategory[];
  openPanels: (typeof pagePanels)[number][];
  snap: boolean;
  powerOverlay: boolean;
  mode: 'select' | 'pan' | 'boards' | 'room';
  viewports: Record<string, ViewportSettings>;
  scroll: {
    inventory: number;
    details: number;
    table: number;
    planner: number;
    catalog: number;
  };
}

export function defaultPageSettings(): PageSettings {
  return {
    version: 1,
    page: 'planner',
    catalog: { gauge: 'oo-ho', brand: '', query: '' },
    browser: { gauge: 'oo-ho', brand: '', query: '', ownedOnly: false },
    openCategories: catalogCategories.map((category) => category.id),
    openPanels: [],
    snap: true,
    powerOverlay: true,
    mode: 'select',
    viewports: {},
    scroll: { inventory: 0, details: 0, table: 0, planner: 0, catalog: 0 },
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function catalogView(value: unknown, allGauges: boolean): value is CatalogPageSettings {
  return (
    record(value) &&
    ((allGauges && value['gauge'] === '') ||
      gaugeGroups.some((gauge) => gauge.id === value['gauge'])) &&
    typeof value['brand'] === 'string' &&
    value['brand'].length <= 120 &&
    typeof value['query'] === 'string' &&
    value['query'].length <= 256
  );
}

function position(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1e9;
}

function viewport(value: unknown): value is ViewportSettings {
  return (
    record(value) &&
    position(value['x']) &&
    position(value['y']) &&
    typeof value['k'] === 'number' &&
    Number.isFinite(value['k']) &&
    value['k'] >= 0.00001 &&
    value['k'] <= 4
  );
}

function scrollPosition(value: unknown): value is number {
  return position(value) && value >= 0;
}

export function parsePageSettings(text: string): PageSettings {
  if (text.length > 50_000) throw new Error('Saved page settings exceed the size limit.');
  const value: unknown = JSON.parse(text);
  if (
    !record(value) ||
    value['version'] !== 1 ||
    (value['page'] !== 'planner' && value['page'] !== 'catalog') ||
    !catalogView(value['catalog'], false) ||
    !catalogView(value['browser'], true) ||
    !Array.isArray(value['openCategories']) ||
    value['openCategories'].length > catalogCategories.length ||
    !value['openCategories'].every((id: unknown): id is TrackCategory =>
      catalogCategories.some((category) => category.id === id),
    ) ||
    !Array.isArray(value['openPanels']) ||
    value['openPanels'].length > pagePanels.length ||
    !value['openPanels'].every((id: unknown): id is (typeof pagePanels)[number] =>
      pagePanels.some((panel) => panel === id),
    ) ||
    typeof value['snap'] !== 'boolean' ||
    typeof value['powerOverlay'] !== 'boolean' ||
    !record(value['viewports']) ||
    Object.keys(value['viewports']).length > 100 ||
    !record(value['scroll'])
  )
    throw new Error('Invalid or unsupported saved page settings.');
  const views: [string, ViewportSettings][] = [];
  for (const [id, view] of Object.entries(value['viewports'])) {
    if (!id || id.length > 120 || !viewport(view))
      throw new Error('Invalid saved layout viewport.');
    views.push([id, { x: view.x, y: view.y, k: view.k }]);
  }
  const scroll = value['scroll'];
  if (
    !scrollPosition(scroll['inventory']) ||
    !scrollPosition(scroll['details']) ||
    !scrollPosition(scroll['table']) ||
    !scrollPosition(scroll['planner']) ||
    !scrollPosition(scroll['catalog'])
  )
    throw new Error('Invalid saved page scroll position.');
  const mode = value['mode'];
  if (mode !== 'select' && mode !== 'pan' && mode !== 'boards' && mode !== 'room')
    throw new Error('Invalid saved editing mode.');
  const browser = value['browser'];
  const ownedOnly = 'ownedOnly' in browser ? browser.ownedOnly : false;
  if (typeof ownedOnly !== 'boolean') throw new Error('Invalid saved owned-only filter.');
  return {
    version: 1,
    page: value['page'],
    catalog: {
      gauge: value['catalog'].gauge,
      brand: value['catalog'].brand,
      query: value['catalog'].query,
    },
    browser: {
      gauge: value['browser'].gauge,
      brand: value['browser'].brand,
      query: value['browser'].query,
      ownedOnly,
    },
    openCategories: [...new Set(value['openCategories'])],
    openPanels: [...new Set(value['openPanels'])],
    snap: value['snap'],
    powerOverlay: value['powerOverlay'],
    mode,
    viewports: Object.fromEntries(views),
    scroll: {
      inventory: scroll['inventory'],
      details: scroll['details'],
      table: scroll['table'],
      planner: scroll['planner'],
      catalog: scroll['catalog'],
    },
  };
}

export function loadPageSettings(storage: Pick<Storage, 'getItem'>): PageSettings {
  const text = storage.getItem(pageSettingsKey);
  return text === null ? defaultPageSettings() : parsePageSettings(text);
}

export function savePageSettings(storage: Pick<Storage, 'setItem'>, settings: PageSettings): void {
  const text = JSON.stringify(settings);
  parsePageSettings(text);
  storage.setItem(pageSettingsKey, text);
}
