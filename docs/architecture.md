# Model Railway Planner Architecture

These C4 views describe the current browser-only implementation. The
[System Context](../README.md#system-context) is maintained in the README; this drilldown covers
containers, components and persistence. No backend, authentication service or cloud user database
exists.

## Containers

The application executes on the user's device. GitHub Pages serves static assets; browser storage
holds user documents and the service worker caches application assets separately.

```mermaid
flowchart LR
    user(["Railway modeller"]):::person
    pages["GitHub Pages<br/>Static application hosting"]:::external
    subgraph planner [Model Railway Planner]
        browser["Browser application<br/>TypeScript and D3 SVG"]:::container
        worker["Service worker<br/>Workbox release cache"]:::container
        documents[("localStorage<br/>Document and separate preferences")]:::store
        cache[("Cache Storage<br/>Application assets only")]:::store
    end
    backup[("User files<br/>JSON plans and drawing exports")]:::store
    issues["GitHub Issues<br/>Optional reviewed error report"]:::external
    user -->|"Plan and edit"| browser
    browser -->|"HTTPS assets"| pages
    browser -->|"Validate and save"| documents
    browser -->|"Import and export"| backup
    browser -.->|"Open issue draft only on request"| issues
    browser -.->|"Register and approve update"| worker
    worker -->|"Cache and serve assets"| cache
    worker -->|"Fetch production release"| pages
    classDef person fill:#ede9fe,stroke:#6d28d9,color:#2e1065
    classDef container fill:#dbeafe,stroke:#1d4ed8,color:#1e3a8a
    classDef store fill:#e5e7eb,stroke:#4b5563,color:#111827
    classDef external fill:#fef3c7,stroke:#d97706,color:#78350f
```

Solid arrows represent direct interactions; the dotted arrow represents asynchronous worker
registration/update events. Inventory and layout data are not sent to Pages.

## Components

The browser adapter owns DOM rendering and gestures. Pure state and geometry modules validate
commands without D3 or storage access; persistence publishes only validated complete snapshots.

```mermaid
flowchart TB
    subgraph browser [Browser application]
        editor["Editor adapter<br/>DOM, D3 joins and gestures"]:::component
        state["Planner commands<br/>Atomic edits, locks and inventory"]:::component
        geometry["Track geometry<br/>Snapping, clearance and boards"]:::component
        catalog["Track catalog and profiles<br/>Routes and compatibility"]:::component
        storage["Persistence adapter<br/>Validated snapshot reads and writes"]:::component
        history["History and activity<br/>Bounded session revisions"]:::component
        preferences["Preferences<br/>Language, audio and confirmation"]:::component
        language["Localization<br/>Text and template translation"]:::component
        exports["Drawing and interchange<br/>SVG, PNG and CSV"]:::component
        sound["Track audio<br/>Opt-in Web Audio tones"]:::component
        pwa["Offline adapter<br/>Worker notifications and update"]:::component
    end
    documents[("localStorage<br/>Planner snapshot")]:::store
    worker["Service worker"]:::external
    editor -->|"Commands and derived state"| state
    editor -->|"Routes and gesture candidates"| geometry
    editor -->|"Load and commit snapshot"| storage
    editor -->|"Register and request update"| pwa
    editor -->|"recordHistory and undo/redo"| history
    editor -->|"loadPreferences and savePreferences"| preferences
    editor -->|"translate and translateUi"| language
    editor -->|"svgExport, pngExport and csvExport"| exports
    editor -->|"playSound"| sound
    state -->|"Validate placement"| geometry
    state -->|"Validate catalog references"| catalog
    geometry -->|"Resolve routes and dimensions"| catalog
    storage -->|"Parse and validate"| state
    storage -->|"getItem and setItem"| documents
    preferences -->|"Separate versioned settings"| documents
    exports -->|"Validate snapshot and shortfalls"| state
    exports -->|"Routes and drawing bounds"| geometry
    exports -->|"Resolve track metadata"| catalog
    pwa -.->|"Worker lifecycle"| worker
    classDef component fill:#dbeafe,stroke:#1d4ed8,color:#1e3a8a
    classDef store fill:#e5e7eb,stroke:#4b5563,color:#111827
    classDef external fill:#fef3c7,stroke:#d97706,color:#78350f
```

All components execute within one bundled browser application; they are responsibilities, not
independently deployed services. Offline registration and update handling currently live in the
editor entrypoint rather than a separate module.
History holds complete document revisions in memory and publishes a step only after a successful
save. Preferences are independent of document undo/redo and JSON backups. Activity is session-only;
unexpected-error reports never automatically include it or document content.

## Code Map

| Component                  | Responsibility                                                                | Code location                                                            | Provides                                                                                        | Requires                                           |
| -------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Editor adapter             | Controls, SVG joins, previews, pointer/keyboard gestures and visible errors   | [main.ts](../src/main.ts), [style.css](../src/style.css)                 | Browser UI and command dispatch                                                                 | State, geometry, catalog, storage, PWA integration |
| Planner commands           | Atomic group/layout edits, locks, inventory, shortfalls and backup validation | [state.ts](../src/state.ts), [model.ts](../src/model.ts)                 | `putPieces`, `transformPieces`, `removePieces`, `setPieceLocks`, `resetInventory`, `parseState` | Catalog and geometry                               |
| Track geometry             | Model-space routes, poses, group snapping, clearance and board union          | [geometry.ts](../src/geometry.ts)                                        | `ports`, `snapPiece`, `snapGroup`, `placementProblem`, `pathData`                               | Catalog routes and profiles                        |
| Track catalog and profiles | Verified nominal dimensions, warnings and geometric compatibility             | [catalog.ts](../src/catalog.ts), [profiles.ts](../src/profiles.ts)       | `catalog`, `definition`, `trackSize`, `planningCompatible`                                      | Domain types                                       |
| Persistence adapter        | Validate a whole snapshot before writing; surface malformed/denied storage    | [storage.ts](../src/storage.ts)                                          | `loadState`, `saveState`, `StoragePort`                                                         | State parser and browser Storage                   |
| History and activity       | Bound undo/redo revisions and activity entries to the current session         | [history.ts](../src/history.ts)                                          | `recordHistory`, `undoHistory`, `redoHistory`, `recordActivity`                                 | Document model                                     |
| Preferences                | Validate and persist independent UI settings                                  | [preferences.ts](../src/preferences.ts)                                  | `loadPreferences`, `savePreferences`                                                            | Browser Storage port                               |
| Localization               | Translate owned UI text/templates without changing user names or codes        | [i18n.ts](../src/i18n.ts), [translations.json](../src/translations.json) | `translate`, `translateUi`                                                                      | Language value and translation data                |
| Drawing and interchange    | Generate safe standalone drawings and formula-protected CSV                   | [exports.ts](../src/exports.ts)                                          | `drawingLayers`, `layoutBounds`, `svgExport`, `pngExport`, `csvExport`                          | State, geometry and catalog                        |
| Track audio                | Synthesize optional local feedback with cleaned-up audio nodes                | [sound.ts](../src/sound.ts)                                              | `playSound`                                                                                     | Browser Web Audio                                  |
| Offline adapter            | Build worker/manifest, register it and offer explicit updates                 | [vite.config.ts](../vite.config.ts), [main.ts](../src/main.ts)           | PWA assets and update action                                                                    | Vite PWA plugin and browser service worker         |

## Runtime Scenarios

### Placing Track

Missing stock is allowed and contributes to the active idea's shopping list. Invalid geometry or
failed persistence leaves the committed snapshot unchanged.

```mermaid
sequenceDiagram
    actor User as Railway modeller
    participant Editor as Editor adapter
    participant Geometry as Track geometry
    participant State as Planner commands
    participant Storage as Persistence adapter
    participant Documents as localStorage
    participant History as History and activity
    User->>Editor: Drag or tap a piece
    Editor->>Geometry: Preview and snap candidate
    Editor->>State: putPiece(candidate)
    State->>Geometry: Validate geometry and connectors
    alt Invalid placement
        State-->>Editor: Throw placement error
        Editor-->>User: Show error and retain saved plan
    else Valid placement
        State-->>Editor: Candidate snapshot
        Editor->>Storage: saveState(snapshot)
        Storage->>State: parseState(serialized snapshot)
        Storage->>Documents: setItem(complete snapshot)
        alt Write fails
            Documents-->>Editor: Storage error
            Editor-->>User: Not saved and no edit applied
        else Write succeeds
            Editor->>History: Record previous and current document
            Editor->>State: Derive shopping list and missing-piece IDs
            Editor-->>User: Render track, shortfalls and saved status
        end
    end
```

The same save-before-publication boundary applies to group moves, deletion, inventory reset and
undo/redo. Pointer cancellation discards previews. SVG hit elements retain identity across selection
redraws so native touch events can reach D3; a second pointer explicitly cancels track dragging before
the zoom owner takes over.

## Document and Update Safety

Format 2 retains piece locks and migrates supported format 1 documents. Unsupported/newer formats
and unreadable storage lock editing while preserving original bytes. Storage events prevent silent
cross-tab overwrite. App-cache updates are explicit and separate from user documents: normal
updates require a successful save, while recovery mode can update the app without rewriting the
document. Background cache notifications do not replace foreground save/recovery errors.

## Deployment Flow

The [CI caller](../.github/workflows/ci.yml) calculates a build version, validates the production
app at `/model-railway-planner/` and transfers the tested artifact to the shared Pages publisher.
PRs validate without deploying. A default-branch push deploys and verifies live commit/version
identity before creating the immutable application release tag.

## Architecture Signals

- **Hub component:** [main.ts](../src/main.ts) owns UI, gestures, dialogs and PWA registration.
  It is the principal change hotspot; no framework or extra abstraction is required merely to
  split it, but focused adapters may help when these responsibilities evolve independently.
- **No backend boundary:** all documents remain origin-local. Export is the recovery boundary,
  not cloud backup or synchronization.
