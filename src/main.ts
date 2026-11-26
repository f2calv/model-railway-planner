import './style.css';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';
import { registerSW } from 'virtual:pwa-register';
import { catalogBrands, catalogCategories, definition, filterCatalog, trackSize } from './catalog';
import { connected, normalize, pathData, ports, samples, snapPiece, snapGroup } from './geometry';
import {
  activeLayout,
  available,
  emptyState,
  layoutProblems,
  missingPieceIds,
  parseState,
  putPiece,
  putPieces,
  transformPieces,
  removePieces,
  setPieceLocks,
  resetInventory,
  setInventory,
  setAccessory,
  setElectrical,
  shoppingList,
  updateLayout,
  assignRoom,
  assignedRoom,
  putRoom,
  removeRoom,
} from './state';
import { loadState, saveState, storageKey } from './storage';
import type { Piece, PlannerState, RoomShape, TrackCategory, Vec } from './model';
import {
  createHistory,
  recordHistory,
  redoHistory,
  undoHistory,
  recordActivity,
  type Activity,
  type History,
} from './history';
import {
  defaultPreferences,
  isLanguage,
  loadPreferences,
  savePreferences,
  type Preferences,
} from './preferences';
import { playSound } from './sound';
import { gaugeGroups, trackWidth } from './profiles';
import { CatalogBrowser } from './catalog-browser';
import {
  defaultPageSettings,
  loadPageSettings,
  pagePanels,
  pageSettingsKey,
  savePageSettings,
  type PageSettings,
} from './page-settings';
import { ShapeEditor } from './shape-editor';
import { roomProblems } from './rooms';
import { analyzePower, attachPowerAccessory, type PowerRoute } from './power';
import { PowerEditor } from './power-editor';
import { translate, translateUi } from './i18n';
import {
  accessoryMarks,
  csvExport,
  drawingLayers,
  layoutBounds,
  pngExport,
  svgExport,
} from './exports';

function element<T extends Element>(selector: string): T {
  const result = document.querySelector<T>(selector);
  if (!result) throw new Error(`Required UI element missing: ${selector}`);
  return result;
}

element<HTMLDivElement>('#app').innerHTML = `
  <header class="app-header">
    <img src="${import.meta.env.BASE_URL}icon.svg" width="38" height="38" alt="" />
    <div class="brand"><h1>Model Railway Planner</h1><span>Your track. Your next great layout. <span id="app-version"></span></span></div>
    <span class="privacy-badge">LOCAL & PRIVATE</span>
    <a class="feedback-link" href="https://github.com/f2calv/model-railway-planner" target="_blank" rel="noopener noreferrer">Feature requests / bug reports</a>
    <button id="theme" aria-pressed="false">Dark mode</button>
    <label>Language<select id="language" aria-label="Language"><option value="en">English</option><option value="de">Deutsch</option><option value="fr">Français</option><option value="es">Español</option><option value="it">Italiano</option></select></label>
    <button id="export">Export backup</button>
    <button id="import">Import backup</button>
    <input id="import-file" type="file" accept=".json,application/json" hidden />
  </header>
  <nav class="page-navigation" aria-label="Application pages"><a id="planner-page-link" href="#planner" aria-current="page">Planner</a><a id="catalog-page-link" href="#catalog">Track catalog</a></nav>
  <section id="catalog-page" class="catalog-page" hidden aria-label="Track catalog"></section>
  <div id="planner-page">
  <div class="layout-bar">
    <div class="document-actions" role="group" aria-label="Layout actions">
      <label>Layout <select id="layouts" aria-label="Saved layouts"></select></label>
      <button id="new-layout">New layout</button><button id="duplicate-layout">Duplicate</button>
      <button id="rename-layout">Rename layout</button><button id="delete-layout">Delete layout</button>
    </div>
    <div class="document-actions" role="group" aria-label="Room actions">
      <label>Room <select id="layout-room" aria-label="Room for this layout"><option value="">No room</option></select></label>
      <button id="new-room">New room</button><button id="rename-room">Rename room</button><button id="delete-room">Delete room</button>
    </div>
    <button id="undo" disabled>Undo</button><button id="redo" disabled>Redo</button>
    <button id="print">Print / PDF</button><button id="export-svg">Export SVG</button><button id="export-png">Export PNG</button><button id="export-inventory-csv">Inventory CSV</button><button id="export-shopping-csv">Shopping list CSV</button>
    <span id="save-state" class="save-state">Autosave ready</span>
  </div>
  <main class="workspace">
    <aside class="inventory-panel">
      <div class="panel-heading"><span class="eyebrow">YOUR COLLECTION</span><h2>Track inventory</h2></div>
      <p>Plan with any piece. Missing stock appears on this idea's shopping list.</p>
      <label class="search-label">Wildcard filter<input id="search" type="search" maxlength="256" placeholder="Code or type; * any text, ? one character" /></label>
      <label>Gauge<select id="catalog-gauge">${gaugeGroups.map((g) => `<option value="${g.id}" ${g.id === 'oo-ho' ? 'selected' : ''}>${g.label}</option>`).join('')}</select></label>
      <label>Brand<select id="catalog-profile"></select></label>
      <div class="catalog-heading"><span id="catalog-gauge-label">OO/H0 / 16.5 mm</span><span>Owned / left</span></div>
      <div id="catalog"></div>
      <p id="catalog-empty" hidden>No registered pieces match these filters.</p>
      <button id="reset-inventory">Reset entire inventory</button>
      <p class="subtle">Drag a piece onto the plan, or choose it and tap an empty spot. No sample stock is added.</p>
    </aside>
    <section class="editor" aria-label="Layout editor">
      <div class="editor-toolbar">
        <button id="cancel-tool" aria-pressed="false">Switch to Pan</button>
        <button id="tool-rotate">Rotate new</button><button id="tool-flip">Reverse new curve</button>
        <span id="tool-label">Select a track piece to begin</span>
        <label><input id="snap" type="checkbox" checked /> Snap</label>
        <button id="zoom-out" aria-label="Zoom out">-</button><output id="zoom-level">60%</output>
        <button id="zoom-in" aria-label="Zoom in">+</button><button id="fit">Fit railway</button><button id="fit-boards">Fit baseboards</button><button id="fit-room">Fit room</button>
      </div>
      <svg id="canvas" role="group" tabindex="0" aria-label="Track plan. Drag blank space to select; Space and drag to pan; Ctrl selects multiple pieces. Use controls for keyboard editing.">
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M100 0H0V100" fill="none" stroke="#d7ddd5" stroke-width="1"/>
            <circle cx="50" cy="50" r="1.4" fill="#d7ddd5"/>
          </pattern>
        </defs>
        <g id="world"><rect x="-1000000" y="-1000000" width="2000000" height="2000000" fill="url(#grid)" />
          <g id="rooms"></g><g id="boards"></g><g id="tracks"></g><g id="preview" pointer-events="none"></g><rect id="marquee" hidden pointer-events="none" />
        </g>
      </svg>
      <div id="empty-hint"><strong>A little space for big ideas.</strong><span>Choose a track piece, then drag or tap to place it.</span></div>
      <div class="canvas-footer"><span>100 mm grid / all dimensions in mm</span><span id="piece-count">0 pieces</span></div>
    </section>
    <aside class="details-panel">
      <span class="eyebrow">FINE TUNE</span><h2>Selected piece</h2>
      <label>Piece<select id="piece-select" aria-label="Select placed piece"><option value="">None</option></select></label>
      <p id="piece-description"></p>
      <p id="selection-count"></p>
      <div class="two-columns"><button id="select-all">Select all pieces</button><button id="lock-pieces" disabled>Lock selection</button><button id="unlock-pieces" disabled>Unlock selection</button></div>
      <div id="piece-controls">
        <div class="two-columns"><label>X (mm)<input id="piece-x" type="number" step="1" /></label><label>Y (mm)<input id="piece-y" type="number" step="1" /></label></div>
        <label>Angle (degrees)<input id="piece-angle" type="number" step="0.5" /></label>
        <button id="apply-position">Apply position</button>
        <div class="two-columns"><button id="rotate-left">Rotate -22.5</button><button id="rotate-right">Rotate +22.5</button></div>
        <button id="flip">Reverse curve</button><button id="remove-piece">Remove piece</button>
        <button id="remove-accessory" hidden>Remove R645 accessory</button>
      </div>
      <hr /><div id="power-editor"></div>
      <hr /><h2>Shopping list</h2><p>Extra pieces needed for this layout only. Orange dashed track is not yet owned.</p>
      <div id="shopping-list"></div>
      <hr /><span class="eyebrow">YOUR SPACE</span><h2>Baseboard</h2>
      <div id="baseboard-editor"></div>
      <hr /><h2>Room & furniture</h2>
      <p>Choose a named room for this layout. Room shapes are shared by all layouts using that room; furniture is a visual reference only.</p>
      <div id="room-controls">
        <label>Room shape role<select id="room-role"><option value="outline">Room outline</option><option value="furniture">Furniture</option></select></label>
        <label>Room shape name<input id="room-shape-name" maxlength="120" value="Room outline" data-user-text /></label>
        <div id="room-editor"></div>
      </div>
      <hr /><h2>Planning checks</h2><div id="checks"></div>
      <p class="subtle">67 mm nominal Hornby track centres. Curves and turnout fans still need physical checks with your longest trains. This is not a clearance certificate.</p>
      <details id="controls-help"><summary>Controls & mobile</summary><p>Use Switch to Pan to drag the canvas without moving pieces; Switch to Select restores selection. Choosing a piece or shape returns to editing. Space + drag temporarily pans; scroll or pinch zooms. Fit railway, Fit baseboards and Fit room frame each layer independently.</p><p>Tap to place track. Drag blank space to select enclosed pieces; Ctrl-click toggles selection. Drag selected pieces as a group. Space + drag pans; scroll or pinch zooms. On touch screens, drag blank space to pan. Arrows move 5 mm; Shift + arrows move 1 mm. R rotates; Delete removes; Escape cancels. Ctrl+A selects all; Ctrl+Z undoes; Ctrl+Shift+Z or Ctrl+Y redoes. Right-click a piece for lock actions, or use the buttons.</p><p>For offline installation, open a production build over HTTPS (or localhost). Use your browser's Install app / Add to Home Screen option. Browser support varies.</p></details>
      <button id="update-app" hidden>Update app</button>
      <hr /><h2>Preferences</h2>
      <label class="check-label"><input id="sounds" type="checkbox" /> Track sounds</label>
      <label class="check-label"><input id="confirm-delete" type="checkbox" checked /> Confirm piece deletion</label>
      <p class="subtle">Page settings stay on this device, separately from layouts and backups. Temporary selections and unapplied edits are not restored.</p>
      <button id="reset-page-settings">Reset page settings</button>
      <p id="page-settings-status" class="check-warning" role="status" hidden></p>
      <details id="activity"><summary>Activity & history (this session)</summary><p id="history-count"></p><h3>Undo history</h3><ol id="undo-history"></ol><h3>Local activity</h3><ol id="activity-list"></ol><p>History is session-only: 100 undo steps and 300 activity entries. Nothing is uploaded.</p></details>
    </aside>
  </main>
  </div>
  <footer id="status" role="status" aria-label="Planner status" aria-live="polite">Welcome. Choose any track to start planning; enter your inventory whenever you're ready.</footer>
  <div id="track-tooltip" role="tooltip" hidden></div>
  <div id="palette-ghost" aria-hidden="true" hidden></div>
  <dialog id="confirm-dialog"><form method="dialog"><h2 id="confirm-title">Confirm</h2><p id="confirm-text"></p><label id="skip-delete-label" class="check-label" hidden><input id="skip-delete" type="checkbox" /> Skip future piece-delete confirmations</label><div class="dialog-actions"><button value="cancel">Cancel</button><button value="confirm">Confirm</button></div></form></dialog>
  <dialog id="name-dialog"><form method="dialog"><h2 id="name-title">Layout name</h2><label>Name<input id="layout-name" maxlength="120" required /></label><div class="dialog-actions"><button value="cancel" formnovalidate>Cancel</button><button value="confirm">Save</button></div></form></dialog>
  <dialog id="piece-menu" aria-label="Selection actions"><h2>Selection actions</h2><button id="context-lock">Lock selection</button><button id="context-unlock">Unlock selection</button><button id="context-delete">Remove selection</button><form method="dialog"><button>Close</button></form></dialog>
  <dialog id="error-dialog" aria-label="Unexpected problem"><h2>Unexpected problem</h2><p>Your last saved data is safe. Export a backup before reloading. No layout or activity data is sent with an error report.</p><p id="error-details"></p><a id="report-error" target="_blank" rel="noopener noreferrer">Review a GitHub issue report</a><form method="dialog"><button>Close</button></form></dialog>
`;

