import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('page settings restore catalog choices, disclosures, toggles, layout views and page independently of document data', async ({
  page,
}) => {
  await seedIdea(page);
  await page.locator('#catalog-profile').selectOption('Hornby');
  const straights = page
    .locator('.catalog-group')
    .filter({ has: page.locator('summary', { hasText: /^Straights/ }) });
  await straights.locator('summary').click();
  await expect(straights).not.toHaveAttribute('open');
  await page.locator('#snap').uncheck();
  await page.locator('#power-overlay').uncheck();
  await page.locator('#controls-help > summary').click();
  await page.locator('#activity > summary').click();
  await page.locator('#zoom-in').click();
  await page.locator('#cancel-tool').click();
  const firstView = await page.locator('#world').getAttribute('transform');
  await createIdea(page);
  await page.locator('#zoom-out').click();
  const secondId = await page.locator('#layouts').inputValue();
  const secondView = await page.locator('#world').getAttribute('transform');
  expect(secondView).not.toBe(firstView);
  await page.locator('#layouts').selectOption('idea');
  await expect(page.locator('#world')).toHaveAttribute('transform', firstView ?? '');
  await page.locator('#search').fill('R60?');
  await expect(straights).toHaveAttribute('open');
  const saved = await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'));
  await page.reload();
  await expect(page.locator('#catalog-profile')).toHaveValue('Hornby');
  await expect(page.locator('#search')).toHaveValue('R60?');
  await expect(page.locator('#snap')).not.toBeChecked();
  await expect(page.locator('#power-overlay')).not.toBeChecked();
  await expect(page.locator('#controls-help')).toHaveAttribute('open');
  await expect(page.locator('#activity')).toHaveAttribute('open');
  await expect(page.locator('#cancel-tool')).toHaveText('Switch to Select');
  await expect(page.locator('#piece-select')).toHaveValue('');
  await expect(page.locator('#world')).toHaveAttribute('transform', firstView ?? '');
  await page.locator('#search').fill('');
  await expect(straights).not.toHaveAttribute('open');
  await page.locator('#layouts').selectOption(secondId);
  await expect(page.locator('#world')).toHaveAttribute('transform', secondView ?? '');
  await page.locator('#layouts').selectOption('idea');
  expect(await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'))).toBe(saved);
  await page.locator('#catalog-page-link').click();
  await page.locator('#browser-gauge').selectOption('n');
  await page.locator('#browser-manufacturer').selectOption('Peco');
  await page.locator('#browser-search').fill('Gerade');
  await page.goto('./');
  await expect(page.locator('#catalog-page')).toBeVisible();
  await expect(page.locator('#browser-gauge')).toHaveValue('n');
  await expect(page.locator('#browser-manufacturer')).toHaveValue('Peco');
  await expect(page.locator('#browser-search')).toHaveValue('Gerade');
  await expect(page.locator('#browser-pieces tr')).toHaveCount(1);
  await page.goto('./#planner');
  await expect(page.locator('#planner-page')).toBeVisible();
  await page.locator('#reset-page-settings').click();
  await expect(page.locator('#catalog-gauge')).toHaveValue('oo-ho');
  await expect(page.locator('#catalog-profile')).toHaveValue('');
  await expect(page.locator('#search')).toHaveValue('');
  await expect(straights).toHaveAttribute('open');
  await expect(page.locator('#snap')).toBeChecked();
  await expect(page.locator('#power-overlay')).toBeChecked();
  await expect(page.locator('#controls-help')).not.toHaveAttribute('open');
  expect(await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'))).toBe(saved);
});

test('page settings restore sidebar scroll and a safe editing layer without restoring placement drafts', async ({
  page,
}) => {
  await seedIdea(page);
  await page.locator('#edit-boards').check();
  await page.getByRole('button', { name: 'Board Circle', exact: true }).click();
  await page.locator('#board-radius').fill('777');
  await page.evaluate(() => {
    const inventory = document.querySelector('.inventory-panel');
    const details = document.querySelector('.details-panel');
    if (!(inventory instanceof HTMLElement) || !(details instanceof HTMLElement))
      throw new Error('Missing panels.');
    inventory.scrollTop = 180;
    details.scrollTop = 220;
  });
  await expect
    .poll(() =>
      page.evaluate(() => {
        const value: unknown = JSON.parse(
          localStorage.getItem('model-railway-planner.v1.page-settings') ?? 'null',
        );
        return typeof value === 'object' && value !== null && 'scroll' in value
          ? value.scroll
          : null;
      }),
    )
    .toMatchObject({ inventory: 180, details: 220 });
  await page.reload();
  await expect(page.locator('#edit-boards')).toBeChecked();
  await expect(page.locator('#board-radius')).toHaveValue('500');
  await expect
    .poll(() => page.locator('.inventory-panel').evaluate((node) => node.scrollTop))
    .toBe(180);
  await expect
    .poll(() => page.locator('.details-panel').evaluate((node) => node.scrollTop))
    .toBe(220);
  await expect(page.locator('#board-add-shape')).toBeDisabled();
  await expect(page.locator('#board-tool-status')).toHaveText(
    'Select a board to move, rotate or reshape it.',
  );
});

test('mobile page settings retain translated filters, page scroll and catalog horizontal scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await page.locator('#catalog-gauge').selectOption('n');
  await page.locator('#catalog-profile').selectOption('Peco');
  await page.locator('#search').fill('Gerade');
  await page.locator('#language').selectOption('de');
  await page.locator('#cancel-tool').click();
  await page.evaluate(() => window.scrollTo(0, 550));
  await expect
    .poll(() =>
      page.evaluate(() => {
        const settings: unknown = JSON.parse(
          localStorage.getItem('model-railway-planner.v1.page-settings') ?? 'null',
        );
        return typeof settings === 'object' && settings !== null && 'scroll' in settings
          ? settings.scroll
          : null;
      }),
    )
    .toMatchObject({ planner: 550 });
  await page.reload();
  await expect(page.locator('#catalog-gauge')).toHaveValue('n');
  await expect(page.locator('#catalog-profile')).toHaveValue('Peco');
  await expect(page.locator('#search')).toHaveValue('Gerade');
  await expect(page.locator('#cancel-tool')).toHaveText('Zur Auswahl wechseln');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(550);
  await page.locator('#catalog-page-link').click();
  await page.locator('#browser-gauge').selectOption('g');
  await page.locator('#browser-manufacturer').selectOption('Peco');
  await page.locator('#browser-search').fill('curva');
  await page.locator('.catalog-table-scroll').evaluate((node) => {
    node.scrollLeft = 80;
  });
  await expect
    .poll(() =>
      page.evaluate(() => {
        const settings: unknown = JSON.parse(
          localStorage.getItem('model-railway-planner.v1.page-settings') ?? 'null',
        );
        return typeof settings === 'object' && settings !== null && 'scroll' in settings
          ? settings.scroll
          : null;
      }),
    )
    .toMatchObject({ table: 80 });
  await page.reload();
  await expect(page.locator('#browser-gauge')).toHaveValue('g');
  await expect(page.locator('#browser-manufacturer')).toHaveValue('Peco');
  await expect(page.locator('#browser-search')).toHaveValue('curva');
  await expect(page.locator('#browser-pieces tr')).toHaveCount(1);
  await expect
    .poll(() => page.locator('.catalog-table-scroll').evaluate((node) => node.scrollLeft))
    .toBe(80);
});

test('invalid or unwritable page settings preserve planner data and offer an independent reset', async ({
  page,
}) => {
  await seedIdea(page);
  const saved = await page.evaluate(() => {
    localStorage.setItem('model-railway-planner.v1.page-settings', '{"version":99}');
    return localStorage.getItem('model-railway-planner.v1');
  });
  await page.reload();
  await expect(page.locator('#page-settings-status')).toContainText('Could not read page settings');
  await page.locator('#catalog-gauge').selectOption('g');
  expect(
    await page.evaluate(() => localStorage.getItem('model-railway-planner.v1.page-settings')),
  ).toBe('{"version":99}');
  expect(await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'))).toBe(saved);
  await page.locator('#reset-page-settings').click();
  await expect(page.locator('#page-settings-status')).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('model-railway-planner.v1.page-settings')))
    .not.toBe('{"version":99}');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === 'model-railway-planner.v1.page-settings')
        throw new DOMException('Settings storage denied', 'QuotaExceededError');
      original.call(this, key, value);
    };
  });
  await page.locator('#catalog-gauge').selectOption('g');
  await expect(page.locator('#page-settings-status')).toContainText('Could not save page settings');
  await page.locator('#zoom-in').click();
  const unsavedView = await page.locator('#world').getAttribute('transform');
  await page.locator('#catalog-page-link').click();
  await page.locator('#planner-page-link').click();
  await expect(page.locator('#world')).toHaveAttribute('transform', unsavedView ?? '');
  await stock(page, 'ST-905', 1);
  await expect(page.getByRole('spinbutton', { name: 'Owned ST-905', exact: true })).toHaveValue(
    '1',
  );
  await expect(page.locator('#save-state')).toHaveText('Saved on this device');
  await page.reload();
  await expect(page.locator('#page-settings-status')).toBeHidden();
  await page.locator('#catalog-gauge').selectOption('g');
  await expect(page.getByRole('spinbutton', { name: 'Owned ST-905', exact: true })).toHaveValue(
    '1',
  );
  await page.locator('#reset-page-settings').click();
  await expect(page.locator('#catalog-gauge')).toHaveValue('oo-ho');
});

