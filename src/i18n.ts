import type { Language } from './preferences';
import translations from './translations.json';

const messages: Readonly<Record<string, readonly string[]>> = translations;

const languageIndex: Record<Exclude<Language, 'en'>, number> = { de: 0, fr: 1, es: 2, it: 3 };
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
const templates = Object.entries(messages)
  .filter(([source]) => source.includes('{'))
  .sort(([a], [b]) => b.replace(/\{\w+\}/g, '').length - a.replace(/\{\w+\}/g, '').length)
  .map(([source, values]) => {
    const keys: string[] = [];
    let pattern = '^';
    let start = 0;
    for (const match of source.matchAll(/\{(\w+)\}/g)) {
      const key = match[1];
      if (!key) throw new Error('Invalid translation parameter.');
      pattern += `${escape(source.slice(start, match.index))}(.*?)`;
      keys.push(key);
      start = match.index + match[0].length;
    }
    return { pattern: new RegExp(`${pattern}${escape(source.slice(start))}$`, 's'), keys, values };
  });

export function translate(text: string, language: Language, depth = 0): string {
  if (language === 'en' || !text.trim() || depth > 4) return text;
  const source = text.trim();
  const index = languageIndex[language];
  let translated = messages[source]?.[index];
  if (!translated) {
    for (const template of templates) {
      const match = template.pattern.exec(source);
      if (!match) continue;
      const target = template.values[index];
      if (!target) throw new Error('Missing language translation.');
      translated = target.replace(/\{(\w+)\}/g, (_, key: string) => {
        const position = template.keys.indexOf(key);
        const value = match[position + 1];
        if (position < 0 || value === undefined) throw new Error('Missing translation parameter.');
        return translate(value, language, depth + 1);
      });
      break;
    }
  }
  return translated ? text.replace(source, translated) : text;
}

const texts = new WeakMap<Node, string>();
const attributes = new WeakMap<Element, Map<string, { source: string; rendered: string }>>();
const privateText =
  '#layouts, #layout-name, #language, #app-version, #error-details, [data-user-text]';

export function translateUi(root: Element, language: Language): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.parentElement?.closest(privateText)) continue;
    const source = texts.get(node) ?? node.textContent ?? '';
    texts.set(node, source);
    node.textContent = translate(source, language);
  }
  for (const node of [root, ...root.querySelectorAll('[aria-label], [title], [placeholder]')]) {
    const previous =
      attributes.get(node) ?? new Map<string, { source: string; rendered: string }>();
    for (const key of ['aria-label', 'title', 'placeholder']) {
      const current = node.getAttribute(key);
      if (current === null) continue;
      const record = previous.get(key);
      const source = record?.rendered === current ? record.source : current;
      const rendered = translate(source, language);
      node.setAttribute(key, rendered);
      previous.set(key, { source, rendered });
    }
    attributes.set(node, previous);
  }
}
