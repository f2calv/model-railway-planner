import { describe, expect, it } from 'vitest';
import {
  defaultPageSettings,
  loadPageSettings,
  parsePageSettings,
  savePageSettings,
} from './page-settings';
import { storageKey } from './storage';

describe('remembered page settings', () => {
  it('round-trips safe UI state without modifying planner documents or other preferences', () => {
    const data = new Map([
      [storageKey, 'existing planner document'],
      [`${storageKey}.preferences`, 'existing preferences'],
    ]);
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
    };
    const settings = defaultPageSettings();
    settings.catalog = { gauge: 'oo-ho', brand: 'Hornby', query: 'Kurve' };
    settings.browser = { gauge: '', brand: 'Peco', query: 'ST-?' };
    settings.openCategories = ['curves', 'points'];
    settings.openPanels = ['activity', 'board-module-presets'];
    settings.snap = false;
    settings.mode = 'boards';
    settings.viewports = { idea: { x: -250, y: 180, k: 0.00001 } };
    settings.scroll.inventory = 120;
    savePageSettings(storage, settings);
    expect(loadPageSettings(storage)).toEqual(settings);
    expect(data.get(storageKey)).toBe('existing planner document');
    expect(data.get(`${storageKey}.preferences`)).toBe('existing preferences');
  });

  it('rejects unsafe, oversized and future settings rather than overwriting their bytes', () => {
    const defaults = defaultPageSettings();
    for (const invalid of [
      { ...defaults, version: 2 },
      { ...defaults, catalog: { ...defaults.catalog, gauge: 'unknown' } },
      { ...defaults, catalog: { ...defaults.catalog, query: 'x'.repeat(257) } },
      { ...defaults, snap: 'false' },
      { ...defaults, mode: 'delete' },
      { ...defaults, openPanels: ['#arbitrary-element'] },
      { ...defaults, openCategories: ['unknown'] },
      { ...defaults, viewports: { idea: { x: 0, y: 0, k: 0 } } },
      { ...defaults, viewports: { idea: { x: 1e10, y: 0, k: 1 } } },
      { ...defaults, scroll: { ...defaults.scroll, inventory: -1 } },
    ]) {
      const original = JSON.stringify(invalid);
      expect(() => loadPageSettings({ getItem: () => original })).toThrow();
    }
    expect(() => parsePageSettings('{')).toThrow();
    expect(() => parsePageSettings(' '.repeat(50_001))).toThrow(/size limit/);
    expect(() =>
      loadPageSettings({
        getItem: () => {
          throw new Error('Storage denied');
        },
      }),
    ).toThrow('Storage denied');
    expect(() =>
      savePageSettings(
        {
          setItem: () => {
            throw new Error('Quota exceeded');
          },
        },
        defaults,
      ),
    ).toThrow('Quota exceeded');
  });

  it('discards unknown fields and treats layout identifiers as data, not object prototype changes', () => {
    const settings = defaultPageSettings();
    const parsed = parsePageSettings(
      JSON.stringify({
        ...settings,
        catalog: { ...settings.catalog, command: 'not a setting' },
        viewports: Object.fromEntries([['__proto__', { x: 1, y: 2, k: 1 }]]),
      }),
    );
    expect(parsed.catalog).not.toHaveProperty('command');
    expect(Object.hasOwn(parsed.viewports, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(parsed.viewports)).toBe(Object.prototype);
  });
});
