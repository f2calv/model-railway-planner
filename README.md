# model-railway-planner

A free, browser-only **model railway track planner** for designing **Hornby OO gauge layouts**.
Drag and snap track pieces, try baseboard shapes, save alternative ideas and calculate a shopping
list for the extra track you need. No account, backend or cloud database is required.

The initial catalog targets Hornby OO (16.5 mm gauge). TypeScript, Vite and D3/SVG power the
zoomable editor; the progressive web app supports offline use and installation where available.

[Open the planner](https://f2calv.github.io/model-railway-planner/) or [run it locally](#run-locally).

![Hornby OO double-loop layout in the track planner, with grouped curve inventory and four extra R607 pieces on the shopping list](docs/images/planner-overview.jpg)

Example layout using synthetic inventory. Orange dashed track identifies the pieces still to buy.

## System Context

The planner runs in a standard browser and keeps inventory and saved ideas on the user's device.
Static hosting distributes application code, not user layouts.

```mermaid
flowchart LR
    user(["Railway modeller"]):::person
    planner["Model Railway Planner<br/>Browser-only layout design"]:::system
    pages["GitHub Pages<br/>Static application hosting"]:::external
    backup[("User backup file<br/>Inventory and saved layouts")]:::store
    user -->|"Place track and explore ideas"| planner
    planner -->|"HTTPS application assets"| pages
    planner -->|"Import and export JSON"| backup
    classDef person fill:#ede9fe,stroke:#6d28d9,color:#2e1065
    classDef system fill:#dbeafe,stroke:#1d4ed8,color:#1e3a8a
    classDef external fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef store fill:#e5e7eb,stroke:#4b5563,color:#111827
```

See the [C4 architecture: containers, components and code map](docs/architecture.md#containers)
for the implementation drilldown and placement/persistence sequence.

## Features

- Drag-and-drop track placement with connector snapping and track descriptions.
- Shared inventory, multiple layout ideas and shopping lists for pieces still to buy.
- Unbounded canvas or baseboards formed from joined rectangles.
- Pan and zoom, touch placement, keyboard controls and exact-coordinate editing.
- Planning warnings for overlaps, baseboard boundaries and nominal parallel spacing.
- Local autosave and JSON backup import/export, without accounts or cloud storage.
- Dark mode and installable offline use where the browser supports it.

## Run Locally

Use Node 24 LTS with its bundled npm 11 or newer. Alternatively open the repository in the
[Dev Container](.devcontainer/devcontainer.json); dependency installation is explicit, not automatic.

```text
npm ci
npm run dev
```

Open the Vite URL printed in the terminal (normally port 5173). Choose a piece and click or tap the
plan, or drag it from the catalog with a moving track preview. Enter your quantities in **Track
inventory** whenever you're ready. The compact catalog groups straights, curves, points and
miscellaneous pieces in collapsible sections; search by code or name.

Drag a placed piece to move it. Each idea uses the owned collection independently. Extra pieces
remain placeable and appear as orange dashed track, with quantities under **Shopping list**.
Increasing inventory or removing pieces updates the shortfall immediately. Where several identical
pieces are placed, the earliest ones count as owned; moving one does not change this ordering.

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
- Inventory reductions are allowed and recalculate the shopping list for each saved idea.
- Hover over placed track for its code, name and dimensions; the selected-piece inspector provides
  the same information without hover. Unselected track uses a pointer; selected track uses a grab
  cursor.
- Track joins have 1.5-pixel visual separator strokes at every connector, independent of zoom.
  They do not change physical track length, positions or snapping.
- **Dark mode** switches the interface theme and saves the preference on this device. The initial
  theme follows the browser's system preference.

Clearance is a conservative planning aid, not a guarantee that trains can pass. The nominal
Hornby set-track spacing is 67 mm centre-to-centre, derived from the 371/438/505 mm standard radii.
Parallel checks allow 0.5 mm for rounded catalog geometry. A 30 mm planning footprint is used for
same-level overlap and board containment, with sampled curves (at most 5 mm between samples).
Valid connector neighbourhoods and the local fan between standard point exits are exempt from
parallel checks, not entire connected components. Points and curved stock overhang still require
physical validation. Diamond crossings contain two independent routes and four connectors; their
internal crossing is permitted, but unrelated track still cannot overlap them. Bridges, elevations,
flexible track and custom catalog editing are not implemented.

## Track Catalogs

The initial catalog contains 22 Hornby OO entries. See the [track catalog guide](docs/catalog.md)
for supported pieces, dimensions, manufacturer sources and geometry limitations.

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

For a project-subpath deployment, build with `VITE_BASE_PATH` set to the site's path with a
trailing slash. Asset URLs, manifest and service-worker scope follow that base. Pages deployment
uses `/model-railway-planner/`; browser tests use that same base rather than only testing `/`.
Set `VITE_APP_VERSION` for an identifiable production build; local builds display `development`
when it is absent.

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
Browser tests use the production build and cover editing, shopping lists, persistence, palette
drag previews/cancellation, grouped search, dark mode, tooltips, visual joins, rejected operations,
mobile alternatives and offline reload. Tests need no cloud credentials. Linux browser tests may require
`npx playwright install --with-deps chromium`.

The Vite starter's newer TypeScript version was adjusted to TypeScript 6 to match the lint parser's
supported peer range. npm's lockfile defines the reproducible dependency set.
Workbox's build-time `glob` is overridden to a patched release; remove that override once Workbox
ships a patched compatible dependency range, then rerun production/offline tests.
Regenerate install icons from the original SVG with `npm run icons`.
Git hooks are not installed automatically; the opt-in pre-commit configuration complements npm's
frontend checks.

Track bugs and future work in [GitHub Issues](https://github.com/f2calv/model-railway-planner/issues).

## License

[MIT](LICENSE). Manufacturer names and product codes identify compatible track; this project is
independent and is not endorsed by the manufacturers.
