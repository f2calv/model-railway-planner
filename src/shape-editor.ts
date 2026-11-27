import { select } from 'd3-selection';
import type { Board, PlannerState, Vec } from './model';
import {
  boardBounds,
  boardPath,
  boardPresets,
  moveBoardCorner,
  rectangleBoard,
  snapBoard,
  snapBoardPoint,
  validateBoard,
} from './baseboards';
import { activeLayout, putBoard, removeBoard, updateLayout } from './state';

interface EditorPort {
  state(): PlannerState;
  commit(state: PlannerState): boolean;
  error(message: string): void;
  point(client: Vec): Vec;
  scale(): number;
  snap(): boolean;
  modeChanged(): void;
  fit(): void;
}
export interface ShapeLayer {
  shapes(state: PlannerState): Board[];
  put(state: PlannerState, board: Board): PlannerState;
  remove(state: PlannerState, id: string): PlannerState;
  clear(state: PlannerState): PlannerState;
  label(board: Board): string;
  role(board: Board): 'outline' | 'furniture';
  selected(board: Board | undefined): void;
}
type Shape = 'rectangle' | 'triangle' | 'circle' | 'semicircle' | 'arc';
type Gesture = {
  pointerId: number;
  original: Board;
  start: Vec;
  corner?: number;
  moved: boolean;
  candidate: Board;
  invalid: boolean;
  source: Element;
};

export class ShapeEditor {
  private selectedId = '';
  private tool: Board | null = null;
  private gesture: Gesture | null = null;
  private suppressClick = false;
  private readonly preview: SVGGElement;
  private readonly root: HTMLElement;
  private readonly svg: SVGSVGElement;
  private readonly boards: SVGGElement;
  private readonly port: EditorPort;
  private readonly layer: ShapeLayer | undefined;

  constructor(
    root: HTMLElement,
    svg: SVGSVGElement,
    boards: SVGGElement,
    port: EditorPort,
    layer?: ShapeLayer,
  ) {
    this.root = root;
    this.svg = svg;
    this.boards = boards;
    this.port = port;
    this.layer = layer;
    root.innerHTML = `
      <p>Choose shapes or module presets. Boards move independently of track; planning checks show gaps and track outside the board.</p>
      <label class="check-label"><input id="edit-boards" type="checkbox" /> Edit baseboards</label>
      <div class="board-palette" id="board-shapes"></div>
      <details id="board-module-presets"><summary>Module presets</summary><div class="board-palette" id="board-presets"></div><p>Tabletop dimensions from <a href="https://www.modellbahnmodule.de/" target="_blank" rel="noopener noreferrer">Modellbahnmodule</a>. Fixings and frame clearance are not modelled.</p></details>
      <button id="board-select-tool">Select / pan boards</button>
      <p id="board-tool-status"></p>
      <label>Baseboard shape<select id="board-select" aria-label="Select baseboard shape"><option value="">New shape</option></select></label>
      <div class="two-columns">
        <label>X (mm)<input id="board-x" type="number" value="0" /></label>
        <label>Y (mm)<input id="board-y" type="number" value="0" /></label>
      </div>
      <label>Board angle (degrees)<input id="board-angle" type="number" value="0" /></label>
      <div class="two-columns" id="board-size">
        <label>Width (mm)<input id="board-width" type="number" min="1" value="1800" /></label>
        <label>Height (mm)<input id="board-height" type="number" min="1" value="1200" /></label>
      </div>
      <div id="board-round">
        <label>Outer radius (mm)<input id="board-radius" type="number" min="1" value="500" /></label>
        <div id="board-arc">
          <label>Inner radius (mm)<input id="board-inner" type="number" min="0" value="250" /></label>
          <label>Arc sweep (degrees)<input id="board-sweep" type="number" min="1" max="360" value="90" /></label>
        </div>
      </div>
      <button id="add-board">Add rectangle</button><button id="board-add-shape">Add shape at coordinates</button>
      <button id="board-apply">Apply board changes</button><button id="board-remove">Remove board shape</button>
      <details id="board-corner-details"><summary>Polygon corners</summary><div id="board-corners"></div><button id="board-apply-corners">Apply corners</button><p>Drag a corner handle, or enter local corner coordinates. Keep the polygon convex and its edges uncrossed.</p></details>
      <button id="unbounded">Use unbounded area</button>`;
    if (layer) this.configureRoomControls();
    this.preview = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.preview.id = layer ? 'room-preview' : 'board-preview';
    this.preview.setAttribute('pointer-events', 'none');
    boards.after(this.preview);
    this.configureTools(layer);
  }

