# Warzone Meta — 3 visual directions (design only, for Jack's pick)

Scope: this brief is direction only. There's no code, no mockups and no deploy. **Approval gate:** Jack picks one direction (or says to mix specific parts) before anything is built. Contrast was measured on these colour pairings with `contrast.py`, and the results are in `contrast-audit.json`. The rule was at least 4.5:1 for text on its intended background (page, surface and raised) and at least 3:1 for chart series on the plot background. All pairings pass. Lowest ratios: A text 6.08, series 7.29. B text 4.59, series 5.52. C text 6.22, series 6.92. These numbers cover the colour pairs only. No compliance claim is made for an unbuilt UI; keyboard access, target sizes and rendered contrast still need verification.

## Rules for all three directions
- **Data:** Never infer or change weapon names, slots, attachments or numbers. The source owns accuracy. Show unnamed slots as "Slot".
- **Confidence words:** supported, emerging, testing, historical. Always show the word. Never show a % or score.
- **Evidence tags:** PRO, MEAS and AGG as text labels, at most 3 per gun. Use no icons and don't build a badge wall. PRO identifies attributed professional-use evidence, MEAS identifies a documented measurement, and AGG identifies an aggregate source; builder must confirm these definitions with its data model. A calculated result must say CALC, not MEAS. These are provenance categories, not confidence scores.
- **Caveats and sources:** Keep them in a `<details>` disclosure on every gun, with the source name and date. Show build completeness on the card itself, e.g. "4 of 5 slots sourced".
- **Charts:** Each series also gets its own dash pattern (solid, long-dash, short-dash, dot) and a direct label at the end of its line. Every chart has a table with the same data next to it. Draw no chart where no sourced data exists. Use an empty state instead ("No measured TTK yet for SMGs"). Don't use placeholder numbers.
- **Layout:** No carousels, neon, camo, glows, filler taglines or generic KPI tiles. Body text is at least 16px, labels at least 14px. Essential uncertainty (mode unverified, historical-only, partial build, calculation assumptions) stays adjacent to the recommendation or number; disclosures hold the full explanation, not the only warning.
- **390px:** Groups stack in one column. The meta pick comes first and is full width. Alternatives sit below it as compact rows. The TTK filter is a horizontal chip row that wraps and never scrolls sideways (All · AR · SMG · LMG · Sniper · Marksman). Tap targets are at least 44px.

---

## A. Mineral Ledger (dark editorial)
**Mood:** A quiet slate-and-moss magazine spread with one chartreuse highlighter.

| Role | Hex |
|---|---|
| page / surface / raised / line | #101311 / #181C19 / #20251F / #2E352F |
| text / muted | #E9ECE4 / #A3AB9F |
| accent / text on accent | #C8E35A / #101311 |
| supported / emerging / testing / historical | #8FD18A / #C8E35A / #E6B85C / #9AA3A8 |
| PRO / MEAS / AGG text | #E9C46A / #7FC8D6 / #C9A7E8 |
| plot / grid / axis | #181C19 / #2E352F / #A3AB9F |
| series 1–4 | #C8E35A solid · #7FC8D6 long-dash · #E79A6B short-dash · #C9A7E8 dot |

Tag and confidence text sits on surface or raised (≥6.08:1); in alternatives they use page with the same verified palette. Tags have a 1px border in the same colour and no fill.

**Type:** Newsreader (editorial serif) for role headings at 28/32px and gun names at 22px. Source Sans 3 for body at 16/24px and labels at 14px with 0.04em tracking, uppercase. JetBrains Mono with tabular numbers for stats, 15px.

**Cards:**
- **Meta pick:** Surface background with a 3px chartreuse rule on the left. The gun name is set in the serif. The "when to pick" line sits under it in italic, 16px. Use a 4px radius, 16px padding and 24px between role groups. Confidence and provenance wrap naturally rather than shrinking text.
- **Alternatives:** No card background, just hairline separators in a list on page. Each row shows name (17px), confidence and tags, and a one-line "when to pick". It expands to show the build.

**TTK:** An editorial line or dot chart on surface with sparse horizontal grid lines. For comparable range curves, label x as distance (m), y as TTK (ms), with source and test conditions adjacent. Use a step curve only when breakpoints are documented. Do not interpolate missing points. At 390px the chart is full width and 240px tall, with the table below it. The table keeps weapon, range and TTK visible; extra protocol details are in the disclosure. Compare no more than four series at once, and reserve a 44px control to select each one.

---

## B. Field Manual (warm-paper light)
**Mood:** A printed technical field manual: warm paper, black ink, vermilion margin marks.

| Role | Hex |
|---|---|
| page / surface / raised / line | #F3EEE3 / #FBF8F1 / #EAE3D4 / #CFC6B4 |
| text / muted | #1F1B16 / #5E564B |
| accent / text on accent | #B8361E / #FBF8F1 |
| supported / emerging / testing / historical | #2F6B3A / #8A5A00 / #A0361F / #5E564B |
| PRO / MEAS / AGG text | #8E2B17 / #1F5A7A / #5B4A8A |
| plot / grid / axis | #FBF8F1 / #DDD5C5 / #5E564B |
| series 1–4 | #B8361E solid · #1F5A7A long-dash · #2F6B3A short-dash · #7A5A00 dot |

