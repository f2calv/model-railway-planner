import { catalogBrands, filterCatalog, trackSize } from './catalog';
import type { PlannerState, TrackDefinition } from './model';
import { gaugeGroups } from './profiles';
import { drawingLayers, layoutBounds } from './exports';
import { pathData } from './geometry';
import { translate, translateUi } from './i18n';
import type { Language } from './preferences';
import type { BrowserPageSettings } from './page-settings';

export class CatalogBrowser {
  private readonly root: HTMLElement;
  private readonly state: () => PlannerState;
  private readonly language: () => Language;

  constructor(root: HTMLElement, state: () => PlannerState, language: () => Language) {
    this.root = root;
    this.state = state;
    this.language = language;
    root.innerHTML = `
      <h2 tabindex="-1">Track catalog</h2>
      <p>All registered pieces, not just owned stock. Filters do not change your layouts or inventory.</p>
      <div class="catalog-filters">
        <label>Gauge<select id="browser-gauge"><option value="">All gauges</option>${gaugeGroups.map((g) => `<option value="${g.id}" ${g.id === 'oo-ho' ? 'selected' : ''}>${g.label}</option>`).join('')}</select></label>
        <label>Brand<select id="browser-manufacturer"></select></label>
        <label>Wildcard filter<input id="browser-search" type="search" maxlength="256" placeholder="Code or type; * any text, ? one character" /></label>
        <label class="catalog-owned-filter"><input id="browser-owned" type="checkbox" />Owned only</label>
      </div>
      <p>Schematic previews are individually scaled; accessories use a symbol, not a physical footprint.</p>
      <p id="browser-count" role="status"></p>
      <div class="catalog-table-scroll" tabindex="0" role="region" aria-label="Registered track pieces">
        <table class="catalog-table"><caption>Registered track pieces</caption><thead><tr>
          <th scope="col">Preview</th><th scope="col">Code</th><th scope="col">Brand</th><th scope="col">Scale / gauge</th>
          <th scope="col">Description</th><th scope="col">Dimensions</th><th scope="col">Owned</th>
          <th scope="col">Source</th>
        </tr></thead><tbody id="browser-pieces"></tbody></table>
      </div>
      <p id="browser-empty" hidden>No registered pieces match these filters.</p>`;
    this.control('#browser-gauge', HTMLSelectElement).addEventListener('change', () =>
      this.render(),
    );
    this.control('#browser-manufacturer', HTMLSelectElement).addEventListener('change', () =>
      this.render(),
    );
    this.control('#browser-search', HTMLInputElement).addEventListener('input', () =>
      this.render(),
    );
    this.control('#browser-owned', HTMLInputElement).addEventListener('change', () =>
      this.render(),
    );
  }

  private control<T extends HTMLElement>(selector: string, type: { new (): T }): T {
    const node = this.root.querySelector(selector);
    if (!(node instanceof type)) throw new Error(`Missing catalog control: ${selector}`);
    return node;
  }

  get filters(): BrowserPageSettings {
    return {
      gauge: this.control('#browser-gauge', HTMLSelectElement).value,
      brand: this.control('#browser-manufacturer', HTMLSelectElement).value,
      query: this.control('#browser-search', HTMLInputElement).value,
      ownedOnly: this.control('#browser-owned', HTMLInputElement).checked,
    };
  }

  restore(filters: BrowserPageSettings): void {
    this.control('#browser-gauge', HTMLSelectElement).value = filters.gauge;
    this.control('#browser-search', HTMLInputElement).value = filters.query;
    this.control('#browser-owned', HTMLInputElement).checked = filters.ownedOnly;
    this.render();
    this.control('#browser-manufacturer', HTMLSelectElement).value = catalogBrands(
      filters.gauge,
    ).includes(filters.brand)
      ? filters.brand
      : '';
    this.render();
  }

  private preview(entry: TrackDefinition): SVGSVGElement {
    const namespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(namespace, 'svg');
    svg.classList.add('catalog-preview');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `${entry.code}: ${translate(entry.name, this.language())}`);
    const bounds = layoutBounds({
      id: entry.id,
      name: entry.name,
      pieces: [{ id: entry.id, trackId: entry.id, x: 0, y: 0, angle: 0, flipped: false }],
      boards: [],
    });
    svg.setAttribute(
      'viewBox',
      bounds ? `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}` : '-20 -20 40 40',
    );
    if (entry.routes.length) {
      for (const route of entry.routes)
        for (const layer of drawingLayers(false, false, entry.gaugeMm)) {
          const path = document.createElementNS(namespace, 'path');
          path.setAttribute('d', pathData(route));
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', layer.stroke);
          path.setAttribute('stroke-width', String(layer.width));
          path.setAttribute('stroke-dasharray', layer.dash);
          svg.append(path);
        }
    } else {
      const path = document.createElementNS(namespace, 'path');
      path.setAttribute('d', 'M-10,-12V12M10,-12V12M-10,0H10');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', '3');
      svg.append(path);
    }
    return svg;
  }

  render(): void {
    const gauge = this.control('#browser-gauge', HTMLSelectElement).value;
    const manufacturer = this.control('#browser-manufacturer', HTMLSelectElement);
    const previous = manufacturer.value;
    const language = this.language();
    const brands = catalogBrands(gauge);
    const group = gaugeGroups.find((group) => group.id === gauge);
    manufacturer.replaceChildren(
      new Option(translate(group ? `All ${group.label} brands` : 'All brands', language), ''),
      ...brands.map((brand) => new Option(brand, brand)),
    );
    manufacturer.value = brands.includes(previous) ? previous : '';
    const query = this.control('#browser-search', HTMLInputElement).value.trim().toLowerCase();
    const state = this.state();
    const ownedOnly = this.control('#browser-owned', HTMLInputElement).checked;
    const matches = filterCatalog({ gauge, brand: manufacturer.value, query }).filter(
      (entry) => !ownedOnly || (state.inventory[entry.id] ?? 0) > 0,
    );
    this.control('#browser-pieces', HTMLTableSectionElement).replaceChildren(
      ...matches.map((entry) => {
        const row = document.createElement('tr');
        row.dataset['catalogId'] = entry.id;
        const preview = document.createElement('td');
        preview.append(this.preview(entry));
        row.append(preview);
        const cell = (value: string) => {
          const node = document.createElement('td');
          node.textContent = value;
          row.append(node);
        };
        cell(entry.code);
        cell(entry.brand);
        cell(`${entry.scale} / ${entry.gaugeMm} mm`);
        cell(translate(entry.name, language));
        cell(translate(trackSize(entry), language));
        cell(String(state.inventory[entry.id] ?? 0));
        const source = document.createElement('td'),
          link = document.createElement('a');
        link.href = entry.source;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = translate('Product source', language);
        source.append(link);
        row.append(source);
        return row;
      }),
    );
    this.control('#browser-count', HTMLParagraphElement).replaceChildren(
      document.createTextNode(`${matches.length} registered pieces`),
    );
    this.control('#browser-empty', HTMLParagraphElement).hidden = matches.length > 0;
    translateUi(this.root, language);
  }
}
