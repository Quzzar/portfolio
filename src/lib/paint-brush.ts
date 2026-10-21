type Bristle = { offset: number; width: number; lag: number; bend: number };
type BrushStroke = {
  x: number;
  y: number;
  angle: number;
  length: number;
  start: number;
  bristles: Bristle[];
};

/** Short, overlapping daubs slather separate patches, with a fresh hand each toggle. */
export function createBrushStrokes(width: number, height: number) {
  const columns = Math.max(3, Math.ceil(width / 240));
  const rows = Math.max(3, Math.ceil(height / 190));
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const strokes: BrushStroke[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const angle = (Math.random() - 0.5) * 100;
      strokes.push({
        x: cellWidth * (column + 0.5 + (Math.random() - 0.5) * 0.12),
        y: cellHeight * (row + 0.5 + (Math.random() - 0.5) * 0.12),
        angle: angle + (Math.random() > 0.5 ? 180 : 0),
        length: Math.max(cellWidth, cellHeight) * 1.9,
        start: 0,
        bristles: Array.from({ length: 29 }, (_, index) => ({
          offset:
            ((index / 28) * 2 - 1) * Math.max(cellWidth, cellHeight) * 0.78,
          width:
            Math.max(cellWidth, cellHeight) * (0.085 + Math.random() * 0.022),
          lag: Math.random() * 0.12,
          bend: (Math.random() - 0.5) * cellHeight * 0.04,
        })),
      });
    }
  }
  for (let index = strokes.length - 1; index > 0; index--) {
    const target = Math.floor(Math.random() * (index + 1));
    const current = strokes[index];
    const replacement = strokes[target];
    if (current && replacement) {
      strokes[index] = replacement;
      strokes[target] = current;
    }
  }
  strokes.forEach((stroke, index) => {
    stroke.start = (index / (strokes.length - 1)) * 0.8;
  });
  return { strokes, width, height };
}
export type BrushPainting = ReturnType<typeof createBrushStrokes>;

/** Every mark reveals the destination UI itself, with no painted-color overlay. */
export function brushMask(painting: BrushPainting, progress: number): string {
  const { width, height, strokes } = painting;
  const paths = strokes
    .map((stroke) => {
      const local = Math.max(0, Math.min(1, (progress - stroke.start) / 0.2));
      if (!local) return "";
      const eased = local * local * (3 - 2 * local);
      const bristles = stroke.bristles
        .map((bristle) => {
          const amount = Math.max(0, eased * (1 + bristle.lag) - bristle.lag);
          if (!amount) return "";
          const start = -stroke.length / 2;
          const length = stroke.length * 1.08;
          return `<path d="M ${start} ${bristle.offset} Q 0 ${bristle.offset + bristle.bend} ${-start} ${bristle.offset}" stroke-width="${bristle.width}" stroke-dasharray="${length}" stroke-dashoffset="${length * (1 - amount)}"/>`;
        })
        .join("");
      return `<g transform="translate(${stroke.x} ${stroke.y}) rotate(${stroke.angle})">${bristles}</g>`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><g fill="none" stroke="white" stroke-linecap="round">${paths}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
