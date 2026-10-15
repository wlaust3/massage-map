# Handoff note for coding agents

## Product in one line
A touch-first web app: pick muscles/regions on a front/back anatomy SVG, set intensity and duration for each, show a bilingual (EN / 简体中文) summary card a masseuse can read at a glance.

## In scope for slice 1 (Milestone 1)
Full details and acceptance criteria: [MILESTONE-1.md](MILESTONE-1.md).

1. **Body map** — front/back muscular anatomy SVG; select individual muscles or broader regions; touch-tuned (big, forgiving hit areas, clear selection feedback, no hover); front/back toggle plus pinch-zoom/swipe.
2. **Per-selection settings** — intensity (light / medium / firm / deep) and duration (e.g. 15 / 30 / 45 / 60 min), editable and removable.
3. **Bilingual UI** — English and Simplified Chinese everywhere, with a persisted language toggle. Chinese must be short, plain, everyday wording a masseuse can read easily.
4. **Summary card** — large, high-contrast, grouped by body side, in the chosen language, with a full-screen view. Also shows each selection's note.
5. **Favorites** — save the current routine (selections, intensities, durations, notes) under a name; load in one tap; rename; delete. Stored locally.
6. **Injury/pressure notes** — optional free-text note per selected muscle/area, shown on the summary card next to intensity and duration. Bilingual labels and placeholders; note text is shown as typed.
7. **Shareable output** — a read-only link and QR code that encode the full map and chosen language in the URL (no server), opened in any browser with no install.

## Explicitly out of scope
- User accounts / authentication
- Booking or scheduling
- Payments
- Languages other than English and Chinese (Simplified)
- Native apps (iOS/Android)
- Backend or database
- Per-segment session timer / countdown (was considered and dropped from this milestone)
- Server-side sharing, short-link services, accounts, cloud sync. Sharing in this slice is client-side only: data lives in the URL.

Don't add these "while you're there". Open an issue instead.

## Conventions
- **i18n keys only.** No hardcoded user-facing strings in components. Add every string to both `en.json` and `zh.json`; a test enforces key parity. Muscle/region names, intensity, duration, buttons, instructions, and aria-labels are all strings.
- **Chinese copy:** short, simple, common words; avoid idioms and medical jargon; prefer e.g. 轻 / 中 / 重 / 很重 style plain labels. Have a native speaker review when possible.
- **Touch targets ≥ 44×44 CSS px** (including the invisible hit areas on the map). Keep spacing between controls.
- **No hover-dependent interactions.** Everything must work with tap alone; `:hover` may only add optional polish.
- **Pointer Events**, not mouse/touch-specific handlers. Set `touch-action` deliberately so pinch/pan work and taps aren't swallowed.
- **Accessibility:** semantic buttons, visible focus, `role`/`aria-pressed` (or equivalent) on selectable muscles, keyboard operable, sufficient contrast (selection must not rely on color alone — use fill + outline), respect `prefers-reduced-motion`.
- **Responsive:** 360px phones up to tablets, portrait and landscape.
- **State:** React state + `localStorage`; keep the persisted schema versioned (selections and favorites).
- **Share links:** encode state as a compact, versioned, compressed payload in the URL hash; validate on decode; render the shared view read-only. Generate the QR code client-side with a small library and justify it in the PR. Never send data to a server.
- **Notes and favorite names are user text:** render as plain text, never as HTML, and don't auto-translate them.
- **TypeScript strict.** Keep dependencies minimal; justify any new one in the PR.

## Suggested file layout
```
src/
├── main.tsx
├── App.tsx
├── i18n/            # en.json, zh.json, t() helper, LanguageProvider, parity test
├── data/            # muscles.ts (ids, region membership, i18n keys), regions.ts
├── components/
│   ├── BodyMap/     # SVG, front/back views, hit areas, pan/zoom
│   ├── SettingsSheet/   # intensity + duration controls
│   ├── SummaryCard/     # masseuse view, full-screen mode, notes
│   ├── Favorites/       # save/load/rename/delete
│   ├── ShareSheet/      # link + QR code
│   ├── SharedView/      # read-only view opened from a link
│   └── LanguageToggle/
├── state/           # selection reducer, favorites, localStorage persistence
├── share/           # encode/decode share payload
├── assets/anatomy/  # SVG art + LICENSE/ATTRIBUTION file
└── styles/
```

## Anatomy art note
Use an **open (CC0 / public domain / CC-BY) illustration or draw your own SVG**. Do not use copyrighted anatomy art. Record the source, author, license, and any modifications in `src/assets/anatomy/ATTRIBUTION.md` (and mention it in the README) before merging art. Each muscle must be its own SVG path/group with a stable id (e.g. `trapezius-upper`), mapped to a region and to an i18n key.

## Definition of done for a PR
Builds in CI, tests pass (i18n key parity, selection state, favorites, share encode/decode), no hardcoded strings, touch targets verified at 360px width, README/docs updated if behavior changed.
