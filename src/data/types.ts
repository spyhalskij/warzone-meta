export type ModeKey = 'br' | 'res';
export type Confidence = 'Established' | 'Emerging' | 'Testing' | 'Historical';
export interface Source {
  id: string;
  label: string;
  kind: string;
  date: string;
  url: string;
  note?: string;
}
export interface Attachment { slot: string; name: string; }
export interface Observation {
  n: number;
  total: number;
  names: string[];
  display?: string;
  date: string | null;
  dateLabel: string;
  sourceIds: string[];
  caveat: string;
}
export interface Build {
  owner: string;
  kind: string;
  status: string;
  attachments: Attachment[];
  note: string;
  sourceIds: string[];
}
export interface TestResult { kind: 'CALC' | 'MEAS'; value: string; note: string; sourceIds: string[]; }
export interface MetaCard {
  id: string;
  role: string;
  weapon: string;
  confidence: Confidence;
  summary: string;
  modeUnlabeled: boolean;
  preReset?: boolean;
  editable: string;
  unlock?: string;
  observed: Observation;
  build: Build | null;
  augment: string;
  test: TestResult | null;
  counterpoint: string;
  sourceIds: string[];
}
export interface GameMode {
  id: ModeKey;
  label: string;
  fullLabel: string;
  map: string;
  headnote: string;
  cards: MetaCard[];
}
export interface ProCapture {
  date: string;
  pair: string;
  note: string;
  preReset: boolean;
  sourceIds: string[];
}
export interface Pro {
  id: string;
  order: number;
  name: string;
  team: string;
  result: string;
  x: string;
  twitch: string;
  youtube: string | null;
  last: ProCapture | null;
  season1Captured: boolean;
  identityNote?: string;
  sourceIds: string[];
}
export interface MetaData {
  schemaVersion: number;
  project: string;
  snapshotDate: string;
  updatedLabel: string;
  researchedWindow: string;
  patch: string;
  season: string;
  launch: string;
  evidenceCutoff: string;
  sources: Source[];
  sample: { label: string; n: number; total: number; trackedTotal: number; note: string; sourceIds: string[]; };
  calculationNote: string;
  modes: Record<ModeKey, GameMode>;
  officialChanges: { text: string; sourceIds: string[]; }[];
  changelog: { date: string; title: string; text: string; sourceIds: string[]; }[];
  rosterNote: string;
  rosterRosterSourceIds: string[];
  pros: Pro[];
}