test('Select/Pan toggles real mouse panning over empty space and track without document edits', async ({
  page,
}) => {
  await seedIdea(page);
  const saved = await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'));
  const before = await page.locator('#world').getAttribute('transform');
  await page.getByRole('button', { name: 'Switch to Pan', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Switch to Select', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const start = await boardScreenPoint(page, 80, 0);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 95, start.y + 55, { steps: 8 });
  await page.mouse.up();
  expect(await page.locator('#world').getAttribute('transform')).not.toBe(before);
  expect(await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'))).toBe(saved);
  const canvas = await page.locator('#canvas').boundingBox();
  if (!canvas) throw new Error('Missing canvas.');
  const panned = await page.locator('#world').getAttribute('transform');
  await page.mouse.move(canvas.x + canvas.width - 100, canvas.y + 240);
  await page.mouse.down();
  await page.mouse.move(canvas.x + canvas.width - 170, canvas.y + 280, { steps: 5 });
  await page.mouse.up();
  expect(await page.locator('#world').getAttribute('transform')).not.toBe(panned);
  await page.getByRole('button', { name: 'Switch to Select', exact: true }).click();
  const point = await boardScreenPoint(page, 80, 0);
  await page.mouse.click(point.x, point.y);
  await expect(page.locator('#piece-select')).toHaveValue('a');
  const stationary = await page.locator('#world').getAttribute('transform');
  await page.mouse.move(canvas.x + canvas.width - 100, canvas.y + 300);
  await page.mouse.down();
  await page.mouse.move(canvas.x + canvas.width - 170, canvas.y + 340, { steps: 4 });
  await page.mouse.up();
  expect(await page.locator('#world').getAttribute('transform')).toBe(stationary);
  await page.getByRole('button', { name: 'Switch to Pan', exact: true }).click();
  await page.getByRole('button', { name: 'Place R600 Straight', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Switch to Pan', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('layer fit controls frame railway, boards and room independently, including an empty layer', async ({
  page,
}) => {
  await page.goto('./');
  await expect(page.locator('#fit')).toBeDisabled();
  await expect(page.locator('#fit-boards')).toBeDisabled();
  await expect(page.locator('#fit-room')).toBeDisabled();
  await page.evaluate(() => {
    const rectangle = (id: string, x: number, y: number, width: number, height: number) => ({
      id,
      kind: 'polygon',
      x,
      y,
      angle: 0,
      points: [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
      ],
    });
    localStorage.setItem(
      'model-railway-planner.v1',
      JSON.stringify({
        version: 6,
        inventory: {},
        activeLayoutId: 'idea',
        rooms: [
          {
            id: 'room',
            name: 'Example room',
            shapes: [
              {
                role: 'outline',
                name: 'Room outline',
                shape: rectangle('floor', -5000, -3000, 14000, 8000),
              },
            ],
          },
        ],
        layouts: [
          {
            id: 'idea',
            name: 'Example idea',
            roomId: 'room',
            boards: [rectangle('board', 1500, 1500, 1000, 600)],
            pieces: [{ id: 'a', trackId: 'hornby-oo-r600', x: 0, y: 0, angle: 0, flipped: false }],
          },
        ],
      }),
    );
  });
  await page.reload();
  const transforms: string[] = [];
  for (const [button, layer, width, height] of [
    ['#fit', '#tracks', 208, 40],
    ['#fit-boards', '#boards', 1000, 600],
    ['#fit-room', '#rooms', 14000, 8000],
  ] as const) {
    await page.locator(button).click();
    transforms.push((await page.locator('#world').getAttribute('transform')) ?? '');
    const framing = await page.locator(layer).evaluate((group: SVGGElement) => {
      const bounds = group.getBoundingClientRect();
      const viewport = document.querySelector('#canvas')?.getBoundingClientRect();
      if (!viewport) throw new Error('Missing canvas bounds.');
      return {
        inside:
          bounds.left >= viewport.left &&
          bounds.right <= viewport.right &&
          bounds.top >= viewport.top &&
          bounds.bottom <= viewport.bottom,
        width: bounds.width,
        height: bounds.height,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        scale: group.getScreenCTM()?.a,
      };
    });
    expect(framing.inside).toBe(true);
    expect(framing.scale).toBeCloseTo(
      Math.min(4, framing.viewportWidth / (width + 80), framing.viewportHeight / (height + 80)),
      6,
    );
  }
  expect(new Set(transforms).size).toBe(3);
  const saved = await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'));
  await page.getByRole('checkbox', { name: 'Edit baseboards', exact: true }).check();
  await page.locator('#cancel-tool').click();
  await expect(page.locator('#cancel-tool')).toHaveText('Switch to Select');
  const board = await boardScreenPoint(page, 2000, 1800);
  const before = await page.locator('#world').getAttribute('transform');
  await page.mouse.move(board.x, board.y);
  await page.mouse.down();
  await page.mouse.move(board.x + 45, board.y + 30, { steps: 6 });
  await page.mouse.up();
  expect(await page.locator('#world').getAttribute('transform')).not.toBe(before);
  expect(await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'))).toBe(saved);
});

test('catalog previews show track geometry and owned-only filtering persists without changing railway data', async ({
  page,
}) => {
  await seedIdea(page);
  for (const code of ['R606', 'R8072', 'R636', 'R645', 'R8232']) await stock(page, code, 1);
  const saved = await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'));
  await page.locator('#catalog-page-link').click();
  await expect(
    page.getByRole('columnheader', { name: 'Used in this idea', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: 'Preview', exact: true })).toBeVisible();
  await page.locator('#browser-gauge').selectOption('');
  await expect(page.locator('#browser-pieces svg[role="img"]')).toHaveCount(52);
  await expect(page.locator('[data-catalog-id="hornby-oo-r606"] path').first()).toHaveAttribute(
    'd',
    / A/,
  );
  await expect(page.locator('[data-catalog-id="hornby-oo-r8072"] path')).toHaveCount(8);
  await expect(page.locator('[data-catalog-id="hornby-oo-r636"] path')).toHaveCount(8);
  await expect(page.locator('[data-catalog-id="hornby-oo-r645"] path')).toHaveCount(1);
  await expect(page.locator('[data-catalog-id="hornby-oo-r8232"] path')).toHaveCount(1);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const dark of [true, false]) {
      if ((await page.locator('#theme').getAttribute('aria-pressed')) !== String(dark))
        await page.locator('#theme').click();
      const previews = await page.locator('.catalog-preview').evaluateAll((nodes) =>
        nodes.every((node) => {
          if (!(node instanceof SVGSVGElement)) return false;
          const box = node.getBBox();
          const view = node.viewBox.baseVal;
          const size = node.getBoundingClientRect();
          return (
            size.width >= 90 &&
            size.height >= 50 &&
            box.width > 0 &&
            box.height >= 0 &&
            box.x >= view.x &&
            box.y >= view.y &&
            box.x + box.width <= view.x + view.width &&
            box.y + box.height <= view.y + view.height
          );
        }),
      );
      expect(previews).toBe(true);
    }
  }
  await page.getByRole('checkbox', { name: 'Owned only', exact: true }).check();
  await expect(page.locator('#browser-pieces tr')).toHaveCount(6);
  // The seeded R600 is overused, but is still owned.
  await expect(page.locator('[data-catalog-id="hornby-oo-r600"]')).toBeVisible();
  await page.locator('#browser-manufacturer').selectOption('Peco');
  await expect(page.locator('#browser-empty')).toBeVisible();
  await page.locator('#browser-manufacturer').selectOption('Hornby');
  await page.locator('#browser-search').fill('curve');
  await expect(page.locator('#browser-pieces tr')).toHaveCount(1);
  await expect(page.locator('[data-catalog-id="hornby-oo-r606"]')).toBeVisible();
  await page.locator('#browser-gauge').selectOption('n');
  await expect(page.locator('#browser-empty')).toBeVisible();
  await page.locator('#browser-gauge').selectOption('oo-ho');
  await page.locator('#browser-search').fill('');
  await page.reload();
  await expect(page.locator('#browser-owned')).toBeChecked();
  await expect(page.locator('#browser-pieces tr')).toHaveCount(6);
  for (const [language, label] of [
    ['de', 'Nur im Bestand'],
    ['fr', 'Possédées uniquement'],
    ['es', 'Solo propias'],
    ['it', 'Solo posseduti'],
    ['en', 'Owned only'],
  ] as const) {
    await page.locator('#language').selectOption(language);
    await expect(page.getByRole('checkbox', { name: label, exact: true })).toBeChecked();
  }
  await page.locator('#browser-owned').uncheck();
  await expect(page.locator('#browser-pieces tr')).toHaveCount(47);
  await page.reload();
  await expect(page.locator('#browser-owned')).not.toBeChecked();
  await page.locator('#browser-owned').check();
  await page.locator('#planner-page-link').click();
  await page.locator('#reset-page-settings').click();
  await page.locator('#catalog-page-link').click();
  await expect(page.locator('#browser-owned')).not.toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'))).toBe(saved);
});

test('gauge filters derive manufacturers and the catalog page browses all registered inventory without edits', async ({
  page,
}) => {
  await seedIdea(page);
  const saved = await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'));
  await expect(page.locator('#catalog-gauge')).toHaveValue('oo-ho');
  await expect(page.locator('#catalog-profile option')).toHaveText([
    'All OO/H0 brands',
    'Hornby',
    'Peco',
    'Bachmann',
  ]);
  await page.locator('#catalog-profile').selectOption('Hornby');
  await page.getByRole('searchbox', { name: 'Wildcard filter', exact: true }).fill('curve');
  await expect(page.getByRole('button', { name: /^Place R606 / })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Place R600 / })).toHaveCount(0);
  await page.locator('#search').fill('R60?');
  await expect(page.getByRole('button', { name: /^Place R600 / })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Place R610 / })).toHaveCount(0);
  await page.locator('#search').fill('no-such-product');
  await expect(page.locator('#catalog-empty')).toBeVisible();
  await page.locator('#search').fill('');
  await expect(page.locator('#catalog-empty')).toBeHidden();
  await page.locator('#catalog-gauge').selectOption('g');
  await expect(page.locator('#catalog-profile option')).toHaveText(['All G brands', 'Peco']);
  await expect(page.locator('#catalog-profile')).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Place ST-905 Standard curve', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#catalog .track-choice')).toHaveCount(1);
  await page.locator('#catalog-gauge').selectOption('tt');
  await expect(page.locator('#catalog-profile option')).toHaveText(['All TT brands', 'Hornby']);
  await expect(
    page.getByRole('button', { name: 'Place TT8002 Straight', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Track catalog', exact: true }).click();
  await expect(page.locator('#catalog-page')).toBeVisible();
  await expect(page.locator('#planner-page')).toBeHidden();
  await expect(page.locator('#browser-gauge')).toHaveValue('oo-ho');
  await expect(page.locator('#browser-pieces tr')).toHaveCount(47);
  await expect(page.locator('[data-catalog-id="hornby-oo-r600"]')).toContainText('R600');
  await page.locator('#browser-manufacturer').selectOption('Hornby');
  await page.locator('#browser-search').fill('curve');
  await expect(page.locator('[data-catalog-id="hornby-oo-r606"]')).toBeVisible();
  await expect(page.locator('[data-catalog-id="hornby-oo-r600"]')).toHaveCount(0);
  await page.locator('#browser-search').fill('');
  await page.locator('#browser-gauge').selectOption('');
  await page.locator('#browser-manufacturer').selectOption('Peco');
  await expect(page.locator('#browser-pieces tr')).toHaveCount(10);
  await expect(page.locator('#browser-manufacturer option')).toHaveText([
    'All brands',
    'Hornby',
    'Peco',
    'Bachmann',
    'Märklin',
  ]);
  await page.locator('#browser-gauge').selectOption('n');
  await expect(page.locator('#browser-manufacturer option')).toHaveText(['All N brands', 'Peco']);
  await expect(page.locator('#browser-pieces tr')).toHaveCount(1);
  await expect(page.locator('#browser-pieces')).toContainText('87 mm');
  await page.locator('#browser-pieces a').evaluate((link) => {
    if (
      !(link instanceof HTMLAnchorElement) ||
      link.protocol !== 'https:' ||
      !link.rel.includes('noopener')
    )
      throw new Error('Unsafe catalog source link.');
  });
  await page.locator('#browser-search').fill('no-such-product');
  await expect(page.locator('#browser-empty')).toBeVisible();
  await page.locator('#browser-search').fill('');
  await page.reload();
  await expect(page.locator('#catalog-page')).toBeVisible();
  await page.goBack();
  await expect(page.locator('#planner-page')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'))).toBe(saved);
});

test('inventory and catalog searches accept all supported languages independently of the UI language', async ({
  page,
}) => {
  await seedIdea(page);
  const saved = await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'));
  await page.locator('#catalog-profile').selectOption('Hornby');
  for (const language of ['en', 'de', 'fr', 'es', 'it']) {
    await page.locator('#language').selectOption(language);
    for (const query of [
      'curve',
      'Kurve',
      'courbe',
      'curva',
      'raggio 2',
      'RADIO 2',
      'rayon 2',
      'rad?us 2',
    ]) {
      await page.locator('#search').fill(query);
      await expect(
        page
          .locator('#catalog .track-choice')
          .filter({ has: page.locator('strong', { hasText: /^R606$/ }) }),
      ).toBeVisible();
      await expect(
        page
          .locator('#catalog .track-choice')
          .filter({ has: page.locator('strong', { hasText: /^R600$/ }) }),
      ).toHaveCount(0);
    }
    await page.locator('#search').fill('digitale');
    await expect(
      page
        .locator('#catalog .track-choice')
        .filter({ has: page.locator('strong', { hasText: /^R8241$/ }) }),
    ).toBeVisible();
    await page.locator('#catalog-page-link').click();
    await page.locator('#browser-manufacturer').selectOption('Hornby');
    for (const query of [
      'Kurven',
      'courbes',
      'curvas',
      'curva',
      'rayon 2',
      'raggio 2',
      'radio 2',
      'rad?us 2',
    ]) {
      await page.locator('#browser-search').fill(query);
      await expect(page.locator('[data-catalog-id="hornby-oo-r606"]')).toBeVisible();
      await expect(page.locator('[data-catalog-id="hornby-oo-r600"]')).toHaveCount(0);
    }
    await page.locator('#browser-search').fill('desvío izquierdo');
    await expect(page.locator('[data-catalog-id="hornby-oo-r8072"]')).toBeVisible();
    await page.locator('#planner-page-link').click();
  }
  expect(await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'))).toBe(saved);
});

test('new navigation remains translated, usable on mobile and readable in both themes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  for (const [language, pan, select, count, brands, wildcard] of [
    [
      'de',
      'Zum Verschieben wechseln',
      'Zur Auswahl wechseln',
      '52 registrierte Teile',
      'Alle OO/H0-Marken',
      'Platzhalterfilter',
    ],
    [
      'fr',
      'Passer au déplacement',
      'Passer à la sélection',
      '52 pièces enregistrées',
      'Toutes les marques OO/H0',
      'Filtre à jokers',
    ],
    [
      'es',
      'Cambiar a desplazar',
      'Cambiar a selección',
      '52 piezas registradas',
      'Todas las marcas OO/H0',
      'Filtro con comodines',
    ],
    [
      'it',
      'Passa a panoramica',
      'Passa a selezione',
      '52 pezzi registrati',
      'Tutte le marche OO/H0',
      'Filtro con caratteri jolly',
    ],
    [
      'en',
      'Switch to Pan',
      'Switch to Select',
      '52 registered pieces',
      'All OO/H0 brands',
      'Wildcard filter',
    ],
  ] as const) {
    await page.locator('#language').selectOption(language);
    await expect(page.locator('#catalog-profile option:checked')).toHaveText(brands);
    await expect(page.getByRole('searchbox', { name: wildcard, exact: true })).toBeVisible();
    await expect(page.locator('#cancel-tool')).toHaveText(pan);
    await page.locator('#cancel-tool').click();
    await expect(page.locator('#cancel-tool')).toHaveText(select);
    await page.locator('#cancel-tool').click();
    await page.locator('#catalog-page-link').click();
    await expect(page.locator('#catalog-page h2')).toBeFocused();
    await page.locator('#browser-gauge').selectOption('');
    await expect(page.locator('#browser-count')).toHaveText(count);
    await page.locator('#browser-gauge').selectOption('g');
    await expect(page.locator('#browser-pieces tr')).toHaveCount(1);
    await page.locator('#browser-gauge').selectOption('');
    for (const dark of [true, false]) {
      if ((await page.locator('#theme').getAttribute('aria-pressed')) !== String(dark))
        await page.locator('#theme').click();
      const links = await page.evaluate(() => {
        const luminance = (color: string) => {
          const [r, g, b] = [...color.matchAll(/\d+/g)].map((match) => {
            const channel = Number(match[0]) / 255;
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
          });
          if (r === undefined || g === undefined || b === undefined)
            throw new Error('Expected rendered RGB colors.');
          return r * 0.2126 + g * 0.7152 + b * 0.0722;
        };
        return {
          overflow: document.documentElement.scrollWidth - innerWidth,
          contrasts: [...document.querySelectorAll('.page-navigation a, .catalog-table a')].map(
            (link) => {
              const background = link.closest('.page-navigation') ?? document.documentElement;
              const a = luminance(getComputedStyle(link).color),
                b = luminance(getComputedStyle(background).backgroundColor);
              return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
            },
          ),
        };
      });
      expect(links.overflow).toBeLessThanOrEqual(1);
      expect(Math.min(...links.contrasts)).toBeGreaterThanOrEqual(4.5);
    }
    await page.locator('#planner-page-link').click();
    await expect(page.locator('#cancel-tool')).toBeFocused();
  }
});