element<HTMLElement>('#app-version').textContent =
  import.meta.env.VITE_APP_VERSION ?? 'development';

const uuid = () => crypto.randomUUID();
let state: PlannerState = emptyState(uuid());
let recovery = false;
let selectedId = '';
let selectedIds = new Set<string>();
let preferences: Preferences = { ...defaultPreferences };
let activity: readonly Activity[] = [];
let toolId = '';
let toolAngle = 0;
let toolFlipped = false;
let transform: ZoomTransform = zoomIdentity;
let previewPiece: Piece | null = null;
let previewPieces: Piece[] = [];
let drag: { pointerId: number; pieces: Piece[]; start: Vec; moved: boolean } | null = null;
let marquee: { pointerId: number; start: Vec; end: Vec; additive: boolean; moved: boolean } | null =
  null;
let spaceDown = false;
let panMode = false;
let pageSettings: PageSettings = defaultPageSettings();
let pageSettingsReady = false;
let pageSettingsWritable = true;
let restoringPageSettings = false;
let pageSettingsFrame = 0;
let lastPageSettings = '';
const touches = new Set<number>();
let multiTouch = false;
let suppressClick = false;
let paletteDrag: {
  pointerId: number;
  source: HTMLButtonElement;
  piece: Piece;
  start: Vec;
  moved: boolean;
} | null = null;
const openCategories = new Set<TrackCategory>(['straights', 'curves', 'points', 'misc']);
const svg = element<SVGSVGElement>('#canvas');
const svgSelection = select(svg);
const catalogBrowser = new CatalogBrowser(
  element<HTMLElement>('#catalog-page'),
  () => state,
  () => preferences.language,
);
const powerEditor = new PowerEditor(element<HTMLElement>('#power-editor'), {
  state: () => state,
  selected,
  single: () => selectedIds.size === 1,
  readonly: () => recovery,
  commit,
  action,
  redraw: render,
});
const boardEditor = new ShapeEditor(
  element<HTMLElement>('#baseboard-editor'),
  svg,
  element<SVGGElement>('#boards'),
  {
    state: () => state,
    commit,
    error: (message) => status(message, true),
    point: modelPoint,
    scale: () => transform.k,
    snap: () => element<HTMLInputElement>('#snap').checked,
    modeChanged: () => {
      panMode = false;
      roomEditor.leave();
      clearPaletteDrag();
      cancelGesture();
      toolId = '';
      selectOnly('');
      render();
    },
    fit: () => fit('boards'),
  },
);
const roomEditor = new ShapeEditor(
  element<HTMLElement>('#room-editor'),
  svg,
  element<SVGGElement>('#rooms'),
  {
    state: () => state,
    commit,
    error: (message) => status(message, true),
    point: modelPoint,
    scale: () => transform.k,
    snap: () => element<HTMLInputElement>('#snap').checked,
    modeChanged: () => {
      panMode = false;
      boardEditor.leave();
      clearPaletteDrag();
      cancelGesture();
      toolId = '';
      selectOnly('');
      render();
    },
    fit: () => fit('room'),
  },
  {
    shapes: (state) =>
      [...(assignedRoom(state)?.shapes ?? [])]
        .sort((a, b) => Number(a.role === 'furniture') - Number(b.role === 'furniture'))
        .map((entry) => entry.shape),
    put: (state, shape) => {
      const room = assignedRoom(state);
      if (!room) throw new Error('Choose a named room first.');
      const role = element<HTMLSelectElement>('#room-role').value;
      if (role !== 'outline' && role !== 'furniture') throw new Error('Invalid room shape role.');
      const entry: RoomShape = {
        shape,
        name: element<HTMLInputElement>('#room-shape-name').value.trim(),
        role,
      };
      return putRoom(state, {
        ...room,
        shapes: [...room.shapes.filter((entry) => entry.shape.id !== shape.id), entry],
      });
    },
    remove: (state, id) => {
      const room = assignedRoom(state);
      if (!room || !room.shapes.some((entry) => entry.shape.id === id))
        throw new Error('Select a room shape.');
      return putRoom(state, {
        ...room,
        shapes: room.shapes.filter((entry) => entry.shape.id !== id),
      });
    },
    clear: (state) => {
      const room = assignedRoom(state);
      if (!room) throw new Error('Choose a named room first.');
      return putRoom(state, { ...room, shapes: [] });
    },
    label: (shape) => {
      const entry = assignedRoom(state)?.shapes.find((entry) => entry.shape.id === shape.id);
      if (!entry) throw new Error('Select a room shape.');
      return entry.name;
    },
    role: (shape) => {
      const entry = assignedRoom(state)?.shapes.find((entry) => entry.shape.id === shape.id);
      if (!entry) throw new Error('Select a room shape.');
      return entry.role;
    },
    selected: (shape) => {
      if (!shape) return;
      const entry = assignedRoom(state)?.shapes.find((entry) => entry.shape.id === shape.id);
      if (!entry) throw new Error('Select a room shape.');
      element<HTMLSelectElement>('#room-role').value = entry.role;
      element<HTMLInputElement>('#room-shape-name').value = entry.name;
    },
  },
);
const shapeEditor = () => (roomEditor.editing ? roomEditor : boardEditor);
element<HTMLInputElement>('#room-board-width').value = '4000';
element<HTMLInputElement>('#room-board-height').value = '3000';

function status(message: string, error = false): void {
  const target = element<HTMLElement>('#status');
  if (target.textContent !== message) target.textContent = message;
  target.classList.toggle('error', error);
  translateUi(target, preferences.language);
  if (error && activity.at(-1)?.message !== message) addActivity(message);
}

function addActivity(message: string): void {
  activity = recordActivity(activity, { at: new Date(), message });
  renderActivity();
}

function changeSummary(previous: PlannerState, next: PlannerState): string {
  if (previous.activeLayoutId !== next.activeLayoutId) return 'Changed layout';
  if (JSON.stringify(previous.rooms) !== JSON.stringify(next.rooms)) return 'Room updated';
  if (activeLayout(previous).roomId !== activeLayout(next).roomId) return 'Changed assigned room';
  if (JSON.stringify(activeLayout(previous).boards) !== JSON.stringify(activeLayout(next).boards))
    return 'Baseboard updated';
  const before = activeLayout(previous).pieces;
  const after = activeLayout(next).pieces;
  if (
    activeLayout(previous).powerMode !== activeLayout(next).powerMode ||
    after.some(
      (p) =>
        JSON.stringify(before.find((old) => old.id === p.id)?.electrical) !==
        JSON.stringify(p.electrical),
    )
  )
    return 'Track power updated';
  const added = after.filter((p) => !before.some((old) => old.id === p.id));
  const removed = before.filter((p) => !after.some((current) => current.id === p.id));
  if (added.length) return `Added: ${added.map((p) => definition(p.trackId).code).join(', ')}`;
  if (removed.length)
    return `Removed: ${removed.map((p) => definition(p.trackId).code).join(', ')}`;
  if (after.some((p) => before.find((old) => old.id === p.id)?.locked !== p.locked))
    return 'Changed piece locks';
  if (
    after.some(
      (p) =>
        JSON.stringify(before.find((old) => old.id === p.id)?.accessories ?? []) !==
        JSON.stringify(p.accessories ?? []),
    )
  )
    return 'Changed track accessories';
  if (JSON.stringify(before) !== JSON.stringify(after))
    return `Moved or transformed ${
      after.filter((p) => {
        const old = before.find((entry) => entry.id === p.id);
        return (
          old &&
          (old.x !== p.x || old.y !== p.y || old.angle !== p.angle || old.flipped !== p.flipped)
        );
      }).length
    } pieces`;
  if (JSON.stringify(previous.inventory) !== JSON.stringify(next.inventory))
    return 'Inventory updated';
  return 'Layout updated';
}

function renderActivity(): void {
  const root = element<HTMLElement>('#activity-list');
  root.replaceChildren(
    ...[...activity].reverse().map((entry) => {
      const item = document.createElement('li');
      item.textContent = `${entry.at.toLocaleTimeString(preferences.language)} / ${entry.message}`;
      return item;
    }),
  );
  translateUi(root, preferences.language);
}

try {
  state = loadState(localStorage, uuid());
} catch (error) {
  recovery = true;
  status(
    `Could not read saved data: ${error instanceof Error ? error.message : String(error)} Export the original backup or import a valid one. Editing is locked to protect your data.`,
    true,
  );
}
try {
  preferences = loadPreferences(localStorage);
} catch (error) {
  status(error instanceof Error ? error.message : String(error), true);
}
try {
  pageSettings = loadPageSettings(localStorage);
  lastPageSettings = JSON.stringify(pageSettings);
} catch (error) {
  pageSettingsWritable = false;
  pageSettingsError(
    `Could not read page settings: ${error instanceof Error ? error.message : String(error)} Use Reset page settings to recover. Layouts and inventory are unchanged.`,
  );
}
let history = createHistory(state);

function countJoins(pieces: readonly Piece[]): number {
  let count = 0;
  for (const [index, piece] of pieces.entries()) {
    const endpoints = ports(piece);
    for (const other of pieces.slice(index + 1)) {
      const targets = ports(other);
      count += endpoints.filter((endpoint) =>
        targets.some((target) => connected(endpoint, target)),
      ).length;
    }
  }
  return count;
}

