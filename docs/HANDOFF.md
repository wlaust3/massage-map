# Handoff note for coding agents

## Product in one line
A touch-first web app: pick muscles/regions on a front/back anatomy SVG, set intensity and duration for each, show a bilingual (EN / 简体中文) summary card a masseuse can read at a glance.

## In scope for slice 1 (Milestone 1)
Full details and acceptance criteria: [MILESTONE-1.md](MILESTONE-1.md).

1. **Body map** — front/back muscular anatomy SVG; select individual muscles or broader regions; touch-tuned (big, forgiving hit areas, clear selection feedback, no hover); front/back toggle plus pinch-zoom/swipe.
2. **Per-selection settings** — intensity (light / medium / firm / deep) and duration (e.g. 15 / 30 / 45 / 60 min), editable and removable.
3. **Bilingual UI** — English and Simplified Chinese everywhere, with a persisted language toggle. Chinese must be short, plain, everyday wording a masseuse can read easily.
4. **Summary card** — large, high-contrast, grouped by body side, in the chosen language, with a full-screen view.

## Explicitly out of scope
- User accounts / authentication
- Booking or scheduling
- Payments
- Languages other than English and Chinese (Simplified)
- Native apps (iOS/Android)
- Backend or database
- Sharing via a server (links, accounts, cloud sync). Local-only; export/print can come later.

Don't add these "while you're there". Open an issue instead.

## Conventions
- **i18n keys only.** No hardcoded user-facing strings in components. Add every string to both `en.json` and `zh.json`; a test enforces key parity. Muscle/region names, intensity, duration, buttons, instructions, and aria-labels are all strings.
- **Chinese copy:** short, simple, common words; avoid idioms and medical jargon; prefer e.g. 轻 / 中 / 重 / 很重 style plain labels. Have a native speaker review when possible.
- **Touch targets ≥ 44×44 CSS px** (including the invisible hit areas on the map). Keep spacing between controls.
- **No hover-dependent interactions.** Everything must work with tap alone; `:hover` may only add optional polish.
- **Pointer Events**, not mouse/touch-specific handlers. Set `touch-action` deliberately so pinch/pan work and taps aren't swallowed.
- **Accessibility:** semantic buttons, visible focus, `role`/`aria-pressed` (or equivalent) on selectable muscles, keyboard operable, sufficient contrast (selection must not rely on color alone — use fill + outline), respect `prefers-reduced-motion`.
- **Responsive:** 360px phones up to tablets, portrait and landscape.
- **State:** React state + `localStorage`; keep the persisted schema versioned.
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
│   ├── SummaryCard/     # masseuse view, full-screen mode
│   └── LanguageToggle/
├── state/           # selection reducer, localStorage persistence
├── assets/anatomy/  # SVG art + LICENSE/ATTRIBUTION file
└── styles/
```

## Anatomy art note
Use an **open (CC0 / public domain / CC-BY) illustration or draw your own SVG**. Do not use copyrighted anatomy art. Record the source, author, license, and any modifications in `src/assets/anatomy/ATTRIBUTION.md` (and mention it in the README) before merging art. Each muscle must be its own SVG path/group with a stable id (e.g. `trapezius-upper`), mapped to a region and to an i18n key.

## Definition of done for a PR
Builds in CI, tests pass (i18n key parity, selection state), no hardcoded strings, touch targets verified at 360px width, README/docs updated if behavior changed.