async function seedPowerIdea(page: Page): Promise<void> {
  await page.goto('./');
  await page.evaluate(() =>
    localStorage.setItem(
      'model-railway-planner.v1',
      JSON.stringify({
        version: 5,
        rooms: [],
        inventory: {},
        activeLayoutId: 'power',
        layouts: [
          {
            id: 'power',
            name: 'Example power idea',
            boards: [],
            pieces: [
              { id: 'source', trackId: 'hornby-oo-r8241', x: -168, y: 0, angle: 0, flipped: false },
              { id: 'point', trackId: 'hornby-oo-r8072', x: 0, y: 0, angle: 0, flipped: false },
            ],
          },
        ],
      }),
    ),
  );
  await page.reload();
  await expect(page.locator('#tracks > g')).toHaveCount(2);
}

test('power controls model self-isolation, clip stock, overlay, undo and persisted DCC feeds', async ({
  page,
}) => {
  await seedPowerIdea(page);
  await expect(page.locator('#power-mode')).toHaveValue('');
  await page.locator('#power-mode').selectOption('dcc');
  await expect(page.locator('#power-summary')).toContainText('No compatible connected power feed');
  await page.locator('#piece-select').selectOption('source');
  await page.locator('#power-feed-kind').selectOption('native');
  await page.locator('#power-feed-connected').check();
  await page.locator('#power-apply').click();
  await expect(page.locator('#power-summary')).toContainText('unverified electrical continuity');
  await page.locator('#piece-select').selectOption('point');
  await page.locator('#power-point-route').selectOption('0');
  await page.locator('#power-apply').click();
  await expect(page.locator('#power-piece-status')).toContainText('route 2: unpowered');
  await page.locator('#search').fill('R8232');
  await page.getByRole('button', { name: /^Attach R8232/ }).click();
  await expect(page.locator('#power-summary')).toContainText('All modelled routes powered.');
  await expect(page.locator('#shopping-list')).toContainText('2 x R8232');
  await expect(page.locator('.power-route[data-power-status="powered"]')).toHaveCount(3);
  await expect(page.locator('[data-piece-id="source"]')).toHaveClass(/missing-stock/);
  await expect(page.locator('[data-piece-id="source"] .track-bed')).toHaveAttribute(
    'stroke',
    '#db843b',
  );
  await page.locator('#undo').click();
  await page.locator('#piece-select').selectOption('point');
  await expect(page.locator('#power-bypass')).toHaveValue('');
  await expect(page.locator('#power-piece-status')).toContainText('route 2: unpowered');
  await page.locator('#redo').click();
  await page.locator('#piece-select').selectOption('point');
  await page.getByRole('spinbutton', { name: 'Owned R8232', exact: true }).fill('1');
  await page.getByRole('spinbutton', { name: 'Owned R8232', exact: true }).press('Tab');
  await expect(page.locator('#shopping-list')).toContainText('1 x R8232');
  await page.locator('#lock-pieces').click();
  await expect(page.locator('#power-apply')).toBeDisabled();
  await page.locator('#unlock-pieces').click();
  await page.locator('#power-overlay').uncheck();
  await expect(page.locator('.power-route')).toHaveCount(0);
  await expect(page.locator('[data-piece-id="source"]')).toHaveClass(/missing-stock/);
  await page.reload();
  await expect(page.locator('#power-mode')).toHaveValue('dcc');
  await expect(page.locator('#power-summary')).toContainText('All modelled routes powered.');
  await expect(page.locator('#shopping-list')).toContainText('1 x R8232');
  await page.locator('#piece-select').selectOption('point');
  await expect(page.locator('#power-bypass')).toHaveValue('clips');
  await page.locator('#language').selectOption('de');
  await expect(page.locator('#power-editor h2')).toHaveText('Stromversorgung');
  await expect(page.locator('#power-summary')).toContainText(
    'Alle modellierten Fahrwege sind versorgt.',
  );
  await expect(page.locator('#power-piece-status')).toContainText('Fahrweg 2: versorgt');
});

