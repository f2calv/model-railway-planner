import { catalogBrands, filterCatalog, trackSize } from './catalog';
import type { PlannerState } from './model';
import { gaugeGroups } from './profiles';
import { activeLayout, used } from './state';
import { translate, translateUi } from './i18n';
import type { Language } from './preferences';
import type { CatalogPageSettings } from './page-settings';

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
      </div>
      <p id="browser-count" role="status"></p>
      <div class="catalog-table-scroll" tabindex="0" role="region" aria-label="Registered track pieces">
        <table class="catalog-table"><caption>Registered track pieces</caption><thead><tr>
          <th scope="col">Code</th><th scope="col">Brand</th><th scope="col">Scale / gauge</th>
          <th scope="col">Description</th><th scope="col">Dimensions</th><th scope="col">Owned</th>
          <th scope="col">Used in this idea</th><th scope="col">Source</th>
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
  }

  private control<T extends HTMLElement>(selector: string, type: { new (): T }): T {
    const node = this.root.querySelector(selector);
    if (!(node instanceof type)) throw new Error(`Missing catalog control: ${selector}`);
    return node;
  }

  get filters(): CatalogPageSettings {
    return {
      gauge: this.control('#browser-gauge', HTMLSelectElement).value,
      brand: this.control('#browser-manufacturer', HTMLSelectElement).value,
      query: this.control('#browser-search', HTMLInputElement).value,
    };
  }

  restore(filters: CatalogPageSettings): void {
    this.control('#browser-gauge', HTMLSelectElement).value = filters.gauge;
    this.control('#browser-search', HTMLInputElement).value = filters.query;
    this.render();
    this.control('#browser-manufacturer', HTMLSelectElement).value = catalogBrands(
      filters.gauge,
    ).includes(filters.brand)
      ? filters.brand
      : '';
    this.render();
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
    const matches = filterCatalog({ gauge, brand: manufacturer.value, query });
    const state = this.state(),
      layout = activeLayout(state);
    this.control('#browser-pieces', HTMLTableSectionElement).replaceChildren(
      ...matches.map((entry) => {
        const row = document.createElement('tr');
        row.dataset['catalogId'] = entry.id;
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
        cell(String(used(layout, entry.id)));
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
