# ADR 0001: Client-Side Planner and Domain Boundaries

**Status:** Accepted; retrospective record of the existing design.
**Date:** 2026-11-24.
**Scope:** Application purpose, client-side ownership and railway-planning domain boundaries.

This record explains why the application is structured this way. It is not a release checklist
or a transcript. The [README](../README.md) describes current features and usage;
the [architecture](architecture.md) describes components and their code locations.

## Context and Purpose

The application began as a drag-and-drop Hornby OO planner: arrange existing track, snap compatible
connectors, explore alternative layouts and retain inventory between visits. It should work in a
standard browser without an account or backend, with offline/mobile installation where supported.
Other manufacturers and scales should be possible without assuming that similarly named pieces
have equivalent geometry or physical compatibility.

The design subsequently grew to address group editing, geometric baseboards, room/furniture
references and optional electrical reachability. These remain planning aids, not manufacturer CAD,
structural assessments or real-wiring certification.

## Decision

### Keep the Application Client-Side

Use Vite for construction/build tooling, strict TypeScript for application contracts and D3/SVG
for the graphical adapter. GitHub Pages distributes static assets; user documents remain in the
browser. No service account, cloud database or server-side layout processing is needed.

SVG suits dimensioned routes and independent layers, while D3 supplies keyed rendering and
interaction rather than owning application state. The
[editor](../src/main.ts) coordinates UI operations; pure
[state commands](../src/state.ts) and [geometry](../src/geometry.ts) remain usable without the DOM.
Specialized editors can delegate through the same save boundary rather than duplicate it.

### Treat a Layout as an Idea, Not an Allocation of Stock

Inventory is shared, but each saved idea evaluates its use of that collection independently.
Planning beyond owned stock is allowed and produces a shopping list instead of blocking exploration.
This avoids treating alternative designs as simultaneous reservations and supports planning a
future purchase as well as arranging an existing collection.

Trackless attachments belong to their host piece and consume their own inventory units.
They are not invented rail geometry. The stock and attachment contract is owned by the
[catalog guide](catalog.md) and [state commands](../src/state.ts).

### Keep Physical Geometry and Compatibility Explicit

Model-space geometry is dimensioned independently of screen zoom. Manufacturer/scale profiles,
routes, connectors and clearance assumptions must be explicit; a new display label is not support
for another gauge. Manufacturer evidence and documented approximations take precedence over
visually convenient shapes or retailer equivalence claims.

The [catalog guide](catalog.md) owns dimensions, sources and compatibility limits.
The [profiles](../src/profiles.ts) separate gauge/electrical-system compatibility from physical
joiner certification. Placement checks remain conservative estimates, not clearance guarantees.

### Preserve Independent Room, Baseboard and Track Layers

The bottom room/furniture layer describes available space. Baseboards describe the proposed
construction surface; track is arranged above them. Editing one layer does not silently transform
the others.

Baseboards use canonical polygons, circles and arcs rather than accumulating special-case
rectangle presets. Room/furniture editing reuses that geometry and the
[shape editor](../src/shape-editor.ts). Named rooms are shared by reference across layouts, so
editing a room intentionally affects every assigned idea. Furniture is a visual reference, not
proof of support or a collision restriction.

The [baseboard](baseboards.md) and [room](rooms.md) guides own their detailed editing and warning
contracts. The [document model](../src/model.ts) defines the layer and reference relationships.

### Publish Edits Only After Successful Persistence

The committed in-memory document is the editing authority; browser storage retains the validated
snapshot across visits. Commands propose a complete next document. The
[persistence adapter](../src/storage.ts) validates and writes it before the UI publishes it or
records an undo step.

Invalid imports, unsupported document versions and failed storage writes must not silently replace
recoverable work. Document migrations preserve existing geometry and editing protections;
new fields that older readers would discard require a compatible format transition.
History is session-only, while preferences and cached application assets are separate from layout
documents. The [architecture safety contract](architecture.md#document-and-update-safety) owns the
implementation detail.

### Estimate Power Conservatively

DC/DCC checking uses explicit operator declarations and route/connector reachability, not a single
electrical node for an entire track piece. This preserves independent crossing routes, isolating
sections and self-isolating point behavior.

Unknown continuity must remain unverified rather than produce an all-powered result. A powered
estimate assumes the proposed parts are fitted; it does not establish stock ownership, polarity
or safe real-world wiring. The [power guide](power.md) owns feed compatibility, point bypasses,
clip quantities and the limits of the [power model](../src/power.ts).

## Tradeoffs and Alternatives

| Alternative                                   | Benefit                                        | Why it is not the current baseline / reason to revisit                                                                               |
| --------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Server-backed accounts and storage            | Cross-device sync and collaboration            | Adds infrastructure and a user-data boundary. Revisit only for an explicit sync/collaboration requirement.                           |
| A full UI framework                           | More structured management of complex controls | Adds dependencies and integration work. Revisit if measured UI maintenance costs justify it; retain pure domain commands.            |
| Canvas/WebGL rendering                        | Potentially better large-scene throughput      | Loses some native SVG inspection/export advantages. Revisit for a measured rendering bottleneck, not presumed performance.           |
| Hard inventory limits                         | Prevents planning with unowned pieces          | Prevents useful shopping-list scenarios. Any future strict-stock mode must be explicit rather than silently changing existing ideas. |
| Automatic geometric or electrical assumptions | Faster catalog expansion and simpler results   | Can make incomplete evidence look authoritative. Keep approximations visible and defer unsupported physical claims.                  |

These are tradeoffs against the existing design, not a claim that each alternative was prototyped.
The client-only choice means local-storage loss and lack of cross-device synchronization remain real
limitations; JSON backups provide user-controlled interchange, not managed cloud recovery.

## Significant Design Evolution

1. **Track and ideas:** connector snapping, shared inventory and local document persistence
   established the domain and privacy boundary.
2. **Editing and interchange:** grouped selection, locks, undo/redo and exports made edits
   transactional rather than a collection of SVG mutations; profiles separated catalog compatibility.
3. **Geometric baseboards:** canonical shapes and module presets replaced rectangle-only planning,
   while retaining independent track placement.
4. **Rooms and furniture:** shared named rooms added a lower reference layer and justified reusing
   the geometric editor through a layer-specific port.
5. **Track power:** explicit feeds and conservative reachability added electrical planning without
   claiming to inspect a physical installation.

Record architectural shifts here, not every feature or validation run. Delivery dates, releases and
minor changes belong in Git history and releases; planned work belongs in issues.

## Validation and Reconsideration

Pure domain tests cover geometry, commands, stock, document migration and power behavior.
Browser tests exercise the production artifact's rendering, gestures, persistence, exports and
accessible controls. See the [development guidance](../README.md#development) and
the [domain](../src/planner.test.ts), [power](../src/power.test.ts) and
[browser](../tests/editor.spec.ts) suites. Their presence is not a claim that a particular release
or physical device has passed validation.

Revisit this decision when requirements change the browser-only privacy boundary, when measured
scale exposes a rendering/storage limit, or when new physical evidence changes a catalog assumption.
Keep future manufacturer/gauge support and physical construction/electrical guarantees separate
from the capabilities actually implemented.