function playChangeSound(previous: PlannerState, next: PlannerState): void {
  if (!preferences.sounds || previous.activeLayoutId !== next.activeLayoutId) return;
  const before = activeLayout(previous).pieces;
  const after = activeLayout(next).pieces;
  const difference = countJoins(after) - countJoins(before);
  let sound: 'delete' | 'snap' | 'disconnect' | null = null;
  if (after.length < before.length) sound = 'delete';
  else if (difference > 0) sound = 'snap';
  else if (difference < 0) sound = 'disconnect';
  if (sound)
    void playSound(sound).catch((error: unknown) =>
      status(
        `Sound playback failed: ${error instanceof Error ? error.message : String(error)}`,
        true,
      ),
    );
}

function commit(
  next: PlannerState,
  message?: string,
  replacing = false,
  restored?: History,
): boolean {
  if (recovery && !replacing) {
    status(
      'Editing is locked. Export the original backup, then import a valid backup to recover.',
      true,
    );
    return false;
  }
  try {
    saveState(localStorage, next);
  } catch (error) {
    status(
      `Not saved: ${error instanceof Error ? error.message : String(error)} No changes were applied. Check browser storage permissions/space.`,
      true,
    );
    element<HTMLElement>('#save-state').textContent = 'Save failed';
    translateUi(element<HTMLElement>('#save-state'), preferences.language);
    return false;
  }
  const previous = state;
  const changedLayout = previous.activeLayoutId !== next.activeLayoutId || replacing;
  if (changedLayout) rememberPageSettings();
  const wasRestoring = restoringPageSettings;
  if (changedLayout) restoringPageSettings = true;
  history =
    restored ?? (replacing && recovery ? createHistory(next) : recordHistory(history, next));
  state = next;
  recovery = false;
  element<HTMLElement>('#save-state').textContent = 'Saved on this device';
  const summary = message ?? changeSummary(previous, next);
  addActivity(summary);
  status(message ?? `${summary}. Saved on this device.`);
  playChangeSound(previous, next);
  render();
  if (changedLayout) restoreLayoutView();
  restoringPageSettings = wasRestoring;
  rememberPageSettings();
  return true;
}

function action(operation: () => void): void {
  try {
    operation();
  } catch (error) {
    status(error instanceof Error ? error.message : String(error), true);
  }
}

function button(id: string, callback: () => void): void {
  element<HTMLButtonElement>(id).addEventListener('click', () => action(callback));
}

function selected(): Piece | undefined {
  return activeLayout(state).pieces.find((p) => p.id === selectedId);
}

function selection(): Piece[] {
  return activeLayout(state).pieces.filter((piece) => selectedIds.has(piece.id));
}

function selectOnly(id: string): void {
  selectedId = id;
  selectedIds = new Set(id ? [id] : []);
}

function drawTrack(
  group: SVGGElement,
  piece: Piece,
  ghost = false,
  missing = false,
  missingAccessory = false,
  power: readonly PowerRoute[] = [],
): void {
  const entry = definition(piece.trackId);
  group.style.setProperty('--track-selection-width', `${(38 * entry.gaugeMm) / 16.5}px`);
  group.setAttribute(
    'transform',
    `translate(${piece.x},${piece.y}) rotate(${piece.angle}) scale(1,${piece.flipped ? -1 : 1})`,
  );
  group.setAttribute(
    'class',
    `track${selectedIds.has(piece.id) ? ' selected' : ''}${piece.locked ? ' locked' : ''}${drag?.pieces.some((p) => p.id === piece.id) && !ghost ? ' drag-source' : ''}${ghost ? ' ghost' : ''}${missing ? ' missing-stock' : ''}`,
  );
  const layers = entry.routes.flatMap((route, index) =>
    drawingLayers(missing, piece.locked, entry.gaugeMm).map((layer) => ({
      ...layer,
      d: pathData(route),
      key: `${index}-${layer.name}`,
    })),
  );
  const drawing = select(group);
  drawing
    .selectAll<SVGPathElement, (typeof layers)[number]>('path.track-layer')
    .data(layers, (layer) => layer.key)
    .join('path')
    .attr('d', (layer) => layer.d)
    .attr('class', (layer) => `${layer.name} track-layer`)
    .attr('fill', 'none')
    .attr('stroke', (layer) => layer.stroke)
    .attr('stroke-width', (layer) => layer.width)
    .attr('stroke-dasharray', (layer) => layer.dash);
  drawing
    .selectAll<SVGPathElement, ReturnType<typeof accessoryMarks>[number]>('path.accessory-mark')
    .data(accessoryMarks(piece), (mark) => mark.id)
    .join('path')
    .attr('class', 'accessory-mark')
    .attr('data-accessory', (mark) => mark.id)
    .attr('d', (mark) => mark.d)
    .attr('fill', 'none')
    .attr('stroke', missingAccessory ? '#db843b' : '#167c99')
    .attr('stroke-width', 4)
    .attr('pointer-events', 'none');
  const localPorts = ports({ ...piece, x: 0, y: 0, angle: 0, flipped: false });
  drawing
    .selectAll<SVGCircleElement, (typeof localPorts)[number]>('circle.port')
    .data(localPorts)
    .join('circle')
    .attr('cx', (port) => port.x)
    .attr('cy', (port) => port.y)
    .attr('r', 4)
    .attr('class', 'port');
  drawing
    .selectAll<SVGLineElement, (typeof localPorts)[number]>('line.track-join')
    .data(localPorts)
    .join('line')
    .attr(
      'x1',
      (port) => port.x - ((19 * entry.gaugeMm) / 16.5) * Math.sin((port.angle * Math.PI) / 180),
    )
    .attr(
      'y1',
      (port) => port.y + ((19 * entry.gaugeMm) / 16.5) * Math.cos((port.angle * Math.PI) / 180),
    )
    .attr(
      'x2',
      (port) => port.x + ((19 * entry.gaugeMm) / 16.5) * Math.sin((port.angle * Math.PI) / 180),
    )
    .attr(
      'y2',
      (port) => port.y - ((19 * entry.gaugeMm) / 16.5) * Math.cos((port.angle * Math.PI) / 180),
    )
    .attr('class', 'track-join');
  drawing
    .selectAll<SVGPathElement, PowerRoute>('path.power-route')
    .data(power, (route) => route.route)
    .join('path')
    .attr('class', 'power-route')
    .attr('data-power-status', (route) => route.status)
    .attr('d', (route) => {
      const geometry = entry.routes[route.route];
      if (!geometry) throw new Error('Missing power overlay route.');
      return pathData(geometry);
    })
    .attr('fill', 'none')
    .attr(
      'stroke',
      (route) =>
        ({ powered: '#38c59b', unpowered: '#ef8b46', partial: '#e5bd43', unverified: '#ba82ea' })[
          route.status
        ],
    )
    .attr('stroke-width', 3)
    .attr('stroke-dasharray', (route) => (route.status === 'powered' ? '' : '8 5'))
    .attr('pointer-events', 'none')
    .selectAll<SVGTitleElement, PowerRoute>('title')
    .data((route) => [route])
    .join('title')
    .text((route) => `Power ${entry.code} route ${route.route + 1}: ${route.status}`);
  drawing
    .selectAll<SVGPathElement, Piece>('path.padlock')
    .data(piece.locked ? [piece] : [])
    .join('path')
    .attr('d', 'M9 -10V-15A5 5 0 0 1 19 -15V-10M7 -10H21V2H7Z')
    .attr('class', 'padlock');
}

function miniature(piece: Piece): SVGSVGElement {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  if (definition(piece.trackId).attachment) {
    icon.setAttribute('viewBox', '0 0 40 40');
    icon.setAttribute('aria-hidden', 'true');
    const mark = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    mark.setAttribute('d', 'M12 5V35M28 5V35M12 20H28');
    mark.setAttribute('stroke', '#167c99');
    mark.setAttribute('stroke-width', '4');
    icon.append(mark);
    return icon;
  }
  const points = samples(piece).flat();
  const minX = Math.min(...points.map((p) => p.x)) - 20;
  const minY = Math.min(...points.map((p) => p.y)) - 20;
  const width = Math.max(...points.map((p) => p.x)) - minX + 20;
  const height = Math.max(...points.map((p) => p.y)) - minY + 20;
  icon.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
  icon.setAttribute('aria-hidden', 'true');
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  drawTrack(group, piece);
  icon.append(group);
  return icon;
}

function preview(candidate: Piece | null): void {
  previewGroup(candidate ? [candidate] : []);
}

function previewGroup(candidates: Piece[]): void {
  previewPieces = candidates;
  previewPiece = candidates[0] ?? null;
  const root = element<SVGGElement>('#preview');
  root.replaceChildren();
  if (!candidates.length) return;
  let problem: string | null = null;
  try {
    putPieces(state, candidates);
  } catch (error) {
    problem = error instanceof Error ? error.message : String(error);
  }
  for (const candidate of candidates) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    drawTrack(
      group,
      candidate,
      true,
      activeLayout(state).pieces.some((p) => p.id === candidate.id)
        ? missingPieceIds(state).has(candidate.id)
        : available(state, candidate.trackId) === 0,
    );
    group.classList.toggle('invalid', problem !== null);
    root.append(group);
  }
  if (problem) status(problem, true);
}

function modelPoint(client: Vec): Vec {
  const matrix = element<SVGGElement>('#world').getScreenCTM();
  if (!matrix) throw new Error('The track canvas is not ready. Try again once it is visible.');
  const point = new DOMPoint(client.x, client.y).matrixTransform(matrix.inverse());
  if (![point.x, point.y].every(Number.isFinite)) throw new Error('Invalid canvas transform.');
  return { x: point.x, y: point.y };
}

function overCanvas(client: Vec): boolean {
  const rect = svg.getBoundingClientRect();
  return (
    client.x >= rect.left &&
    client.x <= rect.right &&
    client.y >= rect.top &&
    client.y <= rect.bottom
  );
}

function trackTooltip(client: Vec): void {
  const tooltip = element<HTMLElement>('#track-tooltip');
  const hit = document.elementFromPoint(client.x, client.y);
  const id = hit?.closest<SVGGElement>('[data-piece-id]')?.dataset['pieceId'];
  const hovered = activeLayout(state).pieces.find((p) => p.id === id);
  tooltip.hidden = true;
  if (!hovered) return;
  const entry = definition(hovered.trackId);
  tooltip.textContent = `${entry.code} / ${translate(entry.name, preferences.language)}\n${translate(trackSize(entry), preferences.language)}${missingPieceIds(state).has(hovered.id) ? `\n${translate('To buy: not in your inventory', preferences.language)}` : ''}${entry.geometryNote ? `\n${translate('Approximate geometry. Verify actual connector positions physically.', preferences.language)}` : ''}${hovered.locked ? `\n${translate('Locked', preferences.language)}` : ''}${hovered.accessories?.length ? `\n${hovered.accessories.map((id) => definition(id).code).join(', ')} / ${translate('Schematic accessory; verify road and gate clearance physically.', preferences.language)}` : ''}`;
  tooltip.hidden = false;
  tooltip.style.left = `${Math.max(8, Math.min(client.x + 14, window.innerWidth - tooltip.offsetWidth - 8))}px`;
  tooltip.style.top = `${Math.max(8, Math.min(client.y + 14, window.innerHeight - tooltip.offsetHeight - 8))}px`;
}

