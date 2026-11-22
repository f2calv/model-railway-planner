import './style.css';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';
import { registerSW } from 'virtual:pwa-register';
import { catalog, definition } from './catalog';
import {
  joinedBoards,
  normalize,
  pathData,
  placementProblem,
  ports,
  samples,
  snapPiece,
} from './geometry';
import {
  activeLayout,
  available,
  emptyState,
  layoutProblems,
  parseState,
  putPiece,
  setInventory,
  updateLayout,
} from './state';
import { loadState, saveState, storageKey } from './storage';
import type { Piece, PlannerState, Vec } from './model';

function element<T extends Element>(selector: string): T {
  const result = document.querySelector<T>(selector);
  if (!result) throw new Error(`Required UI element missing: ${selector}`);
  return result;
}

element<HTMLDivElement>('#app').innerHTML = `
  <header class="app-header">
    <img src="${import.meta.env.BASE_URL}icon.svg" width="38" height="38" alt="" />
    <div class="brand"><h1>Model Railway Planner</h1><span>Your track. Your next great layout.</span></div>
    <span class="privacy-badge">LOCAL & PRIVATE</span>
    <button id="export">Export backup</button>
    <button id="import">Import backup</button>
    <input id="import-file" type="file" accept=".json,application/json" hidden />
  </header>
  <div class="layout-bar">
    <label>Layout <select id="layouts" aria-label="Saved layouts"></select></label>
    <button id="new-layout">New idea</button><button id="duplicate-layout">Duplicate</button>
    <button id="rename-layout">Rename</button><button id="delete-layout">Delete layout</button>
    <span id="save-state" class="save-state">Autosave ready</span>
  </div>
  <main class="workspace">
    <aside class="inventory-panel">
      <div class="panel-heading"><span class="eyebrow">YOUR COLLECTION</span><h2>Track inventory</h2></div>
      <p>Enter what you own. Each idea uses your collection independently.</p>
      <label class="search-label">Find a piece<input id="search" type="search" placeholder="Code or track type..." /></label>
      <div class="catalog-heading"><span>HORNBY / OO</span><span>Owned / left</span></div>
      <div id="catalog"></div>
      <p class="subtle">Drag a piece onto the plan, or choose it and tap an empty spot. No sample stock is added.</p>
    </aside>
    <section class="editor" aria-label="Layout editor">
      <div class="editor-toolbar">
        <button id="cancel-tool">Select / pan</button>
        <button id="tool-rotate">Rotate new</button><button id="tool-flip">Reverse new curve</button>
        <span id="tool-label">Select a track piece to begin</span>
        <label><input id="snap" type="checkbox" checked /> Snap</label>
        <button id="zoom-out" aria-label="Zoom out">-</button><output id="zoom-level">60%</output>
        <button id="zoom-in" aria-label="Zoom in">+</button><button id="fit">Fit plan</button>
      </div>
      <svg id="canvas" role="group" tabindex="0" aria-label="Track plan. Tap to place; drag track to move; drag background to pan. Use controls for keyboard editing.">
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M100 0H0V100" fill="none" stroke="#d7ddd5" stroke-width="1"/>
            <circle cx="50" cy="50" r="1.4" fill="#d7ddd5"/>
          </pattern>
        </defs>
        <g id="world"><rect x="-1000000" y="-1000000" width="2000000" height="2000000" fill="url(#grid)" />
          <g id="boards"></g><g id="tracks"></g><g id="preview" pointer-events="none"></g>
        </g>
      </svg>
      <div id="empty-hint"><strong>A little space for big ideas.</strong><span>Add your inventory, then place your first piece.</span></div>
      <div class="canvas-footer"><span>100 mm grid / all dimensions in mm</span><span id="piece-count">0 pieces</span></div>
    </section>
    <aside class="details-panel">
      <span class="eyebrow">FINE TUNE</span><h2>Selected piece</h2>
      <label>Piece<select id="piece-select" aria-label="Select placed piece"><option value="">None</option></select></label>
      <div id="piece-controls">
        <div class="two-columns"><label>X (mm)<input id="piece-x" type="number" step="1" /></label><label>Y (mm)<input id="piece-y" type="number" step="1" /></label></div>
        <label>Angle (degrees)<input id="piece-angle" type="number" step="0.5" /></label>
        <button id="apply-position">Apply position</button>
        <div class="two-columns"><button id="rotate-left">Rotate -22.5</button><button id="rotate-right">Rotate +22.5</button></div>
        <button id="flip">Reverse curve</button><button id="remove-piece">Remove piece</button>
      </div>
      <hr /><span class="eyebrow">YOUR SPACE</span><h2>Baseboard</h2>
      <p>Unbounded until you add a rectangle. Join more rectangles for an L or U shape.</p>
      <div class="two-columns"><label>X (mm)<input id="board-x" type="number" value="0" /></label><label>Y (mm)<input id="board-y" type="number" value="0" /></label>
        <label>Width (mm)<input id="board-width" type="number" min="1" value="1800" /></label><label>Height (mm)<input id="board-height" type="number" min="1" value="1200" /></label></div>
      <button id="add-board">Add rectangle</button><div id="board-list"></div>
      <button id="unbounded">Use unbounded area</button>
      <hr /><h2>Planning checks</h2><div id="checks"></div>
      <p class="subtle">67 mm nominal Hornby track centres. Curves and turnout fans still need physical checks with your longest trains. This is not a clearance certificate.</p>
      <details><summary>Controls & mobile</summary><p>Choose a piece, then tap to place. Drag placed track to move it. Scroll or pinch to zoom; drag blank space to pan. Select a placed piece from the list for exact coordinates. Arrow keys move 5 mm, Shift + arrows move 1 mm; R rotates, Delete removes, Escape cancels.</p><p>For offline installation, open a production build over HTTPS (or localhost). Use your browser's Install app / Add to Home Screen option. Browser support varies.</p></details>
      <button id="update-app" hidden>Update app</button>
    </aside>
  </main>
  <footer id="status" role="status" aria-label="Planner status" aria-live="polite">Welcome. Start by adding the track you own.</footer>
  <dialog id="confirm-dialog"><form method="dialog"><h2 id="confirm-title">Confirm</h2><p id="confirm-text"></p><div class="dialog-actions"><button value="cancel">Cancel</button><button value="confirm">Confirm</button></div></form></dialog>
  <dialog id="name-dialog"><form method="dialog"><h2 id="name-title">Layout name</h2><label>Name<input id="layout-name" maxlength="120" required /></label><div class="dialog-actions"><button value="cancel" formnovalidate>Cancel</button><button value="confirm">Save</button></div></form></dialog>
`;

