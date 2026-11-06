# Warzone Meta

A local-first, static, evidence-first Warzone Season 1 watchlist for Jack Spyhalski. Intended GitHub Pages URL: `https://spyhalskij.github.io/warzone-meta/`; **no remote repository is configured and nothing has been published**.

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

`astro.config.mjs` uses `/warzone-meta/` as its base. The copied `.github/workflows/deploy.yml` is ready for a future GitHub Pages deployment, but is inert locally and must not be run until Jack approves the exact publishing action.

## Update the content, not the components

- **`src/data/meta.json` is the single structured evidence source.** Its `sources` array defines each dated claim URL and stable ID. `modes.br.cards` and `modes.res.cards` are independent role-card lists, so BR is never inferred to equal Resurgence.
- Each card has `role`, `weapon`, `confidence`, `editable`, `observed`, `build`, `test`, `modeUnlabeled`, optional `preReset`, `counterpoint`, and `sourceIds`. An observation stores `n`, `total`, exact available `names`, capture date, label and caveat. Each build stores its owner, individual / editorial / historical kind, partial status, actual listed attachments, note and direct citations. A missing build stays `null`.
- Only the included launch-day tables support calculated values: `test.kind` is `CALC`, with an explicitly incomplete protocol. `MEAS` must only be used when a current measured result actually exists and includes its test limits. No values are derived by the front end.
- `pros` contains the full 20-player performance roster, qualification and direct channel links, plus either a dated `last` report with its pre-reset state or `last: null` for an honest no-capture state. `officialChanges`, `changelog`, `sample` and global `updatedLabel` / `patch` are edited in the same file.
- `src/data/types.ts` documents the data contract. `src/data/meta.ts` resolves source IDs and fails on an unknown ID. Components render the resolved records; they do not contain weapon facts or attachment recipes.
- On every `npm run build` / `npm run check`, `scripts/build-data.mjs` validates source links, roster count, observation structure, build ownership, confidence labels, pre-reset flags and mode caveats, then preserves a copy as **`src/data/meta-YYYY-MM-DD.json`**. Keep that dated snapshot; change `snapshotDate` only when intentionally starting a new retained record. Before overwriting current facts in the real research workflow, retain the prior evidence separately as described in the `warzone-meta` skill.
- The route is query-first: `?mode=br|res`, persisted in `localStorage`. Both modes are statically rendered and locally switched, with no runtime API or external asset calls. Self-hosted IBM Plex Sans, Sans Condensed and Mono are bundled from Fontsource.

## Evidence boundaries

Launched Nov 6, 2026 (MW4 integration / Season 1), this is a volatile launch-day watchlist, not a settled best-gun leaderboard. Kitted's rolling 14-day panel contains 17 of 46 tracked streamers and spans the reset; it is not the site's 20-player tournament roster or all-pro/all-player telemetry. A named player report is kept distinct from a cross-player modal list and from an editorial build. Unknown slots, missing fifth attachments and no-capture pros remain visibly unresolved.

The official canonical Season 1 notes failed direct fetch during research. The source data preserves both that URL and the linked full-text mirror, rather than presenting the mirror as canonical. No official population pick rate is displayed. No XclusiveAce multiplayer tests, TrueGameData promise, Sym timeout, missing pro stream or unverified attachment is converted into Season 1 Warzone evidence.

## Verification

`playwright/check.mjs` uses the installed Google Chrome binary through Playwright. It checks both switches, query/localStorage precedence and persistence, no-reload switching, exact card/roster counts, missing-build handling, 44 px controls, and no horizontal overflow at 320 / 390 / 1280 px. Full-page screenshots are saved to `shots/` for BR and Resurgence at 390 and 1280 px, plus BR at 320 px. `playwright/results.json` records the completed check output.

The interface uses the supplied stats-site tokens (#0B0D10 / #12151A / #E8EAED / #9AA0A6), amber #F5A623 for selected and evidence states, condensed display type, mono tabular evidence values, 6 px radii and phone-first density. No imagery, taglines, promotional sections, external trackers, or official branding is added.
