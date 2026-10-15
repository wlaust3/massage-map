# massage-map

A mobile- and tablet-first, touch-first web app for telling a masseuse exactly what you want. Tap muscles or regions on a front/back muscular anatomy illustration, set **intensity** (light / medium / firm / deep) and **duration** for each, and get an at-a-glance **summary card** to show the masseuse — in **English** or **simple Chinese (简体中文)**.

## Status

Pre-alpha. Only the project scaffold and the scope for Milestone 1 exist. See [docs/MILESTONE-1.md](docs/MILESTONE-1.md) for scope and acceptance criteria and [docs/HANDOFF.md](docs/HANDOFF.md) for guidance to contributors and coding agents.

## Stack and rationale

| Concern | Choice | Why |
| --- | --- | --- |
| Build / dev server | **Vite** | Fast dev loop, tiny static output, no server needed |
| UI | **React + TypeScript** | Component model suits a stateful, interactive map; types keep selection state and i18n keys safe |
| Body map | **Inline SVG**, one `<g>`/`<path>` group per muscle, plus large invisible padded hit areas | Crisp at any size, styleable (fill + outline), accessible, per-muscle events without canvas hit-testing |
| Input | **Pointer Events** (`pointerdown/up/move`, `touch-action`) | One API for touch, pen and mouse; no hover dependence; supports pinch/pan |
| i18n | Lightweight JSON dictionaries (`en`, `zh-Hans`) + a small `t(key)` helper | No heavy library needed for two languages; a test can enforce key parity |
| State | React state (context/reducer) + `localStorage` | Selections and language survive reloads; no backend |
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
npm run build     # type-check and produce a static build in dist/
npm run preview   # serve the production build locally
```

## Project layout

```
massage-map/
├── README.md
├── LICENSE
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── docs/
│   ├── HANDOFF.md        # scope + conventions for contributors/agents
│   └── MILESTONE-1.md    # milestone/issue body with acceptance criteria
└── src/
    ├── main.tsx          # entry point
    ├── App.tsx           # placeholder shell
    └── i18n/
        ├── en.json       # English strings
        └── zh.json       # Simplified Chinese (zh-Hans) strings
```

The planned layout as the app grows is in [docs/HANDOFF.md](docs/HANDOFF.md).

## License

MIT © William Aust. Anatomy artwork must be open (CC0/CC-BY/similar) or self-drawn; its license is recorded in the repo (see HANDOFF).
