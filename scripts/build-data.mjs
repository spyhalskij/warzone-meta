// Validate the evidence record; the renderer never invents facts or fills build slots.
import fs from 'node:fs';
const root = new URL('../src/data/', import.meta.url);
const meta = JSON.parse(fs.readFileSync(new URL('meta.json', root), 'utf8'));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sourceIds = new Set(meta.sources.map(source => source.id));
assert(sourceIds.size === meta.sources.length, 'Source IDs must be unique');
assert(meta.sources.every(source => source.url.startsWith('https://') && source.date && source.label), 'Every source needs a label, HTTPS URL and date');
assert(/^\d{4}-\d{2}-\d{2}$/.test(meta.snapshotDate) && !Number.isNaN(Date.parse(`${meta.snapshotDate}T00:00:00Z`)), 'Snapshot must have a real ISO date');
const cited = value => {
  if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
    if (key === 'sourceIds' && Array.isArray(child)) {
      assert(new Set(child).size === child.length, `Duplicate sourceIds in ${JSON.stringify(value).slice(0,80)}`);
      child.forEach(id => assert(sourceIds.has(id), `Missing cited source: ${id}`));
    } else cited(child);
  }
};
cited(meta);
for (const mode of ['br', 'res']) {
  assert(meta.modes[mode].cards.length > 0, `${mode} has no cards`);
  for (const card of meta.modes[mode].cards) {
    assert(['Established', 'Emerging', 'Testing', 'Historical'].includes(card.confidence), `${card.id}: invalid confidence`);
    assert(card.modeUnlabeled === true, `${card.id}: missing visible mode flag`);
    assert(card.summary.length <= 110, `${card.id}: summary exceeds 110 characters`);
    if (card.observed.date) assert(/^\d{4}-\d{2}-\d{2}$/.test(card.observed.date) && !Number.isNaN(Date.parse(`${card.observed.date}T00:00:00Z`)), `${card.id}: invalid ISO observed date`);
    assert(card.observed.names.length <= card.observed.total, `${card.id}: impossible observed names`);
    assert(card.observed.n > 0 || card.observed.display, `${card.id}: empty observation must explain its denominator`);
    for (const field of card.build?.attachments ?? []) assert(field.slot && !/^Attachment\s*\d*/i.test(field.slot), `${card.id}: generic numbered slot`);
    if (card.build) {
      assert(card.build.owner && card.build.kind && card.build.note && card.build.sourceIds.length, `${card.id}: incomplete build provenance`);
      assert(card.build.attachments.length > 0, `${card.id}: empty attachment build`);
    }
    if (card.test) {
      assert(['CALC', 'MEAS'].includes(card.test.kind) && card.test.value && card.test.note, `${card.id}: incomplete test result`);
    }
  }
}
assert(meta.pros.length === 20 && new Set(meta.pros.map(pro => pro.id)).size === 20, 'Roster must contain 20 unique players');
for (const pro of meta.pros) if (pro.last) {
  assert(pro.last.date && pro.last.pair && pro.last.note && pro.last.sourceIds.length, `${pro.id}: incomplete capture`);
  assert(pro.last.preReset === (pro.last.date < '2026-11-06'), `${pro.id}: incorrect pre-reset flag`);
}
fs.copyFileSync(new URL('meta.json', root), new URL(`meta-${meta.snapshotDate}.json`, root));
console.log(`Validated ${meta.pros.length} pros, ${meta.sources.length} dated sources, ${meta.modes.br.cards.length} BR cards and ${meta.modes.res.cards.length} Resurgence cards; summaries <=110; no numbered slots.`);