test('power inspector fits desktop and mobile panels in every supported language', async ({
  page,
}) => {
  await seedPowerIdea(page);
  await page.locator('#piece-select').selectOption('source');
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const language of ['en', 'de', 'fr', 'es', 'it']) {
      await page.locator('#language').selectOption(language);
      const overflowing = await page.locator('#power-editor').evaluate((root) => {
        const panel = root.closest('.details-panel');
        if (!panel) throw new Error('Missing details panel.');
        const bounds = panel.getBoundingClientRect();
        return [...root.querySelectorAll('fieldset, select, button')].flatMap((control) => {
          const box = control.getBoundingClientRect();
          return !box.width || (box.left >= bounds.left && box.right <= bounds.right)
            ? []
            : [
                {
                  id: control.id,
                  left: box.left,
                  right: box.right,
                  panelLeft: bounds.left,
                  panelRight: bounds.right,
                },
              ];
        });
      });
      expect(overflowing, `${width}px ${language} power controls fit their panel`).toEqual([]);
    }
  }
});

test('power edits preserve the saved snapshot when clip fit or storage fails', async ({ page }) => {
  await seedPowerIdea(page);
  await page.locator('#power-mode').selectOption('dcc');
  await page.locator('#piece-select').selectOption('source');
  const saved = await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'));
  await page.locator('#search').fill('R602');
  await page.getByRole('button', { name: /^Attach R602/ }).click();
  await expect(page.locator('#status')).toContainText('modelled on R600 and R601 only');
  expect(await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'))).toBe(saved);
  await page.locator('#power-feed-kind').selectOption('native');
  await page.locator('#power-feed-connected').check();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Storage unavailable', 'QuotaExceededError');
    };
  });
  await page.locator('#power-apply').click();
  await expect(page.locator('#status')).toContainText('Not saved:');
  await expect(page.locator('#power-feed-kind')).toHaveValue('');
  await expect(page.locator('#power-summary')).toContainText('No compatible connected power feed');
  expect(await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'))).toBe(saved);
});

async function stock(page: Page, code: string, quantity: number): Promise<void> {
  await page.getByRole('spinbutton', { name: `Owned ${code}`, exact: true }).fill(String(quantity));
  await page.getByRole('spinbutton', { name: `Owned ${code}`, exact: true }).press('Tab');
}

async function createIdea(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'New layout', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Second idea');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
}

async function seedIdea(page: Page): Promise<void> {
  await page.goto('./');
  await page.evaluate(() =>
    localStorage.setItem(
      'model-railway-planner.v1',
      JSON.stringify({
        version: 1,
        inventory: { 'hornby-oo-r600': 1 },
        activeLayoutId: 'idea',
        layouts: [
          {
            id: 'idea',
            name: 'Example idea',
            boards: [],
            pieces: [
              { id: 'a', trackId: 'hornby-oo-r600', x: 0, y: 0, angle: 0, flipped: false },
              { id: 'b', trackId: 'hornby-oo-r600', x: 168, y: 0, angle: 0, flipped: false },
              { id: 'c', trackId: 'hornby-oo-r600', x: 0, y: 300, angle: 0, flipped: false },
            ],
          },
        ],
      }),
    ),
  );
  await page.reload();
  await expect(page.locator('#tracks > g')).toHaveCount(3);
}

async function boardScreenPoint(
  page: Page,
  x: number,
  y: number,
): Promise<{ x: number; y: number }> {
  return page.evaluate(
    ({ x, y }) => {
      const world = document.querySelector<SVGGElement>('#world');
      const matrix = world?.getScreenCTM();
      if (!matrix) throw new Error('Missing model-to-screen transform.');
      const point = new DOMPoint(x, y).matrixTransform(matrix);
      return { x: point.x, y: point.y };
    },
    { x, y },
  );
}

test('room actions beside the selector create and rename rooms independently of layouts', async ({
  page,
}) => {
  await seedIdea(page);
  const rooms = page.getByRole('group', { name: 'Room actions', exact: true });
  const layouts = page.getByRole('group', { name: 'Layout actions', exact: true });
  await expect(rooms.locator('#layout-room')).toHaveValue('');
  await expect(rooms.getByRole('button', { name: 'Rename room', exact: true })).toBeDisabled();
  await rooms.getByRole('button', { name: 'New room', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Example room');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(rooms.locator('#layout-room')).not.toHaveValue('');
  const roomId = await rooms.locator('#layout-room').inputValue();
  await rooms.getByRole('button', { name: 'Rename room', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Renamed room');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(rooms.locator('#layout-room option:checked')).toHaveText('Renamed room');
  await expect(layouts.locator('#layouts option:checked')).toHaveText('Example idea');
  await layouts.getByRole('button', { name: 'Rename layout', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Renamed layout');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(rooms.locator('#layout-room option:checked')).toHaveText('Renamed room');
  await createIdea(page);
  await expect(rooms.locator('#layout-room')).toHaveValue('');
  await expect(rooms.getByRole('button', { name: 'Rename room', exact: true })).toBeDisabled();
  await rooms.locator('#layout-room').selectOption(roomId);
  await page.reload();
  await expect(page.locator('#layout-room option:checked')).toHaveText('Renamed room');
  await expect(page.locator('#layouts option:checked')).toHaveText('Second idea');
  await page.locator('#layouts').selectOption('idea');
  await expect(page.locator('#layouts option:checked')).toHaveText('Renamed layout');
  await expect(page.locator('#tracks > g')).toHaveCount(3);
});

test('room furniture sits below independent boards and track, with undo and exported layers', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'New room', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Example room');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('#room-add-board').click();
  await page.locator('#room-role').selectOption('furniture');
  await page.locator('#room-shape-name').fill('Large table');
  await page.locator('#room-board-x').fill('500');
  await page.locator('#room-board-y').fill('500');
  await page.locator('#room-board-width').fill('2000');
  await page.locator('#room-board-height').fill('1000');
  await page.locator('#room-add-board').click();
  await page.getByRole('button', { name: 'Board Rectangle', exact: true }).click();
  await page.locator('#board-x').fill('600');
  await page.locator('#board-y').fill('600');
  await page.locator('#board-width').fill('1000');
  await page.locator('#board-height').fill('500');
  await page.locator('#board-add-shape').click();
  await page.getByRole('button', { name: /Place R600 / }).click();
  const trackPoint = await boardScreenPoint(page, 700, 700);
  await page.mouse.click(trackPoint.x, trackPoint.y);
  await expect(page.locator('#tracks > g')).toHaveCount(1);
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('Missing test viewport.');
  for (const width of [1280, 900, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const dark of [true, false]) {
      if ((await page.locator('#theme').getAttribute('aria-pressed')) !== String(dark))
        await page.locator('#theme').click();
      await expect(page.locator('#theme')).toHaveAttribute('aria-pressed', String(dark));
      const header = await page.locator('.app-header').evaluate((node) => {
        const link = node.querySelector('.feedback-link');
        if (!link) throw new Error('Missing feedback link.');
        const luminance = (color: string) => {
          const channels = color
            .match(/[\d.]+/g)
            ?.slice(0, 3)
            .map(Number);
          if (!channels || channels.length !== 3) throw new Error('Missing rendered RGB color.');
          return channels.reduce((total, value, index) => {
            const channel = value / 255;
            const linear =
              channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
            const weight = [0.2126, 0.7152, 0.0722][index];
            if (weight === undefined) throw new Error('Missing color channel.');
            return total + linear * weight;
          }, 0);
        };
        const foreground = luminance(getComputedStyle(link).color);
        const background = luminance(getComputedStyle(node).backgroundColor);
        const box = link.getBoundingClientRect();
        return {
          overflow: node.scrollWidth - node.clientWidth,
          left: box.left,
          right: box.right,
          viewport: innerWidth,
          contrast:
            (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
        };
      });
      expect(header.overflow).toBeLessThanOrEqual(1);
      expect(header.left).toBeGreaterThanOrEqual(0);
      expect(header.right).toBeLessThanOrEqual(header.viewport);
      expect(header.contrast).toBeGreaterThanOrEqual(4.5);
    }
  }
  await page.setViewportSize(viewport);
  const before = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('model-railway-planner.v1') ?? '{}'),
  );
  await page.locator('#room-edit-boards').check();
  const point = await boardScreenPoint(page, 1500, 900);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 80, point.y + 40, { steps: 8 });
  await page.mouse.up();
  const after = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('model-railway-planner.v1') ?? '{}'),
  );
  expect(after.layouts).toEqual(before.layouts);
  expect(
    after.rooms[0].shapes.find((entry: { name: string }) => entry.name === 'Large table').shape.x,
  ).not.toBe(500);
  expect(
    await page.evaluate(() => {
      const world = document.querySelector('#world');
      return [...(world?.children ?? [])]
        .map((node) => node.id)
        .filter((id) => ['rooms', 'boards', 'tracks'].includes(id));
    }),
  ).toEqual(['rooms', 'boards', 'tracks']);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('model-railway-planner.v1') ?? '{}')),
  ).toEqual(before);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export SVG', exact: true }).click(),
  ]);
  const path = await download.path();
  if (!path) throw new Error('Missing room export.');
  const drawing = await readFile(path, 'utf8');
  expect(drawing.indexOf('data-room-shape')).toBeLessThan(drawing.indexOf('data-board'));
  expect(drawing).toContain('Large table');
  await expect(
    page.getByRole('link', { name: 'Feature requests / bug reports', exact: true }),
  ).toHaveAttribute('href', 'https://github.com/f2calv/model-railway-planner');
  await page.reload();
  await expect(page.locator('#rooms > g')).toHaveCount(2);
  await expect(page.locator('#boards > g')).toHaveCount(1);
  await expect(page.locator('#tracks > g')).toHaveCount(1);
});

