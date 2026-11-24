import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function stock(page: Page, code: string, quantity: number): Promise<void> {
  await page.getByRole('spinbutton', { name: `Owned ${code}`, exact: true }).fill(String(quantity));
  await page.getByRole('spinbutton', { name: `Owned ${code}`, exact: true }).press('Tab');
}

async function createIdea(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'New idea', exact: true }).click();
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
  await page.getByRole('button', { name: 'Select / pan', exact: true }).tap();
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

test('grouped palette is compact and searchable; dark mode persists', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.catalog-group > summary')).toHaveText([
    'Straights (16)',
    'Curves (17)',
    'Points (7)',
    'Misc / crossings (4)',
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
  const canvas = await page.locator('#canvas').boundingBox();
  if (!canvas) throw new Error('Missing test canvas.');
  await page.mouse.move(canvas.x + 65, canvas.y + 75);
  await page.mouse.down();
  await page.mouse.move(canvas.x + 315, canvas.y + 150, { steps: 8 });
  await expect(page.locator('#marquee')).toBeVisible();
  await page.mouse.up();
  await expect(page.locator('#tracks > .selected')).toHaveCount(2);
  const rail = await page.locator('#tracks > g').first().boundingBox();
  if (!rail) throw new Error('Missing test track.');
  await page.mouse.move(rail.x + rail.width / 2, rail.y + rail.height / 2);
  await page.mouse.down();
  await page.mouse.move(rail.x + rail.width / 2, rail.y + rail.height / 2 + 60, { steps: 5 });
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
  await page.getByRole('button', { name: 'Select / pan', exact: true }).click();
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
  await page.getByRole('button', { name: 'Select / pan', exact: true }).click();
  await page.locator('#canvas').click({ position: { x: 150, y: 350 } });
  const track = page.locator('#tracks > g').first();
  await track.hover();
  await expect(page.getByRole('tooltip')).toContainText('670 mm');
  await expect(track).toHaveCSS('cursor', 'pointer');
  await page.getByRole('button', { name: 'Place R600 Straight', exact: true }).click();
  await track.hover();
  await expect(page.getByRole('tooltip')).toContainText('R603');
  await expect(page.locator('#preview > g')).toHaveCount(1);
  await page.getByRole('button', { name: 'Select / pan', exact: true }).click();
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

test('joined baseboards persist and disconnected rectangles are rejected', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Add rectangle', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'X (mm)', exact: true }).last().fill('1800');
  await page.getByRole('spinbutton', { name: 'Width (mm)', exact: true }).fill('600');
  await page.getByRole('button', { name: 'Add rectangle', exact: true }).click();
  await expect(page.locator('#boards > rect')).toHaveCount(2);
  await page.getByRole('spinbutton', { name: 'X (mm)', exact: true }).last().fill('4000');
  await page.getByRole('button', { name: 'Add rectangle', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Planner status' })).toContainText('share an edge');
  await expect(page.locator('#boards > rect')).toHaveCount(2);
  await page.reload();
  await expect(page.locator('#boards > rect')).toHaveCount(2);
});
