import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import meta from '../src/data/meta.json' with { type: 'json' };
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const base = process.env.SITE_BASE || 'http://127.0.0.1:4323/warzone-meta/';
const out = 'shots/legacy-purge'; fs.mkdirSync(out, { recursive: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [], consoleErrors = [], badResponses = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', e => { if (e.type() === 'error') consoleErrors.push(e.text()); });
page.on('response', r => { if (r.status() >= 400) badResponses.push({ url: r.url(), status: r.status() }); });
await page.goto(`${base}?mode=br`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
const overflow = [];
for (const width of [320, 390, 1280]) {
  await page.setViewportSize({ width, height: 900 });
  const actual = await page.evaluate(() => ({ inner: innerWidth, doc: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  overflow.push({ width, actual }); assert(actual.doc <= width && actual.body <= width, `overflow ${width}`);
}
await page.setViewportSize({ width: 390, height: 844 });
const active = () => page.locator('[data-mode-view]:visible');
const modes = {};
async function clipScreenshot(selector, path, disclosure = false) {
  // Shot-only page: never hide controls in the context that exercises navigation.
  const mode = await page.evaluate(() => document.documentElement.dataset.mode);
  const shotPage = await page.context().newPage();
  await shotPage.goto(`${base}?mode=${mode}`, { waitUntil: 'networkidle' });
  await shotPage.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
  await shotPage.addStyleTag({ content: '.topbar,.skip-link,.mode-switch{display:none!important;}' });
  const loc = shotPage.locator(selector).first(); if (disclosure) await loc.evaluate(e => e.open = true);
  await loc.scrollIntoViewIfNeeded();
  const clip = await loc.evaluate(e => { const r = e.getBoundingClientRect(); return { x: Math.max(0, r.x - 5), y: r.y + scrollY - 5, width: r.width + 10, height: r.height + 10 }; });
  await shotPage.screenshot({ path, fullPage: true, clip });
  await shotPage.close();
}
for (const [key, mode] of Object.entries(meta.modes)) {
  await page.goto(`${base}?mode=${key}`, { waitUntil: 'networkidle' });
  const current = mode.cards.filter(c => !c.archived);
  assert.equal(await active().locator('.meta-card').count(), current.length);
  const heights = [];
  for (const c of current) {
    assert.equal(await page.locator(`#${c.id} .card-summary`).innerText(), c.summary);
    assert.equal(await page.locator(`#${c.id} details.evidence`).evaluate(e => e.open), false);
    assert.equal(await page.locator(`#${c.id} .attachment-list li`).count(), c.build?.attachments.length || 0);
    assert.equal(await page.locator(`#${c.id} .visible-tags`).isVisible(), true);
    const tag = await page.locator(`#${c.id} .visible-tags`).innerText(); assert(tag.includes('Mode-unlabeled'));
    if (c.legacy) { assert(tag.includes('LEGACY')); assert.equal(c.build.attachments.length, 0); }
    heights.push({ id: c.id, height: Math.round(await page.locator(`#${c.id}`).evaluate(e => e.getBoundingClientRect().height)) });
    const details = page.locator(`#${c.id} details.evidence`); await details.evaluate(e => e.open = true);
    const sourceMap = new Map(meta.sources.map(s => [s.id, s]));
    const expected = [...new Set([...c.sourceIds, ...c.observed.sourceIds, ...(c.build?.sourceIds || []), ...(c.test?.sourceIds || [])])].map(id => sourceMap.get(id).url);
    assert.deepEqual(await details.locator('.source-links').first().locator('a').evaluateAll(as => as.map(a => a.href)), expected);
    await details.evaluate(e => e.open = false);
  }
  assert(heights.every(h => h.height <= 735));
  modes[key] = { current: current.map(c => c.id), heights };
  await page.evaluate(() => scrollTo(0,0)); await page.addStyleTag({content:'.topbar,.skip-link{opacity:0!important;}'}); await page.screenshot({ path: `${out}/${key}-390-top.png`, fullPage: true }); await page.addStyleTag({ content: '.topbar,.skip-link{opacity:1!important;}' });
  await clipScreenshot(`#${current[0].id}`, `${out}/${key}-first-card-390.png`);
  if (key === 'res') {
    assert.equal(await active().locator('.attachment-list').count(), 0);
    assert((await active().locator('#res-pending .unavailable-build').innerText()).includes('close, long, support and sniper remain empty'));
    await clipScreenshot('.withdrawn-section', `${out}/res-audit-expanded-390.png`, true);
  } else {
    // Open details before useful evidence screenshots, not a title-only screenshot masquerading as expanded proof.
    await clipScreenshot('#br-voyak details.evidence', `${out}/legacy-evidence-expanded-390.png`, true);
  }
}
await page.goto(`${base}?mode=br`, { waitUntil: 'networkidle' });
assert.equal(await page.locator('.pro-record').count(), 20);
assert.equal(await page.locator('.pro-record.no-capture').count(), 16);
assert.equal(await page.locator('.pro-record .pro-capture').count(), 4);
assert.equal(await page.locator('a[href="https://www.twitch.tv/None"]').count(), 0);
const emptyRows = await page.locator('.pro-record.no-capture').evaluateAll(nodes => nodes.map(row => ({ name: row.querySelector('h3').textContent, height: row.getBoundingClientRect().height, linksHeight: row.querySelector('.pro-links').getBoundingClientRect().height })));
for (const row of emptyRows) { assert(row.height <= 56); assert(row.linksHeight >= 44); }
await page.locator('.historical-pairs').evaluate(e => e.open = true);
const historical = await page.locator('.historical-pairs .historical-pair').evaluateAll(nodes => nodes.map(row => ({ text: row.innerText, source: row.querySelector('a').href })));
assert.equal(historical.length, 6);
for (const pro of meta.historicalPros) {
  const row = historical.find(r => r.text.startsWith(pro.name) && r.text.includes(pro.last.pair));
  assert(row, `${pro.id}: preserve dated historical pair after moving it from current table`);
  assert(row.text.includes(pro.last.note));
  assert(row.source === meta.sources.find(s => s.id === pro.last.sourceIds[0]).url);
}
await page.locator('.historical-pairs').evaluate(e => e.open = false);
await clipScreenshot('.pro-section', `${out}/pros-390.png`);
await clipScreenshot('.historical-pairs', `${out}/prelaunch-pairs-expanded-390.png`, true);
await clipScreenshot('.change-log', `${out}/cleanup-changelog-390.png`, true);
assert.equal(await page.locator('.change-log .changelog-entry').count(), 2);
await page.locator('.change-log').evaluate(e => e.open = false);
await page.locator('[data-mode-target="res"]').click(); await page.waitForFunction(() => document.documentElement.dataset.mode === 'res');
assert.equal(await page.evaluate(() => localStorage.getItem('warzone-meta:mode')), 'res');
assert.equal(await active().getAttribute('data-mode-view'), 'res');
const navigation = await page.evaluate(() => performance.getEntriesByType('navigation').length); assert.equal(navigation, 1);
await page.goto(base, { waitUntil: 'networkidle' }); assert.equal(await active().getAttribute('data-mode-view'), 'res');
await page.goto(`${base}?mode=br`, { waitUntil: 'networkidle' }); assert.equal(await active().getAttribute('data-mode-view'), 'br');
const withdrawn = await page.locator('[data-mode-view="res"] .withdrawn-section').count(); assert.equal(withdrawn, 1);
await page.locator('.historical-pairs').evaluate(e => e.open = false);
for (const text of ['VLK LZR 7MW', 'Demo RXT Stock', '4.6mm Hollowpoint', 'Monolithic Suppressor', 'Lineguard Casket Mag', '7.62 Soviet FMJ', 'OFL-S4.5','MXR-17','CBRS-3','MPC-25','EGRT-17','Carbon 57','XM4','AN-94']) assert(!((await active().locator('.meta-grid').innerText()).includes(text)), `stale ${text}`);
assert.equal(await page.locator('#br-voyak .attachment-list').count(), 0);
assert((await active().locator('.sample-section summary').innerText()).startsWith('20/50 rolling panel'));
assert.deepEqual(errors, []); assert.deepEqual(consoleErrors, []); assert.deepEqual(badResponses, []);
const result = { pass: true, base, viewport: 390, widths: [320,390,1280], live: process.env.LIVE === '1', modes, historicalPairCount: 6, emptyRows, overflow, errors, consoleErrors, badResponses };
fs.writeFileSync(`${out}/results.json`, JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));await browser.close();