  private configureRoomControls(): void {
    const root = this.root;
    for (const node of root.querySelectorAll<HTMLElement>('[id]')) node.id = `room-${node.id}`;
    this.control<HTMLElement>('#board-module-presets').remove();
    const intro = root.querySelector('p');
    if (intro)
      intro.textContent =
        'Edit the room outline and named furniture. Changes affect every layout assigned to this room.';
    const check = this.control<HTMLInputElement>('#edit-boards');
    const label = check.parentElement;
    if (!label) throw new Error('Missing room editing label.');
    label.lastChild?.remove();
    label.append(' Edit room shapes');
    this.control<HTMLButtonElement>('#board-select-tool').textContent = 'Select / pan room';
    this.control<HTMLSelectElement>('#board-select').setAttribute(
      'aria-label',
      'Select room shape',
    );
    const shapeLabel = this.control<HTMLSelectElement>('#board-select').parentElement?.firstChild;
    if (!shapeLabel) throw new Error('Missing room shape label.');
    shapeLabel.textContent = 'Room shape';
    const angleLabel = this.control<HTMLInputElement>('#board-angle').parentElement?.firstChild;
    if (!angleLabel) throw new Error('Missing room angle label.');
    angleLabel.textContent = 'Shape angle (degrees)';
    this.control<HTMLButtonElement>('#add-board').textContent = 'Add room rectangle';
    this.control<HTMLButtonElement>('#board-add-shape').textContent =
      'Add room shape at coordinates';
    this.control<HTMLButtonElement>('#board-apply').textContent = 'Apply room shape changes';
    this.control<HTMLButtonElement>('#board-remove').textContent = 'Remove room shape';
    this.control<HTMLButtonElement>('#unbounded').textContent = 'Clear room shapes';
    this.control<HTMLButtonElement>('#board-apply-corners').textContent = 'Apply room corners';
    const summary = this.control<HTMLElement>('#board-corner-details').querySelector('summary');
    if (!summary) throw new Error('Missing room corner summary.');
    summary.textContent = 'Room polygon corners';
  }