function clearPaletteDrag(): void {
  const current = paletteDrag;
  paletteDrag = null;
  if (current?.source.hasPointerCapture(current.pointerId))
    current.source.releasePointerCapture(current.pointerId);
  element<HTMLElement>('#palette-ghost').hidden = true;
  element<HTMLElement>('#track-tooltip').hidden = true;
  preview(null);
}

function bindPaletteDrag(pick: HTMLButtonElement, trackId: string): void {
  let ignoreClick = false;
  pick.addEventListener('click', () => {
    if (ignoreClick) {
      ignoreClick = false;
      return;
    }
    boardEditor.leave();
    roomEditor.leave();
    toolId = trackId;
    panMode = false;
    selectOnly('');
    preview(null);
    render();
  });
  pick.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    boardEditor.leave();
    roomEditor.leave();
    panMode = false;
    paletteDrag = {
      pointerId: event.pointerId,
      source: pick,
      piece: { id: uuid(), trackId, x: 0, y: 0, angle: toolAngle, flipped: toolFlipped },
      start: { x: event.clientX, y: event.clientY },
      moved: false,
    };
    pick.setPointerCapture(event.pointerId);
    element<HTMLElement>('#palette-ghost').replaceChildren(
      miniature({
        ...paletteDrag.piece,
        angle: 0,
      }),
    );
  });
  pick.addEventListener('pointermove', (event) => {
    if (!paletteDrag || paletteDrag.pointerId !== event.pointerId) return;
    const client = { x: event.clientX, y: event.clientY };
    if (
      !paletteDrag.moved &&
      Math.hypot(client.x - paletteDrag.start.x, client.y - paletteDrag.start.y) < 5
    )
      return;
    paletteDrag.moved = true;
    ignoreClick = true;
    const ghost = element<HTMLElement>('#palette-ghost');
    ghost.style.left = `${client.x + 12}px`;
    ghost.style.top = `${client.y - 25}px`;
    ghost.hidden = overCanvas(client);
    if (overCanvas(client)) {
      preview(snapped({ ...paletteDrag.piece, ...modelPoint(client) }));
      trackTooltip(client);
    } else {
      preview(null);
      element<HTMLElement>('#track-tooltip').hidden = true;
    }
  });
  pick.addEventListener('pointerup', (event) => {
    if (!paletteDrag || paletteDrag.pointerId !== event.pointerId) return;
    const current = paletteDrag;
    const client = { x: event.clientX, y: event.clientY };
    clearPaletteDrag();
    if (current.moved && overCanvas(client)) {
      toolId = '';
      place(snapped({ ...current.piece, ...modelPoint(client) }));
    }
  });
  for (const eventName of ['pointercancel', 'lostpointercapture']) {
    pick.addEventListener(eventName, () => {
      if (paletteDrag?.source === pick) clearPaletteDrag();
    });
  }
}

function snapped(piece: Piece): Piece {
  if (!element<HTMLInputElement>('#snap').checked) return piece;
  return (
    snapPiece(
      piece,
      activeLayout(state).pieces.filter((p) => p.id !== piece.id),
      Math.min(45, 22 / transform.k),
    )?.piece ?? piece
  );
}

function render(): void {
  element<HTMLElement>('#track-tooltip').hidden = true;
  const focused = document.activeElement;
  const focusedLabel = focused?.getAttribute('aria-label');
  const layout = activeLayout(state);
  if (!assignedRoom(state) && roomEditor.editing) roomEditor.leave();
  const panButton = element<HTMLButtonElement>('#cancel-tool');
  panButton.replaceChildren(
    document.createTextNode(panMode ? 'Switch to Select' : 'Switch to Pan'),
  );
  panButton.setAttribute('aria-pressed', String(panMode));
  svg.classList.toggle('pan-mode', panMode);
  element<HTMLButtonElement>('#fit').disabled = layout.pieces.length === 0;
  element<HTMLButtonElement>('#fit-boards').disabled = layout.boards.length === 0;
  element<HTMLButtonElement>('#fit-room').disabled = !assignedRoom(state)?.shapes.length;
  catalogBrowser.render();
  if (!selectedIds.has(selectedId)) selectOnly(selectedId);
  selectedIds = new Set([...selectedIds].filter((id) => layout.pieces.some((p) => p.id === id)));
  if (!selectedIds.has(selectedId)) selectedId = [...selectedIds][0] ?? '';
  const power = analyzePower(layout);
  powerEditor.render(power);
  const missing = missingPieceIds(state);
  const missingAccessories = missingPieceIds(state, 'hornby-oo-r645');
  const layoutSelect = element<HTMLSelectElement>('#layouts');
  layoutSelect.replaceChildren(...state.layouts.map((l) => new Option(l.name, l.id)));
  layoutSelect.value = state.activeLayoutId;
  const room = assignedRoom(state);
  const roomSelect = element<HTMLSelectElement>('#layout-room');
  roomSelect.replaceChildren(
    new Option(translate('No room', preferences.language), ''),
    ...state.rooms.map((room) => new Option(room.name, room.id)),
  );
  roomSelect.setAttribute('data-user-text', '');
  roomSelect.value = room?.id ?? '';
  element<HTMLElement>('#room-controls').hidden = !room;
  element<HTMLButtonElement>('#rename-room').disabled = !room;
  element<HTMLButtonElement>('#delete-room').disabled = !room;
  const query = element<HTMLInputElement>('#search').value.toLowerCase();
  const gaugeInput = element<HTMLSelectElement>('#catalog-gauge');
  const gauge = gaugeGroups.find((group) => group.id === gaugeInput.value);
  if (!gauge) throw new Error('Unknown catalog gauge.');
  const profileSelect = element<HTMLSelectElement>('#catalog-profile');
  const oldProfile = profileSelect.value;
  const brands = catalogBrands(gauge.id);
  profileSelect.replaceChildren(
    new Option(translate(`All ${gauge.label} brands`, preferences.language), ''),
    ...brands.map((brand) => new Option(brand, brand)),
  );
  profileSelect.value = brands.includes(oldProfile) ? oldProfile : '';
  element<HTMLElement>('#catalog-gauge-label').replaceChildren(
    document.createTextNode(`${gauge.label} / ${gauge.gaugeMm} mm`),
  );
  const filtered = filterCatalog({ gauge: gauge.id, brand: profileSelect.value, query });
  element<HTMLElement>('#catalog-empty').hidden = filtered.length > 0;
  const catalogRoot = element<HTMLElement>('#catalog');
  catalogRoot.replaceChildren();
  for (const category of catalogCategories) {
    const entries = filtered.filter((entry) => entry.category === category.id);
    if (!entries.length) continue;
    const section = document.createElement('details');
    section.className = 'catalog-group';
    section.open = !!query || openCategories.has(category.id);
    const heading = document.createElement('summary');
    heading.textContent = `${category.label} (${entries.length})`;
    section.append(heading);
    section.addEventListener('toggle', () => {
      if (query || !section.isConnected) return;
      if (section.open) openCategories.add(category.id);
      else openCategories.delete(category.id);
      rememberPageSettings();
    });
    catalogRoot.append(section);
    for (const entry of entries) {
      const row = document.createElement('div');
      row.className = `catalog-row${entry.id === toolId ? ' active-tool' : ''}`;
      const pick = document.createElement('button');
      pick.className = 'track-choice';
      pick.disabled = recovery;
      pick.setAttribute(
        'aria-label',
        `${entry.attachment ? 'Attach' : 'Place'} ${entry.code} ${entry.name}`,
      );
      pick.title = `${entry.code}: ${translate(entry.name, preferences.language)}. ${translate(trackSize(entry), preferences.language)}${entry.geometryNote ? ` ${translate('Approximate geometry. Verify actual connector positions physically.', preferences.language)}` : ''}`;
      const icon = miniature({
        id: 'catalog',
        trackId: entry.id,
        x: 0,
        y: 0,
        angle: 0,
        flipped: false,
      });
      const text = document.createElement('span');
      const code = document.createElement('strong');
      code.textContent = entry.code;
      const label = document.createElement('span');
      label.textContent = `${entry.brand} / ${entry.name}`;
      text.append(code, label);
      pick.append(icon, text);
      if (entry.attachment)
        pick.addEventListener('click', () =>
          action(() => {
            if (selectedIds.size !== 1)
              throw new Error(
                entry.electrical?.accessory
                  ? 'Select one track piece.'
                  : 'Select one compatible Hornby straight at least 168 mm long.',
              );
            const host = selected();
            if (!host) throw new Error('Select one track piece.');
            const next = entry.electrical?.accessory
              ? setElectrical(state, selectedId, attachPowerAccessory(host, entry.id))
              : setAccessory(state, selectedId, entry.id, true);
            if (commit(next)) {
              toolId = '';
              preview(null);
            }
            render();
          }),
        );
      else bindPaletteDrag(pick, entry.id);
      const quantity = document.createElement('input');
      quantity.type = 'number';
      quantity.inputMode = 'numeric';
      quantity.min = '0';
      quantity.max = '9999';
      quantity.step = '1';
      quantity.value = String(state.inventory[entry.id] ?? 0);
      quantity.setAttribute('aria-label', `Owned ${entry.code}`);
      quantity.addEventListener('change', () =>
        action(() => {
          if (!quantity.value.trim()) throw new Error('Enter an inventory quantity.');
          const previous = state.inventory[entry.id] ?? 0;
          if (!commit(setInventory(state, entry.id, quantity.valueAsNumber)))
            quantity.value = String(previous);
        }),
      );
      const count = document.createElement('span');
      count.textContent = String(available(state, entry.id));
      count.setAttribute('aria-label', `Remaining ${entry.code}`);
      row.append(pick, quantity, count);
      section.append(row);
    }
  }
  const pieceSelect = element<HTMLSelectElement>('#piece-select');
  pieceSelect.replaceChildren(
    new Option('None', ''),
    ...layout.pieces.map(
      (p, i) =>
        new Option(
          `${p.locked ? 'Locked ' : ''}${i + 1}. ${definition(p.trackId).code}${missing.has(p.id) ? ' / to buy' : ''}`,
          p.id,
        ),
    ),
  );
  pieceSelect.value = selectedId;
  const piece = selected();
  const chosen = selection();
  element<HTMLElement>('#piece-controls').hidden = !piece;
  const locked = chosen.some((p) => p.locked);
  element<HTMLElement>('#selection-count').textContent =
    `${chosen.length} pieces selected${locked ? ' / includes locked pieces' : ''}`;
  element<HTMLButtonElement>('#lock-pieces').disabled =
    !chosen.length || chosen.every((p) => p.locked);
  element<HTMLButtonElement>('#unlock-pieces').disabled = !locked;
  element<HTMLElement>('#piece-description').textContent = piece
    ? `${translate(definition(piece.trackId).name, preferences.language)}: ${translate(trackSize(definition(piece.trackId)), preferences.language)}. ${definition(piece.trackId).geometryNote ? translate('Approximate geometry. Verify actual connector positions physically.', preferences.language) : ''}`
    : 'Select a piece to see its type and dimensions.';
  for (const control of element<HTMLElement>('#piece-controls').querySelectorAll<
    HTMLInputElement | HTMLButtonElement
  >('input,button'))
    control.disabled = !piece || locked;
  element<HTMLButtonElement>('#remove-accessory').hidden =
    chosen.length !== 1 || !piece?.accessories?.length;
  if (piece?.accessories?.length)
    element<HTMLElement>('#piece-description').textContent +=
      ` R645 / ${translate('Schematic accessory; verify road and gate clearance physically.', preferences.language)}`;
  element<HTMLInputElement>('#piece-x').value = piece
    ? String(Math.round(piece.x * 100) / 100)
    : '';
  element<HTMLInputElement>('#piece-y').value = piece
    ? String(Math.round(piece.y * 100) / 100)
    : '';
  element<HTMLInputElement>('#piece-angle').value = piece
    ? String(Math.round(normalize(piece.angle) * 100) / 100)
    : '';
  element<HTMLButtonElement>('#flip').disabled =
    !piece ||
    locked ||
    chosen.length !== 1 ||
    definition(piece.trackId).routes.length !== 1 ||
    definition(piece.trackId).routes[0]?.kind !== 'arc';
  element<HTMLElement>('#tool-label').textContent = toolId
    ? `Placing ${definition(toolId).code} / ${toolAngle} degrees${toolFlipped ? ' / reversed' : ''}`
    : 'Select a track piece to begin';
  const shoppingRoot = element<HTMLElement>('#shopping-list');
  const shopping = shoppingList(state);
  shoppingRoot.replaceChildren();
  if (!shopping.length) shoppingRoot.textContent = 'You own all the track needed for this idea.';
  for (const item of shopping) {
    const entry = definition(item.trackId);
    const row = document.createElement('div');
    row.className = 'shopping-row';
    row.textContent = `${item.quantity} x ${entry.code} ${entry.name}`;
    shoppingRoot.append(row);
  }
  select(element<SVGGElement>('#tracks'))
    .selectAll<SVGGElement, Piece>('g.track')
    .data(layout.pieces, (piece) => piece.id)
    .join('g')
    .each((piece, index, groups) => {
      const group = groups[index];
      if (!group) throw new Error('Missing SVG track element.');
      group.dataset['pieceId'] = piece.id;
      group.setAttribute('role', 'button');
      group.setAttribute('tabindex', shapeEditor().editing ? '-1' : '0');
      group.setAttribute(
        'aria-label',
        `${piece.locked ? 'Locked ' : ''}Select ${definition(piece.trackId).code} at ${Math.round(piece.x)}, ${Math.round(piece.y)} mm${missing.has(piece.id) ? ', to buy' : ''}`,
      );
      drawTrack(
        group,
        piece,
        false,
        missing.has(piece.id),
        missingAccessories.has(piece.id),
        powerEditor.overlay ? power.routes.filter((route) => route.pieceId === piece.id) : [],
      );
    });
  boardEditor.render();
  roomEditor.render();
  const issues = [...layoutProblems(layout), ...roomProblems(state)];
  if (layout.pieces.some((p) => p.accessories?.length))
    issues.push('Schematic accessory; verify road and gate clearance physically.');
  const approximateCodes = [
    ...new Set(
      layout.pieces
        .filter((p) => definition(p.trackId).geometryNote)
        .map((p) => definition(p.trackId).code),
    ),
  ];
  if (approximateCodes.length)
    issues.push(
      `Approximate geometry: ${approximateCodes.join(', ')}. Verify physically before buying or building.`,
    );
  if (layout.pieces.some((p) => definition(p.trackId).brand !== 'Hornby'))
    issues.push(
      'This OO project uses a conservative Hornby 67 mm clearance target, not a universal manufacturer standard. Mixed-brand planning is geometric only; rail code and joiner fit need physical verification.',
    );
  if (layout.pieces.some((p) => definition(p.trackId).centresMm === null))
    issues.push(
      'Starter gauge catalog: track widths are schematic and parallel clearance is not verified. Check actual track and rolling-stock envelopes physically.',
    );
  element<HTMLElement>('#checks').replaceChildren(
    ...(issues.length ? issues : ['No definite placement violations found.']).map((issue) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = translate(issue, preferences.language);
      return paragraph;
    }),
  );
  element<HTMLElement>('#checks').className = issues.length ? 'check-warning' : 'check-ok';
  element<HTMLElement>('#piece-count').textContent = `${layout.pieces.length} pieces`;
  element<HTMLElement>('#empty-hint').hidden =
    layout.pieces.length > 0 || layout.boards.length > 0 || !!room?.shapes.length;
  element<HTMLButtonElement>('#delete-layout').disabled = state.layouts.length <= 1;
  element<HTMLButtonElement>('#tool-rotate').disabled = !toolId;
  element<HTMLButtonElement>('#tool-flip').disabled =
    !toolId ||
    definition(toolId).routes.length !== 1 ||
    definition(toolId).routes[0]?.kind !== 'arc';
  element<HTMLButtonElement>('#undo').disabled = recovery || history.past.length === 0;
  element<HTMLButtonElement>('#redo').disabled = recovery || history.future.length === 0;
  element<HTMLSelectElement>('#language').value = preferences.language;
  element<HTMLInputElement>('#sounds').checked = preferences.sounds;
  element<HTMLInputElement>('#confirm-delete').checked = preferences.confirmDelete;
  element<HTMLElement>('#history-count').textContent =
    `${history.past.length} undo steps / ${history.future.length} redo steps`;
  element<HTMLElement>('#undo-history').replaceChildren(
    ...history.past
      .map((previous, i) => {
        const next = history.past[i + 1] ?? history.current;
        const item = document.createElement('li');
        item.textContent = changeSummary(previous, next);
        return item;
      })
      .reverse(),
  );
  renderActivity();
  document.documentElement.lang = preferences.language;
  translateUi(element<HTMLElement>('#app'), preferences.language);
  rememberPageSettings();
  if (focusedLabel && focused && !focused.isConnected) {
    [...document.querySelectorAll<HTMLElement>('[aria-label]')]
      .find((node) => node.getAttribute('aria-label') === focusedLabel)
      ?.focus();
  }
}