const uuid = () => crypto.randomUUID();
let state: PlannerState = emptyState(uuid());
let recovery = false;
let selectedId = '';
let toolId = '';
let toolAngle = 0;
let toolFlipped = false;
let transform: ZoomTransform = zoomIdentity;
let previewPiece: Piece | null = null;
let drag: { pointerId: number; piece: Piece; start: Vec; moved: boolean } | null = null;
let suppressClick = false;
const svg = element<SVGSVGElement>('#canvas');
const svgSelection = select(svg);

function status(message: string, error = false): void {
  const target = element<HTMLElement>('#status');
  if (target.textContent !== message) target.textContent = message;
  target.classList.toggle('error', error);
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

function commit(next: PlannerState, message = 'Saved on this device.', replacing = false): boolean {
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
    return false;
  }
  state = next;
  recovery = false;
  element<HTMLElement>('#save-state').textContent = 'Saved on this device';
  status(message);
  render();
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

function drawTrack(group: SVGGElement, piece: Piece, ghost = false): void {
  const entry = definition(piece.trackId);
  group.setAttribute(
    'transform',
    `translate(${piece.x},${piece.y}) rotate(${piece.angle}) scale(1,${piece.flipped ? -1 : 1})`,
  );
  group.setAttribute(
    'class',
    `track${piece.id === selectedId ? ' selected' : ''}${ghost ? ' ghost' : ''}`,
  );
  for (const route of entry.routes) {
    const d = pathData(route);
    for (const layer of ['track-bed', 'sleepers', 'rails', 'centre-line']) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', layer);
      group.append(path);
    }
  }
  const localPorts = ports({ ...piece, x: 0, y: 0, angle: 0, flipped: false });
  for (const port of localPorts) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(port.x));
    circle.setAttribute('cy', String(port.y));
    circle.setAttribute('r', '4');
    circle.setAttribute('class', 'port');
    group.append(circle);
  }
}

