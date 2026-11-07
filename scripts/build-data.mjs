// Validate the evidence record; the renderer never invents facts or fills build slots.
import fs from 'node:fs';
const root = new URL('../src/data/', import.meta.url);
const meta = JSON.parse(fs.readFileSync(new URL('meta.json', root), 'utf8'));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sourceIds = new Set(meta.sources.map(source => source.id));
assert(sourceIds.size === meta.sources.length, 'Source IDs must be unique');
assert(meta.sources.every(source => source.url.startsWith('https://') && source.date && source.label), 'Every source needs a label, HTTPS URL and date');
assert(meta.schemaVersion === 2, 'Schema version must be 2');
assert(/^\d{4}-\d{2}-\d{2}$/.test(meta.snapshotDate) && !Number.isNaN(Date.parse(`${meta.snapshotDate}T00:00:00Z`)), 'Snapshot must have a real ISO date');
const tags = ['PRO', 'MEAS', 'AGG', 'CALC'];
const placements = ['pick', 'alternative', 'empty', 'withdrawn'];
const roleKeys = ['close', 'long', 'support', 'sniper', 'legacy'];
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
    assert(placements.includes(card.placement), `${card.id}: invalid placement`);
    assert(Array.isArray(card.evidenceTags) && card.evidenceTags.length <= 3 && new Set(card.evidenceTags).size === card.evidenceTags.length, `${card.id}: evidence tags must be unique and at most 3`);
    card.evidenceTags.forEach(tag => assert(tags.includes(tag), `${card.id}: unknown evidence tag ${tag}`));
    if (card.test?.kind === 'CALC') assert(card.evidenceTags.includes('CALC'), `${card.id}: calculator result must be tagged CALC`);
    if (card.test?.kind === 'MEAS') assert(card.evidenceTags.includes('MEAS'), `${card.id}: measured result must be tagged MEAS`);
    if (card.placement === 'alternative') {
      assert(card.whenToPick && !card.whenToPick.includes('\n') && card.whenToPick.length <= 160, `${card.id}: alternative needs one when-to-pick line`);
    }
    assert(!card.legacy || card.build?.attachments.length === 0, `${card.id}: legacy legacy attachment list must not render as an editable recipe`);
    if (card.confidence !== 'Historical' && card.observed.date) {
      assert(card.observed.date >= '2026-11-06' && card.observed.date <= meta.snapshotDate, `${card.id}: observation date outside the current snapshot window`);
    }
    if (card.observed.date) assert(/^\d{4}-\d{2}-\d{2}$/.test(card.observed.date) && !Number.isNaN(Date.parse(`${card.observed.date}T00:00:00Z`)), `${card.id}: invalid ISO observed date`);
    assert(card.observed.names.length <= card.observed.total, `${card.id}: impossible observed names`);
    assert(Number.isInteger(card.observed.n) && card.observed.total > 0 && card.observed.dateLabel && card.observed.caveat, `${card.id}: incomplete observation`);
    assert(card.observed.n > 0 || card.observed.display, `${card.id}: empty observation must explain its denominator`);
    const allCitations = [...card.sourceIds, ...card.observed.sourceIds, ...(card.build?.sourceIds ?? []), ...(card.test?.sourceIds ?? [])];
    assert(allCitations.every(id => card.sourceIds.includes(id)), `${card.id}: observation/build/test citation missing from card sourceIds`);
    for (const field of card.build?.attachments ?? []) assert(field.slot && !/^Attachment\s*\d*/i.test(field.slot), `${card.id}: generic numbered slot`);
    if (card.build) {
      assert(card.build.owner && card.build.kind && card.build.note && card.build.sourceIds.length, `${card.id}: incomplete build provenance`);
      assert(card.build.attachments.length > 0 || card.legacy === true, `${card.id}: empty attachment build requires explicit Legacy`);
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
for (const pro of meta.pros) if (pro.last) assert(pro.last.date >= '2026-11-06' && pro.last.date <= meta.snapshotDate, `${pro.id}: pro capture date outside the current snapshot window`);
for (const mode of ['br', 'res']) {
  const roles = meta.modes[mode].roles;
  assert(Array.isArray(roles) && roles.length > 0, `${mode}: missing role groups`);
  for (const key of ['close', 'long', 'support', 'sniper']) assert(roles.some(role => role.key === key), `${mode}: missing ${key} role`);
  const cards = new Map(meta.modes[mode].cards.map(card => [card.id, card]));
  for (const role of roles) {
    assert(roleKeys.includes(role.key), `${role.id}: unknown role key`);
    assert(role.alternativeIds.length <= 3, `${role.id}: more than 3 alternatives`);
    const pick = role.pickId ? cards.get(role.pickId) : null;
    if (role.pickId) assert(pick?.placement === 'pick', `${role.id}: pick missing`);
    else assert(!role.alternativeIds.length, `${role.id}: empty role cannot invent alternatives`);
    for (const id of role.alternativeIds) assert(cards.get(id)?.placement === 'alternative', `${role.id}: ${id} is not an alternative`);
    if (role.emptyCardId) assert(cards.get(role.emptyCardId)?.placement === 'empty', `${role.id}: empty card missing`);
  }
}
const brRoles = Object.fromEntries(meta.modes.br.roles.map(role => [role.key, role]));
assert(brRoles.close.pickId === 'br-vel' && brRoles.close.alternativeIds.join() === 'br-iso,br-striga', 'BR close group must be VEL plus ISO and Striga');
assert(brRoles.long.pickId === 'br-cronen' && brRoles.long.alternativeIds.length === 0, 'Cronen stays a pick with no alternatives');
assert(brRoles.support.pickId === 'br-han' && brRoles.support.alternativeIds.length === 0, 'Han stays a pick with no alternatives');
assert(brRoles.legacy.pickId === 'br-voyak' && brRoles.legacy.alternativeIds.length === 0, 'Voyak stays a pick with no alternatives');
assert(brRoles.sniper.pickId === null, 'Sniper stays empty');
assert(meta.modes.res.roles.every(role => role.pickId === null && role.alternativeIds.length === 0), 'Resurgence roles stay empty');
const byId = new Map(meta.modes.br.cards.map(card => [card.id, card]));
const vel = byId.get('br-vel');
assert(vel.counterpoint.startsWith('DISAGREEMENT') && vel.sourceIds.includes('hisoka-vod-direct') && vel.sourceIds.includes('swagg-vel-comfort'), 'VEL disagreement and Hisoka/Swagg sources must stay');
for (const id of ['br-iso', 'br-striga']) {
  const card = byId.get(id);
  assert(card.confidence === 'Testing' && card.build === null && card.modeUnlabeled === true, `${id}: testing alternative must stay build-unverified and mode-unverified`);
  assert(!card.build, `${id}: do not attach a build`);
}
assert(byId.get('br-iso').evidenceTags.includes('CALC') && byId.get('br-iso').evidenceTags.includes('AGG'), 'ISO needs CALC and AGG');
assert(byId.get('br-striga').evidenceTags.includes('CALC'), 'Striga needs CALC');
assert(meta.changelog[0].date === 'Nov 7, 2026 · morning ET', 'Nov 7 morning changelog entry must lead');
const ttk = JSON.parse(fs.readFileSync(new URL('ttk.json', root), 'utf8'));
assert(Array.isArray(ttk.weapons) && Array.isArray(ttk.measurements), 'TTK data keeps weapons and measurements lists');
const weaponIds = new Set(ttk.weapons.map(weapon => weapon.id));
const ttkSourceIds = new Set(ttk.sources.map(source => source.id));
for (const measurement of ttk.measurements) {
  assert(weaponIds.has(measurement.weapon_id), `TTK measurement missing weapon ${measurement.weapon_id}`);
  assert(ttkSourceIds.has(measurement.source_id), `TTK measurement missing source ${measurement.source_id}`);
  const keys = Object.keys(measurement.ttk_ms);
  const jgod = keys.every(key => ['0m', '15m', '40m', 'far'].includes(key));
  const cod = keys.every(key => ['0-10m', '10-40m', '40-80m', '80-120m'].includes(key));
  assert(jgod !== cod, `${measurement.weapon_id}: a measurement must belong to one source bucket set`);
}
const ttkValue = (weaponId, sourceId, bucket) => ttk.measurements.find(measurement => measurement.weapon_id === weaponId && measurement.source_id === sourceId)?.ttk_ms[bucket];
assert(ttkValue('wz55-striga', 'jgod-2026-11-06', '0m') === 553 && ttkValue('wz55-striga', 'codmunity-2026-11-06', '0-10m') === 617, 'Striga disagreement drifted');
assert(ttkValue('vel-46', 'jgod-2026-11-06', '0m') === 630 && ttkValue('vel-46', 'codmunity-2026-11-06', '0-10m') === 567, 'VEL disagreement drifted');
assert(ttkValue('kastov-762', 'jgod-2026-11-06', '0m') === 600 && ttkValue('kastov-762', 'codmunity-2026-11-06', '0-10m') === 800, 'Kastov disagreement drifted');
assert(ttkValue('iso-nightshade', 'jgod-2026-11-06', '0m') === 585 && ttkValue('iso-nightshade', 'jgod-2026-11-06', '15m') === 650, 'ISO close TTK drifted');
assert(ttkValue('vel-46', 'jgod-2026-11-06', '40m') === 882 && ttkValue('iso-nightshade', 'jgod-2026-11-06', '40m') === 910, '40m VEL/ISO comparison drifted');
for (const id of ['rezi-12', 'warlord', 'voyak-kt-3']) assert(ttk.weapons.find(weapon => weapon.id === id).ttk_coverage.length === 0, `${id} must stay without TTK`);
fs.copyFileSync(new URL('meta.json', root), new URL(`meta-${meta.snapshotDate}.json`, root));
console.log(`Validated ${meta.pros.length} pros, ${meta.sources.length} dated sources, ${meta.modes.br.cards.length} BR cards and ${meta.modes.res.cards.length} Resurgence cards; summaries <=110; no numbered slots.`);
