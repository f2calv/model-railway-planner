import { definition } from './catalog';
import { ports } from './geometry';
import type { ElectricalSettings, Piece, PlannerState } from './model';
import { activeLayout, setElectrical, updateLayout } from './state';
import type { PowerAnalysis } from './power';

interface PowerEditorPort {
  state(): PlannerState;
  selected(): Piece | undefined;
  single(): boolean;
  readonly(): boolean;
  commit(state: PlannerState, message: string): boolean;
  action(operation: () => void): void;
  redraw(): void;
}

export class PowerEditor {
  private readonly root: HTMLElement;
  private readonly port: PowerEditorPort;

  constructor(root: HTMLElement, port: PowerEditorPort) {
    this.root = root;
    this.port = port;
    root.innerHTML = `
      <h2>Track power</h2>
      <label>Power system<select id="power-mode"><option value="">Not configured</option><option value="dc">DC (analogue)</option><option value="dcc">DCC (digital)</option></select></label>
      <label class="check-label"><input id="power-overlay" type="checkbox" checked /> Show power overlay</label>
      <p class="subtle">Green: powered. Orange: unpowered. Yellow: partial. Purple: unverified.</p>
      <p class="subtle">Planning estimate only: one controller, sound rail joints. No polarity, short-circuit or wiring certification.</p>
      <p class="subtle">Powered estimates assume all planned parts are fitted, including shopping-list items.</p>
      <div id="power-summary"></div>
      <p id="power-selection-note">Select one unlocked track piece to edit its power settings.</p>
      <fieldset id="power-piece-controls">
        <legend>Selected track power</legend>
        <label>Feed type<select id="power-feed-kind"></select></label>
        <label>Feed connector<select id="power-feed-port"></select></label>
        <label class="check-label"><input id="power-feed-connected" type="checkbox" /> Connected to the selected controller</label>
        <div id="power-point-controls">
          <label>Point position<select id="power-point-route"><option value="">Unknown position</option><option value="0">Route 1</option><option value="1">Route 2</option></select></label>
          <label>Point bypass<select id="power-bypass"><option value="">No bypass</option><option value="clips">R8232 pair (2 clips)</option><option value="soldered">Soldered bypass</option></select></label>
        </div>
        <button id="power-apply">Apply power settings</button>
        <div id="power-piece-status"></div>
      </fieldset>`;
    this.select('#power-mode').addEventListener('change', () =>
      port.action(() => {
        const value = this.select('#power-mode').value;
        const layout = { ...activeLayout(port.state()) };
        delete layout.powerMode;
        if (value === 'dc' || value === 'dcc') layout.powerMode = value;
        else if (value !== '') throw new Error('Choose DC or DCC power.');
        if (!port.commit(updateLayout(port.state(), layout), 'Track power updated')) port.redraw();
      }),
    );
    this.input('#power-overlay').addEventListener('change', () => port.redraw());
    this.select('#power-feed-kind').addEventListener('change', () => this.feedControls());
    this.get('#power-apply', HTMLButtonElement).addEventListener('click', () =>
      port.action(() => {
        const piece = port.selected();
        if (!piece || !port.single()) throw new Error('Select one track piece.');
        const settings: ElectricalSettings = {};
        const kind = this.select('#power-feed-kind').value;
        if (kind === 'native' || kind === 'r602' || kind === 'r8242' || kind === 'manual')
          settings.feed = {
            kind,
            port: Number(this.select('#power-feed-port').value),
            connected: this.input('#power-feed-connected').checked,
          };
        else if (kind !== '') throw new Error('Choose a valid power feed.');
        const route = this.select('#power-point-route').value;
        if (route === '0' || route === '1') settings.pointRoute = route === '0' ? 0 : 1;
        else if (route !== '') throw new Error('Choose a supported point route.');
        const bypass = this.select('#power-bypass').value;
        if (bypass === 'clips' || bypass === 'soldered') settings.bypass = bypass;
        else if (bypass !== '') throw new Error('Choose a supported point bypass.');
        if (!port.commit(setElectrical(port.state(), piece.id, settings), 'Track power updated'))
          port.redraw();
      }),
    );
  }