function preview(candidate: Piece | null): void {
  previewPiece = candidate;
  const root = element<SVGGElement>('#preview');
  root.replaceChildren();
  if (!candidate) return;
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  drawTrack(group, candidate, true);
  const layout = activeLayout(state);
  const problem = placementProblem(
    candidate,
    layout.pieces.filter((p) => p.id !== candidate.id),
    layout.boards,
  );
  group.classList.toggle('invalid', problem !== null);
  root.append(group);
  if (problem) status(problem.message, true);
}

function modelPoint(client: Vec): Vec {
  const rect = svg.getBoundingClientRect();
  const [x, y] = transform.invert([client.x - rect.left, client.y - rect.top]);
  return { x, y };
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
  const focused = document.activeElement;
  const focusedLabel = focused?.getAttribute('aria-label');
  const layout = activeLayout(state);
  const layoutSelect = element<HTMLSelectElement>('#layouts');
  layoutSelect.replaceChildren(...state.layouts.map((l) => new Option(l.name, l.id)));
  layoutSelect.value = state.activeLayoutId;
  const query = element<HTMLInputElement>('#search').value.toLowerCase();
  const catalogRoot = element<HTMLElement>('#catalog');
  catalogRoot.replaceChildren();
  for (const entry of catalog) {
    if (!`${entry.code} ${entry.name}`.toLowerCase().includes(query)) continue;
    const row = document.createElement('div');
    row.className = `catalog-row${entry.id === toolId ? ' active-tool' : ''}`;
    const pick = document.createElement('button');
    pick.className = 'track-choice';
    pick.disabled = available(state, entry.id) <= 0;
    pick.draggable = !pick.disabled;
    pick.setAttribute('aria-label', `Place ${entry.code} ${entry.name}`);
    const code = document.createElement('strong');
    code.textContent = entry.code;
    const label = document.createElement('span');
    label.textContent = entry.name;
    pick.append(code, label);
    pick.addEventListener('click', () => {
      toolId = entry.id;
      selectedId = '';
      render();
    });
    pick.addEventListener('dragstart', (event) => {
      toolId = entry.id;
      event.dataTransfer?.setData('text/plain', entry.id);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
    });
    const quantity = document.createElement('input');
    quantity.type = 'number';
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
    catalogRoot.append(row);
  }
  const pieceSelect = element<HTMLSelectElement>('#piece-select');
  pieceSelect.replaceChildren(
    new Option('None', ''),
    ...layout.pieces.map((p, i) => new Option(`${i + 1}. ${definition(p.trackId).code}`, p.id)),
  );
  pieceSelect.value = selectedId;
  const piece = selected();
  for (const control of element<HTMLElement>('#piece-controls').querySelectorAll<
    HTMLInputElement | HTMLButtonElement
  >('input,button'))
    control.disabled = !piece;
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
    definition(piece.trackId).routes.length !== 1 ||
    definition(piece.trackId).routes[0]?.kind !== 'arc';
  element<HTMLElement>('#tool-label').textContent = toolId
    ? `Placing ${definition(toolId).code} / ${toolAngle} degrees${toolFlipped ? ' / reversed' : ''}`
    : 'Select a track piece to begin';
  select(element<SVGGElement>('#tracks'))
    .selectAll<SVGGElement, Piece>('g.track')
    .data(layout.pieces, (piece) => piece.id)
    .join('g')
    .each((piece, index, groups) => {
      const group = groups[index];
      if (!group) throw new Error('Missing SVG track element.');
      group.replaceChildren();
      group.dataset['pieceId'] = piece.id;
      group.setAttribute('role', 'button');
      group.setAttribute('tabindex', '0');
      group.setAttribute(
        'aria-label',
        `Select ${definition(piece.trackId).code} at ${Math.round(piece.x)}, ${Math.round(piece.y)} mm`,
      );
      drawTrack(group, piece);
    });
  const boardsRoot = element<SVGGElement>('#boards');
  const boardList = element<HTMLElement>('#board-list');
  boardsRoot.replaceChildren();
  boardList.replaceChildren();
  layout.boards.forEach((board, index) => {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    for (const [key, value] of Object.entries(board)) rect.setAttribute(key, String(value));
    rect.setAttribute('class', 'baseboard');
    boardsRoot.append(rect);
    const remove = document.createElement('button');
    remove.textContent = `${board.width} x ${board.height} at ${board.x}, ${board.y} / remove`;
    remove.addEventListener('click', () =>
      action(() => {
        const boards = layout.boards.filter((_, i) => i !== index);
        if (!joinedBoards(boards))
          throw new Error('Removing this rectangle would disconnect the baseboard.');
        const next = { ...layout, boards };
        const issues = layoutProblems(next);
        if (issues.length) throw new Error(issues.join(' '));
        commit(updateLayout(state, next));
      }),
    );
    boardList.append(remove);
  });
  const issues = layoutProblems(layout);
  element<HTMLElement>('#checks').textContent = issues.length
    ? issues.join(' ')
    : 'No definite placement violations found.';
  element<HTMLElement>('#checks').className = issues.length ? 'check-warning' : 'check-ok';
  element<HTMLElement>('#piece-count').textContent = `${layout.pieces.length} pieces`;
  element<HTMLElement>('#empty-hint').hidden = layout.pieces.length > 0;
  element<HTMLButtonElement>('#delete-layout').disabled = state.layouts.length <= 1;
  element<HTMLButtonElement>('#tool-rotate').disabled = !toolId;
  element<HTMLButtonElement>('#tool-flip').disabled =
    !toolId ||
    definition(toolId).routes.length !== 1 ||
    definition(toolId).routes[0]?.kind !== 'arc';
  if (focusedLabel && focused && !focused.isConnected) {
    [...document.querySelectorAll<HTMLElement>('[aria-label]')]
      .find((node) => node.getAttribute('aria-label') === focusedLabel)
      ?.focus();
  }
}

