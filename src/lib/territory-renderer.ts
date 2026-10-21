import { BATTLE, Territory, battleRandom } from "./territory";
import type { Point, Side } from "./territory";
import { DARK_PALETTE, LIGHT_PALETTE } from "../styles/theme.css";
import type { Theme } from "../atoms/theme";

/** Render the simulation into a theme mask and a separate live troop layer. */
export function createTerritoryBattle(
  canvas: HTMLCanvasElement,
  origin: Point,
  incoming: Theme,
) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
  const forecast = new Territory(width, height, origin, battleRandom(seed));
  while (forecast.winner === null) forecast.step(BATTLE.tick);
  const pace = forecast.time / BATTLE.playbackSeconds;
  const simulation = new Territory(width, height, origin, battleRandom(seed));
  const mask = document.createElement("canvas");
  mask.width = width;
  mask.height = height;
  const ratio = Math.min(window.devicePixelRatio, 2);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const maskContext = mask.getContext("2d");
  const context = canvas.getContext("2d");
  if (!maskContext || !context) throw new Error("Territory canvas unavailable");
  context.scale(ratio, ratio);
  const cellWidth = width / simulation.columns;
  const cellHeight = height / simulation.rows;
  const position = (cell: number): Point => ({
    x: ((cell % simulation.columns) + 0.5) * cellWidth,
    y: (Math.floor(cell / simulation.columns) + 0.5) * cellHeight,
  });
  const colors =
    incoming === "dark"
      ? [LIGHT_PALETTE, DARK_PALETTE]
      : [DARK_PALETTE, LIGHT_PALETTE];
  let frame = 0;
  let cancel: (() => void) | undefined;
  let disposed = false;

  function draw(): string {
    if (!maskContext || !context) return "none";
    maskContext.clearRect(0, 0, mask.width, mask.height);
    maskContext.fillStyle = DARK_PALETTE.ink;
    for (let cell = 0; cell < simulation.owners.length; cell++) {
      if (simulation.owners[cell])
        maskContext.fillRect(
          Math.floor((cell % simulation.columns) * cellWidth),
          Math.floor(Math.floor(cell / simulation.columns) * cellHeight),
          Math.ceil(cellWidth) + 1,
          Math.ceil(cellHeight) + 1,
        );
    }
    context.clearRect(0, 0, width, height);
    for (const factory of simulation.factories) {
      const { x, y } = position(factory.cell);
      const palette = colors[factory.side];
      if (!palette) continue;
      context.fillStyle = palette.paper;
      context.strokeStyle = palette.ink;
      context.lineWidth = 1;
      context.fillRect(x - 6, y - 5, 12, 10);
      context.strokeRect(x - 6, y - 5, 12, 10);
      context.fillStyle = palette.ink;
      context.fillRect(x - 4, y - 8, 2, 3);
      context.fillRect(x + 2, y - 7, 2, 2);
      context.fillRect(x - 4, y + 2, 8 * factory.progress, 1);
    }
    for (const troop of simulation.troops) {
      const from = position(troop.from);
      const to = position(troop.to);
      const x = from.x + (to.x - from.x) * troop.progress;
      const y = from.y + (to.y - from.y) * troop.progress;
      const palette = colors[troop.side];
      if (!palette) continue;
      context.fillStyle = palette.ink;
      context.strokeStyle = palette.paper;
      context.lineWidth = 1;
      // Three soldiers visibly carry each reinforcement shipment to its front.
      for (let i = 0; i < 3; i++) {
        context.fillRect(x - i * 4, y + i * 3, 2, 2);
        context.strokeRect(x - i * 4 - 1, y + i * 3 - 1, 4, 4);
      }
    }
    canvas.dataset["claimed"] = String(simulation.claimed);
    canvas.dataset["factories"] = String(simulation.factories.length);
    canvas.dataset["reversals"] = String(simulation.reversals);
    return `url("${mask.toDataURL()}")`;
  }
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
          accumulator += simulation.winner === null ? dt * pace : dt;
          let changed = false;
          while (accumulator >= BATTLE.tick) {
            if (simulation.winner === null) simulation.step(BATTLE.tick);
            else {
              settling += BATTLE.tick;
              // Several layers per tick clear disconnected enclaves within the settling budget.
              const layers = Math.ceil(
                (Math.max(simulation.columns, simulation.rows) * BATTLE.tick) /
                  BATTLE.settleSeconds,
              );
              for (let i = 0; i < layers; i++) simulation.settle();
            }
            accumulator -= BATTLE.tick;
            changed = true;
          }
          if (changed) onFrame(draw());
          if (simulation.winner !== null && settling >= BATTLE.settleSeconds) {
            context.clearRect(0, 0, width, height);
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
