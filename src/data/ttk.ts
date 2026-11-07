import raw from './ttk.json';

export interface TtkSource {
  id: string;
  name: string;
  url: string;
  published: string;
  retrieved?: string;
  evidence_type: string;
  method: string;
  build?: string;
  range_buckets: string[];
  far_definition?: string;
  armor_health_assumption: string;
  coverage_limit?: string;
}

export interface TtkWeapon {
  id: string;
  name: string;
  type: string;
  type_short: string;
  game: string;
  legacy: boolean;
  tags: string[];
  site_cards: string[];
  ttk_coverage: string[];
}

export interface TtkMeasurement {
  weapon_id: string;
  source_id: string;
  build: string;
  attachments: string[] | null;
  fire_rate_rpm: number | null;
  ttk_ms: Record<string, number>;
  stk: Record<string, number> | null;
  open_bolt_delay_ms?: number | null;
  notes: string;
  damage_profile?: { damage_drop_distances_m?: number[] } | null;
}

export interface TtkData {
  schema_version: number;
  generated: string;
  game: string;
  how_to_filter: string;
  sources: TtkSource[];
  weapons: TtkWeapon[];
  measurements: TtkMeasurement[];
  known_gaps: string[];
}

export interface FilterState {
  type: string;
  weaponId: string | null;
}

export const TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'AR', label: 'AR' },
  { id: 'SMG', label: 'SMG' },
  { id: 'LMG', label: 'LMG' },
  { id: 'Marksman', label: 'Marksman' },
  { id: 'Sniper', label: 'Sniper' },
  { id: 'Pistol', label: 'Pistol' },
  { id: 'Shotgun', label: 'Shotgun' }
] as const;

export const ttk = raw as TtkData;
const sourceById = new Map(ttk.sources.map(source => [source.id, source]));
const weaponById = new Map(ttk.weapons.map(weapon => [weapon.id, weapon]));

const SPOTLIGHT = new Set(['wz55-striga', 'iso-nightshade', 'vel-46', 'kastov-762', 'cronen-osprey', 'han-86']);

export const weaponsOf = (type: string) => ttk.weapons
  .filter(weapon => weapon.type_short === type)
  .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));

const rank = (weapon: TtkWeapon) => (weapon.site_cards.length ? -20 : 0) + (SPOTLIGHT.has(weapon.id) ? -10 : 0);

export const measurementFor = (weaponId: string, sourceId: string) => ttk.measurements.find(
  measurement => measurement.weapon_id === weaponId && measurement.source_id === sourceId
) ?? null;

export interface ArmorLabel {
  inferred: boolean;
  short: string;
  full: string;
}

export const armorLabel = (source: TtkSource): ArmorLabel => source.id.startsWith('jgod')
  ? {
      inferred: true,
      short: 'Armor is not stated by JGOD. A 300 HP reading is inferred from the STK counts, not published in the post.',
      full: source.armor_health_assumption
    }
  : {
      inferred: false,
      short: 'CODMunity states 300 HP, 50 HP per plate, and 3 plates.',
      full: source.armor_health_assumption
    };

export const sourceDateLabel = (source: TtkSource) => source.id.startsWith('jgod')
  ? 'Nov 6, 2026'
  : 'Updated Nov 6, 2026 · read Nov 7, 2026';

export interface ChartPoint {
  bucket: string;
  ttk: number;
  stk: number | null;
  x: number;
  y: number;
}

export interface ChartSeries {
  weaponId: string;
  name: string;
  selected: boolean;
  points: ChartPoint[];
  labelX: number;
  labelY: number;
  endLabel: string;
  oneShot: string | null;
  notes: string;
}

export interface ChartModel {
  id: string;
  type: string;
  source: TtkSource;
  dateLabel: string;
  armor: ArmorLabel;
  xTitle: string;
  yTitle: string;
  caption: string;
  buckets: string[];
  yTicks: { value: number; y: number }[];
  yMax: number;
  series: ChartSeries[];
  showOneShot: boolean;
  width: number;
  height: number;
  plotLeft: number;
  plotRight: number;
  plotTop: number;
  plotBottom: number;
}

export interface CloseDisagreement {
  weaponId: string;
  name: string;
  type: string;
  detail: string;
}

const WIDTH = 360;
const HEIGHT = 240;
const PLOT_LEFT = 40;
const PLOT_RIGHT = 252;
const PLOT_TOP = 16;
const PLOT_BOTTOM = 206;

const niceMax = (max: number) => {
  const padded = Math.max(max * 1.12, max + 40);
  const step = padded > 1500 ? 400 : padded > 900 ? 200 : 100;
  return { max: Math.ceil(padded / step) * step, step };
};

const yFor = (value: number, yMax: number) => PLOT_TOP + (1 - value / yMax) * (PLOT_BOTTOM - PLOT_TOP);

