# بستنی نوشین — Nooshin ice cream showcase

Static site (no build step required): `index.html`, `menu.html`, `services.html`, `css/`, `js/`, `img/`, `models/`.
Deploy the folder as-is to Cloudflare Pages. `_headers` sets caching.

## 3D ice cream
* Put the model at `models/ice-cream.glb` (Draco/Meshopt OK, textures up to 2048 px recommended). Without it a built-in stand-in model is shown.
* Name scoop meshes with `scoop`, `ice`, `cream` or `surface` (cone/stick/wafer meshes are excluded from toppings). Open the site with `?debug` to print a model report (triangles, textures, warnings) in the console.
* Reset limits (candies / covered area / trail points / trail count) and the hold time: `data-max-candies`, `data-max-coverage`, `data-hold-ms` on `#ice-viewer`, or `NooshinViewer.ResetConfig` (see `js/viewer.js`).

## Editing the viewer code
Sources are `js/viewer/*.js`. The site loads the single file `js/viewer/bundle.js`. After editing a module run
`node tools/build.js` (and `node tools/build.js --check` verifies the bundle is current).

## Fonts
No font files are shipped. Persian text uses Vazirmatn / Noto Sans Arabic / Tahoma if installed, otherwise the system font.
To self-host a font add a `@font-face` with `src:url(../fonts/<file>.woff2)` in `css/style.css`.

## Tests
`tests/run.sh` – Node suites (geometry/BVH, candy physics, pour, smarties, reset choreography, model fetching, bundle check).
`tests/integration/*.py` – Playwright (Chromium) audits of the real site code: layout/RTL/navigation, loading/render loop/resize/rotation,
toppings/attachment/resets, mobile touch, repeated cycles + memory, random-action fuzz. They replace Three.js with `tests/three-lite.js`
(an API-level stand-in without GPU rendering): they verify logic, DOM, events and resource lifecycles, **not pixels or real GPU speed/memory**.
Run e.g. `python3 tests/integration/b_toppings.py` (needs `pip install playwright` + `playwright install chromium`).
