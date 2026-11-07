# Warzone TTK dataset — Nov 7, 2026 (ET)

Sources (both current MW4 S1 Warzone; no pre-launch data, no attachment names used):
- **JGOD**, "Warzone TTKs for New MW4 Weapons", https://x.com/JGODYT/status/2118625064195359188 — posted Nov 6, 2026, 3:42 a.m. ET. Re-pulled Nov 7 ~8:20 a.m. ET (images saved as jgod-table-1/2.png). Calculated by the creator, MEAS. Base guns. Buckets: 0/15/40m/far ("far" isn't defined). **Armor/HP isn't stated.** The STK counts fit 300 HP (full 3 plates), but that's my inference, not something JGOD says.
- **CODMunity**, https://codmunity.gg/ttk/warzone — "Updated 06/11/2026 – Season 1", read Nov 7 ~8:15 a.m. ET (raw-codmunity-ttk.html). A calculator built from game data, MEAS. The page config says 300 HP with 3 plates of 50. Buckets: 0–10/10–40/40–80/80–120m averages. **I couldn't confirm whether the default table shows Meta Loadouts or Base Weapons.**
- Not usable yet: TrueGameData (the page is a JS/captcha shell), Sym.gg (interactive only, no values extracted), WZStats (AGG, partial values only, skipped).

## Re-verifying the JGOD figures you already had
They match the source: ISO 585/650 ms vs VEL 630/693 ms at 0/15m, and VEL 882 vs ISO 910 ms at 40m. VEL and ISO also have the same "far" values (882/910).

## Coverage by weapon type (MW4 S1 arsenal)
| Type | In arsenal | With TTK | Sources |
|---|---|---|---|
| Assault Rifle | 9 (incl. Osprey) | 9 | JGOD 9, CODMunity 9 |
| SMG | 6 (incl. CSG-35) | 6 | JGOD 6, CODMunity 5 (no CSG-35) |
| LMG | 3 | 3 | both |
| Marksman Rifle | 3 | 3 | JGOD only |
| Sniper Rifle | 3 | 3 | JGOD only |
| Pistol | 4 | 4 | JGOD only |
| Shotgun | 2 | **0** | none |
| Legacy (Voyak KT-3) | – | **0** | none |
No Battle Rifle class exists in the S1 arsenal. Launchers and melee are left out.

## Meta cards
- VEL 46, ISO Nightshade, Wz.55 Striga, Cronen Osprey, Han 86: TTK from both sources, base or default build only. None of the pro builds on the cards has its own TTK.
- Voyak (Legacy): **no TTK.**

## Disagreements (both values kept)
- **Striga:** JGOD 553 ms at 0m (fastest). CODMunity 617 ms at 0–10m, with a 64 ms open-bolt delay shown, which JGOD may not include. That flips the close-range #1.
- **VEL 46:** JGOD 630 at 0m, CODMunity 567 at 0–10m. CODMunity's number may include attachments.
- **Kastov 762:** JGOD 600 flat out to 40m, CODMunity 800 at 0–40m. That's a big gap with no explanation.
- **Cronen Squall** (623 vs 712), **LMGs** (CODMunity is 57–110 ms slower, likely open-bolt delay), **Patriot XMR** (651 vs 558), **Oden** (725 vs 580). The two sources use different range buckets, so only compare them where the buckets roughly line up.

## Gaps
Shotguns, the Voyak, attachment-level TTK, a TrueGameData cross-check, and JGOD's armor/hitbox method.