  private configureTools(layer: ShapeLayer | undefined): void {
    const shapes: { shape: Shape; label: string }[] = [
      { shape: 'rectangle', label: 'Rectangle' },
      { shape: 'triangle', label: 'Right triangle' },
      { shape: 'circle', label: 'Circle' },
      { shape: 'semicircle', label: 'Semicircle' },
      { shape: 'arc', label: 'Arc strip' },
    ];
    for (const item of shapes)
      this.paletteButton('#board-shapes', item.label, () => this.create(item.shape));
    for (const preset of layer ? [] : boardPresets)
      this.paletteButton('#board-presets', preset.name, () => {
        const board = rectangleBoard(crypto.randomUUID(), 0, 0, preset.width, preset.height);
        if ('triangle' in preset && board.kind === 'polygon') board.points.splice(2, 1);
        return board;
      });
    this.control<HTMLInputElement>('#edit-boards').addEventListener('change', () => {
      this.cancel();
      this.tool = null;
      this.port.modeChanged();
      this.render();
    });
    this.control<HTMLSelectElement>('#board-select').addEventListener('change', () => {
      this.cancel();
      this.selectedId = this.control<HTMLSelectElement>('#board-select').value;
      this.tool = null;
      this.enable();
      this.render();
    });
    this.button('#board-select-tool', () => {
      this.cancel();
      this.tool = null;
      this.selectedId = '';
      this.enable();
      this.render();
    });
    this.button('#add-board', () => {
      this.publish(this.create('rectangle'));
      this.port.fit();
    });
    this.button('#board-add-shape', () => {
      if (!this.tool) throw new Error('Choose a baseboard shape first.');
      this.publish(this.readChanges(this.tool));
    });
    this.button('#board-apply', () => this.publish(this.readChanges(this.selected())));
    this.button('#board-remove', () => {
      if (this.port.commit(this.remove(this.selected().id))) this.selectedId = '';
      this.render();
    });
    this.button('#unbounded', () => {
      this.cancel();
      this.tool = null;
      if (
        this.port.commit(
          this.layer
            ? this.layer.clear(this.port.state())
            : updateLayout(this.port.state(), { ...activeLayout(this.port.state()), boards: [] }),
        )
      )
        this.selectedId = '';
      this.render();
    });
    this.button('#board-apply-corners', () => {
      const board = this.selected();
      if (board.kind !== 'polygon') throw new Error('Select a polygon corner.');
      const next = {
        ...board,
        points: board.points.map((_, i) => ({
          x: this.value(`#corner-${i}-x`),
          y: this.value(`#corner-${i}-y`),
        })),
      };
      this.publish(next);
    });
  }

