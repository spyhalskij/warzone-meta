// Validate every published evidence reference before Astro renders the static pages.
// No observations, attachments, TTK figures or tournament results are synthesized.
import fs from 'node:fs';
const root = new URL('../src/data/', import.meta.url);
const meta = JSON.parse(fs.readFileSync(new URL('meta.json', root), 'utf8'));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sourceIds = new Set(meta.sources.map(source => source.id));
assert(sourceIds.size === meta.sources.length, 'Source IDs must be unique');
assert(meta.sources.every(source => source.url.startsWith('https://') && source.date && source.label), 'Every source needs a label, HTTPS URL and date');
assert(/^\d{4}-\d{2}-\d{2}$/.test(meta.snapshotDate) && !Number.isNaN(Date.parse(`${meta.snapshotDate}T00:00:00Z`)), 'Snapshot must have a real ISO date');
const cited = value => {
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === 'sourceIds' && Array.isArray(child)) child.forEach(id => assert(sourceIds.has(id), `Missing source definition: ${id}`));
      else cited(child);
    }
  }
};
cited(meta);
for (const mode of ['br', 'res']) {
  assert(meta.modes[mode].cards.length > 0, `${mode} has no cards`);
  for (const card of meta.modes[mode].cards) {
    assert(['Established', 'Emerging', 'Testing', 'Historical'].includes(card.confidence), `${card.id}: invalid confidence`);
    assert(card.modeUnlabeled === true, `${card.id}: missing visible mode-unlabeled flag`);
    assert(card.observed.names.length <= card.observed.total, `${card.id}: impossible observed names`);
    if (card.observed.date) assert(/^\d{4}-\d{2}-\d{2}$/.test(card.observed.date) && !Number.isNaN(Date.parse(`${card.observed.date}T00:00:00Z`)), `${card.id}: observed date must be ISO YYYY-MM-DD`);
    assert(card.observed.n > 0 || card.observed.display, `${card.id}: empty observation must explain its denominator`);
    if (card.build) {
      assert(card.build.owner && card.build.kind && card.build.note, `${card.id}: build provenance is incomplete`);
      assert(card.build.attachments.length > 0, `${card.id}: build has no attachments`);
      assert(card.build.sourceIds.length > 0, `${card.id}: attachments lack direct citations`);
      card.build.attachments.forEach(attachment => assert(attachment.slot && attachment.name, `${card.id}: incomplete attachment`));
    }
    if (card.test) {
      assert(['CALC', 'MEAS'].includes(card.test.kind), `${card.id}: invalid test label`);
      assert(card.test.value && card.test.note, `${card.id}: test result lacks its limitations`);
    }
    for (const list of [card.sourceIds, card.observed.sourceIds, ...(card.build ? [card.build.sourceIds] : []), ...(card.test ? [card.test.sourceIds] : [])]) {
      list.forEach(id => assert(sourceIds.has(id), `${card.id}: missing source ${id}`));
    }
  }
}
assert(meta.pros.length === 20, 'The performance roster must retain all 20 players');
assert(new Set(meta.pros.map(pro => pro.id)).size === 20, 'Player IDs must be unique');
for (const pro of meta.pros) {
  if (pro.last) {
    assert(pro.last.date && pro.last.pair && pro.last.note && pro.last.sourceIds.length, `${pro.id}: incomplete capture`);
    assert(pro.last.preReset === (pro.last.date < '2026-11-06'), `${pro.id}: pre-reset label does not match capture date`);
  }
}
fs.copyFileSync(new URL('meta.json', root), new URL(`meta-${meta.snapshotDate}.json`, root));
console.log(`Validated ${meta.pros.length} pros, ${meta.sources.length} dated sources, ${meta.modes.br.cards.length} BR cards and ${meta.modes.res.cards.length} Resurgence cards; retained meta-${meta.snapshotDate}.json.`);
