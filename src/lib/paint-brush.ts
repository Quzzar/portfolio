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
  const columns = Math.max(2, Math.ceil(width / 220));
  const lane = width / columns;
  const size = lane * 1.65;

  function drawStamp(stamp: Stamp): void {
    const image = brushImages[stamp.loaded ? 1 : 0];
    if (!image) throw new Error("Brush texture unavailable");
    context!.save();
    context!.translate(stamp.x * scale, stamp.y * scale);
    context!.rotate(stamp.angle);
    const pixels = stamp.size * scale;
    context!.drawImage(image, -pixels / 2, -pixels / 2, pixels, pixels);
    context!.restore();
  }

  function stroke(
    x: number,
    from: number,
    to: number,
    brushSize: number,
    loaded: boolean,
  ): Stamp[] {
    const tilt = (Math.random() - 0.5) * 0.07;
    const steps = Math.ceil(Math.abs(to - from) / (brushSize * 0.045));
    return Array.from({ length: steps + 1 }, (_, step) => {
      const y = from + (to - from) * (step / steps);
      return {
        x: x + (y - height / 2) * Math.tan(tilt),
        y,
        size: brushSize,
        angle: tilt + (to > from ? Math.PI : 0),
        at: 0,
        loaded,
      };
    });
  }

  // Adjacent, alternating passes follow a hand painting up, down, up, down.
  for (let column = 0; column < columns; column++) {
    const top = -size * 0.5;
    const bottom = height + size * 0.5;
    const marks = stroke(
      lane * (column + 0.5),
      column % 2 ? top : bottom,
      column % 2 ? bottom : top,
      size,
      false,
    );
    marks.forEach((stamp, index) => {
      stamp.at = ((column + index / marks.length) / columns) * 0.78;
      stamps.push(stamp);
      drawStamp(stamp);
    });
  }

  // Inspect the actual painted alpha, then brush only lanes containing uncovered pixels.
  const touchups: Stamp[][] = [];
  for (let column = 0; column < columns; column++) {
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let top = canvas.height;
    let bottom = -1;
    const left = Math.floor(column * lane * scale);
    const right = Math.min(
      canvas.width,
      Math.ceil((column + 1) * lane * scale),
    );
    for (let y = 0; y < canvas.height; y++) {
      for (let x = left; x < right; x++) {
        if ((pixels[(y * canvas.width + x) * 4 + 3] ?? 0) < 250) {
          top = Math.min(top, y);
          bottom = y;
          break;
        }
      }
    }
    if (bottom < top) continue;
    const brushSize = lane * 3.2;
    const from = top / scale - brushSize * 0.4;
    const to = bottom / scale + brushSize * 0.4;
    const marks = stroke(
      lane * (column + 0.5),
      column % 2 ? from : to,
      column % 2 ? to : from,
      brushSize,
      true,
    );
    touchups.push(marks);
    marks.forEach(drawStamp);
  }
  touchups.forEach((marks, pass) => {
    marks.forEach((stamp, index) => {
      stamp.at =
        0.78 + ((pass + index / marks.length) / touchups.length) * 0.22;
      stamps.push(stamp);
    });
  });
  context.clearRect(0, 0, canvas.width, canvas.height);
  stamps.sort((a, b) => a.at - b.at);
  let cursor = 0;
  let mask = `url("${canvas.toDataURL()}")`;
  return (progress: number): string => {
    const previous = cursor;
    while (cursor < stamps.length) {
      const stamp = stamps[cursor];
      if (!stamp || stamp.at > progress) break;
      drawStamp(stamp);
      cursor++;
    }
    if (cursor !== previous) mask = `url("${canvas.toDataURL()}")`;
    return mask;
  };
}