test('named rooms are selectable per layout and shared deletion is undoable without translating names', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'New room', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Dark mode');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('#room-add-board').click();
  const originalId = await page.locator('#layouts').inputValue();
  const roomId = await page.locator('#layout-room').inputValue();
  await createIdea(page);
  await expect(page.locator('#layout-room')).toHaveValue('');
  await page.locator('#layout-room').selectOption(roomId);
  await expect(page.locator('#rooms > g')).toHaveCount(1);
  await page.getByRole('button', { name: 'New room', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Round room');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('button', { name: 'Room shape Circle', exact: true }).click();
  await page.locator('#room-board-radius').fill('1500');
  await page.locator('#room-board-add-shape').click();
  await page.locator('#layouts').selectOption(originalId);
  await expect(page.locator('#layout-room')).toHaveValue(roomId);
  await page.locator('#language').selectOption('de');
  await expect(page.locator('#layout-room option:checked')).toHaveText('Dark mode');
  await expect(page.getByRole('button', { name: 'Neuer Raum', exact: true })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Funktionswünsche / Fehlerberichte', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#rooms title')).toHaveText('Room outline');
  await page.locator('#language').selectOption('en');
  await page.getByRole('button', { name: 'Delete room', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.locator('#rooms > g')).toHaveCount(0);
  await expect(page.locator('#layout-room')).toHaveValue('');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.reload();
  await expect(page.locator('#layout-room')).toHaveValue(roomId);
  await expect(page.locator('#rooms > g')).toHaveCount(1);
});

test('baseboard presets snap, corner handles reshape atomically, and undo preserves boards', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByText('Module presets', { exact: true }).click();
  await page.getByRole('button', { name: 'Board 1000 x 500 mm', exact: true }).click();
  const origin = await boardScreenPoint(page, 0, 0);
  await page.mouse.click(origin.x, origin.y);
  await expect(page.locator('#boards > g')).toHaveCount(1);
  await page.getByRole('button', { name: 'Board 500 x 500 mm', exact: true }).click();
  const next = await boardScreenPoint(page, 1010, 0);
  await page.mouse.click(next.x, next.y);
  await expect(page.locator('#boards > g')).toHaveCount(2);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('model-railway-planner.v1') ?? '{}'),
  );
  expect(saved.layouts[0].boards[1].x).toBeCloseTo(1000);
  await page.getByRole('combobox', { name: 'Select baseboard shape' }).selectOption({ index: 1 });
  const handle = page.locator('#boards > g.selected-board').locator('.board-corner').nth(1);
  const box = await handle.boundingBox();
  if (!box) throw new Error('Corner handle is not visible.');
  const target = await boardScreenPoint(page, 900, 0);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x, target.y, { steps: 8 });
  await page.mouse.up();
  const reshaped = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('model-railway-planner.v1') ?? '{}'),
  );
  expect(reshaped.layouts[0].boards[0].points[1].x).toBeCloseTo(900, 4);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  const restored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('model-railway-planner.v1') ?? '{}'),
  );
  expect(restored.layouts[0].boards).toEqual(saved.layouts[0].boards);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await page.reload();
  await expect(page.locator('#boards > g')).toHaveCount(2);
  const persisted = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('model-railway-planner.v1') ?? '{}'),
  );
  expect(persisted.layouts[0].boards).toEqual(reshaped.layouts[0].boards);
});

test('curved baseboards drag from the palette, cancel cleanly and export their real outlines', async ({
  page,
}) => {
  await page.goto('./');
  const palette = page.getByRole('button', { name: 'Board Circle', exact: true });
  await palette.scrollIntoViewIfNeeded();
  const box = await palette.boundingBox();
  if (!box) throw new Error('Circle palette entry is not visible.');
  const target = await boardScreenPoint(page, 300, 300);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x, target.y, { steps: 8 });
  await expect(page.locator('#board-preview > path')).toHaveCount(1);
  await expect(page.locator('#boards > g')).toHaveCount(0);
  await page.mouse.up();
  await expect(page.locator('#boards > g')).toHaveCount(1);
  const circle = page.locator('#boards > g').first().locator('.board-surface');
  const bounds = await circle.boundingBox();
  if (!bounds) throw new Error('Placed circle is not visible.');
  const before = await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'));
  await page.mouse.move(target.x, target.y);
  await page.mouse.down();
  await page.mouse.move(target.x + 80, target.y + 30, { steps: 6 });
  await page
    .locator('#canvas')
    .dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse' });
  await page.mouse.up();
  expect(await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'))).toBe(before);
  await expect(page.locator('#board-preview > path')).toHaveCount(0);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x, target.y, { steps: 6 });
  await expect(page.locator('#board-preview > path')).toHaveCount(1);
  await page.locator('#canvas').dispatchEvent('pointerdown', {
    pointerId: 99,
    pointerType: 'touch',
    button: 0,
    clientX: target.x + 40,
    clientY: target.y,
  });
  await page.mouse.up();
  await page.locator('#canvas').dispatchEvent('pointerup', { pointerId: 99, pointerType: 'touch' });
  await expect(page.locator('#board-preview > path')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'))).toBe(before);
  await page.getByRole('button', { name: 'Board Arc strip', exact: true }).click();
  await page.locator('#board-x').fill('1200');
  await page.locator('#board-y').fill('0');
  await page.locator('#board-radius').fill('300');
  await page.locator('#board-inner').fill('150');
  await page.locator('#board-sweep').fill('270');
  await page.locator('#board-angle').fill('45');
  await page.getByRole('button', { name: 'Add shape at coordinates', exact: true }).click();
  await expect(page.locator('#boards > g')).toHaveCount(2);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export SVG', exact: true }).click(),
  ]);
  const path = await download.path();
  if (!path) throw new Error('Missing exported board SVG.');
  const drawing = await readFile(path, 'utf8');
  expect(drawing).toContain('A300,300');
  expect(drawing).toContain('A150,150');
  expect(drawing).toContain('rotate(45)');
  expect(
    await page.evaluate((text) => {
      const svg = new DOMParser().parseFromString(text, 'image/svg+xml');
      return {
        errors: svg.querySelectorAll('parsererror').length,
        boards: svg.querySelectorAll('[data-board]').length,
      };
    }, drawing),
  ).toEqual({ errors: 0, boards: 2 });
});