  get editing(): boolean {
    return this.control<HTMLInputElement>('#edit-boards').checked;
  }
  get busy(): boolean {
    return this.gesture !== null;
  }
  get placing(): boolean {
    return this.tool !== null;
  }
  leave(): void {
    this.cancel();
    this.tool = null;
    this.control<HTMLInputElement>('#edit-boards').checked = false;
    this.render();
  }
  private control<T extends Element>(selector: string): T {
    const element = this.root.querySelector<T>(
      this.layer ? selector.replace(/^#/, '#room-') : selector,
    );
    if (!element) throw new Error(`Required baseboard control missing: ${selector}`);
    return element;
  }
  private value(selector: string): number {
    const value = this.control<HTMLInputElement>(selector).valueAsNumber;
    if (!Number.isFinite(value))
      throw new Error('Enter finite baseboard dimensions and coordinates.');
    return value;
  }
  private run(operation: () => void): void {
    try {
      operation();
    } catch (error) {
      this.port.error(error instanceof Error ? error.message : String(error));
    }
  }
  private button(selector: string, operation: () => void): void {
    this.control<HTMLButtonElement>(selector).addEventListener('click', () => this.run(operation));
  }
  private selected(): Board {
    const board = this.shapes().find((board) => board.id === this.selectedId);
    if (!board) throw new Error('Select a baseboard shape.');
    return board;
  }
  private shapes(): Board[] {
    return this.layer
      ? this.layer.shapes(this.port.state())
      : activeLayout(this.port.state()).boards;
  }
  private remove(id: string): PlannerState {
    return this.layer
      ? this.layer.remove(this.port.state(), id)
      : removeBoard(this.port.state(), id);
  }
  private enable(): void {
    this.control<HTMLInputElement>('#edit-boards').checked = true;
    this.port.modeChanged();
  }
  private create(shape: Shape): Board {
    const pose = {
      id: crypto.randomUUID(),
      x: this.value('#board-x'),
      y: this.value('#board-y'),
      angle: this.value('#board-angle'),
    };
    if (shape === 'circle') return { ...pose, kind: 'circle', radius: this.value('#board-radius') };
    if (shape === 'semicircle' || shape === 'arc')
      return {
        ...pose,
        kind: 'arc',
        radius: this.value('#board-radius'),
        innerRadius: shape === 'semicircle' ? 0 : this.value('#board-inner'),
        sweep: shape === 'semicircle' ? 180 : this.value('#board-sweep'),
      };
    const board = rectangleBoard(
      pose.id,
      pose.x,
      pose.y,
      this.value('#board-width'),
      this.value('#board-height'),
    );
    board.angle = pose.angle;
    if (shape === 'triangle' && board.kind === 'polygon') board.points.splice(2, 1);
    return board;
  }
  private readChanges(board: Board): Board {
    const pose = {
      ...board,
      x: this.value('#board-x'),
      y: this.value('#board-y'),
      angle: this.value('#board-angle'),
    };
    if (pose.kind === 'circle') return { ...pose, radius: this.value('#board-radius') };
    if (pose.kind === 'arc')
      return {
        ...pose,
        radius: this.value('#board-radius'),
        innerRadius: this.value('#board-inner'),
        sweep: this.value('#board-sweep'),
      };
    const xs = pose.points.map((p) => p.x),
      ys = pose.points.map((p) => p.y);
    const minX = Math.min(...xs),
      minY = Math.min(...ys);
    const width = this.value('#board-width'),
      height = this.value('#board-height');
    if (width <= 0 || height <= 0) throw new Error('Baseboard dimensions must be positive.');
    return {
      ...pose,
      points: pose.points.map((p) => ({
        x: minX + ((p.x - minX) * width) / (Math.max(...xs) - minX),
        y: minY + ((p.y - minY) * height) / (Math.max(...ys) - minY),
      })),
    };
  }
  private publish(board: Board): void {
    validateBoard(board);
    const next = this.layer
      ? this.layer.put(this.port.state(), board)
      : putBoard(this.port.state(), board);
    if (this.port.commit(next)) {
      this.selectedId = board.id;
      this.tool = null;
      this.render();
    }
  }
  private snapped(board: Board): Board {
    return this.port.snap() ? snapBoard(board, this.shapes(), 15 / this.port.scale()) : board;
  }
  private showPreview(board: Board, invalid = false): void {
    select(this.preview)
      .selectAll<SVGPathElement, Board>('path')
      .data([board])
      .join('path')
      .attr('d', boardPath)
      .attr('transform', (b) => `translate(${b.x},${b.y}) rotate(${b.angle})`)
      .attr('fill-rule', 'evenodd')
      .attr('class', invalid ? 'baseboard-preview invalid' : 'baseboard-preview');
  }
  cancel(): void {
    const gesture = this.gesture;
    this.gesture = null;
    if (gesture?.source.hasPointerCapture(gesture.pointerId))
      gesture.source.releasePointerCapture(gesture.pointerId);
    this.preview.replaceChildren();
  }

  private paletteButton(selector: string, label: string, make: () => Board): void {
    const button = document.createElement('button');
    button.textContent = label;
    button.setAttribute('aria-label', this.layer ? `Room shape ${label}` : `Board ${label}`);
    this.control<HTMLElement>(selector).append(button);
    button.addEventListener('pointerdown', (event) =>
      this.run(() => {
        if (event.button !== 0) return;
        if (this.gesture && this.gesture.pointerId !== event.pointerId) {
          this.cancel();
          this.tool = null;
          this.suppressClick = true;
          this.render();
          return;
        }
        this.cancel();
        this.enable();
        this.selectedId = '';
        const board = make();
        validateBoard(board);
        this.tool = board;
        this.render();
        this.gesture = {
          pointerId: event.pointerId,
          original: board,
          candidate: board,
          start: { x: event.clientX, y: event.clientY },
          moved: false,
          invalid: false,
          source: button,
        };
        button.setPointerCapture(event.pointerId);
      }),
    );
    button.addEventListener('pointermove', (event) =>
      this.run(() => {
        const gesture = this.gesture;
        if (!gesture || gesture.source !== button || gesture.pointerId !== event.pointerId) return;
        if (
          !gesture.moved &&
          Math.hypot(event.clientX - gesture.start.x, event.clientY - gesture.start.y) < 4
        )
          return;
        gesture.moved = true;
        const bounds = this.svg.getBoundingClientRect();
        gesture.invalid =
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom;
        if (gesture.invalid) {
          this.preview.replaceChildren();
          return;
        }
        gesture.candidate = this.snapped({
          ...gesture.original,
          ...this.port.point({ x: event.clientX, y: event.clientY }),
        });
        this.showPreview(gesture.candidate);
      }),
    );
    button.addEventListener('pointerup', (event) =>
      this.run(() => {
        const gesture = this.gesture;
        if (!gesture || gesture.source !== button || gesture.pointerId !== event.pointerId) return;
        this.cancel();
        if (gesture.moved) {
          this.suppressClick = true;
          if (!gesture.invalid) this.publish({ ...gesture.candidate, id: crypto.randomUUID() });
        }
      }),
    );
    button.addEventListener('pointercancel', () => this.cancel());
    button.addEventListener('lostpointercapture', () => {
      if (this.gesture?.source === button) this.cancel();
    });
    button.addEventListener('click', () =>
      this.run(() => {
        if (this.suppressClick) {
          this.suppressClick = false;
          return;
        }
        this.enable();
        this.selectedId = '';
        this.tool = make();
        validateBoard(this.tool);
        this.render();
      }),
    );
  }

  pointerDown(event: PointerEvent): void {
    this.run(() => {
      if (this.gesture) {
        if (this.gesture.pointerId !== event.pointerId) {
          this.cancel();
          this.tool = null;
          this.suppressClick = true;
          this.render();
        }
        return;
      }
      if (event.button !== 0 || this.tool) return;
      const hit =
        event.target instanceof Element
          ? event.target.closest<SVGGElement>('[data-board-id]')
          : null;
      const id = hit?.dataset['boardId'];
      const board = this.shapes().find((b) => b.id === id);
      if (!board) return;
      this.selectedId = board.id;
      const handle =
        event.target instanceof SVGElement ? event.target.dataset['corner'] : undefined;
      this.gesture = {
        pointerId: event.pointerId,
        original: board,
        candidate: board,
        start: this.port.point({ x: event.clientX, y: event.clientY }),
        moved: false,
        invalid: false,
        source: this.svg,
        ...(handle !== undefined ? { corner: Number(handle) } : {}),
      };
      this.svg.setPointerCapture(event.pointerId);
      event.stopPropagation();
      this.render();
    });
  }
  pointerMove(event: PointerEvent): void {
    this.run(() => {
      const point = this.port.point({ x: event.clientX, y: event.clientY });
      const gesture = this.gesture;
      if (!gesture) {
        if (this.tool) this.showPreview(this.snapped({ ...this.tool, ...point }));
        return;
      }
      if (gesture.source !== this.svg || gesture.pointerId !== event.pointerId) return;
      if (
        !gesture.moved &&
        Math.hypot(point.x - gesture.start.x, point.y - gesture.start.y) * this.port.scale() < 3
      )
        return;
      gesture.moved = true;
      try {
        if (gesture.corner !== undefined) {
          const target = this.port.snap()
            ? snapBoardPoint(
                point,
                this.shapes().filter((b) => b.id !== gesture.original.id),
                15 / this.port.scale(),
              )
            : point;
          gesture.candidate = moveBoardCorner(gesture.original, gesture.corner, target);
        } else
          gesture.candidate = this.snapped({
            ...gesture.original,
            x: gesture.original.x + point.x - gesture.start.x,
            y: gesture.original.y + point.y - gesture.start.y,
          });
        gesture.invalid = false;
      } catch (error) {
        gesture.invalid = true;
        this.port.error(error instanceof Error ? error.message : String(error));
      }
      this.showPreview(gesture.candidate, gesture.invalid);
    });
  }
  pointerUp(event: PointerEvent): void {
    this.run(() => {
      const gesture = this.gesture;
      if (!gesture || gesture.source !== this.svg || gesture.pointerId !== event.pointerId) return;
      this.cancel();
      if (gesture.moved && !gesture.invalid) this.publish(gesture.candidate);
      this.suppressClick = true;
      this.render();
    });
  }
  click(event: MouseEvent): void {
    this.run(() => {
      if (this.suppressClick) {
        this.suppressClick = false;
        return;
      }
      if (this.tool) {
        this.publish(
          this.snapped({
            ...this.readChanges(this.tool),
            ...this.port.point({ x: event.clientX, y: event.clientY }),
            id: crypto.randomUUID(),
          }),
        );
      } else if (!(event.target instanceof Element) || !event.target.closest('[data-board-id]')) {
        this.selectedId = '';
        this.render();
      }
    });
  }
  key(event: KeyboardEvent): void {
    this.run(() => {
      if (event.key === 'Escape') {
        this.cancel();
        this.tool = null;
        this.render();
        return;
      }
      if ((event.key === 'Enter' || event.key === ' ') && event.target instanceof Element) {
        const id = event.target.closest<SVGGElement>('[data-board-id]')?.dataset['boardId'];
        if (id) {
          event.preventDefault();
          this.selectedId = id;
          this.tool = null;
          this.render();
        }
      }
      if (!this.selectedId) return;
      const board = this.selected(),
        step = event.shiftKey ? 1 : 5;
      const moves: Record<string, Vec> = {
        ArrowLeft: { x: -step, y: 0 },
        ArrowRight: { x: step, y: 0 },
        ArrowUp: { x: 0, y: -step },
        ArrowDown: { x: 0, y: step },
      };
      const move = moves[event.key];
      if (move) {
        event.preventDefault();
        this.publish({ ...board, x: board.x + move.x, y: board.y + move.y });
      }
      if (event.key.toLowerCase() === 'r') this.publish({ ...board, angle: board.angle + 22.5 });
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        if (this.port.commit(this.remove(board.id))) this.selectedId = '';
        this.render();
      }
    });
  }

