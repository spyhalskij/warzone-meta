# Warzone Meta

A local-first, static, evidence-first Warzone Season 1 watchlist for Jack Spyhalski. Published at [spyhalskij.github.io/warzone-meta](https://spyhalskij.github.io/warzone-meta/).

## Run locally

```sh
npm ci
npm run check
npm run build
npm run check
npm run serve:test
# in a second shell:
npm test
```

`astro.config.mjs` uses `/warzone-meta/` as its base. `.github/workflows/deploy.yml` builds the static site and deploys it to GitHub Pages from `main`.

## Update the content, not the components

- **`src/data/meta.json` is the structured evidence source for picks.** Its `sources` array defines each dated claim URL and stable ID. Each mode has `roles`: one meta pick plus up to three alternatives, or an empty state. BR is never inferred to equal Resurgence.
- Each gun card has its own `confidence`, `evidenceTags` (`PRO`, `MEAS`, `AGG`, `CALC`; at most three), sample, sources, and `builds[]`. A build’s evidence tag is `PRO`, `AGG`, or `CREATOR`. Multiple competitive builds render as tabs, pro evidence first; one build has no tab bar. Slots a source does not list stay `unknown`. Voyak keeps an empty `builds` list. Alternatives carry a one-line `whenToPick`. `src/data/ttk.json` keeps a separate `weapons` list and `measurements` list for the TTK page.
- Only the included launch-day tables support calculated values: `test.kind` is `CALC`, with an explicitly incomplete protocol. `MEAS` must only be used when a current measured result actually exists and includes its test limits. No values are derived by the front end.
- `pros` contains the full 20-player performance roster, qualification and direct channel links, plus either a dated `last` report with its pre-reset state or `last: null` for an honest no-capture state. `officialChanges`, `changelog`, `sample` and global `updatedLabel` / `patch` are edited in the same file.
- `src/data/types.ts` documents the data contract. `src/data/meta.ts` resolves source IDs and fails on an unknown ID. Components render the resolved records; they do not contain weapon facts or attachment recipes.
- On every `npm run build` / `npm run check`, `scripts/build-data.mjs` validates source links, role groups, evidence tags, the TTK tables, roster count, observation structure, build ownership, confidence labels, pre-reset flags and mode caveats, then preserves a copy as **`src/data/meta-YYYY-MM-DD.json`**. Keep that dated snapshot; change `snapshotDate` only when intentionally starting a new retained record.
- The route is query-first: `?mode=br|res`, persisted in `localStorage`. Both modes and the `/ttk/` page are statically rendered. The TTK type filter runs in the page; `weaponId` stays null until a single-weapon filter is added. Self-hosted Newsreader, Source Sans 3, and JetBrains Mono are bundled from Fontsource.

## Evidence boundaries

Launched Nov 6, 2026 (MW4 integration / Season 1), this is a volatile launch-day watchlist, not a settled best-gun leaderboard. Kitted's rolling 14-day panel contains 17 of 46 tracked streamers and spans the reset; it is not the site's 20-player tournament roster or all-pro/all-player telemetry. A named player report is kept distinct from a cross-player modal list and from an editorial build. Unknown slots, missing fifth attachments and no-capture pros remain visibly unresolved.

The official canonical Season 1 notes failed direct fetch during research. The source data preserves both that URL and the linked full-text mirror, rather than presenting the mirror as canonical. No official population pick rate is displayed. No XclusiveAce multiplayer tests, TrueGameData promise, Sym timeout, missing pro stream or unverified attachment is converted into Season 1 Warzone evidence.

## Verification

`playwright/check.mjs` uses the installed Google Chrome binary through Playwright Chromium. It checks both mode switches, role groups, closed Evidence, 44px controls, the TTK type filter, and no horizontal overflow at 320 / 390 / 1280px. Set `LIVE=1 SITE_BASE=https://spyhalskij.github.io/warzone-meta/` to verify a deployed site.

The interface uses the Mineral Ledger palette (#101311 / #181C19 / #20251F / #E9ECE4, chartreuse #C8E35A). Meta picks have a 3px chartreuse left rule. Alternatives are separated rows. Confidence and evidence tags use the audited text colors, with no fill. Body text is 16px, labels 14px, and controls are at least 44px. No imagery, carousels, taglines, or official branding is added.

## R2 presentation

Cards keep the sourced build visible while detailed caveats and sources remain in closed native `<details>` evidence panels. Summaries are capped at 110 characters. Slot labels must come from cited records; a slot the source does not list reads `unknown`, never a guessed part or a numbered attachment. Empty roles stay empty. The changelog is one disclosure after the official-changes list.