test('triangle and semicircle baseboards retain their geometry and translated controls', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByText('Module presets', { exact: true }).click();
  await page.getByRole('button', { name: 'Board 250 mm right triangle', exact: true }).click();
  await page.getByRole('button', { name: 'Add shape at coordinates', exact: true }).click();
  await expect(page.locator('#boards > g.selected-board .board-corner')).toHaveCount(3);
  await page.getByRole('button', { name: 'Board Semicircle', exact: true }).click();
  await page.locator('#board-radius').fill('125');
  await page.locator('#board-x').fill('500');
  await page.getByRole('button', { name: 'Add shape at coordinates', exact: true }).click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('model-railway-planner.v1') ?? '{}'),
  );
  expect(saved.layouts[0].boards[0].points).toEqual([
    { x: 0, y: 0 },
    { x: 250, y: 0 },
    { x: 0, y: 250 },
  ]);
  expect(saved.layouts[0].boards[1]).toMatchObject({
    kind: 'arc',
    radius: 125,
    innerRadius: 0,
    sweep: 180,
  });
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('de');
  await expect(
    page.getByRole('checkbox', { name: 'Grundplatten bearbeiten', exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole('button', { name: 'Grundplattenänderungen anwenden', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator('#boards > g')).toHaveCount(2);
});

test('R645 attaches without adding track, survives history and reload, and can be removed', async ({
  page,
}) => {
  await seedIdea(page);
  await page.getByRole('combobox', { name: 'Select placed piece' }).selectOption('a');
  await page
    .getByRole('button', { name: 'Attach R645 Single-track level crossing', exact: true })
    .click();
  await expect(page.locator('#tracks > g')).toHaveCount(3);
  await expect(page.locator('#tracks .accessory-mark')).toHaveCount(1);
  await expect(page.locator('#shopping-list')).toContainText('1 x R645');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('#tracks .accessory-mark')).toHaveCount(0);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await page.reload();
  await expect(page.locator('#tracks .accessory-mark')).toHaveCount(1);
  await page.getByRole('combobox', { name: 'Select placed piece' }).selectOption('a');
  await page.getByRole('button', { name: 'Lock selection', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Remove R645 accessory', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Unlock selection', exact: true }).click();
  await page.getByRole('button', { name: 'Remove R645 accessory', exact: true }).click();
  await expect(page.locator('#tracks .accessory-mark')).toHaveCount(0);
  await expect(page.locator('#tracks > g')).toHaveCount(3);
  await page
    .getByRole('button', { name: 'Place R636 Double-track level crossing', exact: true })
    .click();
  await page.locator('#canvas').click({ position: { x: 200, y: 550 } });
  await expect(page.locator('#tracks > g')).toHaveCount(4);
  await expect(page.locator('#tracks > g').last().locator('.port')).toHaveCount(4);
  await page.getByRole('button', { name: 'Place R8241 Digital power track', exact: true }).click();
  await page.locator('#canvas').click({ position: { x: 450, y: 550 } });
  await expect(page.locator('#tracks > g')).toHaveCount(5);
});

test('inventory counts, snapping, dragging, separate ideas and persistence', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await stock(page, 'R600', 2);
  const canvas = page.locator('#canvas');
  await page.getByRole('button', { name: 'Place R600 Straight', exact: true }).click();
  await canvas.click({ position: { x: 200, y: 200 } });
  await canvas.click({ position: { x: 302, y: 200 } });
  await expect(page.locator('#tracks > g')).toHaveCount(2);
  await expect(
    page.getByRole('button', { name: 'Place R600 Straight', exact: true }),
  ).toBeEnabled();
  const poses = await page
    .locator('#tracks > g')
    .evaluateAll((groups) => groups.map((g) => g.getAttribute('transform')));
  expect(poses[1]).toContain('rotate(0)');
  // 168 mm = 100.8 pixels at the initial 60% zoom.
  const translation = poses[1]?.match(/translate\(([^,]+),([^)]+)\)/);
  expect(Number(translation?.[1])).toBeCloseTo(351.333333, 4);
  await page.reload();
  await expect(page.locator('#tracks > g')).toHaveCount(2);
  await createIdea(page);
  await expect(page.locator('#tracks > g')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Place R600 Straight', exact: true }),
  ).toBeEnabled();
  await page
    .getByRole('combobox', { name: 'Saved layouts' })
    .selectOption({ label: 'My first layout' });
  await expect(page.locator('#tracks > g')).toHaveCount(2);
  const rail = page.locator('#tracks > g').first().locator('.centre-line').first();
  const box = await rail.boundingBox();
  if (!box) throw new Error('Track not visible');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 120, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('#tracks > g').first()).not.toHaveAttribute(
    'transform',
    poses[0] ?? '',
  );
  expect(errors).toEqual([]);
});

test('rejects collisions and unsafe imports without changing data', async ({ page }) => {
  await page.goto('./');
  await stock(page, 'R600', 3);
  await page.getByRole('button', { name: 'Place R600 Straight', exact: true }).click();
  await page.locator('#canvas').click({ position: { x: 200, y: 200 } });
  await page.locator('#canvas').click({ position: { x: 220, y: 210 } });
  await expect(page.locator('#tracks > g')).toHaveCount(1);
  await expect(page.getByRole('status', { name: 'Planner status' })).toContainText(
    /overlap|centres/,
  );
  await page.locator('#import-file').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.getByRole('status', { name: 'Planner status' })).toContainText('Import failed');
  await expect(page.locator('#tracks > g')).toHaveCount(1);
});

test('local storage write failures reject edits and malformed reads preserve original bytes', async ({
  page,
}) => {
  await page.goto('./');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
    };
  });
  await stock(page, 'R600', 2);
  await expect(page.getByRole('status', { name: 'Planner status' })).toContainText('Not saved');
  await expect(page.getByRole('spinbutton', { name: 'Owned R600', exact: true })).toHaveValue('0');
  await page.getByRole('button', { name: 'Add rectangle', exact: true }).click();
  await expect(page.locator('#boards > g')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
  await page.reload();
  await page.evaluate(() => localStorage.setItem('model-railway-planner.v1', '{bad-json'));
  await page.reload();
  await expect(page.getByRole('status', { name: 'Planner status' })).toContainText(
    'Editing is locked',
  );
  await stock(page, 'R600', 2);
  expect(await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'))).toBe(
    '{bad-json',
  );
});

test('touch and keyboard alternatives work at mobile size', async ({ browser, baseURL }) => {
  if (!baseURL) throw new Error('Browser tests require a configured application URL.');
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    baseURL,
  });
  const page = await context.newPage();
  await page.goto('./');
  await stock(page, 'R600', 1);
  await page.getByRole('button', { name: 'Place R600 Straight', exact: true }).tap();
  await page.locator('#canvas').tap({ position: { x: 100, y: 200 } });
  await expect(page.locator('#tracks > g')).toHaveCount(1);
  await page.getByRole('button', { name: 'Switch to Pan', exact: true }).tap();
  await page
    .getByRole('combobox', { name: 'Select placed piece', exact: true })
    .selectOption({ index: 1 });
  const x = page.getByRole('spinbutton', { name: 'X (mm)', exact: true }).first();
  const before = Number(await x.inputValue());
  await page.locator('#canvas').focus();
  await page.keyboard.press('ArrowRight');
  await expect(x).toHaveValue(String(Math.round((before + 5) * 100) / 100));
  await context.close();
});

test('a second touch cancels a track drag and pinches without editing the document', async ({
  browser,
  baseURL,
}) => {
  if (!baseURL) throw new Error('Missing test application URL.');
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    baseURL,
  });
  try {
    const page = await context.newPage();
    await seedIdea(page);
    await page.locator('#canvas').scrollIntoViewIfNeeded();
    const box = await page.locator('#tracks > g').first().boundingBox();
    if (!box) throw new Error('Missing touch-test track.');
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    const original = await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'));
    const client = await context.newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, id: 1 }],
    });
    await expect(page.locator('#tracks .drag-source')).toHaveCount(1);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x, y, id: 1 },
        { x: x + 80, y, id: 2 },
      ],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: x - 30, y, id: 1 },
        { x: x + 110, y, id: 2 },
      ],
    });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect(
      Number((await page.locator('#zoom-level').textContent())?.replace('%', '')),
    ).toBeGreaterThan(60);
    expect(await page.evaluate(() => localStorage.getItem('model-railway-planner.v1'))).toBe(
      original,
    );
    await expect(page.locator('#tracks .drag-source')).toHaveCount(0);
    await expect(page.locator('#preview > g')).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('production shell, manifest and icons support offline reload', async ({ page }) => {
  await page.goto('./');
  await stock(page, 'R600', 1);
  await expect
    .poll(() =>
      page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.state),
    )
    .toBe('activated');
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestUrl).toBeTruthy();
  if (!manifestUrl) throw new Error('Missing PWA manifest.');
  const response = await page.request.get(manifestUrl);
  const manifest = (await response.json()) as {
    icons: { src: string; sizes: string }[];
    start_url: string;
  };
  expect(manifest.icons.some((icon) => icon.sizes === '192x192')).toBe(true);
  expect(manifest.icons.some((icon) => icon.sizes === '512x512')).toBe(true);
  const version = await page.request.get('version.json');
  expect(version.ok()).toBe(true);
  const versionInfo = (await version.json()) as { version: string };
  await expect(page.locator('#app-version')).toHaveText(versionInfo.version);
  for (const icon of manifest.icons) expect((await page.request.get(icon.src)).ok()).toBe(true);
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Model Railway Planner' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Owned R600', exact: true })).toHaveValue('1');
});

