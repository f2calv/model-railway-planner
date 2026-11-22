# model-railway-planner

A browser-only model railway track planner for trying layout ideas with the track you already own.
The first catalog targets Hornby OO (16.5 mm gauge); no account, backend or cloud database is required.

## Product Brief

This section preserves the original requirements and agreed direction:

- Drag-and-drop track planning, with snapping between compatible connectors.
- Inventory entered and saved locally; a layout cannot consume more pieces than you own.
- Multiple independently saved layout ideas, each drawing on the same inventory.
- Unbounded planning space or a baseboard formed from joined rectangles.
- Pan and zoom, touch placement and keyboard/exact-coordinate alternatives.
- Detect same-level overlaps and insufficient nominal parallel spacing, while warning where
  rolling-stock clearance still needs physical verification.
- Client-side Vite, TypeScript and D3/SVG, with testable domain logic separate from rendering.
- A Node Dev Container, linting, formatting, type checking, unit tests and browser tests.
- Offline/mobile installation through a progressive web app (PWA), where the browser supports it.
- Eventually publish to GitHub Pages through GitHub Actions.
- Expand later to other manufacturers (for example Peco and Marklin) and scales O, N and TT.
- Use GitHub Issues to track bugs and follow-up work; begin with iterative development.

GitHub Pages publication is deliberately deferred until the editor is ready. No Pages deployment
workflow or live site is enabled in this first implementation.

## Run Locally

Use Node 24 LTS with its bundled npm 11 or newer. Alternatively open the repository in the
[Dev Container](.devcontainer/devcontainer.json); dependency installation is explicit, not automatic.

```text
npm ci
npm run dev
```

Open the Vite URL printed in the terminal (normally port 5173). Add your quantities in **Track
inventory**, choose a piece, and click or tap the plan. Desktop users can drag from the catalog.
Drag a placed piece to move it. Stock is consumed only by the active idea; deleting track releases it.

Use **New idea**, **Duplicate** and the layout selector to explore alternatives. Changes autosave
after a successful browser-storage write. **Export backup** downloads all inventory and layouts;
**Import backup** validates a file and asks before replacing existing data.

## Editing and Limits

- Model coordinates, lengths and radii are millimetres; angles are degrees, clockwise on screen.
- Snap aligns both endpoint position and tangent. Occupied endpoints cannot accept extra pieces.
- **Rotate new** and **Reverse new curve** orient new track. Points have distinct handed catalog
  entries; their handedness is not changed by the curve-reversal control.
- Select a placed piece for exact X/Y/angle editing. Arrow keys move 5 mm; Shift + arrows move 1 mm.
  `R` rotates 22.5 degrees; Delete removes; Escape cancels placement.
- Empty background drag pans; wheel/pinch or the zoom controls zoom. **Fit plan** frames the layout.
- Baseboard rectangles must overlap or share an edge, not merely touch at a corner.
- Stock reductions are rejected if any saved layout would exceed the new quantity.

Clearance is a conservative planning aid, not a guarantee that trains can pass. The nominal
Hornby set-track spacing is 67 mm centre-to-centre, derived from the 371/438/505 mm standard radii.
Parallel checks allow 0.5 mm for rounded catalog geometry. A 30 mm planning footprint is used for
same-level overlap and board containment, with sampled curves (at most 5 mm between samples).
Valid connector neighbourhoods and the local fan between standard point exits are exempt from
parallel checks, not entire connected components. Points and curved stock overhang still require
physical validation. Crossings, bridges, elevations, flexible track and custom catalog editing are
not implemented.

## Initial Catalog

The catalog is a verified subset, not the complete Hornby range. Numeric dimensions and product
codes are referenced from manufacturer descriptions; no product photographs or artwork are copied.

| Pieces        | Geometry                                                | Sources                                                                                                                                  |
| ------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| R600 / R601   | 168 / 335 mm straight                                   | [R600](https://uk.hornby.com/products/straight-track-r600), [R601](https://uk.hornby.com/products/double-straight-r601)                  |
| R604 / R605   | 371 mm radius; 22.5 / 45 degrees                        | [R604](https://uk.hornby.com/products/curve-1st-radius-r604), [R605](https://uk.hornby.com/products/double-curve-1st-radius-r605)        |
| R606          | 438 mm radius; 22.5 degrees                             | [R606](https://uk.hornby.com/products/curve-2nd-radius-r606)                                                                             |
| R608 / R609   | 505 mm radius; 22.5 / 45 degrees                        | [R608](https://uk.hornby.com/products/curve-3rd-radius-r608), [R609](https://uk.hornby.com/products/double-curve-3rd-radius-r609)        |
| R8072 / R8073 | 168 mm straight plus 438 mm radius / 22.5 degree branch | [Left point](https://uk.hornby.com/products/left-hand-point-r8072), [Right point](https://uk.hornby.com/products/right-hand-point-r8073) |

Sources checked 22 November 2026. Points use an idealised analytic branch from the shared origin;
this is not a manufacturer CAD model. R607, short/long straights, fourth-radius curves and specialist
pieces remain catalog follow-ups. Some manufacturer descriptions conflate arc length and radius;
disputed dimensions must be resolved before adding those entries.

## Storage and Offline Use

Data is stored in this browser, on this device and origin. Clearing site data, private-browsing
restrictions, browser eviction or changing the site's URL/origin can remove or hide it. There is no
cross-device sync. Export backups regularly.

Malformed or future-version saved data locks editing rather than overwriting it. Export preserves
the original readable bytes for recovery. Failed writes reject the edit and display an error.
Changes in another tab lock editing until reload. Imports validate schema, catalog references,
finite coordinates, inventory quantities and unique IDs; placement problems are displayed for review.

To try the installable/offline production build:

```text
npm run build
npm run preview
```

Service workers run on localhost or HTTPS, not arbitrary HTTP network addresses. After the initial
online load, the production shell is cached for offline use. Installation varies by browser:
Chromium offers an install option; iOS uses Safari's **Add to Home Screen**. Native packaging and
app-store distribution are not implemented. Updates are offered explicitly; app caches and user
documents are kept separate.

For a future project-subpath deployment, build with `VITE_BASE_PATH` set to the site's path with a
trailing slash. Asset URLs, manifest and service-worker scope follow that base. Pages deployment
will be added and verified later.

## Development

```text
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Domain tests cover geometry, snapping, circuit closure, clearance, boards, inventory and storage.
Browser tests use the production build and cover editing, persistence, rejected operations, mobile
alternatives and offline reload. Tests need no cloud credentials. Linux browser tests may require
`npx playwright install --with-deps chromium`.

The Vite starter's newer TypeScript version was adjusted to TypeScript 6 to match the lint parser's
supported peer range. npm's lockfile defines the reproducible dependency set.
Workbox's build-time `glob` is overridden to a patched release; remove that override once Workbox
ships a patched compatible dependency range, then rerun production/offline tests.
Regenerate install icons from the original SVG with `npm run icons`.
Git hooks are not installed automatically; the opt-in pre-commit configuration complements npm's
frontend checks.

## Next Milestones

- Validate more real-world layouts, point/countercurve combinations and rolling-stock envelopes.
- Expand the verified Hornby catalog, then add manufacturer/scale profiles and compatibility rules.
- Add undo/redo, selection groups and print/export tools if user feedback calls for them.
- Verify the Dev Container build and mobile installation on physical devices.
- Add and verify GitHub Actions Pages publication only when approved.

## License

[MIT](LICENSE). Manufacturer names and product codes identify compatible track; this project is
independent and is not endorsed by the manufacturers.