export const buildChart = (type: string, sourceId: string): ChartModel | null => {
  const source = sourceById.get(sourceId);
  if (!source) return null;
  const weapons = weaponsOf(type).filter(weapon => measurementFor(weapon.id, sourceId));
  if (!weapons.length) return null;
  const buckets = source.range_buckets;
  const selectedIds = new Set(weapons.slice(0, 4).map(weapon => weapon.id));
  const values = weapons.flatMap(weapon => buckets.map(bucket => measurementFor(weapon.id, sourceId)?.ttk_ms[bucket]).filter((value): value is number => typeof value === 'number'));
  const { max: yMax, step } = niceMax(Math.max(...values));
  const yTicks = [];
  for (let value = 0; value <= yMax; value += step) yTicks.push({ value, y: yFor(value, yMax) });
  const xFor = (index: number) => buckets.length === 1
    ? (PLOT_LEFT + PLOT_RIGHT) / 2
    : PLOT_LEFT + (index / (buckets.length - 1)) * (PLOT_RIGHT - PLOT_LEFT);

  const series: ChartSeries[] = weapons.map(weapon => {
    const measurement = measurementFor(weapon.id, sourceId)!;
    const points = buckets.flatMap((bucket, index) => {
      const ttkMs = measurement.ttk_ms[bucket];
      if (typeof ttkMs !== 'number') return [];
      return [{
        bucket,
        ttk: ttkMs,
        stk: measurement.stk?.[bucket] ?? null,
        x: xFor(index),
        y: yFor(ttkMs, yMax)
      }];
    });
    const last = points[points.length - 1];
    const oneShot = /^one-shot/i.test(measurement.notes) ? measurement.notes : null;
    return {
      weaponId: weapon.id,
      name: weapon.name,
      selected: selectedIds.has(weapon.id),
      points,
      labelX: (last?.x ?? PLOT_RIGHT) + 6,
      labelY: last?.y ?? PLOT_TOP,
      endLabel: weapon.name,
      oneShot,
      notes: measurement.notes
    };
  });

  const placed: number[] = [];
  for (const item of series.filter(item => item.selected)) {
    const origin = item.labelY;
    let y = origin;
    let guard = 0;
    while (placed.some(previous => Math.abs(previous - y) < 14) && guard < 8) {
      const step = Math.floor(guard / 2) + 1;
      y = origin + (guard % 2 === 0 ? 14 : -14) * step;
      guard += 1;
    }
    item.labelY = Math.min(PLOT_BOTTOM - 2, Math.max(PLOT_TOP + 10, y));
    placed.push(item.labelY);
  }

  const categorical = source.id.startsWith('jgod');
  return {
    id: `${source.id}-${type}`,
    type,
    source,
    dateLabel: sourceDateLabel(source),
    armor: armorLabel(source),
    xTitle: categorical ? 'Documented bucket' : 'Averaged band',
    yTitle: 'TTK (ms)',
    caption: categorical
      ? 'Points are the published buckets only, including far. far has no stated distance, so it is not placed on a meter scale. Lines join documented points and do not fill missing ranges.'
      : 'Each mark is that source’s average for the band. Bands are not connected, because the page does not publish a point curve. These bands are not merged with the other source.',
    buckets,
    yTicks,
    yMax,
    series,
    showOneShot: series.some(item => item.oneShot),
    width: WIDTH,
    height: HEIGHT,
    plotLeft: PLOT_LEFT,
    plotRight: PLOT_RIGHT,
    plotTop: PLOT_TOP,
    plotBottom: PLOT_BOTTOM
  };
};

export const chartsFor = (type: string) => ttk.sources
  .map(source => buildChart(type, source.id))
  .filter((chart): chart is ChartModel => chart !== null);

export const gapsFor = (type: string) => weaponsOf(type).filter(weapon => weapon.ttk_coverage.length === 0);

export const closeDisagreements = (type?: string): CloseDisagreement[] => {
  const rows: CloseDisagreement[] = [];
  for (const weapon of ttk.weapons) {
    if (weapon.type_short === 'Melee') continue;
    if (type && weapon.type_short !== type) continue;
    const jgod = measurementFor(weapon.id, 'jgod-2026-11-06');
    const cod = measurementFor(weapon.id, 'codmunity-2026-11-06');
    if (!jgod || !cod) continue;
    const jgodClose = jgod.ttk_ms['0m'];
    const codClose = cod.ttk_ms['0-10m'];
    if (typeof jgodClose !== 'number' || typeof codClose !== 'number' || jgodClose === codClose) continue;
    rows.push({
      weaponId: weapon.id,
      name: weapon.name,
      type: weapon.type_short,
      detail: disagreementDetail(weapon.id, jgod, cod)
    });
  }
  const priority = ['wz55-striga', 'vel-46', 'kastov-762'];
  return rows.sort((a, b) => {
    const ai = priority.indexOf(a.weaponId);
    const bi = priority.indexOf(b.weaponId);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return a.name.localeCompare(b.name);
  });
};

const disagreementDetail = (weaponId: string, jgod: TtkMeasurement, cod: TtkMeasurement) => {
  const j = jgod.ttk_ms;
  const c = cod.ttk_ms;
  if (weaponId === 'wz55-striga') {
    return `Close range: JGOD ${j['0m']} ms at 0m versus CODMunity ${c['0-10m']} ms at 0–10m. CODMunity shows an open-bolt delay of ${cod.open_bolt_delay_ms} ms, which JGOD may not include. Buckets differ and are not merged.`;
  }
  if (weaponId === 'vel-46') {
    return `Close range: JGOD ${j['0m']} ms at 0m versus CODMunity ${c['0-10m']} ms at 0–10m. CODMunity’s default build is unconfirmed. Buckets differ and are not merged.`;
  }
  if (weaponId === 'kastov-762') {
    return `JGOD ${j['0m']} ms at 0m, ${j['15m']} ms at 15m, and ${j['40m']} ms at 40m versus CODMunity ${c['0-10m']} ms at 0–10m and ${c['10-40m']} ms at 10–40m. Buckets differ and are not merged.`;
  }
  return `Close range: JGOD ${j['0m']} ms at 0m versus CODMunity ${c['0-10m']} ms at 0–10m. Buckets differ and are not merged.`;
};

export const xForBucket = (chart: ChartModel, index: number) => chart.buckets.length === 1
  ? (chart.plotLeft + chart.plotRight) / 2
  : chart.plotLeft + (index / (chart.buckets.length - 1)) * (chart.plotRight - chart.plotLeft);

export const weaponName = (id: string) => weaponById.get(id)?.name ?? id;

export const TYPE_ORDER = TYPE_FILTERS.filter(item => item.id !== 'all').map(item => item.id);
