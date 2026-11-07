import raw from './meta.json';
import type { GameMode, MetaCard, MetaData, RoleGroup, Source } from './types';
export const meta = raw as MetaData;
export const sourceById = new Map<string, Source>(meta.sources.map(source => [source.id, source]));
export const evidenceSourcesFor = (card: MetaCard) => sourcesFor([
  ...card.sourceIds,
  ...card.observed.sourceIds,
  ...(card.build?.sourceIds ?? []),
  ...(card.test?.sourceIds ?? []),
]);

export interface ResolvedRole extends RoleGroup {
  pick: MetaCard | null;
  alternatives: MetaCard[];
  emptyCard: MetaCard | null;
}

export const rolesFor = (mode: GameMode): ResolvedRole[] => {
  const byId = new Map(mode.cards.map(card => [card.id, card]));
  return mode.roles.map(role => ({
    ...role,
    pick: role.pickId ? byId.get(role.pickId) ?? null : null,
    alternatives: role.alternativeIds.map(id => {
      const card = byId.get(id);
      if (!card) throw new Error(`Missing alternative ${id} on ${role.id}`);
      return card;
    }),
    emptyCard: role.emptyCardId ? byId.get(role.emptyCardId) ?? null : null
  }));
};

export const caveatLine = (card: MetaCard) => {
  const parts: string[] = [];
  if (card.legacy) parts.push('Legacy preset');
  if (card.modeUnlabeled) parts.push('Mode unverified');
  if (card.placement === 'alternative' && !card.build) parts.push('Build unverified');
  const partial = card.build?.status.toLowerCase().includes('partial')
    || card.build?.attachments.some(attachment => attachment.slot === 'Slot unverified');
  if (partial) parts.push('Partial build');
  return parts.join(' · ');
};

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