test('desktop palette dragging previews track across the menu and canvas before committing', async ({
  page,
}) => {
  await page.goto('./');
  await stock(page, 'R600', 1);
  const choice = page.getByRole('button', { name: 'Place R600 Straight', exact: true });
  const box = await choice.boundingBox();
  const canvas = await page.locator('#canvas').boundingBox();
  if (!box || !canvas) throw new Error('Missing palette or canvas.');
  await page.mouse.move(box.x + 10, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 45, box.y + box.height / 2, { steps: 4 });
  await expect(page.locator('#palette-ghost')).toBeVisible();
  await expect(page.locator('#tracks > g')).toHaveCount(0);
  await page.mouse.move(canvas.x + 200, canvas.y + 200, { steps: 8 });
  await expect(page.locator('#preview > g')).toHaveCount(1);
  await expect(page.locator('#tracks > g')).toHaveCount(0);
  await page.mouse.up();
  await expect(page.locator('#tracks > g')).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: 'Place R600 Straight', exact: true }),
  ).toBeEnabled();
  await expect(page.locator('#palette-ghost')).toBeHidden();
  await expect(page.locator('#preview > g')).toHaveCount(0);
  await expect(page.locator('#shopping-list')).toContainText('You own all');
});

test('unowned pieces form a per-idea shopping list that responds to inventory and removal', async ({
  page,
}) => {
  await page.goto('./');
  await stock(page, 'R600', 1);
  await page.getByRole('button', { name: 'Place R600 Straight', exact: true }).click();
  await page.locator('#canvas').click({ position: { x: 200, y: 200 } });
  await page.locator('#canvas').click({ position: { x: 302, y: 200 } });
  await page.locator('#canvas').click({ position: { x: 403, y: 200 } });
  await expect(page.locator('#tracks > .missing-stock')).toHaveCount(2);
  await expect(page.locator('#shopping-list')).toContainText('2 x R600');
  await page.reload();
  await expect(page.locator('#tracks > .missing-stock')).toHaveCount(2);
  await stock(page, 'R600', 2);
  await expect(page.locator('#tracks > .missing-stock')).toHaveCount(1);
  await stock(page, 'R600', 0);
  await expect(page.locator('#shopping-list')).toContainText('3 x R600');
  await page.getByRole('combobox', { name: 'Select placed piece' }).selectOption({ index: 3 });
  await page.getByRole('button', { name: 'Remove piece', exact: true }).click();
  await page
    .locator('#confirm-dialog')
    .getByRole('button', { name: 'Confirm', exact: true })
    .click();
  await expect(page.locator('#shopping-list')).toContainText('2 x R600');
  await createIdea(page);
  await expect(page.locator('#shopping-list')).toContainText('You own all');
});

test('compact inventory counts leave space for track names and retain four-digit editing', async ({
  page,
}) => {
  await seedIdea(page);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator('#search').fill('R600');
    await stock(page, 'R600', 9999);
    await expect(page.getByLabel('Remaining R600', { exact: true })).toHaveText('9996');
    const dimensions = await page
      .getByRole('spinbutton', { name: 'Owned R600', exact: true })
      .evaluate((input) => {
        if (!(input instanceof HTMLInputElement)) throw new Error('Missing inventory input.');
        const row = input.closest('.catalog-row');
        const name = row?.querySelector('.track-choice > span');
        const remaining = row?.querySelector(':scope > span');
        if (!row || !name || !remaining) throw new Error('Missing catalog row controls.');
        const style = getComputedStyle(input);
        const context = document.createElement('canvas').getContext('2d');
        if (!context) throw new Error('Missing text measurement context.');
        context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        return {
          inputWidth: input.getBoundingClientRect().width,
          digitsWidth: context.measureText(input.value).width,
          inputContentWidth:
            input.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
          remainingFits: remaining.scrollWidth <= remaining.clientWidth,
          nameWidth: name.getBoundingClientRect().width,
          rowWidth: row.getBoundingClientRect().width,
          rowFits: row.scrollWidth <= row.clientWidth,
        };
      });
    expect(dimensions.inputWidth).toBeLessThanOrEqual(36);
    expect(
      dimensions.digitsWidth,
      `${width}px viewport: ${JSON.stringify(dimensions)}`,
    ).toBeLessThanOrEqual(dimensions.inputContentWidth);
    expect(dimensions.remainingFits).toBe(true);
    expect(dimensions.rowFits).toBe(true);
    expect(dimensions.nameWidth).toBeGreaterThanOrEqual(dimensions.rowWidth - 116);
    const quantity = page.getByRole('spinbutton', { name: 'Owned R600', exact: true });
    await quantity.focus();
    await quantity.press('ArrowDown');
    await quantity.press('Tab');
    await expect(quantity).toHaveValue('9998');
    await expect(page.getByLabel('Remaining R600', { exact: true })).toHaveText('9995');
    await page.reload();
    await expect(quantity).toHaveValue('9998');
  }
});

test('grouped palette is compact and searchable; dark mode persists', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.catalog-group > summary')).toHaveText([
    'Straights (16)',
    'Curves (17)',
    'Points (7)',
    'Misc / crossings (7)',
  ]);
  const height = await page
    .locator('.catalog-row')
    .first()
    .evaluate((row) => row.getBoundingClientRect().height);
  expect(height).toBeLessThanOrEqual(48);
  await page.getByText('Curves (17)', { exact: true }).click();
  await stock(page, 'R600', 1);
  await expect(page.locator('.catalog-group').nth(1)).not.toHaveAttribute('open');
  await page.getByRole('searchbox').fill('R8262');
  await expect(page.getByRole('button', { name: /Place R8262/ })).toBeVisible();
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: 'Dark mode', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('group selection supports Ctrl, enclosing marquee, rigid moves and a single undo transaction', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await seedIdea(page);
  await page.locator('#tracks > g').nth(0).click();
  await expect(page.locator('#tracks > .selected')).toHaveCount(1);
  await page
    .locator('#tracks > g')
    .nth(1)
    .click({ modifiers: ['Control'] });
  await expect(page.locator('#tracks > .selected')).toHaveCount(2);
  await page.locator('#canvas').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#tracks > g').nth(0)).toHaveAttribute(
    'transform',
    'translate(0,5) rotate(0) scale(1,1)',
  );
  await expect(page.locator('#tracks > g').nth(1)).toHaveAttribute(
    'transform',
    'translate(168,5) rotate(0) scale(1,1)',
  );
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('#tracks > g').nth(0)).toHaveAttribute(
    'transform',
    'translate(0,0) rotate(0) scale(1,1)',
  );
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
  const marqueeStart = await boardScreenPoint(page, -20, -20);
  const marqueeEnd = await boardScreenPoint(page, 356, 20);
  await page.mouse.move(marqueeStart.x, marqueeStart.y);
  await page.mouse.down();
  await page.mouse.move(marqueeEnd.x, marqueeEnd.y, { steps: 8 });
  await expect(page.locator('#marquee')).toBeVisible();
  await page.mouse.up();
  await expect(page.locator('#tracks > .selected')).toHaveCount(2);
  const dragStart = await boardScreenPoint(page, 84, 0);
  const dragEnd = await boardScreenPoint(page, 84, 100);
  await page.mouse.move(dragStart.x, dragStart.y);
  await page.mouse.down();
  await page.mouse.move(dragEnd.x, dragEnd.y, { steps: 5 });
  await page.mouse.up();
  const moved = await page.locator('#tracks > g').evaluateAll((groups) =>
    groups.slice(0, 2).map((group) =>
      group
        .getAttribute('transform')
        ?.match(/translate\(([^,]+),([^)]+)\)/)
        ?.slice(1)
        .map(Number),
    ),
  );
  expect(moved[0]?.[1]).toBeCloseTo(100, 4);
  expect(moved[1]?.[0]).toBeCloseTo(168, 8);
  expect(moved[1]?.[1]).toBeCloseTo(100, 4);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('#tracks > g').first()).toHaveAttribute(
    'transform',
    'translate(0,0) rotate(0) scale(1,1)',
  );
});

