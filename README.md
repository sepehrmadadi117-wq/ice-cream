# بستنی نوشین — Nooshin ice cream showcase

Static site (no build step required): `index.html`, `menu.html`, `services.html`, `css/`, `js/`, `img/`, `models/`.
Deploy the folder as-is to Cloudflare Pages. `_headers` sets caching.

## 3D ice cream
* Put the model at `models/ice-cream.glb` (Draco/Meshopt OK, textures up to 2048 px recommended). Without it a built-in stand-in model is shown.
* Name scoop meshes with `scoop`, `ice`, `cream` or `surface` (cone/stick/wafer meshes are excluded from toppings). Open the site with `?debug` to print a model report (triangles, textures, warnings) in the console.
* Automatic cleanup: it starts when about 90% of the *paintable* ice cream surface is covered by liquid and/or sprinkles (`js/viewer/coverage.js`
  samples the receiver meshes and counts each spot once; surface facing down or hidden by other geometry is not counted). Change the threshold with
  `data-max-coverage` (0..1) on `#ice-viewer` or `NooshinViewer.ResetConfig.maxCoverage`; `data-hold-ms` sets the pause before the cleanup animation.
  `maxCandies` / `maxTrails` / `maxTrailPoints` are only safety ceilings (memory / draw calls), normally never reached before the coverage.
* Pouring: press and hold on the ice cream; moving the pointer moves the pour, releasing stops it. Chocolate is thick (holds on gentle slopes, short runs),
  mulberry syrup is thin (runs on almost any slope). Tuning values are in `NooshinViewer.POURS` (`yield`, `dripSpeed`, `puddleR`, ...).
* Sprinkles (topping id `smarties`): exactly two shapes (round bead, thin rectangular rod), 10 colours (`NooshinViewer.SPRINKLE`).

## Editing the viewer code
Sources are `js/viewer/*.js`. The site loads the single file `js/viewer/bundle.js`. After editing a module run
`node tools/build.js` (and `node tools/build.js --check` verifies the bundle is current).

## Fonts
No font files are shipped. Persian text uses Vazirmatn / Noto Sans Arabic / Tahoma if installed, otherwise the system font.
To self-host a font add a `@font-face` with `src:url(../fonts/<file>.woff2)` in `css/style.css`.

## Tests
`tests/run.sh` – Node suites (geometry/BVH, candy physics, coverage/cleanup, pour, sprinkles, reset choreography, model fetching, bundle check).
`tests/integration/*.py` – Playwright (Chromium) audits of the real site code: layout/RTL/navigation, loading/render loop/resize/rotation,
toppings/attachment/resets, mobile touch, repeated cycles + memory, random-action fuzz. They replace Three.js with `tests/three-lite.js`
(an API-level stand-in without GPU rendering): they verify logic, DOM, events and resource lifecycles, **not pixels or real GPU speed/memory**.
Run e.g. `python3 tests/integration/b_toppings.py` (needs `pip install playwright` + `playwright install chromium`).
