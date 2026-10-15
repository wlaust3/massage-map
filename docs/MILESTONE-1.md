# Milestone 1: Touch-first body map, settings, bilingual summary card

## Goal
A user on a phone or tablet can tap muscles or regions on a front/back anatomy illustration, set intensity and duration for each, switch between English and simple Chinese, and show the masseuse a clear summary card — no account, no backend.

## Scope
1. Front/back muscular anatomy SVG with muscle-level and region-level selection.
2. Per-selection intensity (4 levels) and duration.
3. English + Simplified Chinese with a language toggle.
4. Masseuse summary card.

Out of scope: accounts/auth, booking, payments, other languages, native apps, backend/database, server-side sharing. See [HANDOFF.md](HANDOFF.md).

## Acceptance criteria

### Body map
- [ ] Front and back views are available via a toggle button.
- [ ] Pinch-to-zoom (and pan while zoomed) works on the map; swipe or toggle switches front/back.
- [ ] Individual muscles can be selected and deselected by tap.
- [ ] Broader regions (e.g. shoulders, upper back, lower back, arms, legs) can be selected, which selects their muscles.
- [ ] Every tap target is at least 44×44 CSS px, with forgiving invisible padded hit areas for small muscles; taps near a muscle resolve to the nearest sensible one.
- [ ] Selected items show clear visual feedback: fill **and** outline (not color alone).
- [ ] No feature depends on hover.

### Intensity and duration
- [ ] Each selection has an intensity: light / medium / firm / deep.
- [ ] Each selection has a duration option (e.g. 15 / 30 / 45 / 60 min).
- [ ] Settings can be edited or removed per selection, and all selections cleared at once.

### Language
- [ ] All labels, muscle/region names, buttons, intensity and duration names, and instructions render in English and Simplified Chinese.
- [ ] A language toggle is always reachable; the choice persists across reloads.
- [ ] Chinese uses short, plain phrasing a masseuse can read easily.

### Summary card
- [ ] Lists each selected area with intensity and duration, grouped by body side (front / back).
- [ ] Renders in the currently chosen language.
- [ ] Readable at a glance: large type, high contrast.
- [ ] Has a full-screen view to hand to the masseuse.
- [ ] Selections persist across reloads (localStorage).

### Responsive and quality
- [ ] Works from 360px-wide phones to tablets, in portrait and landscape, with no horizontal scroll or clipped controls.
- [ ] Lighthouse (mobile): Performance ≥ 90, Accessibility ≥ 95.
- [ ] Unit tests cover i18n key parity (en vs zh) and selection state logic.
- [ ] CI builds and runs tests on every PR.
- [ ] Anatomy art is open-licensed or self-drawn, and its license is recorded.
