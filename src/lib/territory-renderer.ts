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
  const forecast = new Territory(width, height, origin, battleRandom(seed));
  while (forecast.winner === null) forecast.step(BATTLE.tick);
  const pace = forecast.time / BATTLE.playbackSeconds;
  const simulation = new Territory(width, height, origin, battleRandom(seed));
  const mask = canvas;
  mask.width = Math.ceil(width / 3);
  mask.height = Math.ceil(height / 3);
  const context = mask.getContext("2d");
  if (!context) throw new Error("Territory canvas unavailable");
  const pixels = context.createImageData(mask.width, mask.height);
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
    const waveY = Float32Array.from(
      { length: mask.width },
      (_, x) =>
        Math.sin(((x / mask.width) * columns) / 5 - elapsed * 2.1) * 0.55,
    );
    for (let y = 0; y < mask.height; y++) {
      const gridY = (y / mask.height) * rows - 0.5;
      const waveX =
        Math.sin(gridY / 4 + elapsed * 2.4) * 0.65 +
        Math.sin(gridY / 2.2 - elapsed * 1.3) * 0.18;
      for (let x = 0; x < mask.width; x++) {
        const density = sample(
          (x / mask.width) * columns - 0.5 + waveX,
          gridY + (waveY[x] ?? 0),
        );
        const edge = Math.max(0, Math.min(1, (density - 0.47) / 0.06));
        pixels.data[(y * mask.width + x) * 4 + 3] = Math.round(
          edge * edge * (3 - 2 * edge) * 255,
        );
      }
    }
    context.putImageData(pixels, 0, 0);
    canvas.dataset["claimed"] = String(simulation.claimed);
    canvas.dataset["factories"] = String(simulation.factories.length);
    canvas.dataset["reversals"] = String(simulation.reversals);
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
          accumulator += simulation.winner === null ? dt * pace : dt;
          let changed = false;
          while (accumulator >= BATTLE.tick) {
            if (simulation.winner === null) simulation.step(BATTLE.tick);
            else {
              settling += BATTLE.tick;
              // Several layers per tick clear disconnected enclaves within the settling budget.
              const layers = Math.ceil(
                ((simulation.columns + simulation.rows) * BATTLE.tick) /
                  BATTLE.settleSeconds,
              );
              for (let i = 0; i < layers; i++) simulation.settle();
            }
            accumulator -= BATTLE.tick;
            changed = true;
          }
          if (changed) onFrame(draw());
          if (simulation.winner !== null && settling >= BATTLE.settleSeconds) {
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
