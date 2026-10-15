# Milestone 1: Touch-first body map, settings, bilingual summary card

## Goal
A user on a phone or tablet can tap muscles or regions on a front/back anatomy illustration, set intensity and duration for each, switch between English and simple Chinese, and show the masseuse a clear summary card — no account, no backend.

## Scope
1. Front/back muscular anatomy SVG with muscle-level and region-level selection.
2. Per-selection intensity (4 levels) and duration.
3. English + Simplified Chinese with a language toggle.
4. Masseuse summary card.
5. Favorites: save, load, rename and delete a named routine.
6. Injury/pressure notes: a free-text note per selection, shown on the summary card.
7. Shareable output: a read-only link or QR code the masseuse can open in any browser.

Out of scope: accounts/auth, booking, payments, other languages, native apps, backend/database, per-segment session timer (dropped), cloud sync. See [HANDOFF.md](HANDOFF.md).

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

### Favorites
- [ ] The client can save the current routine (selected muscles/areas, intensities, durations, and notes) under a name.
- [ ] Saving with an empty selection or an empty name is blocked with a clear message.
- [ ] Saved favorites appear in a list; loading one restores the full routine in one tap (the current selection is replaced, with a confirm if it has unsaved changes).
- [ ] A favorite can be renamed and deleted; delete asks for confirmation.
- [ ] Favorites persist across reloads (localStorage, versioned schema).
- [ ] All favorites UI (labels, buttons, placeholders, confirmations, errors) works in English and Chinese, and favorite names the user typed are shown as entered.
- [ ] Controls meet the 44×44 CSS px touch target rule.

### Injury/pressure notes
- [ ] Each selected muscle or area can have an optional free-text note (e.g. "avoid this spot, old injury"), with a sensible length limit (e.g. 200 characters) and a visible counter.
- [ ] The note can be added, edited and cleared from the same settings control as intensity and duration.
- [ ] Notes appear on the summary card alongside intensity and duration, visually distinct (e.g. warning icon plus text, not color alone), and in the full-screen view.
- [ ] Notes persist with selections and are saved in and restored from favorites.
- [ ] Placeholder text, labels and character-limit messages are in both English and Chinese. The note text itself is shown exactly as typed (no auto-translation).
- [ ] Notes are rendered as plain text (no HTML injection).

### Shareable output
- [ ] A "Share" action produces a link and a QR code for the completed map: selections, intensities, durations, notes, and the client's chosen language.
- [ ] The link works with no backend: the data is encoded in the URL (e.g. compressed in the hash fragment). Opening it in any modern mobile or desktop browser needs no install, account or login.
- [ ] The shared view is read-only: no editing controls and no ability to change the selection. It shows the summary card plus the body map highlights, front and back.
- [ ] The shared view opens in the language the client chose, and a language toggle is still available on it.
- [ ] The QR code is generated client-side and is large and high-contrast enough to scan from another phone; a "copy link" button and the native share sheet (where available) are offered.
- [ ] An invalid, truncated or too-large link shows a friendly bilingual error instead of crashing.
- [ ] Links are as short as practical, and the app shows a warning if the data is too big for a scannable QR code.
- [ ] No data is sent to any server (note this in the README privacy section).
- [ ] Share UI strings are in both English and Chinese.

### Responsive and quality
- [ ] Works from 360px-wide phones to tablets, in portrait and landscape, with no horizontal scroll or clipped controls.
- [ ] Lighthouse (mobile): Performance ≥ 90, Accessibility ≥ 95.
- [ ] Unit tests cover i18n key parity (en vs zh), selection state logic, favorites save/load/rename/delete, and share-link encode/decode round trips (including bad input).
- [ ] CI builds and runs tests on every PR.
- [ ] Anatomy art is open-licensed or self-drawn, and its license is recorded.