const zoomer = zoom<SVGSVGElement, unknown>()
  .scaleExtent([0.08, 4])
  .filter((event: Event) => {
    if (event.type === 'wheel') return true;
    const target = event.target;
    return !toolId && !drag && (!(target instanceof Element) || !target.closest('.track'));
  })
  .on('zoom', (event: { transform: ZoomTransform }) => {
    transform = event.transform;
    element<SVGGElement>('#world').setAttribute('transform', transform.toString());
    element<HTMLOutputElement>('#zoom-level').textContent = `${Math.round(transform.k * 100)}%`;
  });
svgSelection.call(zoomer).on('dblclick.zoom', null);
svgSelection.call(zoomer.transform, zoomIdentity.translate(90, 110).scale(0.6));

function place(candidate: Piece): void {
  action(() => {
    if (commit(putPiece(state, candidate))) {
      selectedId = candidate.id;
      if (available(state, candidate.trackId) <= 0) toolId = '';
      preview(null);
      render();
    } else preview(null);
  });
}

svg.addEventListener('pointerdown', (event) => {
  if (toolId) return;
  const target =
    event.target instanceof Element ? event.target.closest<SVGGElement>('[data-piece-id]') : null;
  const id = target?.dataset['pieceId'];
  const piece = activeLayout(state).pieces.find((p) => p.id === id);
  if (!piece || event.button !== 0) return;
  event.stopPropagation();
  selectedId = piece.id;
  toolId = '';
  drag = {
    pointerId: event.pointerId,
    piece,
    start: modelPoint({ x: event.clientX, y: event.clientY }),
    moved: false,
  };
  svg.setPointerCapture(event.pointerId);
  render();
});
svg.addEventListener('pointermove', (event) => {
  const position = modelPoint({ x: event.clientX, y: event.clientY });
  if (drag && event.pointerId === drag.pointerId) {
    const dx = position.x - drag.start.x;
    const dy = position.y - drag.start.y;
    if (Math.hypot(dx, dy) * transform.k < 3 && !drag.moved) return;
    drag.moved = true;
    preview(snapped({ ...drag.piece, x: drag.piece.x + dx, y: drag.piece.y + dy }));
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
svg.addEventListener('pointerup', (event) => {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const moved = drag.moved;
  drag = null;
  if (moved && previewPiece) place(previewPiece);
  preview(null);
  render();
  suppressClick = moved;
});
svg.addEventListener('pointercancel', () => {
  drag = null;
  preview(null);
  render();
});
svg.addEventListener('pointerleave', () => {
  if (!drag) preview(null);
});
svg.addEventListener('click', (event) => {
  if (suppressClick) {
    suppressClick = false;
    return;
  }
  if (!toolId && event.target instanceof Element && event.target.closest('.track')) return;
  if (!toolId) {
    selectedId = '';
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
svg.addEventListener('dragover', (event) => {
  event.preventDefault();
});
svg.addEventListener('drop', (event) => {
  event.preventDefault();
  const id = event.dataTransfer?.getData('text/plain');
  if (!id || !catalog.some((entry) => entry.id === id)) return;
  place(
    snapped({
      id: uuid(),
      trackId: id,
      ...modelPoint({ x: event.clientX, y: event.clientY }),
      angle: toolAngle,
      flipped: toolFlipped,
    }),
  );
});

function transformSelected(change: (p: Piece) => Piece): void {
  const piece = selected();
  if (!piece) throw new Error('Select a placed piece first.');
  commit(putPiece(state, change(piece)));
}

document.addEventListener('keydown', (event) => {
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLSelectElement ||
    event.target instanceof HTMLTextAreaElement ||
    element<HTMLDialogElement>('#confirm-dialog').open ||
    element<HTMLDialogElement>('#name-dialog').open
  )
    return;
  if (event.key === 'Escape') {
    toolId = '';
    preview(null);
    render();
    return;
  }
  if (
    event.target instanceof Element &&
    event.target.closest('[data-piece-id]') &&
    (event.key === 'Enter' || event.key === ' ')
  ) {
    event.preventDefault();
    selectedId = event.target.closest<SVGGElement>('[data-piece-id]')?.dataset['pieceId'] ?? '';
    toolId = '';
    render();
    return;
  }
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
    action(() => transformSelected((p) => ({ ...p, x: p.x + move.x, y: p.y + move.y })));
  }
  if (event.key.toLowerCase() === 'r')
    action(() => transformSelected((p) => ({ ...p, angle: normalize(p.angle + 22.5) })));
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault();
    removePiece();
  }
});

function removePiece(): void {
  const layout = activeLayout(state);
  if (
    commit(
      updateLayout(state, { ...layout, pieces: layout.pieces.filter((p) => p.id !== selectedId) }),
    )
  ) {
    selectedId = '';
    render();
  }
}

function fit(): void {
  const layout = activeLayout(state);
  const points = [
    ...layout.pieces.flatMap((p) => samples(p).flat()),
    ...layout.boards.flatMap((b) => [
      { x: b.x, y: b.y },
      { x: b.x + b.width, y: b.y + b.height },
    ]),
  ];
  if (!points.length) {
    svgSelection.call(zoomer.transform, zoomIdentity.translate(90, 110).scale(0.6));
    return;
  }
  const minX = Math.min(...points.map((p) => p.x)) - 60;
  const minY = Math.min(...points.map((p) => p.y)) - 60;
  const maxX = Math.max(...points.map((p) => p.x)) + 60;
  const maxY = Math.max(...points.map((p) => p.y)) + 60;
  const rect = svg.getBoundingClientRect();
  const k = Math.max(0.08, Math.min(4, rect.width / (maxX - minX), rect.height / (maxY - minY)));
  svgSelection.call(
    zoomer.transform,
    zoomIdentity
      .translate((rect.width - (maxX + minX) * k) / 2, (rect.height - (maxY + minY) * k) / 2)
      .scale(k),
  );
}

button('#zoom-in', () => svgSelection.call(zoomer.scaleBy, 1.3));
button('#zoom-out', () => svgSelection.call(zoomer.scaleBy, 1 / 1.3));
button('#fit', fit);
button('#cancel-tool', () => {
  toolId = '';
  preview(null);
  render();
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
button('#apply-position', () =>
  transformSelected((p) => ({
    ...p,
    x: element<HTMLInputElement>('#piece-x').valueAsNumber,
    y: element<HTMLInputElement>('#piece-y').valueAsNumber,
    angle: element<HTMLInputElement>('#piece-angle').valueAsNumber,
  })),
);
element<HTMLInputElement>('#search').addEventListener('input', render);
element<HTMLSelectElement>('#piece-select').addEventListener('change', (event) => {
  selectedId = (event.currentTarget as HTMLSelectElement).value;
  toolId = '';
  render();
});
element<HTMLSelectElement>('#layouts').addEventListener('change', () => {
  if (commit({ ...state, activeLayoutId: element<HTMLSelectElement>('#layouts').value })) {
    selectedId = '';
    toolId = '';
    preview(null);
    render();
    fit();
  }
});

function confirm(title: string, message: string, operation: () => void): void {
  const dialog = element<HTMLDialogElement>('#confirm-dialog');
  element<HTMLElement>('#confirm-title').textContent = title;
  element<HTMLElement>('#confirm-text').textContent = message;
  dialog.returnValue = 'cancel';
  dialog.addEventListener(
    'close',
    () => {
      if (dialog.returnValue === 'confirm') action(operation);
    },
    { once: true },
  );
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
  dialog.showModal();
  input.select();
}

button('#new-layout', () =>
  askName('New layout idea', `Idea ${state.layouts.length + 1}`, (name) => {
    const id = uuid();
    commit({
      ...state,
      layouts: [...state.layouts, { id, name, pieces: [], boards: [] }],
      activeLayoutId: id,
    });
    selectedId = '';
    toolId = '';
    render();
    fit();
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
    selectedId = '';
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
      selectedId = '';
      render();
      fit();
    },
  ),
);
button('#add-board', () => {
  const board = {
    x: element<HTMLInputElement>('#board-x').valueAsNumber,
    y: element<HTMLInputElement>('#board-y').valueAsNumber,
    width: element<HTMLInputElement>('#board-width').valueAsNumber,
    height: element<HTMLInputElement>('#board-height').valueAsNumber,
  };
  if (!Object.values(board).every(Number.isFinite) || board.width <= 0 || board.height <= 0)
    throw new Error('Enter finite coordinates and positive rectangle dimensions.');
  const layout = activeLayout(state);
  const boards = [...layout.boards, board];
  if (!joinedBoards(boards))
    throw new Error('Rectangles must share an edge or overlap, not just touch at a corner.');
  const next = { ...layout, boards };
  const issues = layoutProblems(next);
  if (issues.length) throw new Error(issues.join(' '));
  if (commit(updateLayout(state, next))) fit();
});
button('#unbounded', () => commit(updateLayout(state, { ...activeLayout(state), boards: [] })));

function download(text: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
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
      'This replaces all inventory and layouts. Export a backup first. Imported geometry will be checked and any placement issues shown.',
      () => {
        if (commit(next, 'Backup imported and saved on this device.', true)) {
          selectedId = '';
          toolId = '';
          preview(null);
          render();
          fit();
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
  },
  onOfflineReady() {
    status('App is cached for offline use. Your inventory stays on this device.');
  },
  onRegisterError(error: Error) {
    status(`Offline installation is unavailable: ${error.message}`, true);
  },
});
button('#update-app', () => {
  if (drag || previewPiece || recovery)
    throw new Error('Finish the current gesture and resolve any storage errors before updating.');
  saveState(localStorage, state);
  void updateSW(true).catch((error: unknown) => status(`Update failed: ${String(error)}`, true));
});

render();
