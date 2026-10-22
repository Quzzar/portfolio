import { BATTLE, Territory, battleRandom } from "./territory";
import type { Point, Side } from "./territory";

/** Smooth contested cells into a moving liquid boundary; units stay in the model. */
export function createTerritoryBattle(
  canvas: HTMLCanvasElement,
  origin: Point,
) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
  const simulation = new Territory(width, height, origin, battleRandom(seed));
  const mask = canvas;
  const resolution = Math.min(
    window.devicePixelRatio,
    2,
    Math.max(1, Math.sqrt(1_500_000 / (width * height))),
  );
  mask.width = Math.ceil(width * resolution);
  mask.height = Math.ceil(height * resolution);
  const context = mask.getContext("2d");
  if (!context) throw new Error("Territory canvas unavailable");

  const field = Float32Array.from(simulation.owners);
  const horizontal = new Float32Array(field.length);
  const smooth = new Float32Array(field.length);
  const weights = [1, 4, 6, 4, 1];
  const columns = simulation.columns;
  const rows = simulation.rows;
  let elapsed = 0;
  const sample = (x: number, y: number): number => {
    x = Math.max(0, Math.min(columns - 1, x));
    y = Math.max(0, Math.min(rows - 1, y));
    const left = Math.floor(x),
      top = Math.floor(y);
    const right = Math.min(columns - 1, left + 1),
      bottom = Math.min(rows - 1, top + 1);
    const dx = x - left,
      dy = y - top;
    return (
      ((smooth[top * columns + left] ?? 0) * (1 - dx) +
        (smooth[top * columns + right] ?? 0) * dx) *
        (1 - dy) +
      ((smooth[bottom * columns + left] ?? 0) * (1 - dx) +
        (smooth[bottom * columns + right] ?? 0) * dx) *
        dy
    );
  };
  let frame = 0;
  let cancel: (() => void) | undefined;
  let disposed = false;

  const draw = (): string => {
    // Ease cell transfers in time, then convolve spatially before tracing the half-density contour.
    for (let i = 0; i < field.length; i++)
      field[i] =
        (field[i] ?? 0) +
        ((simulation.owners[i] ?? 0) - (field[i] ?? 0)) * 0.28;
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < columns; x++) {
        let value = 0;
        for (let k = -2; k <= 2; k++)
          value +=
            (field[y * columns + Math.max(0, Math.min(columns - 1, x + k))] ??
              0) * (weights[k + 2] ?? 0);
        horizontal[y * columns + x] = value / 16;
      }
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < columns; x++) {
        let value = 0;
        for (let k = -2; k <= 2; k++)
          value +=
            (horizontal[Math.max(0, Math.min(rows - 1, y + k)) * columns + x] ??
              0) * (weights[k + 2] ?? 0);
        smooth[y * columns + x] = value / 16;
      }
    // Trace the density contour as geometry. Native canvas antialiasing covers only the edge pixel.
    const path = new Path2D();
    const nx = columns * 2,
      ny = rows * 2;
    const densities = new Float32Array((nx + 1) * (ny + 1));
    for (let y = 0; y <= ny; y++)
      for (let x = 0; x <= nx; x++) {
        const gx = x / 2 - 0.5,
          gy = y / 2 - 0.5;
        densities[y * (nx + 1) + x] = sample(
          gx + Math.sin(gy / 4 + elapsed * 2.4) * 0.35,
          gy + Math.sin(gx / 5 - elapsed * 2.1) * 0.3,
        );
      }
    type Vertex = { x: number; y: number; value: number };
    const triangle = (vertices: Vertex[]): void => {
      const clipped: Vertex[] = [];
      for (let i = 0; i < vertices.length; i++) {
        const start = vertices[i]!,
          end = vertices[(i + 1) % vertices.length]!;
        if (start.value >= 0.5) clipped.push(start);
        if (start.value >= 0.5 !== end.value >= 0.5) {
          const t = (0.5 - start.value) / (end.value - start.value);
          clipped.push({
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t,
            value: 0.5,
          });
        }
      }
      if (!clipped.length) return;
      path.moveTo(clipped[0]!.x, clipped[0]!.y);
      for (const vertex of clipped.slice(1)) path.lineTo(vertex.x, vertex.y);
      path.closePath();
    };
    for (let y = 0; y < ny; y++)
      for (let x = 0; x < nx; x++) {
        const vertex = (dx: number, dy: number): Vertex => ({
          x: ((x + dx) * mask.width) / nx,
          y: ((y + dy) * mask.height) / ny,
          value: densities[(y + dy) * (nx + 1) + x + dx] ?? 0,
        });
        const a = vertex(0, 0),
          b = vertex(1, 0),
          c = vertex(1, 1),
          d = vertex(0, 1);
        if ([a, b, c, d].every((v) => v.value >= 0.5))
          path.rect(a.x, a.y, b.x - a.x, d.y - a.y);
        else if ([a, b, c, d].some((v) => v.value >= 0.5)) {
          triangle([a, b, c]);
          triangle([a, c, d]);
        }
      }
    context.clearRect(0, 0, mask.width, mask.height);
    context.fill(path);
    canvas.dataset["claimed"] = String(simulation.claimed);
    canvas.dataset["factories"] = String(simulation.factories.length);
    canvas.dataset["reversals"] = String(simulation.reversals);
    canvas.dataset["raids"] = String(simulation.raids);
    return `url("${mask.toDataURL()}")`;
  };
  return {
    initialMask: draw(),
    play(onFrame: (mask: string) => void): Promise<Side | null> {
      return new Promise((resolve) => {
        let last = performance.now();
        let accumulator = 0;
        let settling = 0;
        const finish = (winner: Side | null) => {
          cancelAnimationFrame(frame);
          resolve(winner);
        };
        cancel = () => finish(null);
        const update = (now: number) => {
          if (disposed) {
            finish(null);
            return;
          }
          const dt = Math.min((now - last) / 1000, 0.1);
          last = now;
          elapsed += dt;
          accumulator += simulation.winner === null ? dt * BATTLE.speed : dt;
          let changed = false;
          while (accumulator >= BATTLE.tick) {
            if (simulation.winner === null) simulation.step(BATTLE.tick);
            else {
              settling += BATTLE.tick;
            }
            accumulator -= BATTLE.tick;
            changed = true;
          }
          if (changed) onFrame(draw());
          if (simulation.winner !== null && settling >= BATTLE.finishSeconds) {
            finish(simulation.winner);
          } else frame = requestAnimationFrame(update);
        };
        frame = requestAnimationFrame(update);
      });
    },
    dispose(): void {
      disposed = true;
      cancel?.();
      context.clearRect(0, 0, width, height);
    },
  };
}
