import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import meta from '../src/data/meta.json' with { type: 'json' };
const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const base = (process.env.SITE_BASE || 'http://127.0.0.1:4323/warzone-meta/').replace(/\/$/, '') + '/';
const live = process.env.LIVE === '1';
const errors=[],consoleErrors=[],badResponses=[];
fs.mkdirSync('shots/r2',{recursive:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
page.on('pageerror',error=>errors.push(String(error)));
page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
page.on('response',response=>{if(response.status()>=400)badResponses.push({url:response.url(),status:response.status()});});
const active=()=>page.locator('[data-mode-view]:visible');
const sourceById=new Map(meta.sources.map(s=>[s.id,s]));
const sourceCount=card=>new Set(card.sourceIds).size;
const checkOverflow=async width=>{
  await page.setViewportSize({width,height:900});
  const actual=await page.evaluate(()=>({inner:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
  assert(actual.doc<=width && actual.body<=width,`Overflow at ${width}: ${JSON.stringify(actual)}`);
};
const collectHeights=()=>active().locator('.meta-card').evaluateAll(cards=>cards.map(card=>({id:card.id,height:Math.ceil(card.getBoundingClientRect().height),detailsOpen:card.querySelector('details.evidence').open})));
await page.goto(`${base}?mode=br`,{waitUntil:'networkidle'});
await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true');
assert.equal(await active().getAttribute('data-mode-view'),'br');
for(const [key,cards] of Object.entries(meta.modes))for(const card of cards.cards){
  assert.equal(await page.locator(`#${card.id} .card-summary`).innerText(),card.summary);
  assert.equal(await page.locator(`#${card.id} .confidence`).innerText(),`${card.confidence} · ${sourceCount(card)} src`);
  assert.equal(await page.locator(`#${card.id} details.evidence`).evaluate(el=>el.open),false);
  assert.equal(await page.locator(`#${card.id} .flag-row`).isVisible(),false);
  assert.equal(await page.locator(`#${card.id} .source-links`).isVisible(),false);
  assert.equal(await page.locator(`#${card.id} .attachment-list li`).count(),card.build?.attachments.length||0);
}
assert.equal(await page.locator('.launch-note').count(),0);
assert.equal(await page.locator('.pro-record').count(),20);
assert.equal(await page.locator('.pro-record.no-capture').count(),meta.pros.filter(p=>!p.last).length);
assert.equal(await page.locator('.pro-record').first().locator('h3').innerText(),'FLS');
for(const pro of meta.pros.filter(p=>p.last)){
  const row=page.locator(`.pro-record:has(h3:text-is("${pro.name}"))`);
  assert.equal(await row.locator('.pro-identity p').innerText(),`${pro.team} · ${pro.result}`,`${pro.name}: capture row retains its complete identity`);
}
assert.equal(await page.locator('.pro-record.no-capture').first().locator('h3').innerText(),'Anziety');
assert.equal(await page.locator('.empty-capture-label').first().innerText(),'· no S1 capture');
assert.equal(await page.locator('.empty-capture').first().locator('a').count(),2);
for(const pro of meta.pros.filter(p=>!p.last)){
  const row=page.locator(`.pro-record.no-capture:has(h3:text-is("${pro.name}"))`);
  const identity=(await row.locator('.pro-identity').innerText()).replace(/\s+/g,' ');
  assert(identity.includes(`${String(pro.order).padStart(2,'0')} ${pro.name} · ${pro.team} · no S1 capture`));
  assert(!identity.includes(pro.result),`${pro.name}: empty row must not include its tournament resume`);
  const links=await row.locator('.pro-links a').evaluateAll(nodes=>nodes.map(a=>a.href));
  assert.deepEqual(links,[pro.twitch,pro.x],`${pro.name}: both external links are retained`);
}
const expectedLabels={"VLK LZR 7MW":"Laser","4.6mm Hollowpoint":"Ammunition","SA H86 465MM":"Barrel","TZL-110 V1":"Muzzle","5.56 NATO High":"Ammunition","7.62 Soviet FMJ":"Ammunition"};
for(const card of [...meta.modes.br.cards,...meta.modes.res.cards]){
  for(const a of card.build?.attachments ?? [])assert.equal(await page.locator(`#${card.id} .attachment-list li`).filter({hasText:a.name}).locator('span').innerText(),a.slot,`${card.id}: ${a.name} slot`);
  for(const [name,slot] of Object.entries(expectedLabels))if(card.build?.attachments.some(a=>a.name===name))assert.equal(card.build.attachments.find(a=>a.name===name).slot,slot);
  const expectedMeta=`${card.observed.display ?? `${card.observed.n}/${card.observed.total}`} · ${card.observed.date === '2026-11-06' ? 'Nov 6' : 'No capture'}`;
  assert.equal((await page.locator(`#${card.id} .meta-strip > span`).first().innerText()).replace(/\s+/g,' ').trim(),expectedMeta,`${card.id}: compact card meta strip`);
}
assert.equal(await page.locator('.slot-note').count(),0,'No unverified generic Slot labels remain');
const heights=await collectHeights();
for(const {id,height,detailsOpen} of heights){assert.equal(detailsOpen,false);assert(height<=700,`${id} is ${height}px, greater than 700px`);}
for(const attachment of meta.modes.br.cards[0].build.attachments){assert.equal(await page.locator('#br-cronen .attachment-list strong').filter({hasText:attachment.name}).count(),1);}
assert.equal(await page.locator('.attachment-list li').evaluateAll(rows=>rows.some(row=>/Attachment\s*\d/.test(row.innerText))),false);
await page.locator('#br-cronen summary').click();
assert.equal(await page.locator('#br-cronen details.evidence').evaluate(el=>el.open),true);
assert.equal(await page.locator('#br-cronen .source-links').isVisible(),true);
const directLinks=await page.locator('#br-cronen .source-links a').evaluateAll(as=>as.map(a=>a.href));
assert.deepEqual(directLinks,[...new Set(meta.modes.br.cards[0].sourceIds)].map(id=>sourceById.get(id).url));
assert.equal(await page.locator('#br-cronen .evidence-content h4').filter({hasText:'Source disagreement'}).count(),1);
assert.equal(await page.locator('#br-cronen .evidence-content p').filter({hasText:meta.modes.br.cards[0].counterpoint}).count(),1);
// Every discrete evidence record should have its cited URL inside the one closed-by-default card disclosure.
for (const card of [...meta.modes.br.cards, ...meta.modes.res.cards]) {
  const details = page.locator(`#${card.id} details.evidence`);
  await details.evaluate(element => { element.open = true; });
  const expected = [...new Set([card.sourceIds, card.observed.sourceIds, card.build?.sourceIds || [], card.test?.sourceIds || []].flat())].map(id => sourceById.get(id).url);
  const actual = await details.locator('.source-links a').evaluateAll(links => links.map(link => link.href));
  assert.deepEqual(actual, expected, `All cited evidence URLs for ${card.id}`);
  await details.evaluate(element => { element.open = false; });
}
await page.evaluate(()=>{document.querySelector('[data-mode-view="br"] .sample-section').open=true;});
assert.equal(await page.locator('[data-mode-view="br"] .sample-section summary').isVisible(),true);
await page.evaluate(()=>{document.querySelector('.roster-details').open=true;});
assert.equal(await page.locator('.roster-details .source-links').isVisible(),true);
await page.locator('#br-cronen summary').click();
await page.locator('[data-mode-target="res"]').click();
await page.waitForFunction(()=>document.documentElement.dataset.mode==='res');
assert.equal(await active().getAttribute('data-mode-view'),'res');
assert.equal(await active().locator('.meta-card').count(),meta.modes.res.cards.length);
const navigation=await page.evaluate(()=>performance.getEntriesByType("navigation").length);assert.equal(navigation,1,'Mode switch should not reload');
assert(page.url().includes('mode=res'));
assert.equal(await page.evaluate(()=>localStorage.getItem('warzone-meta:mode')),'res');
const resHeights=await collectHeights();resHeights.forEach(({id,height})=>assert(height<=700,`${id}: ${height}px`));
await page.goto(base,{waitUntil:'networkidle'});
assert.equal(await active().getAttribute('data-mode-view'),'res','localStorage should restore Resurgence');
await page.goto(`${base}?mode=br`,{waitUntil:'networkidle'});
assert.equal(await active().getAttribute('data-mode-view'),'br','query should win');
for(const width of [320,390,1280]){
  await checkOverflow(width);
  if(width!==1280){
    const rows=await page.locator('.pro-record.no-capture').evaluateAll(nodes=>nodes.map(row=>({name:row.querySelector('h3').textContent,height:row.getBoundingClientRect().height,linksHeight:row.querySelector('.pro-links').getBoundingClientRect().height})));
    for(const row of rows){assert(row.height<=56,`${row.name}: ${row.height}px empty-pro row exceeds 56px at ${width}`);assert(row.linksHeight>=44,`${row.name}: links must retain 44px targets at ${width}`);}
  }
}
await page.setViewportSize({width:390,height:844});
await checkOverflow(390);
const emptyProRows=await page.locator('.pro-record.no-capture').evaluateAll(rows=>rows.map(row=>{const identity=row.querySelector('.pro-identity').getBoundingClientRect();const links=row.querySelector('.pro-links').getBoundingClientRect();const r=row.getBoundingClientRect();return {name:row.querySelector('h3').textContent,height:r.height,oneLine:Math.abs(r.top-links.top)<1 && identity.height<23,linksHeight:links.height};}));
for(const row of emptyProRows){assert(row.oneLine,`${row.name}: links should share the identity line at 390`);}
await page.setViewportSize({width:1280,height:900});
assert.equal(await page.locator('[data-mode-view="br"] .map-readout').isVisible(),true);
await page.evaluate(()=>scrollTo(0,0));
await page.screenshot({path:'shots/r2/br-1280-top.png',fullPage:false});

await page.setViewportSize({width:390,height:844});
await checkOverflow(390);
const mobileMapHidden=await page.locator('[data-mode-view="br"] .map-readout').isHidden();assert(mobileMapHidden);
await page.evaluate(()=>scrollTo(0,0));
await page.screenshot({path:'shots/r2/br-390-top.png'});
await page.locator('#br-cronen').screenshot({path:'shots/r2/card-br-cronen-390.png'});
await page.locator('.pro-record.no-capture').first().scrollIntoViewIfNeeded();
await page.screenshot({path:'shots/r2/pros-empty-390.png'});
await page.locator('.pro-section').screenshot({path:'shots/r2/pros-390.png'});
await page.locator('.official-section').scrollIntoViewIfNeeded();
await page.screenshot({path:'shots/r2/official-390.png'});
const allDetailsClosed=await page.locator('details').evaluateAll(ds=>ds.every(d=>!d.open));assert(allDetailsClosed,'All Evidence disclosures should default closed');
assert.equal(await page.locator('.log-section').count(),0,'No one-entry changelog section');assert.equal(await page.locator('.change-log').count(),1,'Compact changelog disclosure is retained');
assert.equal(await page.locator('.topbar .segment').count(),1,'Mode switch stays unchanged');
assert.equal(await page.locator('.launch-note').count(),0);
assert.equal(await page.locator('.section-title > span').count(),0);
const switchMarkup=await page.locator('.mode-switch').innerHTML();assert.equal(await page.locator('.mode-switch').evaluate(el=>el.getAttribute('aria-label')),'Game mode');
const rows=await active().locator('.attachment-list li').evaluateAll(rows=>rows.map(row=>Math.round(row.getBoundingClientRect().height)));for(const height of rows)assert(height>=44 && height<=48,`Attachment row ${String(height)}px outside 44–48px`);
assert((await page.locator('[data-mode-view="br"] .sample-section summary').innerText()).startsWith('17/46 panel · not a population · 2 sources · latest Nov 6'));
assert(switchMarkup.includes('data-mode-target="br"') && switchMarkup.includes('data-mode-target="res"'), 'BR and Res controls remain');
for(const target of ['br','res'])assert((await page.locator(`[data-mode-target="${target}"]`).evaluate(el=>el.getBoundingClientRect().height))>=44);
const result={checks:'pass',live,base,widthsChecked:[320,390,1280],brHeights:heights,resHeights,emptyProRows,meanBrHeight:Math.round(heights.reduce((sum,row)=>sum+row.height,0)/heights.length),pageHeight:await page.evaluate(()=>document.documentElement.scrollHeight),pageErrors:errors,consoleErrors,badResponses};
for(const {height} of resHeights)assert(height<=700);
assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);assert.deepEqual(badResponses,[]);
fs.writeFileSync('shots/r2/results.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
await browser.close();