const zoomer = zoom<SVGSVGElement, unknown>()
  .scaleExtent([0.00001, 4])
  .filter((event: Event) => {
    if (event.type === 'wheel') return !drag && !marquee && !shapeEditor().busy;
    if (event.type.startsWith('touch')) {
      const target = event.target;
      return (
        touches.size > 1 ||
        (panMode && !drag && !marquee && !shapeEditor().busy) ||
        (!toolId &&
          !drag &&
          !marquee &&
          !shapeEditor().busy &&
          !shapeEditor().placing &&
          (!shapeEditor().editing ||
            !(target instanceof Element) ||
            !target.closest('[data-board-id]')) &&
          (!(target instanceof Element) || !target.closest('.track')))
      );
    }
    return (
      (panMode || spaceDown) &&
      !drag &&
      !marquee &&
      !shapeEditor().busy &&
      (!(event instanceof MouseEvent) || event.button === 0)
    );
  })
  .on('zoom', (event: { transform: ZoomTransform }) => {
    transform = event.transform;
    element<SVGGElement>('#world').setAttribute('transform', transform.toString());
    element<HTMLOutputElement>('#zoom-level').textContent = `${Math.round(transform.k * 100)}%`;
    boardEditor.render();
    roomEditor.render();
  })
  .on('end', () => rememberPageSettings());
svgSelection.call(zoomer).on('dblclick.zoom', null);
svgSelection.call(zoomer.transform, zoomIdentity.translate(90, 110).scale(0.6));

function place(candidate: Piece): void {
  action(() => {
    if (commit(putPiece(state, candidate))) {
      selectOnly(candidate.id);
      preview(null);
      render();
    } else preview(null);
  });
}

function beginMultiTouch(event: PointerEvent): boolean {
  if (event.pointerType !== 'touch') return false;
  touches.add(event.pointerId);
  if (touches.size < 2) return false;
  multiTouch = true;
  cancelGesture();
  suppressClick = true;
  render();
  return true;
}

function toggleSelection(id: string): void {
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  selectedId = [...selectedIds][0] ?? '';
}

svg.addEventListener('pointerdown', (event) => {
  suppressClick = false;
  if (beginMultiTouch(event)) return;
  if (panMode || spaceDown) return;
  if (shapeEditor().editing) {
    if (!spaceDown) shapeEditor().pointerDown(event);
    return;
  }
  if (drag || marquee) return;
  if (toolId || spaceDown || event.button !== 0) return;
  const target =
    event.target instanceof Element ? event.target.closest<SVGGElement>('[data-piece-id]') : null;
  const id = target?.dataset['pieceId'];
  const piece = activeLayout(state).pieces.find((p) => p.id === id);
  event.stopPropagation();
  if (!piece) {
    if (event.pointerType === 'touch') return;
    const start = modelPoint({ x: event.clientX, y: event.clientY });
    marquee = {
      pointerId: event.pointerId,
      start,
      end: start,
      additive: event.ctrlKey || event.metaKey,
      moved: false,
    };
    svg.setPointerCapture(event.pointerId);
    return;
  }
  if (event.ctrlKey || event.metaKey) {
    suppressClick = true;
    toggleSelection(piece.id);
    selectedId = selectedIds.has(piece.id) ? piece.id : ([...selectedIds][0] ?? '');
    render();
    return;
  }
  if (!selectedIds.has(piece.id)) selectOnly(piece.id);
  selectedId = piece.id;
  toolId = '';
  if (selection().some((p) => p.locked)) {
    render();
    status('Unlock the selected pieces before moving or deleting them.', true);
    return;
  }
  drag = {
    pointerId: event.pointerId,
    pieces: selection(),
    start: modelPoint({ x: event.clientX, y: event.clientY }),
    moved: false,
  };
  svg.setPointerCapture(event.pointerId);
  render();
});
function snappedGroup(candidates: Piece[]): Piece[] {
  if (candidates.length === 1 && candidates[0]) return [snapped(candidates[0])];
  if (!element<HTMLInputElement>('#snap').checked) return candidates;
  const ids = new Set(candidates.map((piece) => piece.id));
  return snapGroup(
    candidates,
    activeLayout(state).pieces.filter((piece) => !ids.has(piece.id)),
    Math.min(45, 22 / transform.k),
  );
}

function previewMarquee(position: Vec): void {
  if (!marquee) return;
  marquee.end = position;
  if (Math.hypot(position.x - marquee.start.x, position.y - marquee.start.y) * transform.k >= 3)
    marquee.moved = true;
  const box = element<SVGRectElement>('#marquee');
  box.removeAttribute('hidden');
  box.setAttribute('x', String(Math.min(position.x, marquee.start.x)));
  box.setAttribute('y', String(Math.min(position.y, marquee.start.y)));
  box.setAttribute('width', String(Math.abs(position.x - marquee.start.x)));
  box.setAttribute('height', String(Math.abs(position.y - marquee.start.y)));
}

