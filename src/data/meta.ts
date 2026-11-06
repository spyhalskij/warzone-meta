import raw from './meta.json';
import type { MetaData, Source } from './types';
export const meta = raw as MetaData;
export const sourceById = new Map<string, Source>(meta.sources.map(source => [source.id, source]));
export const sourcesFor = (ids: string[]) => [...new Set(ids)].map(id => {
  const source = sourceById.get(id);
  if (!source) throw new Error(`Missing cited source: ${id}`);
  return source;
});
export const modeFrom = (value: unknown) => value === 'res' ? 'res' as const : 'br' as const;
export const formatDate = (iso: string) => new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', timeZone: 'UTC'
}).format(new Date(`${iso.slice(0, 10)}T12:00:00Z`));

export const latestSourceDate = (sources: Source[]) => {
  const dates = sources.map(source => {
    const match = source.date.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}/);
    if (!match) return null;
    const parsed = Date.parse(`${match[0]} 2026 UTC`);
    return Number.isNaN(parsed) ? null : parsed;
  }).filter((date): date is number => date !== null);
  return dates.length ? formatDate(new Date(Math.max(...dates)).toISOString()) : 'date unavailable';
};
