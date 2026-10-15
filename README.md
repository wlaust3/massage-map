# massage-map

A mobile- and tablet-first, touch-first web app for telling a masseuse exactly what you want. Tap muscles or regions on a front/back muscular anatomy illustration, set **intensity** (light / medium / firm / deep) and **duration** for each, and get an at-a-glance **summary card** to show the masseuse — in **English** or **simple Chinese (简体中文)**.

## Status

**Live app:** https://wlaust3.github.io/massage-map/ (deployed from `main` to GitHub Pages by `.github/workflows/pages.yml`; the build uses a relative `base: './'`, so it works under the `/massage-map/` subpath and share-link hashes still resolve).

**Milestone 1 is implemented** (see [docs/MILESTONE-1.md](docs/MILESTONE-1.md) and [issue #1](https://github.com/wlaust3/massage-map/issues/1)):

- Front/back muscular body map (inline SVG): tap muscles one by one or pick whole areas (neck, shoulders, chest, belly, upper back, lower back, arms, hands, hips, legs, feet). Pinch-zoom, pan, swipe and a Front/Back toggle. Forgiving touch targets, fill + outline selection feedback, no hover needed.
- Per-selection **pressure** (light / medium / firm / deep), **time** (15 / 30 / 45 / 60 min) and an optional **note** (200 characters) such as an injury. Edit one, set all at once, remove, or clear all.
- **English and Simplified Chinese** everywhere, with a toggle that is always on screen and remembered.
- A large-type, high-contrast **summary card** grouped by front/back, with a full-screen view to hand to the masseuse.
- **Favorites**: save, use, rename and delete named routines (including notes), stored on the device.
- **Share**: a read-only link and QR code that carry the whole plan (and its language) inside the URL.

Not built, by design: accounts, booking, payments, other languages, a backend, and the per-segment session timer. See [docs/HANDOFF.md](docs/HANDOFF.md) for scope and conventions.

## Privacy

**No data leaves your device.** There is no server, no analytics and no network request for your data.

- Your picks, notes, favorites and language choice are stored in your browser's `localStorage` only.
- A share link contains the plan itself, compressed into the URL **fragment** (`#v1=...`). Browsers never send the fragment to a server, and this app has no backend to send it to. Whoever you give the link or QR code to can read the plan (including notes), and anyone who sees a link in a chat or log has the plan too, so share it only with people you want to see it.
- The QR code is drawn in your browser.

## Stack and rationale

| Concern | Choice | Why |
| --- | --- | --- |
| Build / dev server | **Vite** | Fast dev loop, tiny static output, no server needed |
| UI | **React + TypeScript** | Component model suits a stateful, interactive map; types keep selection state and i18n keys safe |
| Body map | **Inline SVG**, one `<g>`/`<path>` group per muscle, plus large invisible padded hit areas | Crisp at any size, styleable (fill + outline), accessible, per-muscle events without canvas hit-testing |
| Input | **Pointer Events** (`pointerdown/up/move`, `touch-action`) | One API for touch, pen and mouse; no hover dependence; supports pinch/pan |
| i18n | Lightweight JSON dictionaries (`en`, `zh-Hans`) + a small `t(key)` helper | No heavy library needed for two languages; a test can enforce key parity |
| State | React state (context/reducer) + `localStorage` | Selections and language survive reloads; no backend |
| Share links | **`lz-string`** (~5 kB) compresses a small JSON payload into URL-safe characters in the hash; **`qrcode`** (lazy-loaded, ~25 kB) draws the QR code as SVG | Keeps links short enough for a scannable QR code. `CompressionStream` was rejected because it is async-only and gives longer URL-safe output once base64-encoded; `qrcode` is a small, well-known pure-JS encoder, loaded only when the Share dialog opens |
| Tests | **Vitest** (v2, matches Vite 5) | Fast, no extra browser tooling; covers i18n parity, selection, favorites and share encode/decode |
| Hosting | Static site (GitHub Pages, Netlify, Cloudflare Pages, etc.) | No backend, no database, no accounts |

### Alternatives considered

- **Plain HTML/JS** — smallest possible, but selection state, i18n re-rendering, and the summary view get messy fast; React keeps it maintainable for multiple agents.
- **Next.js** — SSR/routing/server features are unnecessary for a single-page, offline-friendly static app and add weight.
- **Native apps (iOS/Android/React Native/Flutter)** — explicitly out of scope; a web app works on any phone/tablet with no install and is easy to share via a link.
- **Canvas/WebGL for the body map** — poorer accessibility and harder styling/hit-testing than SVG.

## Run it

Requires Node 18+ (tested with Node 20).

```bash
npm install
npm run dev       # start the dev server (open on your phone via your LAN IP)
npm test          # unit tests (vitest)
npm run build     # type-check (tsc, strict) and produce a static build in dist/
npm run preview   # serve the production build locally
```

**CI:** the workflow ([.github/workflows/ci.yml](.github/workflows/ci.yml): `npm ci`, `npm run build`, `npm test`) runs on every pull request and on pushes to `main`.

The built `dist/` folder is a plain static site (relative asset paths), so it can be dropped on GitHub Pages, Netlify, Cloudflare Pages or any file host. Share links use the URL fragment, so no server-side routing is needed.

## How it works

- **Body map** (`src/components/BodyMap`, art in `src/assets/anatomy`): each muscle is one path with a stable id like `biceps-l` (`-l`/`-r` is the person's own left/right). Taps are handled by one Pointer Events handler on the map. A tap picks the muscle under the finger or, failing that, the nearest muscle within a 24 px radius (so every target is effectively at least 44 px wide, even tiny ones). Two fingers zoom, one finger pans when zoomed, and a sideways swipe at 1x flips front/back. The zoom buttons and the Front/Back toggle give the same actions without gestures, and every muscle is also a keyboard-focusable button.
- **State** (`src/state`): a pure reducer over `{ muscleId: { intensity, duration, note } }`, persisted as `mm.selection` (`version: 1`). Favorites live in `mm.favorites` (`version: 1`). Both are sanitized on load, so bad or old data cannot crash the app.
- **i18n** (`src/i18n`): `en.json` and `zh.json` with a tiny `t(key, params)` helper. A unit test enforces identical keys and placeholders.
- **Sharing** (`src/share`): payload `[1, lang, [[muscleId, intensityIndex, minutes, note?], ...]]`, compressed by lz-string and put in `#v1=...`. Decoding validates everything (version, size limits, known ids, value ranges, note length, duplicates) and a bad link shows a friendly bilingual error.

## Project layout

```
src/
├── main.tsx, App.tsx
├── i18n/            en.json, zh.json, t() helper and LanguageProvider
├── data/            muscles.ts (ids, regions, i18n keys), regions.ts, options.ts
├── assets/anatomy/  shapes.ts (original SVG art) and ATTRIBUTION.md
├── components/      BodyMap, SettingsSheet, SummaryCard, Favorites, ShareSheet, SharedView, LanguageToggle, common
├── state/           selection reducer, favorites, localStorage persistence
├── share/           encode/decode and QR generation
└── styles/app.css
docs/                HANDOFF.md, MILESTONE-1.md, screenshots/
```

## Anatomy artwork

The front and back figures are **original, simplified, stylized drawings** made for this project and released under the repo's MIT license (see [src/assets/anatomy/ATTRIBUTION.md](src/assets/anatomy/ATTRIBUTION.md)). They are recognizable but not medically precise. An artist-drawn or open-licensed upgrade (CC0 / CC-BY) would look better; keep the muscle ids stable if you swap it in.

## Known limitations

- The Chinese strings are short and plain but have **not** been reviewed by a native speaker.
- The map is a simplified figure: no deep muscles, no soles of the feet, no head/scalp.
- The map captures touch gestures, so the page cannot be scrolled by dragging on the map itself (scroll from the area around it). The map is sized so the controls stay reachable.
- Share links hold the plan, so very long notes make a long link and a dense QR code. The app warns when the QR code gets hard to scan.

## License

MIT © William Aust. Anatomy artwork must be open (CC0/CC-BY/similar) or self-drawn; its license is recorded in the repo (see HANDOFF).