svg.addEventListener('pointermove', (event) => {
  if (multiTouch || spaceDown || panMode) return;
  if (shapeEditor().editing) {
    shapeEditor().pointerMove(event);
    return;
  }
  trackTooltip({ x: event.clientX, y: event.clientY });
  const position = modelPoint({ x: event.clientX, y: event.clientY });
  if (event.pointerId === marquee?.pointerId) {
    previewMarquee(position);
  } else if (drag?.pointerId === event.pointerId) {
    const dx = position.x - drag.start.x;
    const dy = position.y - drag.start.y;
    if (Math.hypot(dx, dy) * transform.k < 3 && !drag.moved) return;
    drag.moved = true;
    const candidates = drag.pieces.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));
    previewGroup(snappedGroup(candidates));
  } else if (toolId) {
    preview(
      snapped({
        id: 'preview',
        trackId: toolId,
        ...position,
        angle: toolAngle,
        flipped: toolFlipped,
      }),
    );
  }
});
function finishMarquee(pointerId: number): void {
  if (marquee?.pointerId !== pointerId) return;
  const current = marquee;
  marquee = null;
  element<SVGRectElement>('#marquee').setAttribute('hidden', '');
  if (svg.hasPointerCapture(pointerId)) svg.releasePointerCapture(pointerId);
  if (!current.additive) selectOnly('');
  if (current.moved) {
    const minX = Math.min(current.start.x, current.end.x);
    const maxX = Math.max(current.start.x, current.end.x);
    const minY = Math.min(current.start.y, current.end.y);
    const maxY = Math.max(current.start.y, current.end.y);
    for (const p of activeLayout(state).pieces) {
      if (
        samples(p)
          .flat()
          .every(
            (point) =>
              point.x - trackWidth(definition(p.trackId)) / 2 >= minX &&
              point.x + trackWidth(definition(p.trackId)) / 2 <= maxX &&
              point.y - trackWidth(definition(p.trackId)) / 2 >= minY &&
              point.y + trackWidth(definition(p.trackId)) / 2 <= maxY,
          )
      )
        selectedIds.add(p.id);
    }
    selectedId = [...selectedIds][0] ?? '';
  }
  suppressClick = current.moved || current.additive;
  render();
}

svg.addEventListener('pointerup', (event) => {
  touches.delete(event.pointerId);
  if (!touches.size) multiTouch = false;
  if (shapeEditor().editing) {
    shapeEditor().pointerUp(event);
    return;
  }
  if (marquee?.pointerId === event.pointerId) {
    finishMarquee(event.pointerId);
    return;
  }
  if (!drag || event.pointerId !== drag.pointerId) return;
  const moved = drag.moved;
  drag = null;
  if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
  if (moved && previewPieces.length) action(() => commit(putPieces(state, previewPieces)));
  preview(null);
  render();
  // Capture can retarget a stationary track click to the blank SVG.
  suppressClick = true;
});
svg.addEventListener('pointercancel', (event) => {
  touches.delete(event.pointerId);
  if (!touches.size) multiTouch = false;
  cancelGesture();
  render();
});
svg.addEventListener('lostpointercapture', () => {
  if (!drag && !marquee && !shapeEditor().busy) return;
  cancelGesture();
  render();
});
svg.addEventListener('pointerleave', () => {
  element<HTMLElement>('#track-tooltip').hidden = true;
  if (shapeEditor().editing && !shapeEditor().busy) shapeEditor().cancel();
  if (!drag && !marquee) preview(null);
});
svg.addEventListener('click', (event) => {
  if (panMode || spaceDown) return;
  if (suppressClick) {
    suppressClick = false;
    return;
  }
  if (shapeEditor().editing) {
    shapeEditor().click(event);
    return;
  }
  if (!toolId && event.target instanceof Element && event.target.closest('.track')) return;
  if (!toolId) {
    selectOnly('');
    render();
    return;
  }
  place(
    snapped({
      id: uuid(),
      trackId: toolId,
      ...modelPoint({ x: event.clientX, y: event.clientY }),
      angle: toolAngle,
      flipped: toolFlipped,
    }),
  );
});

function transformSelected(change: (p: Piece) => Piece): void {
  const piece = selected();
  if (!piece) throw new Error('Select a placed piece first.');
  const next = change(piece);
  const delta = normalize(next.angle - piece.angle);
  const radians = (delta * Math.PI) / 180;
  commit(
    transformPieces(state, [...selectedIds], (p) => {
      const dx = p.x - piece.x;
      const dy = p.y - piece.y;
      return {
        ...p,
        x: next.x + dx * Math.cos(radians) - dy * Math.sin(radians),
        y: next.y + dx * Math.sin(radians) + dy * Math.cos(radians),
        angle: normalize(p.angle + delta),
        flipped: p.id === piece.id ? next.flipped : p.flipped,
      };
    }),
  );
}

function cancelGesture(): void {
  boardEditor.cancel();
  roomEditor.cancel();
  const pointerId = drag?.pointerId ?? marquee?.pointerId;
  drag = null;
  marquee = null;
  if (pointerId !== undefined && svg.hasPointerCapture(pointerId))
    svg.releasePointerCapture(pointerId);
  element<SVGRectElement>('#marquee').setAttribute('hidden', '');
  preview(null);
}

function handleSelectionKey(event: KeyboardEvent): void {
  const id =
    event.target instanceof Element
      ? (event.target.closest<SVGGElement>('[data-piece-id]')?.dataset['pieceId'] ?? '')
      : '';
  if (event.ctrlKey || event.metaKey) toggleSelection(id);
  else selectOnly(id);
  toolId = '';
  render();
}

function handlePieceKey(event: KeyboardEvent): void {
  if (toolId && event.key.toLowerCase() === 'r') {
    toolAngle = normalize(toolAngle + 22.5);
    render();
    return;
  }
  if (!selected()) return;
  const step = event.shiftKey ? 1 : 5;
  const moves: Record<string, Vec> = {
    ArrowLeft: { x: -step, y: 0 },
    ArrowRight: { x: step, y: 0 },
    ArrowUp: { x: 0, y: -step },
    ArrowDown: { x: 0, y: step },
  };
  const move = moves[event.key];
  if (move) {
    event.preventDefault();
    action(() =>
      transformSelected((piece) => ({ ...piece, x: piece.x + move.x, y: piece.y + move.y })),
    );
  }
  if (event.key.toLowerCase() === 'r')
    action(() =>
      transformSelected((piece) => ({ ...piece, angle: normalize(piece.angle + 22.5) })),
    );
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault();
    action(removePiece);
  }
}

document.addEventListener('keydown', (event) => {
  if (location.hash === '#catalog') return;
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLSelectElement ||
    event.target instanceof HTMLTextAreaElement ||
    document.querySelector('dialog[open]')
  )
    return;
  if (event.key === 'Escape') {
    clearPaletteDrag();
    cancelGesture();
    toolId = '';
    if (shapeEditor().editing) shapeEditor().key(event);
    preview(null);
    render();
    return;
  }
  if (
    event.target instanceof Element &&
    event.target.closest('[data-piece-id]') &&
    event.key === 'Enter'
  ) {
    event.preventDefault();
    handleSelectionKey(event);
    return;
  }
  if (event.code === 'Space') {
    if (drag || marquee) {
      event.preventDefault();
      return;
    }
    spaceDown = true;
    event.preventDefault();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
    if (shapeEditor().editing) return;
    event.preventDefault();
    selectedIds = new Set(activeLayout(state).pieces.map((p) => p.id));
    selectedId = [...selectedIds][0] ?? '';
    toolId = '';
    render();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && ['z', 'y'].includes(event.key.toLowerCase())) {
    event.preventDefault();
    action(() => restoreHistory(event.key.toLowerCase() === 'y' || event.shiftKey));
    return;
  }
  if (shapeEditor().editing) shapeEditor().key(event);
  else handlePieceKey(event);
});
document.addEventListener('keyup', (event) => {
  if (event.code === 'Space') spaceDown = false;
});
window.addEventListener('blur', () => {
  touches.clear();
  multiTouch = false;
  spaceDown = false;
  clearPaletteDrag();
  cancelGesture();
  render();
});

function removePiece(): void {
  const ids = [...selectedIds];
  removePieces(state, ids);
  const layoutId = state.activeLayoutId;
  const revision = state;
  const remove = () => {
    if (state !== revision || state.activeLayoutId !== layoutId)
      throw new Error('The layout changed. Select the pieces again before deleting.');
    if (element<HTMLInputElement>('#skip-delete').checked && preferences.confirmDelete)
      updatePreferences({ ...preferences, confirmDelete: false });
    if (commit(removePieces(state, ids))) selectOnly('');
    render();
  };
  if (preferences.confirmDelete)
    confirm(
      'Remove selected pieces?',
      `Remove ${ids.length} selected pieces? Your inventory quantities are unchanged. Undo is available during this session.`,
      remove,
      true,
    );
  else remove();
}

function pageSettingsError(message: string): void {
  const target = element<HTMLElement>('#page-settings-status');
  target.textContent = message;
  target.hidden = false;
  translateUi(target, preferences.language);
}

function rememberPageSettings(): void {
  if (!pageSettingsReady || restoringPageSettings) return;
  const planner = !element<HTMLElement>('#planner-page').hidden;
  const scroll = { ...pageSettings.scroll };
  if (planner) {
    scroll.inventory = element<HTMLElement>('.inventory-panel').scrollTop;
    scroll.details = element<HTMLElement>('.details-panel').scrollTop;
    scroll.planner = window.scrollY;
  } else {
    scroll.table = element<HTMLElement>('.catalog-table-scroll').scrollLeft;
    scroll.catalog = window.scrollY;
  }
  const views = recovery
    ? Object.entries(pageSettings.viewports)
    : state.layouts.flatMap((layout) => {
        const view =
          planner && layout.id === state.activeLayoutId
            ? { x: transform.x, y: transform.y, k: transform.k }
            : Object.hasOwn(pageSettings.viewports, layout.id)
              ? pageSettings.viewports[layout.id]
              : undefined;
        return view ? [[layout.id, view] as const] : [];
      });
  const next: PageSettings = {
    version: 1,
    page: planner ? 'planner' : 'catalog',
    catalog: {
      gauge: element<HTMLSelectElement>('#catalog-gauge').value,
      brand: element<HTMLSelectElement>('#catalog-profile').value,
      query: element<HTMLInputElement>('#search').value,
    },
    browser: catalogBrowser.filters,
    openCategories: [...openCategories],
    openPanels: pagePanels.filter((id) => element<HTMLDetailsElement>(`#${id}`).open),
    snap: element<HTMLInputElement>('#snap').checked,
    powerOverlay: element<HTMLInputElement>('#power-overlay').checked,
    mode: panMode ? 'pan' : roomEditor.editing ? 'room' : boardEditor.editing ? 'boards' : 'select',
    viewports: Object.fromEntries(views),
    scroll,
  };
  const text = JSON.stringify(next);
  pageSettings = next;
  if (!pageSettingsWritable || text === lastPageSettings) return;
  try {
    savePageSettings(localStorage, next);
    lastPageSettings = text;
  } catch (error) {
    pageSettingsWritable = false;
    pageSettingsError(
      `Could not save page settings: ${error instanceof Error ? error.message : String(error)} Changes remain in this tab only. Use Reset page settings to retry. Layouts and inventory are unchanged.`,
    );
  }
}