  render(): void {
    const shapes = this.shapes();
    if (!shapes.some((b) => b.id === this.selectedId)) this.selectedId = '';
    this.svg.classList.toggle(this.layer ? 'editing-room' : 'editing-boards', this.editing);
    select(this.boards)
      .selectAll<SVGGElement, Board>('g.baseboard')
      .data(shapes, (b) => b.id)
      .join('g')
      .attr(
        'class',
        (b) => `baseboard${b.id === this.selectedId && this.editing ? ' selected-board' : ''}`,
      )
      .attr('data-board-id', (b) => b.id)
      .attr('data-room-role', (b) => this.layer?.role(b) ?? null)
      .attr('data-user-label', this.layer ? '' : null)
      .attr('data-user-text', this.layer ? '' : null)
      .attr('role', 'button')
      .attr('tabindex', this.editing ? 0 : -1)
      .attr('aria-label', (b) => (this.layer ? this.layer.label(b) : `Select baseboard ${b.kind}`))
      .attr('transform', (b) => `translate(${b.x},${b.y}) rotate(${b.angle})`)
      .attr('pointer-events', this.editing ? 'all' : 'none')
      .each((board, index, groups) => {
        const group = groups[index];
        if (!group) throw new Error('Missing baseboard element.');
        select(group)
          .selectAll<SVGPathElement, Board>('path')
          .data([board])
          .join('path')
          .attr('d', boardPath)
          .attr('fill-rule', 'evenodd')
          .attr('class', 'board-surface');
        const layer = this.layer;
        if (layer) {
          select(group)
            .selectAll<SVGTitleElement, Board>('title')
            .data([board])
            .join('title')
            .text((b) => layer.label(b));
          select(group)
            .selectAll<SVGTextElement, Board>('text')
            .data([board])
            .join('text')
            .attr('x', (b) => boardBounds({ ...b, x: 0, y: 0, angle: 0 }).x + 12)
            .attr('y', (b) => boardBounds({ ...b, x: 0, y: 0, angle: 0 }).y + 24)
            .attr('data-user-text', '')
            .attr('pointer-events', 'none')
            .text((b) => layer.label(b));
        }
        const corners =
          board.kind === 'polygon' && board.id === this.selectedId && this.editing
            ? board.points
            : [];
        select(group)
          .selectAll<SVGCircleElement, Vec>('circle')
          .data(corners)
          .join('circle')
          .attr('class', 'board-corner')
          .attr('data-corner', (_, i) => i)
          .attr('cx', (p) => p.x)
          .attr('cy', (p) => p.y)
          .attr('r', 6 / this.port.scale());
      });
    select(this.boards)
      .selectAll<SVGGElement, Board>('g.baseboard')
      .filter((board) => this.editing && board.id === this.selectedId)
      .raise();
    const picker = this.control<HTMLSelectElement>('#board-select');
    picker.replaceChildren(
      new Option('New shape', ''),
      ...shapes.map((b, i) => {
        const option = new Option(
          this.layer ? this.layer.label(b) : `Board ${i + 1}: ${b.kind}`,
          b.id,
        );
        if (this.layer) option.dataset['userText'] = '';
        return option;
      }),
    );
    picker.value = this.selectedId;
    const board = shapes.find((b) => b.id === this.selectedId) ?? this.tool;
    this.layer?.selected(this.selectedId ? (board ?? undefined) : undefined);
    this.control<HTMLElement>('#board-tool-status').textContent = this.layer
      ? this.tool
        ? 'Place room shape: drag from the palette or tap the canvas.'
        : 'Select a room shape to move, rotate or reshape it.'
      : this.tool
        ? 'Place board: drag from the palette or tap the canvas.'
        : 'Select a board to move, rotate or reshape it.';
    for (const id of ['#board-apply', '#board-remove'])
      this.control<HTMLButtonElement>(id).disabled = !this.selectedId;
    this.control<HTMLButtonElement>('#board-add-shape').disabled = !this.tool;
    this.control<HTMLElement>('#board-size').hidden = !!board && board.kind !== 'polygon';
    this.control<HTMLElement>('#board-round').hidden = !board || board.kind === 'polygon';
    this.control<HTMLElement>('#board-arc').hidden = board?.kind !== 'arc';
    this.control<HTMLElement>('#board-corner-details').hidden =
      !this.selectedId || board?.kind !== 'polygon';
    if (!board) return;
    this.renderShapeFields(board);
  }

