import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function stock(page: Page, code: string, quantity: number): Promise<void> {
  await page.getByRole('spinbutton', { name: `Owned ${code}`, exact: true }).fill(String(quantity));
  await page.getByRole('spinbutton', { name: `Owned ${code}`, exact: true }).press('Tab');
}

async function createIdea(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'New idea', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Second idea');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
}

test('inventory limits, snapping, dragging, separate ideas and persistence', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await stock(page, 'R600', 2);
  const canvas = page.locator('#canvas');
  await page.getByRole('button', { name: 'Place R600 Straight', exact: true }).click();
  await canvas.click({ position: { x: 200, y: 200 } });
  await canvas.click({ position: { x: 302, y: 200 } });
  await expect(page.locator('#tracks > g')).toHaveCount(2);
  await expect(
    page.getByRole('button', { name: 'Place R600 Straight', exact: true }),
  ).toBeDisabled();
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
  await page.goto('/');
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
  await page.goto('/');
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

test('touch and keyboard alternatives work at mobile size', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
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

test('production shell, manifest and icons support offline reload', async ({ page }) => {
  await page.goto('/');
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
  for (const icon of manifest.icons) expect((await page.request.get(icon.src)).ok()).toBe(true);
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Model Railway Planner' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Owned R600', exact: true })).toHaveValue('1');
});

test('desktop palette drag-and-drop consumes stock only after placement', async ({ page }) => {
  await page.goto('/');
  await stock(page, 'R600', 1);
  await page
    .getByRole('button', { name: 'Place R600 Straight', exact: true })
    .dragTo(page.locator('#canvas'), { targetPosition: { x: 200, y: 200 } });
  await expect(page.locator('#tracks > g')).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: 'Place R600 Straight', exact: true }),
  ).toBeDisabled();
});

test('joined baseboards persist and disconnected rectangles are rejected', async ({ page }) => {
  await page.goto('/');
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
