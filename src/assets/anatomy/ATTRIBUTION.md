# Anatomy artwork attribution

| Item | Value |
| --- | --- |
| Files | `front.svg`, `back.svg` (the drawing, one per view) and `musclePaths.ts` (tap shapes traced from it) |
| Source | [“Muscles front and back”](https://commons.wikimedia.org/wiki/File:Muscles_front_and_back.svg), Wikimedia Commons |
| Author | OpenStax, Tomáš Kebert & umimeto.org (a redraw of the OpenStax *Anatomy & Physiology* figure) |
| License | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| Modifications | Split into front and back views (cropped viewBox) and Inkscape editor metadata removed. `musclePaths.ts` holds one outline per muscle and side, traced from the drawing's own outlines by `tools/anatomy/` and simplified. |

**Credit line:** “Muscles front and back” by OpenStax, Tomáš Kebert & umimeto.org, CC BY-SA 4.0.

**Share-alike:** these three files are adapted from a CC BY-SA 4.0 work, so they are licensed **CC BY-SA 4.0** as
well, not MIT. The rest of the repository (the app code) stays MIT. Anyone reusing the art must keep the credit line
and the CC BY-SA 4.0 license.

Muscle ids (`<base>-l` / `<base>-r`, see `src/data/muscles.ts`) are part of the saved and shared data format. To
change the art or the muscle list, follow `tools/anatomy/README.md`, keep existing ids, and map any removed id in
`LEGACY_BASES`.