  private renderShapeFields(board: Board): void {
    const values: Record<string, number> = { x: board.x, y: board.y, angle: board.angle };
    if (board.kind === 'polygon') {
      const local = { ...board, x: 0, y: 0, angle: 0 };
      const bounds = boardBounds(local);
      values['width'] = bounds.width;
      values['height'] = bounds.height;
    } else {
      values['radius'] = board.radius;
      if (board.kind === 'arc') {
        values['inner'] = board.innerRadius;
        values['sweep'] = board.sweep;
      }
    }
    for (const [key, value] of Object.entries(values))
      this.control<HTMLInputElement>(`#board-${key}`).value = String(value);
    const corners = this.control<HTMLElement>('#board-corners');
    corners.replaceChildren();
    if (board.kind === 'polygon')
      board.points.forEach((point, i) => {
        const row = document.createElement('div');
        row.className = 'two-columns';
        for (const axis of ['x', 'y'] as const) {
          const label = document.createElement('label');
          label.textContent = `Corner ${i + 1} ${axis.toUpperCase()} (mm)`;
          const input = document.createElement('input');
          input.type = 'number';
          input.id = `${this.layer ? 'room-' : ''}corner-${i}-${axis}`;
          input.value = String(point[axis]);
          label.append(input);
          row.append(label);
        }
        corners.append(row);
      });
  }
}
