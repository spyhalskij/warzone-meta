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
const buildEvidence = ['PRO', 'AGG', 'CREATOR', 'OFFICIAL'];
const buildRank = build => build.evidenceType === 'PRO' ? 0 : build.proUseReported ? 1 : build.evidenceType === 'CREATOR' ? 2 : build.evidenceType === 'OFFICIAL' ? 4 : 3;
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
    if (card.builds) {
      assert(Array.isArray(card.builds) && card.builds.length <= 3, `${card.id}: builds must be an array of at most 3`);
      const ids = new Set();
      let previousRank = -1;
      card.builds.forEach((build, index) => {
        assert(build.id && !ids.has(build.id), `${card.id}: duplicate build id`);
        ids.add(build.id);
        assert(buildEvidence.includes(build.evidenceType), `${card.id}: build evidence must be PRO, AGG, CREATOR, or OFFICIAL`);
        assert(typeof build.sourceName === 'string' && build.sourceName.length > 0, `${card.id}: build needs a source name`);
        assert(typeof build.url === 'string' && build.url.startsWith('https://'), `${card.id}: build source must be HTTPS`);
        assert(/^\d{4}-\d{2}-\d{2}$/.test(build.date) && !Number.isNaN(Date.parse(`${build.date}T00:00:00Z`)), `${card.id}: build date must be ISO`);
        const earliestBuildDate = build.evidenceType === 'OFFICIAL' ? '2026-11-05' : '2026-11-06';
        assert(build.date >= earliestBuildDate && build.date <= meta.snapshotDate, `${card.id}: build date is outside the current snapshot`);
        assert(typeof build.mode === 'string' && build.mode.length > 0, `${card.id}: build mode must be the source mode`);
        assert(typeof build.note === 'string' && build.note.trim() && !build.note.includes('\n'), `${card.id}: build note must be one line`);
        assert(build.complete === true || build.complete === false, `${card.id}: build completeness must be explicit`);
        const rank = buildRank(build);
        if (card.id !== 'br-kg7') assert(rank >= previousRank, `${card.id}: builds must be ordered pro first`);
        previousRank = rank;
        if (card.builds.length > 1) assert(build.label === `${build.label.split(' Build ')[0]} Build ${index + 1}`, `${card.id}: tab label must stay a short Build N label`);
        assert(Array.isArray(build.attachments) && build.attachments.length > 0, `${card.id}: build needs its listed slots`);
        for (const attachment of build.attachments) {
          assert(attachment.slot && !/^Attachment\s*\d*/i.test(attachment.slot), `${card.id}: generic numbered slot`);
          if (attachment.status === 'unknown') assert(attachment.name == null, `${card.id}: unknown slot was filled in`);
          else {
            assert(attachment.status === 'verified-current-catalog', `${card.id}: unknown attachment status`);
            assert(typeof attachment.name === 'string' && attachment.name.trim() && attachment.name !== 'unknown', `${card.id}: listed part missing`);
          }
        }
        const named = build.attachments.filter(attachment => attachment.name).length;
        assert(build.complete === (named === build.attachments.length), `${card.id}: completeness does not match listed parts`);
        if (build.variant) {
          assert(build.variant.note && !build.variant.note.includes('\n'), `${card.id}: variant note must be one line`);
          assert(build.note.toLowerCase().includes('variant') || (build.variant.with?.name && build.note.includes(build.variant.with.name)), `${card.id}: variant must be mentioned in the build note`);
        }
      });
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
assert(brRoles.sniper.pickId === 'br-kg7' && brRoles.sniper.alternativeIds.join() === 'br-mosin', 'KG-7 is the BR sniper pick and Mosin is the alternative');
assert(meta.modes.res.roles.every(role => role.pickId === null && role.alternativeIds.length === 0), 'Resurgence roles stay empty');
const byId = new Map(meta.modes.br.cards.map(card => [card.id, card]));
const vel = byId.get('br-vel');
assert(vel.counterpoint.startsWith('DISAGREEMENT') && vel.sourceIds.includes('hisoka-vod-direct') && vel.sourceIds.includes('swagg-vel-comfort'), 'VEL disagreement and Hisoka/Swagg sources must stay');
for (const id of ['br-iso']) {
  const card = byId.get(id);
  assert(card.confidence === 'Testing' && card.modeUnlabeled === true, `${id}: testing alternative stays mode-unverified`);
  assert(Array.isArray(card.builds) && card.builds.length > 0, `${id}: show the sourced build`);
  assert(card.builds.every(build => build.mode === 'unverified'), `${id}: do not assign a mode the source did not`);
}
const striga = byId.get('br-striga');
assert(striga.confidence === 'Emerging' && striga.placement === 'alternative' && striga.modeUnlabeled === true, 'Striga is an Emerging, mode-flagged alternative (Nov 12 evening)');
assert(striga.observed.n === 8 && striga.observed.names.length === 8, 'Striga sample is 8 named pros (Nov 13)');
assert(striga.builds.slice(0, 2).every(build => build.evidenceType === 'PRO' && build.complete === true), 'Striga pro builds lead the tabs');
assert(striga.builds.find(build => build.id === 'striga-shifty').mode.startsWith('Resurgence'), 'Shifty build keeps its Resurgence event label');
const buildOrder = {
  'br-vel': ['vel-hisoka-direct', 'vel-spam', 'vel-codmunity'],
  'br-iso': ['iso-adriann-partial', 'iso-codmunity'],
  'br-han': ['han-hisoka-partial', 'han-codmunity'],
  'br-striga': ['striga-almond', 'striga-shifty', 'striga-codmunity'],
  'br-cronen': ['cronen-spam'],
  'br-voyak': [],
  'br-mosin': ['mosin-fifakill'],
  'br-kg7': ['kg7-codmunity', 'kg7-cbass', 'kg7-official']
};
const buildSlots = {
  'vel-hisoka-direct': ['Barrel:VB-46 Series 11', 'Muzzle:FSS Crackdown', 'Laser:Schlager VISIV-5', 'Stock:EXP U-Turn Stock', 'Unknown equipped slot:'],
  'vel-spam': ['Barrel:VB-46 Series 11', 'Muzzle:212 LC40 Comp', 'Stock:EXP U-Turn Stock', 'Rear Grip:V46 R-Skel Grip', 'Ammunition:4.6x30mm High Velocity'],
  'vel-codmunity': ['Muzzle:TA TacPro-56', 'Barrel:RV-B v2 Barrel', 'Underbarrel:FSS Fireline Grip', 'Stock:EXP U-Turn Stock', 'Ammunition:4.6x30mm High Velocity'],
  'iso-adriann-partial': ['Barrel:ZLR Carbon-900', 'Stock:', 'Rear Grip:Demo STP-1', 'Ammunition:', 'Magazine:40 Round Mag'],
  'iso-codmunity': ['Barrel:ZLR Mag-Z 9"', 'Magazine:40 Round Mag', 'Rear Grip:Demo STP-1', 'Stock:EXP G2-44 Stock', 'Ammunition:9mm Parabellum High Velocity'],
  'han-hisoka-partial': ['Barrel:SA H86 465mm', 'Muzzle:TZL-110 V1', 'Optic:Slimline Elite', 'Stock:FR4 Retractable Stock', 'Unknown equipped slot:'],
  'han-codmunity': ['Optic:Cronen R808', 'Muzzle:FSS IS300', 'Barrel:Hanbit Lightning-7 465mm', 'Magazine:45 Round Mag', 'Ammunition:5.56 NATO High Velocity'],
  'striga-almond': ['Barrel:GW Sender 500', 'Muzzle:FTAC Silent Recon', 'Optic:Slimline Elite', 'Stock:Wire Stock', 'Magazine:50 Round Drum Mag'],
  'striga-shifty': ['Barrel:GW Sender 500', 'Muzzle:FTAC Silent Recon', 'Optic:Slimline Elite', 'Rear Grip:Matuzek 532-L Grip', 'Magazine:50 Round Drum Mag'],
  'striga-codmunity': ['Muzzle:Full Port Comp', 'Barrel:GW Sender 500', 'Magazine:50 Round Drum Mag', 'Rear Grip:Matuzek 532-L Grip', 'Stock:Wire Stock'],
  'cronen-spam': ['Barrel:IO-556 TAC 18"', 'Muzzle:FSS IS300 Heavy Silencer', 'Optic:Locus PX3 Canted Rifle Scope', 'Magazine:60 Round Mag', 'Ammunition:5.56 NATO High Velocity'],
  'mosin-fifakill': ['Muzzle:FTAC Silent Recon (Heavy Silencer)', 'Barrel:Mosin K025 Barrel (Long Barrel)', 'Laser:XRK Clutch-LS (Dim ADS Laser)', 'Optic:Expedite 308 DR2 (Marksman Scope)', 'Ammunition:7.62x54mmR High Velocity'],
  'kg7-codmunity': ['Muzzle:Gauge-12 Mono', 'Barrel:Haebang RMT762 29"', 'Stock:TT G76-RP Stock', 'Ammunition:7.62x54mmR High Velocity', 'Bolt:KT76 Light Bolt', 'Optic:'],
  'kg7-cbass': ['Muzzle:TT Solgae F7', 'Barrel:Haebang RMT762 29"', 'Stock:TT G76-RP Stock', 'Ammunition:7.62x54mmR High Velocity', 'Bolt:KT76 Light Bolt', 'Optic:'],
  'kg7-official': ['Ammunition:7.62x54mmR High Velocity', 'Laser:XRK Clutch-LS', 'Muzzle:TT Solgae F7', 'Optic:SZ Castaway', 'Stock:TT G76-RP Stock']
};
for (const [id, order] of Object.entries(buildOrder)) {
  const card = byId.get(id);
  assert(Array.isArray(card.builds), `${id}: builds[] required`);
  assert(card.builds.map(build => build.id).join() === order.join(), `${id}: build tab order drifted`);
  for (const build of card.builds) {
    const actual = build.attachments.map(attachment => `${attachment.slot}:${attachment.name ?? ''}`);
    assert(actual.join('|') === buildSlots[build.id].join('|'), `${id} ${build.id}: attachment not in the sourced build`);
  }
}
assert(byId.get('br-vel').builds[0].evidenceType === 'PRO' && byId.get('br-vel').builds[0].mode === 'BR', 'VEL pro build stays first');
assert(byId.get('br-voyak').builds.length === 0 && byId.get('br-voyak').build.attachments.length === 0, 'Voyak stays without a verified current build');
assert(byId.get('br-vel').builds.find(build => build.id === 'vel-spam').note.includes('LM Combat Grip'), 'VEL rear-grip variant stays in the note');
assert(byId.get('br-cronen').builds[0].note.includes('FSS Fireline Grip'), 'Cronen variant stays in the note');
assert(!JSON.stringify(byId.get('br-iso').builds).includes('Demo Kilo90 ST'), 'unresolved ISO stock string must not become an attachment');
assert(byId.get('br-iso').evidenceTags.includes('CALC') && byId.get('br-iso').evidenceTags.includes('AGG'), 'ISO needs CALC and AGG');
assert(byId.get('br-striga').evidenceTags.includes('CALC'), 'Striga needs CALC');
assert(meta.changelog[0].date === 'Nov 13, 2026 · morning ET' && meta.changelog[0].title === 'Wz.55 Striga gains ground', 'Nov 13 morning Striga entry must lead');
assert(meta.changelog.some(entry => entry.date === 'Nov 12, 2026 · evening ET' && entry.title === 'Wz.55 Striga Emerging'), 'Nov 12 evening Striga entry must remain');
assert(meta.changelog.some(entry => entry.date === 'Nov 12, 2026 · morning ET' && entry.title === 'Hitscan and ballistics update'), 'Nov 12 morning changelog entry must remain');
assert(meta.changelog.some(entry => entry.date === 'Nov 10, 2026 · morning ET' && entry.title === 'Cronen Osprey'), 'Nov 10 changelog entry must remain');
assert(meta.changelog.find(entry => entry.date === 'Nov 7, 2026 · late morning ET')?.text === 'KG-7 Vulcan named BR long-range sniper pick (Testing); Mosin moved to alternative for medium-range quick-scoping.', 'KG-7 changelog line must remain');
const mosinEntry = meta.changelog.find(entry => entry.text === "Mosin-Nagant added to BR Sniper (Testing) from Fifakill's build.");
assert(mosinEntry && mosinEntry.date === 'Nov 7, 2026 · morning ET', 'Mosin morning changelog entry must remain');
const buildTabsEntry = meta.changelog.find(entry => /build tabs/i.test(`${entry.title} ${entry.text}`));
assert(buildTabsEntry && /aggregator builds added where no pro loadout exists/i.test(buildTabsEntry.text), 'build tabs changelog entry must remain');
const mosin = byId.get('br-mosin');
assert(mosin.placement === 'alternative' && mosin.confidence === 'Testing' && mosin.weapon === 'Mosin-Nagant' && mosin.evidenceTags.join() === 'PRO', 'Mosin stays a Testing PRO alternative');
assert(mosin.whenToPick === 'Medium-range quick-scoping; marksman rifle, not a long-range sniper.', 'Mosin when-to-pick line drifted');
assert(mosin.builds.length === 1 && mosin.builds[0].evidenceType === 'PRO' && mosin.builds[0].mode === 'unverified' && mosin.builds[0].complete === true, 'Mosin has one complete unverified pro build');
assert(mosin.summary.length <= 110, 'Mosin summary stays within 110 characters');
const kg7 = byId.get('br-kg7');
assert(kg7.placement === 'pick' && kg7.confidence === 'Testing' && kg7.weapon === 'KG-7 Vulcan', 'KG-7 is the Testing sniper pick');
assert(kg7.evidenceTags.join() === 'CALC,AGG,PRO' && kg7.summary.length <= 110, 'KG-7 evidence tags and summary drifted');
assert(kg7.observed.n === 0 && kg7.observed.total === 22 && /no pro usage yet/i.test(kg7.observed.display), 'KG-7 pro sample must state 0/22 and no pro usage yet');
assert(kg7.counterpoint === 'WZStats ranks no sniper in its top five; no measured full-plate one-shot ranges yet.', 'KG-7 counterpoint drifted');
assert(kg7.builds.map(build => `${build.evidenceType}:${build.mode}:${build.date}`).join() === 'AGG:unverified:2026-11-06,CREATOR:unverified:2026-11-06,OFFICIAL:BR:2026-11-05', 'KG-7 build order drifted');
assert(kg7.builds[0].note.includes('R04-3K9Y5-JTFYN-8S51') && /max velocity/i.test(kg7.builds[0].note) && /rechamber/i.test(kg7.builds[0].note), 'KG-7 aggregator note drifted');
assert(/suppressed for long holds/i.test(kg7.builds[1].note), 'KG-7 creator note drifted');
assert(kg7.builds[2].note === 'official default preset, not a pro-optimized build', 'KG-7 official note drifted');
assert(meta.modes.br.cards.every(card => card.placement === 'withdrawn' || !/astaroth|signal/i.test(card.weapon)), 'Astaroth and Signal stay off the BR board');
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
assert(ttk.weapons.find(weapon => weapon.id === 'mosin-nagant').site_cards.includes('BR sniper'), 'Mosin card links to the mosin-nagant TTK entry');
assert(ttk.weapons.find(weapon => weapon.id === 'kg-7-vulcan').site_cards.includes('BR sniper'), 'KG-7 card links to the kg-7-vulcan TTK entry');
fs.copyFileSync(new URL('meta.json', root), new URL(`meta-${meta.snapshotDate}.json`, root));
console.log(`Validated ${meta.pros.length} pros, ${meta.sources.length} dated sources, ${meta.modes.br.cards.length} BR cards and ${meta.modes.res.cards.length} Resurgence cards; summaries <=110; no numbered slots.`);