function restorePageControls(): void {
  restoringPageSettings = true;
  clearPaletteDrag();
  cancelGesture();
  boardEditor.leave();
  roomEditor.leave();
  toolId = '';
  selectOnly('');
  panMode = pageSettings.mode === 'pan';
  element<HTMLInputElement>('#edit-boards').checked = pageSettings.mode === 'boards';
  element<HTMLInputElement>('#room-edit-boards').checked =
    pageSettings.mode === 'room' && !!assignedRoom(state);
  element<HTMLInputElement>('#snap').checked = pageSettings.snap;
  element<HTMLInputElement>('#power-overlay').checked = pageSettings.powerOverlay;
  element<HTMLSelectElement>('#catalog-gauge').value = pageSettings.catalog.gauge;
  element<HTMLInputElement>('#search').value = pageSettings.catalog.query;
  openCategories.clear();
  for (const id of pageSettings.openCategories) openCategories.add(id);
  catalogBrowser.restore(pageSettings.browser);
  render();
  element<HTMLSelectElement>('#catalog-profile').value = catalogBrands(
    pageSettings.catalog.gauge,
  ).includes(pageSettings.catalog.brand)
    ? pageSettings.catalog.brand
    : '';
  for (const id of pagePanels)
    element<HTMLDetailsElement>(`#${id}`).open = pageSettings.openPanels.includes(id);
  render();
}

function restoreLayoutView(): void {
  if (element<HTMLElement>('#planner-page').hidden) return;
  const view = Object.hasOwn(pageSettings.viewports, state.activeLayoutId)
    ? pageSettings.viewports[state.activeLayoutId]
    : undefined;
  if (view)
    svgSelection.call(zoomer.transform, zoomIdentity.translate(view.x, view.y).scale(view.k));
  else fit();
}

button('#reset-page-settings', () => {
  try {
    localStorage.removeItem(pageSettingsKey);
  } catch (error) {
    pageSettingsError(
      `Could not reset page settings: ${error instanceof Error ? error.message : String(error)} Layouts and inventory are unchanged.`,
    );
    return;
  }
  pageSettings = defaultPageSettings();
  pageSettingsWritable = true;
  lastPageSettings = '';
  element<HTMLElement>('#page-settings-status').hidden = true;
  restorePageControls();
  window.history.replaceState(null, '', '#planner');
  showPage();
  status('Page settings reset. Layouts and inventory are unchanged.');
});

function updatePreferences(next: Preferences): void {
  try {
    savePreferences(localStorage, next);
    preferences = next;
  } finally {
    render();
  }
}

function restoreHistory(redo: boolean): void {
  clearPaletteDrag();
  cancelGesture();
  const next = redo ? redoHistory(history) : undoHistory(history);
  if (commit(next.current, redo ? 'Redid last change.' : 'Undid last change.', false, next)) {
    selectOnly('');
    toolId = '';
    render();
  }
}

button('#undo', () => restoreHistory(false));
button('#redo', () => restoreHistory(true));
button('#select-all', () => {
  selectedIds = new Set(activeLayout(state).pieces.map((p) => p.id));
  selectedId = [...selectedIds][0] ?? '';
  toolId = '';
  render();
});
button('#lock-pieces', () => commit(setPieceLocks(state, [...selectedIds], true)));
button('#unlock-pieces', () => commit(setPieceLocks(state, [...selectedIds], false)));
button('#context-lock', () => {
  element<HTMLDialogElement>('#piece-menu').close();
  commit(setPieceLocks(state, [...selectedIds], true));
});
button('#context-unlock', () => {
  element<HTMLDialogElement>('#piece-menu').close();
  commit(setPieceLocks(state, [...selectedIds], false));
});
button('#context-delete', () => {
  element<HTMLDialogElement>('#piece-menu').close();
  removePiece();
});
svg.addEventListener('contextmenu', (event) => {
  const id =
    event.target instanceof Element
      ? event.target.closest<SVGGElement>('[data-piece-id]')?.dataset['pieceId']
      : undefined;
  if (!id) return;
  event.preventDefault();
  cancelGesture();
  toolId = '';
  if (!selectedIds.has(id)) selectOnly(id);
  render();
  element<HTMLButtonElement>('#context-lock').disabled = selection().every((p) => p.locked);
  element<HTMLButtonElement>('#context-unlock').disabled = !selection().some((p) => p.locked);
  element<HTMLButtonElement>('#context-delete').disabled = selection().some((p) => p.locked);
  element<HTMLDialogElement>('#piece-menu').showModal();
});
button('#reset-inventory', () =>
  confirm(
    'Reset entire inventory?',
    'Set every owned quantity to zero? Layouts and their shopping lists are retained. Undo is available during this session.',
    () => commit(resetInventory(state)),
  ),
);
element<HTMLSelectElement>('#language').addEventListener('change', () =>
  action(() => {
    const language = element<HTMLSelectElement>('#language').value;
    if (!isLanguage(language)) throw new Error('Unknown language.');
    updatePreferences({ ...preferences, language });
  }),
);
element<HTMLInputElement>('#sounds').addEventListener('change', () =>
  action(() =>
    updatePreferences({ ...preferences, sounds: element<HTMLInputElement>('#sounds').checked }),
  ),
);
element<HTMLInputElement>('#confirm-delete').addEventListener('change', () =>
  action(() =>
    updatePreferences({
      ...preferences,
      confirmDelete: element<HTMLInputElement>('#confirm-delete').checked,
    }),
  ),
);

function unexpected(error: unknown): void {
  clearPaletteDrag();
  cancelGesture();
  const type =
    error instanceof Error &&
    [
      'Error',
      'TypeError',
      'RangeError',
      'SyntaxError',
      'ReferenceError',
      'SecurityError',
      'QuotaExceededError',
    ].includes(error.name)
      ? error.name
      : 'Error';
  const version = import.meta.env.VITE_APP_VERSION ?? 'development';
  element<HTMLElement>('#error-details').textContent = `${type} / application ${version}`;
  const report = new URL('https://github.com/f2calv/model-railway-planner/issues/new');
  report.searchParams.set('title', `Unexpected ${type} in planner ${version}`);
  report.searchParams.set(
    'body',
    `Application version: ${version}\nError category: ${type}\n\nSteps to reproduce:\n\nExpected result:\n\nActual result:\n\nPlease review this report before submitting. Do not include personal layouts, inventory or browser activity unless you explicitly want to share them.`,
  );
  element<HTMLAnchorElement>('#report-error').href = report.href;
  status('Unexpected error. Export a backup before reloading.', true);
  const dialog = element<HTMLDialogElement>('#error-dialog');
  if (!dialog.open) dialog.showModal();
}
window.addEventListener('error', (event) => {
  event.preventDefault();
  unexpected(event.error);
});
window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
  unexpected(event.reason);
});

function fit(layer: 'all' | 'railway' | 'boards' | 'room' = 'all'): void {
  const layout = activeLayout(state);
  const bounds = layoutBounds(
    {
      ...layout,
      pieces: layer === 'all' || layer === 'railway' ? layout.pieces : [],
      boards: layer === 'all' || layer === 'boards' ? layout.boards : [],
    },
    layer === 'all' || layer === 'room' ? assignedRoom(state) : undefined,
  );
  if (!bounds) {
    svgSelection.call(zoomer.transform, zoomIdentity.translate(90, 110).scale(0.6));
    return;
  }
  const minX = bounds.x - 20;
  const minY = bounds.y - 20;
  const maxX = bounds.x + bounds.width + 20;
  const maxY = bounds.y + bounds.height + 20;
  const rect = svg.getBoundingClientRect();
  const k = Math.min(4, rect.width / (maxX - minX), rect.height / (maxY - minY));
  svgSelection.call(
    zoomer.transform,
    zoomIdentity
      .translate((rect.width - (maxX + minX) * k) / 2, (rect.height - (maxY + minY) * k) / 2)
      .scale(k),
  );
}

button('#zoom-in', () => svgSelection.call(zoomer.scaleBy, 1.3));
button('#zoom-out', () => svgSelection.call(zoomer.scaleBy, 1 / 1.3));
button('#fit', () => fit('railway'));
button('#fit-boards', () => fit('boards'));
button('#fit-room', () => fit('room'));
button('#cancel-tool', () => {
  clearPaletteDrag();
  cancelGesture();
  boardEditor.leave();
  roomEditor.leave();
  toolId = '';
  panMode = !panMode;
  preview(null);
  render();
});
function applyTheme(dark: boolean): void {
  document.documentElement.dataset['theme'] = dark ? 'dark' : 'light';
  element<HTMLButtonElement>('#theme').setAttribute('aria-pressed', String(dark));
}
action(() => {
  const stored = localStorage.getItem(`${storageKey}.theme`);
  if (stored !== null && stored !== 'dark' && stored !== 'light')
    throw new Error('Invalid saved theme preference. Choose Dark mode to reset it.');
  applyTheme(
    stored === null ? matchMedia('(prefers-color-scheme: dark)').matches : stored === 'dark',
  );
});
button('#theme', () => {
  const dark = document.documentElement.dataset['theme'] !== 'dark';
  localStorage.setItem(`${storageKey}.theme`, dark ? 'dark' : 'light');
  applyTheme(dark);
});
button('#tool-rotate', () => {
  toolAngle = normalize(toolAngle + 22.5);
  preview(null);
  render();
});
button('#tool-flip', () => {
  toolFlipped = !toolFlipped;
  preview(null);
  render();
});
button('#rotate-left', () =>
  transformSelected((p) => ({ ...p, angle: normalize(p.angle - 22.5) })),
);
button('#rotate-right', () =>
  transformSelected((p) => ({ ...p, angle: normalize(p.angle + 22.5) })),
);
button('#flip', () => transformSelected((p) => ({ ...p, flipped: !p.flipped })));
button('#remove-piece', removePiece);
button('#remove-accessory', () => {
  if (selectedIds.size !== 1)
    throw new Error('Select one compatible Hornby straight at least 168 mm long.');
  commit(setAccessory(state, selectedId, 'hornby-oo-r645', false));
});
button('#apply-position', () =>
  transformSelected((p) => ({
    ...p,
    x: element<HTMLInputElement>('#piece-x').valueAsNumber,
    y: element<HTMLInputElement>('#piece-y').valueAsNumber,
    angle: element<HTMLInputElement>('#piece-angle').valueAsNumber,
  })),
);
element<HTMLInputElement>('#search').addEventListener('input', render);
element<HTMLSelectElement>('#catalog-gauge').addEventListener('change', () => {
  clearPaletteDrag();
  cancelGesture();
  toolId = '';
  render();
});
element<HTMLSelectElement>('#catalog-profile').addEventListener('change', () => {
  clearPaletteDrag();
  cancelGesture();
  toolId = '';
  render();
});
element<HTMLSelectElement>('#piece-select').addEventListener('change', (event) => {
  boardEditor.leave();
  roomEditor.leave();
  panMode = false;
  selectOnly((event.currentTarget as HTMLSelectElement).value);
  toolId = '';
  render();
});
element<HTMLSelectElement>('#layouts').addEventListener('change', () => {
  cancelGesture();
  boardEditor.leave();
  roomEditor.leave();
  if (commit({ ...state, activeLayoutId: element<HTMLSelectElement>('#layouts').value })) {
    selectOnly('');
    toolId = '';
    preview(null);
    render();
  }
});
element<HTMLSelectElement>('#layout-room').addEventListener('change', () =>
  action(() => {
    cancelGesture();
    roomEditor.leave();
    if (commit(assignRoom(state, element<HTMLSelectElement>('#layout-room').value))) fit();
  }),
);
button('#new-room', () =>
  askName('New room', `Room ${state.rooms.length + 1}`, (name) => {
    cancelGesture();
    boardEditor.leave();
    roomEditor.leave();
    const room = { id: uuid(), name, shapes: [] };
    element<HTMLSelectElement>('#room-role').value = 'outline';
    element<HTMLInputElement>('#room-shape-name').value = 'Room outline';
    if (commit(assignRoom(putRoom(state, room), room.id))) fit();
  }),
);
button('#rename-room', () => {
  const room = assignedRoom(state);
  if (!room) throw new Error('Choose a named room first.');
  askName('Rename room', room.name, (name) => {
    const current = state.rooms.find((entry) => entry.id === room.id);
    if (!current) throw new Error('Selected room does not exist.');
    commit(putRoom(state, { ...current, name }));
  });
});
button('#delete-room', () => {
  const room = assignedRoom(state);
  if (!room) throw new Error('Choose a named room first.');
  confirm(
    'Delete this room?',
    'This removes the room and furniture from every assigned layout, but keeps all baseboards and track. Undo can restore it.',
    () => {
      cancelGesture();
      roomEditor.leave();
      if (commit(removeRoom(state, room.id))) fit();
    },
  );
});

