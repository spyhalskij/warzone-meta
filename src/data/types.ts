export type ModeKey = "br" | "res";
export type Confidence = "Established" | "Emerging" | "Testing" | "Historical";
export type EvidenceTag = "PRO" | "MEAS" | "AGG" | "CALC";
export type BuildEvidence = "PRO" | "AGG" | "CREATOR" | "OFFICIAL";
export type Placement = "pick" | "alternative" | "empty" | "withdrawn";
export type RoleKey = "close" | "long" | "support" | "sniper" | "legacy";

export interface Source {
  id: string;
  label: string;
  kind: string;
  date: string;
  url: string;
  note?: string;
}
export interface Attachment {
  slot: string;
  name: string;
}
export interface BuildAttachment {
  slot: string;
  name: string | null;
  status: "verified-current-catalog" | "unknown";
}
export interface BuildVariant {
  sourceName: string;
  url: string;
  date: string;
  evidenceType: BuildEvidence;
  note: string;
  replace?: { slot: string; name: string };
  with?: { slot: string; name: string };
}
export interface CompetitiveBuild {
  id: string;
  label: string;
  sourceName: string;
  url: string;
  date: string;
  dateBasis?: string;
  evidenceType: BuildEvidence;
  mode: string;
  complete: boolean;
  proUseReported?: boolean;
  note: string;
  attachments: BuildAttachment[];
  variant?: BuildVariant;
}
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
export interface BaselineCandidate { arm: string; owner: string; note: string; sourceIds: string[]; }
export interface Build {
  owner: string;
  kind: string;
  status: string;
  attachments: Attachment[];
  note: string;
  sourceIds: string[];
}
export interface TestResult {
  kind: "CALC" | "MEAS";
  value: string;
  note: string;
  sourceIds: string[];
}
export interface MetaCard {
  id: string;
  role: string;
  roleKey?: RoleKey;
  placement: Placement;
  evidenceTags: EvidenceTag[];
  whenToPick?: string;
  weapon: string;
  confidence: Confidence;
  summary: string;
  fullSummary?: string;
  modeUnlabeled: boolean;
  preReset?: boolean;
  editable: string;
  unlock?: string;
  legacy?: boolean;
  archived?: boolean;
  withdrawnOn?: string;
  noteTitle?: string;
  reflectCandidates?: boolean;
  candidates?: BaselineCandidate[];
  observed: Observation;
  build: Build | null;
  builds?: CompetitiveBuild[];
  augment?: string;
  test: TestResult | null;
  counterpoint: string;
  sourceIds: string[];
}
export interface RoleGroup {
  id: string;
  key: RoleKey;
  label: string;
  pickId: string | null;
  alternativeIds: string[];
  emptyCardId?: string | null;
  emptySummary?: string;
  revealEmptyCard?: boolean;
}
export interface GameMode {
  id: ModeKey;
  label: string;
  fullLabel: string;
  map: string;
  headnote: string;
  roles: RoleGroup[];
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
  teamContext?: string;
  identityNote?: string;
  streamNote?: { text: string; sourceIds: string[] };
  legacyLabel?: string;
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
  sample: {
    label: string;
    n: number;
    total: number;
    trackedTotal: number;
    note: string;
    sourceIds: string[];
  };
  calculationNote: string;
  modes: Record<ModeKey, GameMode>;
  officialChanges: { text: string; sourceIds: string[] }[];
  changelog: {
    date: string;
    title: string;
    text: string;
    sourceIds: string[];
  }[];
  rosterNote: string;
  rosterRosterSourceIds: string[];
  pros: Pro[];
  historicalPros?: Pro[];
  auditStats?: Record<string, unknown>;
  legacyPurge?: Record<string, unknown>;
}
