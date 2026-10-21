type Stamp = {
  x: number;
  y: number;
  size: number;
  angle: number;
  at: number;
  loaded: boolean;
};

/** Paint with downloaded, scanned brush tips. Only the stroke paths are generated. */
export async function createBrushPainting(width: number, height: number) {
  const brushImages = [
    "/brushes/dry-brush.png",
    "/brushes/loaded-brush.png",
  ].map((source) => {
    const image = new Image();
    image.src = source;
    return image;
  });

  await Promise.all(brushImages.map((image) => image.decode()));
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 960 / width);
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Brush mask canvas unavailable");
  const stamps: Stamp[] = [];
  const cell = Math.min(240, width / 2);
  const columns = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const positions = Array.from({ length: columns * rows }, (_, index) => ({
    x: ((index % columns) + 0.5) * (width / columns),
    y: (Math.floor(index / columns) + 0.5) * (height / rows),
    order: Math.random(),
  })).sort((a, b) => a.order - b.order);
  positions.forEach((position, index) => {
    const angle = Math.random() * Math.PI * 2;
    const start = (index / positions.length) * 0.56;
    for (let step = 0; step < 12; step++) {
      const distance = (step / 11 - 0.5) * cell * 0.9;
      stamps.push({
        x: position.x + Math.cos(angle) * distance,
        y: position.y + Math.sin(angle) * distance,
        angle: angle + Math.PI / 2,
        size: cell * (1.3 + Math.sin((step / 11) * Math.PI) * 0.25),
        at: start + (step / 11) * 0.16,
        loaded: false,
      });
    }
  });
  // A second pass uses the scanned loaded brush, never a solid rectangle or fade.
  // Its overlapping opaque centers cover the gaps left by the dry first pass.
  const finishCell = cell * 0.55;
  const finishColumns = Math.ceil(width / finishCell) + 1;
  const finishRows = Math.ceil(height / finishCell) + 1;
  for (let row = 0; row < finishRows; row++) {
    for (let column = 0; column < finishColumns; column++) {
      const order =
        row * finishColumns + (row % 2 ? finishColumns - column - 1 : column);
      stamps.push({
        x: column * finishCell,
        y: row * finishCell,
        size: cell * 2.8,
        angle: (Math.random() - 0.5) * 0.6,
        at: 0.65 + (order / (finishColumns * finishRows - 1)) * 0.35,
        loaded: true,
      });
    }
  }
  stamps.sort((a, b) => a.at - b.at);
  let cursor = 0;
  let mask = `url("${canvas.toDataURL()}")`;
  return (progress: number): string => {
    const previous = cursor;
    while (cursor < stamps.length) {
      const stamp = stamps[cursor];
      if (!stamp || stamp.at > progress) break;
      const image = brushImages[stamp.loaded ? 1 : 0];
      if (!image) throw new Error("Brush texture unavailable");
      context.save();
      context.translate(stamp.x * scale, stamp.y * scale);
      context.rotate(stamp.angle);
      const size = stamp.size * scale;
      context.drawImage(image, -size / 2, -size / 2, size, size);
      context.restore();
      cursor++;
    }
    if (cursor !== previous) mask = `url("${canvas.toDataURL()}")`;
    return mask;
  };
}
