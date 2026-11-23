import { definition } from './catalog';
import { pathData, ports, samples } from './geometry';
import type { Layout, Piece, PlannerState } from './model';
import { activeLayout, missingPieceIds, parseState, shoppingList } from './state';

export function drawingLayers(missing = false, locked = false) {
  let bed = '#81745d';
  if (missing) bed = '#db843b';
  else if (locked) bed = '#6874ab';
  return [
    {
      name: 'track-bed',
      stroke: bed,
      width: 30,
      dash: missing ? '8 4' : '',
    },
    { name: 'sleepers', stroke: '#4e5045', width: 30, dash: '3 7' },
    { name: 'rails', stroke: '#c8c9bd', width: 19.5, dash: '' },
    { name: 'centre-line', stroke: missing ? '#85521f' : '#354338', width: 13.5, dash: '' },
  ];
}

export function layoutBounds(layout: Layout) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const include = (x: number, y: number, padding: number) => {
    minX = Math.min(minX, x - padding);
    minY = Math.min(minY, y - padding);
    maxX = Math.max(maxX, x + padding);
    maxY = Math.max(maxY, y + padding);
  };
  for (const piece of layout.pieces)
    for (const route of samples(piece)) for (const point of route) include(point.x, point.y, 20);
  for (const board of layout.boards) {
    include(board.x, board.y, 0);
    include(board.x + board.width, board.y + board.height, 0);
  }
  return minX === Infinity
    ? null
    : { x: minX - 20, y: minY - 20, width: maxX - minX + 40, height: maxY - minY + 40 };
}

function xml(text: string): string {
  for (const character of text) {
    const code = character.codePointAt(0);
    if (
      code !== undefined &&
      ((code < 32 && code !== 9 && code !== 10 && code !== 13) ||
        (code >= 0xd800 && code <= 0xdfff))
    )
      throw new Error(
        'A name contains characters SVG cannot represent. Rename it before exporting.',
      );
  }
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function validatePixelSize(pixels?: { width: number; height: number }): void {
  if (
    pixels &&
    (!Number.isInteger(pixels.width) ||
      !Number.isInteger(pixels.height) ||
      pixels.width < 1 ||
      pixels.height < 1 ||
      pixels.width > 4096 ||
      pixels.height > 4096)
  )
    throw new Error('PNG dimensions must be between 1 and 4096 pixels.');
}

function piecePaths(piece: Piece, missing: boolean): string[] {
  return definition(piece.trackId).routes.flatMap((route) =>
    drawingLayers(missing, piece.locked).map(
      (layer) =>
        `<path d="${pathData(route)}" fill="none" stroke="${layer.stroke}" stroke-width="${layer.width}" stroke-dasharray="${layer.dash}"/>`,
    ),
  );
}

export function svgExport(state: PlannerState, pixels?: { width: number; height: number }): string {
  const validated = parseState(JSON.stringify(state));
  const layout = activeLayout(validated);
  const bounds = layoutBounds(layout);
  if (!bounds) throw new Error('Add track or a baseboard before exporting.');
  validatePixelSize(pixels);
  const missing = missingPieceIds(validated);
  const content: string[] = [];
  for (const board of layout.boards)
    content.push(
      `<rect x="${board.x}" y="${board.y}" width="${board.width}" height="${board.height}" fill="#e9dfc8" stroke="#a79570" stroke-width="2"/>`,
    );
  for (const piece of layout.pieces) {
    content.push(
      `<g transform="translate(${piece.x},${piece.y}) rotate(${piece.angle}) scale(1,${piece.flipped ? -1 : 1})">`,
    );
    content.push(...piecePaths(piece, missing.has(piece.id)));
    for (const port of ports({ ...piece, x: 0, y: 0, angle: 0, flipped: false })) {
      const radians = (port.angle * Math.PI) / 180;
      const dx = 19 * Math.sin(radians),
        dy = 19 * Math.cos(radians);
      content.push(
        `<line x1="${port.x - dx}" y1="${port.y + dy}" x2="${port.x + dx}" y2="${port.y - dy}" stroke="#fff" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`,
      );
    }
    if (piece.locked)
      content.push(
        '<path d="M9 -10V-15A5 5 0 0 1 19 -15V-10M7 -10H21V2H7Z" fill="#f7e7a4" stroke="#243c35" stroke-width="2"/>',
      );
    content.push('</g>');
  }
  const width = pixels ? pixels.width : `${bounds.width}mm`;
  const height = pixels ? pixels.height : `${bounds.height}mm`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}"><title>${xml(layout.name)}</title><desc>Model railway planning overview in millimetres. Verify track geometry, rail joiners and rolling-stock clearance physically.</desc><rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" fill="#fff"/>${content.join('')}</svg>`;
}

export function csvCell(value: string): string {
  const safe = /^\s*[=+\-@]/.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function csvExport(state: PlannerState, shoppingOnly = false): string {
  const validated = parseState(JSON.stringify(state));
  const layout = activeLayout(validated);
  const shortfalls = new Map(
    shoppingList(validated).map((entry) => [entry.trackId, entry.quantity]),
  );
  const rows = [['Manufacturer', 'Scale', 'Code', 'Piece', 'Owned', 'In layout', 'To buy']];
  for (const [id, quantity] of Object.entries(validated.inventory)) {
    if (shoppingOnly && !shortfalls.has(id)) continue;
    const entry = definition(id);
    rows.push([
      entry.brand,
      entry.scale,
      entry.code,
      entry.name,
      String(quantity),
      String(layout.pieces.filter((piece) => piece.trackId === id).length),
      String(shortfalls.get(id) ?? 0),
    ]);
  }
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

export async function pngExport(state: PlannerState): Promise<Blob> {
  const layout = activeLayout(parseState(JSON.stringify(state)));
  const bounds = layoutBounds(layout);
  if (!bounds) throw new Error('Add track or a baseboard before exporting.');
  const scale = Math.min(2, 4096 / Math.max(bounds.width, bounds.height));
  const width = Math.max(1, Math.round(bounds.width * scale));
  const height = Math.max(1, Math.round(bounds.height * scale));
  const url = URL.createObjectURL(
    new Blob([svgExport(state, { width, height })], { type: 'image/svg+xml' }),
  );
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('PNG export is unavailable in this browser.');
    context.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('The browser could not encode the PNG export.'));
      }, 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