Confidence and evidence text sits on surface or raised; text colours also pass on page. The tightest pair is emerging on raised, at 4.59:1. Keep the tag and confidence words at 14px or larger, weight 600.

**Type:** IBM Plex Serif for headings at 26/30px. IBM Plex Sans Condensed for section numbers ("2.3 BR — Long range") and labels at 14px uppercase. IBM Plex Sans for body at 16/24px. IBM Plex Mono with tabular numbers for stats.

**Cards:**
- **Meta pick:** A "manual entry": surface paper with a 1px ink border and a vermilion corner index ("PICK"). Use square corners, 16px padding and 28px between groups. Display only the supplied build slots with their actual labels; unknown labels remain "Slot". Never imply every build has five parts.
- **Alternatives:** Indented sub-entries (2.3a, 2.3b) on page with a dotted rule. Sources use inline reference numerals visually, within a full 44px Evidence control—not tiny superscript-only tap targets.

**TTK:** A monochrome-ink chart on paper. The series differ in dash pattern first and colour second, and labels sit right on the lines. The table looks like a manual table with ruled rows. At 390px the chart is 220px tall and the table switches to stacked rows per weapon.

---

## C. Instrument Lab (midnight icy-blue)
**Mood:** A calibrated test-bench readout: matte midnight, icy-blue measurement, no glow.

| Role | Hex |
|---|---|
| page / surface / raised / line | #0A0F1A / #111827 / #18213A / #26324A |
| text / muted | #E6EEF8 / #94A3B8 |
| accent / text on accent | #7CC4FF / #0A0F1A |
| supported / emerging / testing / historical | #6EE7B7 / #7CC4FF / #FBBF77 / #A5B0C2 |
| PRO / MEAS / AGG text | #FBBF77 / #7CC4FF / #D6A8FF |
| plot / grid / axis | #111827 / #26324A / #94A3B8 |
| series 1–4 | #7CC4FF solid · #FBBF77 long-dash · #6EE7B7 short-dash · #F49AC1 dot |

Confidence and evidence text uses surface or raised; chart background is surface. All text pairs pass at ≥6.22:1.

**Type:** Space Grotesk for headings at 24/28px and gun names at 20px. Source Sans 3 for body at 16/24px. IBM Plex Mono with tabular numbers for labels and stats at 14px, which carries the instrument voice.

**Cards:**
- **Meta pick:** A "readout panel": raised background with a 1px icy-blue top border. Use a 6px radius, 16px padding and 24px between groups. A spec grid has two columns (slot / attachment) in mono. The confidence word sits top-right with a matching 8px square swatch, plus the word.
- **Alternatives:** Surface rows that line up in the same spec-grid columns, so you can compare them against the pick at a glance.

**TTK:** The most chart-forward of the three: a bar or step chart with the grid on and tick labels in mono. A filter chip row sits above the chart, and the individual-gun filter goes in the same place later. At 390px use horizontal bars only for a single explicitly selected, comparable distance/protocol (weapons on the y-axis, TTK ms on x). A range curve must remain a line/step chart, never silently become a single bar. Changing presentation must not change the question or discard range data. Bar fills can't carry dashes, so each bar is direct-labelled with the weapon name and the series uses a pattern hatch. The table follows the chart.

---

## Recommendation: A, Mineral Ledger
- **It's the clearest break from the old dark amber look** without leaving the dark theme Jack is used to on the phone.
- **The type does the work.** The serif and sans contrast makes "meta pick vs alternatives" readable through type and layout alone, so it avoids the badge-wall risk.
- **Its contrast has ample headroom** (text ≥6.08, series ≥7.29) for tag text; C has a slightly higher text minimum, so colour ratios alone do not decide the recommendation.
- **Runner-up is C** if Jack wants the TTK section to be the star.
- **B is the boldest.** It's the most distinctive, but it's light mode, and its muted and emerging text on raised has the thinnest margin (4.59).

**390px acceptance for every direction:** 12–16px gutters; no page overflow; pick with its build fits roughly one screen where content permits; alternatives are separate visible rows (not hidden in a carousel). Role navigation and TTK are reachable via short 44px links near the top, not only after scrolling the entire roster. On desktop use a role-group layout with the pick on the left and alternatives beside it; do not equal-size every gun into a dashboard tile grid. Each alternative retains its own confidence, when-to-pick, completeness and sources. Grid lines may be subtle because direct labels and the accessible table carry the data; meaningful axes/series retain ≥3:1.

**Next step:** Jack chooses A, B or C, or a named mix. The builder confirms fonts are self-hosted, then builds. Only after that, test the contrast of the built UI and keyboard focus at 390px.