  private get<T extends HTMLElement>(selector: string, type: { new (): T }): T {
    const element = this.root.querySelector(selector);
    if (!(element instanceof type)) throw new Error(`Required power control missing: ${selector}`);
    return element;
  }
  private select(selector: string): HTMLSelectElement {
    return this.get(selector, HTMLSelectElement);
  }
  private input(selector: string): HTMLInputElement {
    return this.get(selector, HTMLInputElement);
  }
  private feedControls(): void {
    const disabled = !this.select('#power-feed-kind').value;
    this.select('#power-feed-port').disabled = disabled;
    this.input('#power-feed-connected').disabled = disabled;
  }
  get overlay(): boolean {
    return this.input('#power-overlay').checked;
  }

  render(analysis: PowerAnalysis): void {
    const layout = activeLayout(this.port.state());
    this.select('#power-mode').value = layout.powerMode ?? '';
    this.select('#power-mode').disabled = this.port.readonly();
    this.renderSummary(analysis, layout.powerMode);
    this.renderPiece(analysis);
  }

  private renderSummary(analysis: PowerAnalysis, powerMode: 'dc' | 'dcc' | undefined): void {
    const summary = this.get('#power-summary', HTMLDivElement);
    const counts = (status: string) =>
      analysis.routes.filter((route) => route.status === status).length;
    const complete =
      !!analysis.routes.length &&
      analysis.routes.every((route) => route.status === 'powered') &&
      !analysis.warnings.length;
    const messages = powerMode
      ? [
          `Power routes: ${counts('powered')} powered / ${counts('unpowered')} unpowered / ${counts('partial')} partial / ${counts('unverified')} unverified.`,
          `Compatible connected feeds: ${analysis.feeds}.`,
          ...(complete ? ['All modelled routes powered.'] : []),
          ...(powerMode === 'dc' ? ['DC dead sidings may be intentional.'] : []),
          ...analysis.warnings,
        ]
      : ['Choose DC or DCC to check power connectivity.'];
    summary.replaceChildren(
      ...messages.map((message) => {
        const paragraph = document.createElement('p');
        paragraph.textContent = message;
        return paragraph;
      }),
    );
    summary.className = complete ? 'check-ok' : powerMode ? 'check-warning' : '';
  }

  private renderPiece(analysis: PowerAnalysis): void {
    const piece = this.port.single() ? this.port.selected() : undefined;
    this.get('#power-piece-controls', HTMLFieldSetElement).disabled =
      !piece || !!piece.locked || this.port.readonly();
    const entry = piece ? definition(piece.trackId) : undefined;
    const kinds = [
      new Option('No feed', ''),
      ...(entry?.electrical?.nativeFeed ? [new Option('Native power track', 'native')] : []),
      ...(piece && ['hornby-oo-r600', 'hornby-oo-r601'].includes(piece.trackId)
        ? [new Option('R602 DC clip', 'r602'), new Option('R8242 DCC clip', 'r8242')]
        : []),
      new Option('Manual feeder (operator declaration)', 'manual'),
    ];
    this.select('#power-feed-kind').replaceChildren(...kinds);
    this.select('#power-feed-kind').value = piece?.electrical?.feed?.kind ?? '';
    this.select('#power-feed-port').replaceChildren(
      ...(piece
        ? ports(piece).map(
            (port, index) =>
              new Option(
                `Connector ${index + 1}: ${Math.round(port.x)}, ${Math.round(port.y)} mm`,
                String(index),
              ),
          )
        : []),
    );
    this.select('#power-feed-port').value = String(piece?.electrical?.feed?.port ?? 0);
    this.input('#power-feed-connected').checked = piece?.electrical?.feed?.connected ?? false;
    this.select('#power-point-route').value =
      piece?.electrical?.pointRoute === undefined ? '' : String(piece.electrical.pointRoute);
    this.select('#power-bypass').value = piece?.electrical?.bypass ?? '';
    this.get('#power-point-controls', HTMLDivElement).hidden =
      entry?.electrical?.behavior !== 'turnout';
    this.feedControls();
    this.get('#power-piece-status', HTMLDivElement).replaceChildren(
      ...analysis.routes
        .filter((route) => route.pieceId === piece?.id)
        .map((route) => {
          const paragraph = document.createElement('p');
          paragraph.textContent = `Power ${entry?.code ?? ''} route ${route.route + 1}: ${route.status}`;
          return paragraph;
        }),
    );
  }
}
