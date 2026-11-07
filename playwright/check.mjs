import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import meta from '../src/data/meta.json' with { type: 'json' };

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const base = (process.env.SITE_BASE || 'http://127.0.0.1:4323/warzone-meta/').replace(/\/$/, '') + '/';
const errors = [];
const consoleErrors = [];
const badResponses = [];
fs.mkdirSync('shots/r2', { recursive: true });
fs.mkdirSync('/opt/cursor/artifacts', { recursive: true });

const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('response', response => { if (response.status() >= 400) badResponses.push({ url: response.url(), status: response.status() }); });

const active = () => page.locator('[data-mode-view]:visible');
const sourceById = new Map(meta.sources.map(source => [source.id, source]));
const checkOverflow = async width => {
  await page.setViewportSize({ width, height: 900 });
  const actual = await page.evaluate(() => ({ inner: innerWidth, doc: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert(actual.doc <= width + 1 && actual.body <= width + 1, `Overflow at ${width}: ${JSON.stringify(actual)}`);
};

await page.goto(`${base}?mode=br`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
assert.equal(await active().getAttribute('data-mode-view'), 'br');
assert.equal(await page.locator('#br-close .pick-card').count(), 1);
assert.equal(await page.locator('#br-close .alt-row').count(), 2);
assert.equal(await page.locator('#br-vel .card-summary').innerText(), meta.modes.br.cards.find(card => card.id === 'br-vel').summary);
assert.equal(await page.locator('#br-vel .confidence').innerText(), 'Emerging');
assert.equal(await page.locator('#br-iso .attachment-list').count(), 0);
assert.equal(await page.locator('#br-striga .attachment-list').count(), 0);
assert.match(await page.locator('#br-iso').innerText(), /Build unverified/);
assert.match(await page.locator('#br-iso').innerText(), /When you want the fastest calculated close-range kill and play inside 15m/);
assert.match(await page.locator('#br-iso').innerText(), /882 vs 910/);
assert.match(await page.locator('#br-striga').innerText(), /Mode unverified/);
assert.match(await page.locator('#br-striga').innerText(), /Build unverified/);
assert.equal(await page.locator('#br-long .alt-row').count(), 0);
assert.equal(await page.locator('#br-support .alt-row').count(), 0);
assert.equal(await page.locator('#br-legacy .alt-row').count(), 0);
assert.equal(await page.locator('#br-sniper .pick-card').count(), 0);
assert.match(await page.locator('#br-kg7').innerText(), /Role left unfilled/);
assert.equal(await page.locator('#br-voyak .attachment-list').count(), 0);
assert.equal(await page.locator('#br-han .slot-note').count(), 1);

for (const card of meta.modes.br.cards.filter(item => !item.archived && item.placement !== 'empty')) {
  assert.equal(await page.locator(`#${card.id} details.evidence`).evaluate(element => element.open), false);
  const details = page.locator(`#${card.id} details.evidence`);
  await details.evaluate(element => { element.open = true; });
  const expected = [...new Set([card.sourceIds, card.observed.sourceIds, card.build?.sourceIds || [], card.test?.sourceIds || []].flat())].map(id => sourceById.get(id).url);
  const actual = await details.locator('.source-links a').evaluateAll(links => links.map(link => link.href));
  assert.deepEqual(actual, expected, `sources for ${card.id}`);
  await details.evaluate(element => { element.open = false; });
}
const vel = meta.modes.br.cards.find(card => card.id === 'br-vel');
await page.locator('#br-vel details.evidence').evaluate(element => { element.open = true; });
assert.match(await page.locator('#br-vel .evidence-content').innerText(), /DISAGREEMENT/);
assert.equal(await page.locator('#br-vel .evidence-content').getByText(vel.counterpoint).count(), 1);
await page.locator('#br-vel details.evidence').evaluate(element => { element.open = false; });

assert.equal(await page.locator('.pro-record').count(), 20);
assert.equal(await page.locator('.change-log').count(), 1);
assert.match(await page.locator('.change-log').textContent(), /Nov 7, 2026 · morning ET/);
for (const text of ['VLK LZR 7MW', 'Demo RXT Stock', '4.6mm Hollowpoint', 'Monolithic Suppressor']) {
  assert(!(await active().innerText()).includes(text), `stale ${text}`);
}
const rows = await active().locator('.attachment-list li').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
for (const height of rows) assert(height >= 44, `attachment row ${height}px`);
for (const target of ['br', 'res']) assert((await page.locator(`[data-mode-target="${target}"]`).evaluate(element => element.getBoundingClientRect().height)) >= 44);
for (const link of await active().locator('.role-jump a').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height))) assert(link >= 44);

await page.locator('[data-mode-target="res"]').click();
await page.waitForFunction(() => document.documentElement.dataset.mode === 'res');
assert.equal(await page.evaluate(() => performance.getEntriesByType('navigation').length), 1);
assert.equal(await page.locator('[data-mode-view="res"] .pick-card').count(), 0);
assert.equal(await page.locator('[data-mode-view="res"] .empty-card').count(), 1);
assert.match(await page.locator('#res-long').innerText(), /No current Zodiac pick assigned for long range/);
assert.equal(await page.locator('#res-pending .attachment-list').count(), 0);

await page.goto(`${base}ttk/`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
assert.equal(await page.locator('.filter-chip[aria-pressed="true"]').getAttribute('data-filter-type'), 'all');
assert.equal(await page.locator('.ttk-svg').count() > 0, true);
assert.match(await page.locator('body').innerText(), /No measured TTK yet for Voyak KT-3/);
assert.match(await page.locator('body').innerText(), /No measured TTK yet for Rezi 12 or Warlord/);
assert.match(await page.locator('body').innerText(), /knockdown/);
assert.match(await page.locator('body').innerText(), /JGOD 553 ms at 0m versus CODMunity 617 ms/);
assert.match(await page.locator('body').innerText(), /JGOD 630 ms at 0m versus CODMunity 567 ms/);
assert.match(await page.locator('body').innerText(), /800 ms at 0–10m/);
const visibleSeries = await page.locator('.ttk-svg .series-mark[data-slot]').count();
assert(visibleSeries <= 4 * await page.locator('.ttk-chart').count(), 'more than four series on a chart');
await page.getByRole('button', { name: 'SMG', exact: true }).click();
await page.waitForFunction(() => document.querySelector('.ttk-page').dataset.filterState.includes('"type":"SMG"'));
assert.equal(await page.locator('[data-ttk-type="AR"]').isHidden(), true);
assert.equal(await page.locator('[data-ttk-type="SMG"]').isVisible(), true);
assert.equal(await page.locator('[data-ttk-type="Shotgun"]').isHidden(), true);
const smgCharts = page.locator('[data-ttk-type="SMG"] .ttk-chart');
assert.equal(await smgCharts.count(), 2);
for (const chart of await smgCharts.all()) {
  const on = await chart.locator('.series-mark[data-slot]').count();
  assert(on <= 8, 'SMG chart shows more than four weapons in the chart and table');
}
await page.getByRole('button', { name: 'Shotgun', exact: true }).click();
assert.match(await page.locator('[data-ttk-type="Shotgun"]').innerText(), /No measured TTK yet/);
assert.equal(await page.locator('[data-ttk-type="Shotgun"] .ttk-svg').count(), 0);
await page.setViewportSize({ width: 390, height: 844 });
const chipHeights = await page.locator('.filter-chip').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
for (const height of chipHeights) assert(height >= 44, `filter chip ${height}px`);
const chipOverflow = await page.locator('.filter-row').evaluate(row => row.scrollWidth <= row.clientWidth + 1);
assert(chipOverflow, 'type filter scrolls sideways');

for (const width of [320, 390, 1280]) await checkOverflow(width);

await page.getByRole('button', { name: 'SMG', exact: true }).click();
await page.setViewportSize({ width: 1280, height: 900 });
await page.evaluate(() => scrollTo(0, 0));
await page.screenshot({ path: '/opt/cursor/artifacts/ttk_filter_1280.png' });
await page.screenshot({ path: 'shots/r2/ttk-smg-1280.png' });
await page.setViewportSize({ width: 390, height: 844 });
await checkOverflow(390);
await page.evaluate(() => scrollTo(0, 0));
await page.screenshot({ path: '/opt/cursor/artifacts/ttk_390.png' });
await page.screenshot({ path: 'shots/r2/ttk-smg-390.png' });

await page.goto(`${base}?mode=br`, { waitUntil: 'networkidle' });
await page.setViewportSize({ width: 1280, height: 900 });
await page.evaluate(() => scrollTo(0, 0));
await page.screenshot({ path: '/opt/cursor/artifacts/home_1280.png' });
await page.locator('#br-close').screenshot({ path: '/opt/cursor/artifacts/role_alternatives_1280.png' });
await page.setViewportSize({ width: 390, height: 844 });
await checkOverflow(390);
await page.evaluate(() => scrollTo(0, 0));
await page.screenshot({ path: '/opt/cursor/artifacts/home_390.png' });
await page.locator('#br-close').screenshot({ path: '/opt/cursor/artifacts/role_alternatives_390.png' });

assert.deepEqual(errors, []);
assert.deepEqual(consoleErrors, []);
assert.deepEqual(badResponses, []);
console.log(JSON.stringify({ checks: 'pass', chipHeights, consoleErrors, badResponses }, null, 2));
await browser.close();
