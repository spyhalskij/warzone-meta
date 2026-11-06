import raw from './meta.json';
import type { MetaData, Source } from './types';

// Importing through this module gives every page one typed, static evidence source.
export const meta = raw as MetaData;
export const sourceById = new Map<string, Source>(meta.sources.map(source => [source.id, source]));
export const sourcesFor = (ids: string[]) => ids.map(id => {
  const source = sourceById.get(id);
  if (!source) throw new Error(`Missing cited source: ${id}`);
  return source;
});
export const modeFrom = (value: unknown) => value === 'res' ? 'res' as const : 'br' as const;
export const formatDate = (iso: string) => new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
}).format(new Date(`${iso.slice(0, 10)}T12:00:00Z`));