function confirm(title: string, message: string, operation: () => void, deletion = false): void {
  const dialog = element<HTMLDialogElement>('#confirm-dialog');
  element<HTMLElement>('#confirm-title').textContent = title;
  element<HTMLElement>('#confirm-text').textContent = message;
  element<HTMLElement>('#skip-delete-label').hidden = !deletion;
  element<HTMLInputElement>('#skip-delete').checked = false;
  dialog.returnValue = 'cancel';
  dialog.addEventListener(
    'close',
    () => {
      if (dialog.returnValue === 'confirm') action(operation);
    },
    { once: true },
  );
  translateUi(dialog, preferences.language);
  dialog.showModal();
}

function askName(title: string, initial: string, operation: (name: string) => void): void {
  const dialog = element<HTMLDialogElement>('#name-dialog');
  element<HTMLElement>('#name-title').textContent = title;
  const input = element<HTMLInputElement>('#layout-name');
  input.value = initial;
  dialog.returnValue = 'cancel';
  dialog.addEventListener(
    'close',
    () => {
      if (dialog.returnValue === 'confirm' && input.value.trim())
        action(() => operation(input.value.trim()));
    },
    { once: true },
  );
  translateUi(dialog, preferences.language);
  dialog.showModal();
  input.select();
}

button('#new-layout', () =>
  askName('New layout', `Idea ${state.layouts.length + 1}`, (name) => {
    const id = uuid();
    commit({
      ...state,
      layouts: [...state.layouts, { id, name, pieces: [], boards: [] }],
      activeLayoutId: id,
    });
    selectOnly('');
    toolId = '';
    render();
  }),
);
button('#duplicate-layout', () =>
  askName('Duplicate layout', `${activeLayout(state).name} copy`, (name) => {
    const id = uuid();
    const layout = activeLayout(state);
    commit({
      ...state,
      layouts: [
        ...state.layouts,
        { ...layout, id, name, pieces: layout.pieces.map((p) => ({ ...p, id: uuid() })) },
      ],
      activeLayoutId: id,
    });
    selectOnly('');
    render();
  }),
);
button('#rename-layout', () =>
  askName('Rename layout', activeLayout(state).name, (name) =>
    commit(updateLayout(state, { ...activeLayout(state), name })),
  ),
);
button('#delete-layout', () =>
  confirm(
    'Delete this layout?',
    'This removes only this idea, not your inventory. Export a backup first if you need to keep it.',
    () => {
      const layouts = state.layouts.filter((l) => l.id !== state.activeLayoutId);
      if (!layouts[0]) throw new Error('Keep at least one layout.');
      commit({ ...state, layouts, activeLayoutId: layouts[0].id });
      selectOnly('');
      render();
    },
  ),
);
function download(content: string | Blob, filename: string, type = 'application/json'): void {
  const url = URL.createObjectURL(
    typeof content === 'string' ? new Blob([content], { type }) : content,
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
button('#export-svg', () => download(svgExport(state), 'railway-layout.svg', 'image/svg+xml'));
button('#export-inventory-csv', () =>
  download(csvExport(state), 'railway-inventory.csv', 'text/csv;charset=utf-8'),
);
button('#export-shopping-csv', () =>
  download(csvExport(state, true), 'railway-shopping-list.csv', 'text/csv;charset=utf-8'),
);
button('#export-png', () => {
  const control = element<HTMLButtonElement>('#export-png');
  control.disabled = true;
  void pngExport(state)
    .then((blob) => download(blob, 'railway-layout.png'))
    .catch((error: unknown) =>
      status(`PNG export failed: ${error instanceof Error ? error.message : String(error)}`, true),
    )
    .finally(() => {
      control.disabled = false;
    });
});
button('#print', () => {
  const content = svgExport(state);
  const graphic = new DOMParser().parseFromString(content, 'image/svg+xml');
  if (graphic.querySelector('parsererror'))
    throw new Error('The print drawing could not be generated.');
  document.querySelector('#print-view')?.remove();
  const root = document.createElement('section');
  root.id = 'print-view';
  root.hidden = true;
  const title = document.createElement('h1');
  title.textContent = activeLayout(state).name;
  const notice = document.createElement('p');
  notice.textContent = translate(
    'Printed overview; not a 1:1 construction template.',
    preferences.language,
  );
  root.append(title, notice, document.importNode(graphic.documentElement, true));
  document.body.append(root);
  window.addEventListener('afterprint', () => root.remove(), { once: true });
  window.print();
});
button('#export', () => {
  const text = recovery ? localStorage.getItem(storageKey) : JSON.stringify(state, null, 2);
  if (text === null)
    throw new Error(
      'No readable original backup is available. Browser storage access may be blocked.',
    );
  download(text, recovery ? 'railway-original-recovery.json' : 'railway-planner-backup.json');
});
button('#import', () => element<HTMLInputElement>('#import-file').click());
element<HTMLInputElement>('#import-file').addEventListener('change', async () => {
  const input = element<HTMLInputElement>('#import-file');
  const file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 4_000_000) throw new Error('Backup exceeds the 4 MB import limit.');
    const next = parseState(await file.text());
    confirm(
      "Replace this device's planner data?",
      'This replaces all inventory, rooms and layouts. Export a backup first. Imported geometry will be checked and any placement issues shown.',
      () => {
        if (commit(next, 'Backup imported and saved on this device.', true)) {
          selectOnly('');
          toolId = '';
          preview(null);
          render();
        }
      },
    );
  } catch (error) {
    status(
      `Import failed: ${error instanceof Error ? error.message : String(error)} Original data was not changed.`,
      true,
    );
  } finally {
    input.value = '';
  }
});
window.addEventListener('storage', (event) => {
  if (event.key === storageKey) {
    recovery = true;
    status(
      'Planner data changed in another tab. Reload before editing to avoid overwriting its changes.',
      true,
    );
  }
});

const updateSW = registerSW({
  onNeedRefresh() {
    element<HTMLButtonElement>('#update-app').hidden = false;
    addActivity('App update available.');
  },
  onOfflineReady() {
    const message = 'App is cached for offline use. Your inventory stays on this device.';
    addActivity(message);
    if (!element<HTMLElement>('#status').classList.contains('error')) status(message);
  },
  onRegisterError(error: Error) {
    status(`Offline installation is unavailable: ${error.message}`, true);
  },
});
button('#update-app', () => {
  if (drag || marquee || paletteDrag || previewPiece)
    throw new Error('Finish the current gesture before updating.');
  if (!recovery) saveState(localStorage, state);
  rememberPageSettings();
  void updateSW(true).catch((error: unknown) => status(`Update failed: ${String(error)}`, true));
});

function showPage(focus = false): void {
  rememberPageSettings();
  restoringPageSettings = true;
  const browsing = location.hash === '#catalog';
  clearPaletteDrag();
  cancelGesture();
  toolId = '';
  element<HTMLElement>('#planner-page').hidden = browsing;
  element<HTMLElement>('#catalog-page').hidden = !browsing;
  for (const [id, active] of [
    ['#planner-page-link', !browsing],
    ['#catalog-page-link', browsing],
  ] as const) {
    const link = element<HTMLAnchorElement>(id);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  render();
  if (!browsing) restoreLayoutView();
  if (focus) {
    if (browsing) element<HTMLHeadingElement>('#catalog-page h2').focus();
    else element<HTMLButtonElement>('#cancel-tool').focus();
  }
  cancelAnimationFrame(pageSettingsFrame);
  const scroll = { ...pageSettings.scroll };
  pageSettingsFrame = requestAnimationFrame(() => {
    if (browsing) element<HTMLElement>('.catalog-table-scroll').scrollLeft = scroll.table;
    else {
      element<HTMLElement>('.inventory-panel').scrollTop = scroll.inventory;
      element<HTMLElement>('.details-panel').scrollTop = scroll.details;
    }
    window.scrollTo(0, browsing ? scroll.catalog : scroll.planner);
    restoringPageSettings = false;
    rememberPageSettings();
  });
}
window.addEventListener('hashchange', () => showPage(true));
document.addEventListener('input', (event) => {
  if (event.target instanceof HTMLInputElement && event.target.id === 'browser-search')
    rememberPageSettings();
});
document.addEventListener('change', (event) => {
  if (
    event.target instanceof Element &&
    ['browser-gauge', 'browser-manufacturer', 'browser-owned', 'snap', 'power-overlay'].includes(
      event.target.id,
    )
  )
    rememberPageSettings();
});
document.addEventListener(
  'toggle',
  (event) => {
    const target = event.target;
    if (target instanceof HTMLDetailsElement && pagePanels.some((id) => id === target.id))
      rememberPageSettings();
  },
  true,
);
document.addEventListener(
  'scroll',
  (event) => {
    if (
      event.target === document ||
      (event.target instanceof Element &&
        event.target.matches('.inventory-panel, .details-panel, .catalog-table-scroll'))
    )
      rememberPageSettings();
  },
  true,
);
window.addEventListener('pagehide', rememberPageSettings);
window.history.scrollRestoration = 'manual';
restorePageControls();
if (location.hash !== '#planner' && location.hash !== '#catalog')
  window.history.replaceState(null, '', `#${pageSettings.page}`);
pageSettingsReady = true;
showPage();