test('right-click locks persist and protect an entire group until explicitly unlocked', async ({
  page,
}) => {
  await seedIdea(page);
  await page.locator('#tracks > g').first().click({ button: 'right' });
  await page
    .locator('#piece-menu')
    .getByRole('button', { name: 'Lock selection', exact: true })
    .click();
  await expect(page.locator('#tracks .padlock')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('#tracks .padlock')).toHaveCount(1);
  await page.getByRole('button', { name: 'Select all pieces', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove piece', exact: true })).toBeDisabled();
  await page.locator('#canvas').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#status')).toContainText('Unlock');
  await page.keyboard.press('Delete');
  await expect(page.locator('#error-dialog')).not.toBeVisible();
  await expect(page.locator('#tracks > g')).toHaveCount(3);
  await page.getByRole('button', { name: 'Unlock selection', exact: true }).click();
  await expect(page.locator('#tracks .padlock')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Remove piece', exact: true })).toBeEnabled();
});

test('deletion confirmation can be cancelled or skipped persistently; inventory reset is undoable', async ({
  page,
}) => {
  await seedIdea(page);
  await page.locator('#piece-select').selectOption('a');
  await page.getByRole('button', { name: 'Remove piece', exact: true }).click();
  await page
    .locator('#confirm-dialog')
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  await expect(page.locator('#tracks > g')).toHaveCount(3);
  await page.getByRole('button', { name: 'Remove piece', exact: true }).click();
  await page.locator('#skip-delete').check();
  await page
    .locator('#confirm-dialog')
    .getByRole('button', { name: 'Confirm', exact: true })
    .click();
  await expect(page.locator('#tracks > g')).toHaveCount(2);
  await page.reload();
  await expect(page.locator('#confirm-delete')).not.toBeChecked();
  await page.locator('#piece-select').selectOption('b');
  await page.getByRole('button', { name: 'Remove piece', exact: true }).click();
  await expect(page.locator('#tracks > g')).toHaveCount(1);
  await expect(page.locator('#confirm-dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Reset entire inventory', exact: true }).click();
  await page
    .locator('#confirm-dialog')
    .getByRole('button', { name: 'Confirm', exact: true })
    .click();
  await expect(page.getByRole('spinbutton', { name: 'Owned R600', exact: true })).toHaveValue('0');
  await expect(page.locator('#tracks > g')).toHaveCount(1);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Owned R600', exact: true })).toHaveValue('1');
});

test('languages persist, translate dynamic controls and leave user layout names untouched', async ({
  page,
}) => {
  await seedIdea(page);
  for (let theme = 0; theme < 2; theme++) {
    const contrast = await page.locator('#language').evaluate((control) => {
      const style = getComputedStyle(control);
      const luminance = (color: string) => {
        const [r, g, b] = [...color.matchAll(/\d+/g)].map((match) => {
          const channel = Number(match[0]) / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        if (r === undefined || g === undefined || b === undefined)
          throw new Error('Expected an RGB control colour.');
        return r * 0.2126 + g * 0.7152 + b * 0.0722;
      };
      const text = luminance(style.color);
      const background = luminance(style.backgroundColor);
      return (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05);
    });
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  }
  await page.locator('#language').selectOption('de');
  await expect(page.getByRole('heading', { name: 'Gleisbestand', exact: true })).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Bestand R600', exact: true }).fill('2');
  await page.getByRole('spinbutton', { name: 'Bestand R600', exact: true }).press('Tab');
  await expect(page.locator('#status')).toContainText('Bestand aktualisiert');
  await expect(page.locator('#layouts option')).toHaveText('Example idea');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await page.locator('#piece-select').selectOption('a');
  await expect(page.getByRole('button', { name: 'Gleis entfernen', exact: true })).toBeEnabled();
  await page.locator('#language').selectOption('fr');
  await expect(
    page.getByRole('heading', { name: 'Inventaire des voies', exact: true }),
  ).toBeVisible();
  await page.locator('#language').selectOption('es');
  await expect(
    page.getByRole('heading', { name: 'Inventario de vías', exact: true }),
  ).toBeVisible();
  await page.locator('#language').selectOption('it');
  await expect(
    page.getByRole('heading', { name: 'Inventario dei binari', exact: true }),
  ).toBeVisible();
  await page.locator('#language').selectOption('en');
  await expect(page.getByRole('heading', { name: 'Track inventory', exact: true })).toBeVisible();
});

test('SVG and bounded PNG exports are usable files; shopping CSV reflects this idea', async ({
  page,
}) => {
  await seedIdea(page);
  const [svg] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export SVG', exact: true }).click(),
  ]);
  const svgPath = await svg.path();
  if (!svgPath) throw new Error('Missing downloaded SVG.');
  const drawing = await readFile(svgPath, 'utf8');
  expect(
    await page.evaluate(
      (text) =>
        new DOMParser().parseFromString(text, 'image/svg+xml').querySelector('parsererror') ===
        null,
      drawing,
    ),
  ).toBe(true);
  const [csv] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Shopping list CSV', exact: true }).click(),
  ]);
  const csvPath = await csv.path();
  if (!csvPath) throw new Error('Missing downloaded CSV.');
  expect(await readFile(csvPath, 'utf8')).toContain('"Hornby","OO","R600","Straight","1","3","2"');
  await page.locator('#board-x').fill('-100');
  await page.locator('#board-y').fill('-100');
  await page.locator('#board-width').fill('20000');
  await page.locator('#board-height').fill('5000');
  await page.getByRole('button', { name: 'Add rectangle', exact: true }).click();
  const [png] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export PNG', exact: true }).click(),
  ]);
  const pngPath = await png.path();
  if (!pngPath) throw new Error('Missing downloaded PNG.');
  const bytes = await readFile(pngPath);
  expect(bytes.subarray(1, 4).toString()).toBe('PNG');
  expect(bytes.readUInt32BE(16)).toBe(4096);
  expect(bytes.readUInt32BE(20)).toBeGreaterThan(0);
  expect(bytes.readUInt32BE(20)).toBeLessThanOrEqual(4096);
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.getByRole('button', { name: 'Print / PDF', exact: true }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#print-view svg')).toBeVisible();
  await expect(page.locator('#app')).toBeHidden();
  const pdf = await page.pdf({ format: 'A4', landscape: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
});

test('failed storage does not publish undo steps; unexpected errors offer a privacy-safe report', async ({
  page,
}) => {
  await seedIdea(page);
  await page.locator('#piece-select').selectOption('c');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
    };
  });
  await page.locator('#canvas').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#status')).toContainText('Not saved');
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
  await expect(page.locator('#tracks > g').first()).toHaveAttribute(
    'transform',
    'translate(0,0) rotate(0) scale(1,1)',
  );
  await page.evaluate(() => {
    window.dispatchEvent(
      new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.resolve(),
        reason: new Error('private-fixture-detail'),
      }),
    );
  });
  await expect(page.locator('#error-dialog')).toBeVisible();
  const link = await page.locator('#report-error').getAttribute('href');
  expect(link).toContain('github.com/f2calv/model-railway-planner/issues/new');
  expect(link).not.toContain('private-fixture-detail');
  expect(link).not.toContain('Example%20idea');
});

test('optional audio emits distinct snap, disconnect and deletion tones only after enabling it', async ({
  page,
}) => {
  await page.goto('./');
  await page.evaluate(() => {
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const oscillator = create.call(this);
      let frequency = 0;
      const setFrequency = oscillator.frequency.setValueAtTime;
      oscillator.frequency.setValueAtTime = function (value, time) {
        frequency = value;
        return setFrequency.call(this, value, time);
      };
      const start = oscillator.start;
      oscillator.start = function (when?: number) {
        document.documentElement.dataset['tones'] =
          `${document.documentElement.dataset['tones'] ?? ''}${frequency},`;
        start.call(this, when);
      };
      return oscillator;
    };
  });
  await page.getByRole('button', { name: 'Place R600 Straight', exact: true }).click();
  await page.locator('#canvas').click({ position: { x: 200, y: 200 } });
  await expect(page.locator('html')).not.toHaveAttribute('data-tones');
  await page.locator('#sounds').check();
  await page.locator('#canvas').click({ position: { x: 302, y: 200 } });
  await expect(page.locator('html')).toHaveAttribute('data-tones', '660,');
  await page.getByRole('button', { name: 'Switch to Pan', exact: true }).click();
  await page.locator('#piece-select').selectOption({ index: 2 });
  const y = page.locator('#piece-y');
  await y.fill(String(Number(await y.inputValue()) + 200));
  await page.getByRole('button', { name: 'Apply position', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-tones', '660,330,');
  await page.getByRole('button', { name: 'Remove piece', exact: true }).click();
  await page
    .locator('#confirm-dialog')
    .getByRole('button', { name: 'Confirm', exact: true })
    .click();
  await expect(page.locator('html')).toHaveAttribute('data-tones', '660,330,150,');
});

test('hover identifies dimensions, unselected track uses a pointer and joins stay screen-sized', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Place R603 Long straight', exact: true }).click();
  await page.locator('#canvas').click({ position: { x: 130, y: 200 } });
  await page.getByRole('button', { name: 'Switch to Pan', exact: true }).click();
  await page.getByRole('button', { name: 'Switch to Select', exact: true }).click();
  await page.locator('#canvas').click({ position: { x: 150, y: 350 } });
  const track = page.locator('#tracks > g').first();
  await track.hover();
  await expect(page.getByRole('tooltip')).toContainText('670 mm');
  await expect(track).toHaveCSS('cursor', 'pointer');
  await page.getByRole('button', { name: 'Place R600 Straight', exact: true }).click();
  await track.hover();
  await expect(page.getByRole('tooltip')).toContainText('R603');
  await expect(page.locator('#preview > g')).toHaveCount(1);
  await page.getByRole('button', { name: 'Switch to Pan', exact: true }).click();
  await page.getByRole('button', { name: 'Switch to Select', exact: true }).click();
  const join = track.locator('.track-join').first();
  await expect(join).toHaveCSS('stroke-width', '1.5px');
  await expect(join).toHaveCSS('vector-effect', 'non-scaling-stroke');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(join).toHaveCSS('stroke-width', '1.5px');
  await page.getByRole('combobox', { name: 'Select placed piece' }).selectOption({ index: 1 });
  await expect(track).toHaveCSS('cursor', 'grab');
});

test('cancelled palette drags do not place or consume track', async ({ page }) => {
  await page.goto('./');
  const choice = page.getByRole('button', { name: 'Place R600 Straight', exact: true });
  const box = await choice.boundingBox();
  const canvas = await page.locator('#canvas').boundingBox();
  if (!box || !canvas) throw new Error('Missing palette or canvas.');
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(canvas.x + 200, canvas.y + 200, { steps: 8 });
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(page.locator('#tracks > g')).toHaveCount(0);
  await expect(page.locator('#palette-ghost')).toBeHidden();
  await expect(page.locator('#preview > g')).toHaveCount(0);
});

test('baseboard islands persist and display disconnected warnings instead of blocking edits', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Add rectangle', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'X (mm)', exact: true }).last().fill('1800');
  await page.getByRole('spinbutton', { name: 'Width (mm)', exact: true }).fill('600');
  await page.getByRole('button', { name: 'Add rectangle', exact: true }).click();
  await expect(page.locator('#boards > g')).toHaveCount(2);
  await page.getByRole('spinbutton', { name: 'X (mm)', exact: true }).last().fill('4000');
  await page.getByRole('button', { name: 'Add rectangle', exact: true }).click();
  await expect(page.locator('#checks')).toContainText('disconnected');
  await expect(page.locator('#boards > g')).toHaveCount(3);
  await page.reload();
  await expect(page.locator('#boards > g')).toHaveCount(3);
});
