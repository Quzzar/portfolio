export type BrushStroke = {
  path: string;
  length: number;
  bristles: { offset: number; width: number; lag: number }[];
};

/** Overlapping passes cover a rotated viewport; their order and hand vary each time. */
export function createBrushStrokes(width: number, height: number) {
  const angle = (Math.random() - 0.5) * 40;
  const radians = (angle * Math.PI) / 180;
  const span = width * Math.cos(radians) + height * Math.abs(Math.sin(radians));
  const rise = height * Math.cos(radians) + width * Math.abs(Math.sin(radians));
  const spacing = rise / 6;
  const strokes: BrushStroke[] = Array.from({ length: 6 }, (_, index) => {
    const y = -rise / 2 + spacing * (index + 0.5);
    const start = -span / 2 - spacing;
    const end = span / 2 + spacing;
    const bend = (Math.random() - 0.5) * spacing * 0.2;
    const reverse = Math.random() > 0.5;
    return {
      path: `M ${reverse ? end : start} ${y} Q 0 ${y + bend} ${reverse ? start : end} ${y}`,
      length: end - start + spacing,
      bristles: Array.from({ length: 37 }, (_, bristle) => ({
        offset: ((bristle / 36) * 2 - 1) * spacing * 0.87,
        width: spacing * (0.052 + Math.random() * 0.018),
        lag: Math.random() * 0.045,
      })),
    };
  });
  for (let index = strokes.length - 1; index > 0; index--) {
    const target = Math.floor(Math.random() * (index + 1));
    const current = strokes[index];
    const replacement = strokes[target];
    if (current && replacement) {
      strokes[index] = replacement;
      strokes[target] = current;
    }
  }
  return { strokes, angle, width, height };
}

export type BrushPainting = ReturnType<typeof createBrushStrokes>;

/** Alpha mask reveals the complete new view, including its live text and controls. */
export function brushMask(painting: BrushPainting, progress: number): string {
  const { width, height, angle, strokes } = painting;
  const paths = strokes
    .map((stroke, index) => {
      const local = Math.max(
        0,
        Math.min(1, (progress - index * 0.125) / 0.375),
      );
      if (local === 0) return "";
      const eased = local * local * (3 - 2 * local);
      const path = (size: number, offset: number, amount: number) =>
        `<path d="${stroke.path}" transform="translate(0 ${offset})" stroke-width="${size}" stroke-dasharray="${stroke.length}" stroke-dashoffset="${stroke.length * (1 - amount)}"/>`;
      return stroke.bristles
        .map((bristle) =>
          path(
            bristle.width,
            bristle.offset,
            Math.max(0, eased * (1 + bristle.lag) - bristle.lag),
          ),
        )
        .join("");
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><g transform="translate(${width / 2} ${height / 2}) rotate(${angle})" fill="none" stroke="white" stroke-linecap="round">${paths}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
