/** A two-sided, finite-resource territory battle. Side 1 is the incoming theme. */
export type Point = { x: number; y: number };
export type Side = 0 | 1;
export type Factory = { cell: number; side: Side; progress: number };
export type Troop = { from: number; to: number; side: Side; progress: number };
export const BATTLE = {
  cell: 18,
  finishSeconds: 0.4,
  tick: 1 / 30,
  speed: 0.65,
};

export class Territory {
  readonly columns: number;
  readonly rows: number;
  readonly owners: Uint8Array;
  readonly neighbors: number[][];
  readonly factories: Factory[] = [];
  readonly troops: Troop[] = [];
  readonly reserves: [number, number];
  readonly industry: [number, number];
  readonly supplies: [number, number];
  readonly campaigns: [number, number];
  readonly objectives: [number, number];
  rallies = 0;
  readonly emergency: [number, number];
  private readonly highWater: [number, number];
  private routed: Side | null = null;
  private readonly mobilization: number;
  readonly seed: number;
  time = 0;
  claimed = 0;
  reversals = 0;
  winner: Side | null = null;
  private readonly fronts: [Set<number>, Set<number>] = [new Set(), new Set()];
  private readonly captured: Uint8Array;

  constructor(
    width: number,
    height: number,
    origin: Point,
    private readonly random = Math.random,
  ) {
    const cellSize = Math.max(BATTLE.cell, Math.sqrt((width * height) / 1400));
    this.columns = Math.max(8, Math.ceil(width / cellSize));
    this.rows = Math.max(8, Math.ceil(height / cellSize));
    const count = this.columns * this.rows;
    this.owners = new Uint8Array(count);
    this.captured = new Uint8Array(count);
    this.neighbors = Array.from({ length: count }, (_, cell) => {
      const x = cell % this.columns;
      const y = Math.floor(cell / this.columns);
      return [
        x > 0 ? cell - 1 : -1,
        x < this.columns - 1 ? cell + 1 : -1,
        y > 0 ? cell - this.columns : -1,
        y < this.rows - 1 ? cell + this.columns : -1,
      ].filter((n) => n >= 0);
    });
    const x = Math.max(
      0,
      Math.min(this.columns - 1, Math.floor((origin.x / width) * this.columns)),
    );
    const y = Math.max(
      0,
      Math.min(this.rows - 1, Math.floor((origin.y / height) * this.rows)),
    );
    this.seed = y * this.columns + x;
    // Most defenders are underprepared, but a rare well-stocked defense can defeat the invasion.
    const readiness = this.random() ** 9;
    this.reserves = [count * (1.1 + readiness * 5), count * 3.2];
    this.supplies = [count * (5 + readiness * 9), count * 7];
    this.campaigns = [0, count * 0.9];
    this.emergency = [count * 3, count * 3];
    this.highWater = [count, 0];
    this.objectives = [this.seed, this.seed];
    this.mobilization = 0.8 + this.random() * 1.4;
    this.industry = [1.8 + readiness * 1.4, 1.5];
    const radius = Math.max(2, Math.round(Math.sqrt(count * 0.003)));
    for (let dy = -radius; dy <= radius; dy++)
      for (let dx = -radius; dx <= radius; dx++) {
        if (
          x + dx >= 0 &&
          x + dx < this.columns &&
          y + dy >= 0 &&
          y + dy < this.rows
        ) {
          const cell = (y + dy) * this.columns + x + dx;
          this.owners[cell] = 1;
          this.captured[cell] = 1;
          this.claimed++;
        }
      }
    this.factories.push({ cell: this.seed, side: 1, progress: 0 });
    for (let i = 0; i < 4; i++) {
      const cell = Math.floor(this.random() * count);
      if (!this.owners[cell])
        this.factories.push({ cell, side: 0, progress: this.random() });
    }
    for (let cell = 0; cell < count; cell++) this.refresh(cell);
  }

  private refresh(cell: number): void {
    const side = this.owners[cell] === 1 ? 1 : 0;
    this.fronts[1 - side]?.delete(cell);
    if (this.neighbors[cell]?.some((n) => this.owners[n] !== side))
      this.fronts[side].add(cell);
    else this.fronts[side].delete(cell);
  }

  private claim(cell: number, side: Side): void {
    if (this.owners[cell] === side) return;
    if (this.captured[cell]) this.reversals++;
    this.captured[cell] = 1;
    this.owners[cell] = side;
    this.claimed += side === 1 ? 1 : -1;
    for (const factory of this.factories)
      if (factory.cell === cell) factory.side = side;
    this.refresh(cell);
    for (const neighbor of this.neighbors[cell] ?? []) this.refresh(neighbor);
  }

  /** Each attack pays for troops; defense also spends troops, even when it holds. */
  step(dt: number): void {
    if (this.winner !== null) return;
    this.time += dt;
    if (this.routed !== null) {
      // Occupation keeps moving at the normal front speed, even after an army exhausts its supplies.
      const victor = this.routed === 0 ? 1 : 0;
      for (let i = 0; i < Math.ceil(this.owners.length * dt * 0.18); i++) {
        const border = [...this.fronts[victor]];
        const from = border[Math.floor(this.random() * border.length)];
        if (from === undefined) break;
        const targets =
          this.neighbors[from]?.filter((n) => this.owners[n] !== victor) ?? [];
        const target = targets[Math.floor(this.random() * targets.length)];
        if (target !== undefined) this.claim(target, victor);
      }
      if (this.claimed === 0) this.winner = 0;
      else if (this.claimed === this.owners.length) this.winner = 1;
      return;
    }
    for (const troop of this.troops) {
      troop.progress += dt * 2;
      if (troop.progress >= 1 && this.owners[troop.to] === troop.side) {
        this.reserves[troop.side] += this.owners.length * 0.045;
      }
    }
    for (let i = this.troops.length - 1; i >= 0; i--)
      if ((this.troops[i]?.progress ?? 1) >= 1) this.troops.splice(i, 1);
    for (const factory of this.factories) {
      factory.progress += dt * this.industry[factory.side];
      if (
        factory.progress >= 1 &&
        this.supplies[factory.side] >= this.owners.length * 0.045
      ) {
        factory.progress -= 1;
        const border = [...this.fronts[factory.side]];
        const to = border[Math.floor(this.random() * border.length)];
        if (to !== undefined) {
          this.supplies[factory.side] -= this.owners.length * 0.045;
          this.troops.push({
            from: factory.cell,
            to,
            side: factory.side,
            progress: 0,
          });
        }
      }
    }
    // Build out from captured land; new production consumes the army's reserves.
    for (const side of [0, 1] as const) {
      const owned =
        side === 1 ? this.claimed : this.owners.length - this.claimed;
      this.highWater[side] = Math.max(this.highWater[side], owned);
      const share = owned / this.owners.length;
      // A retreat unlocks a finite reserve, so a comeback has force but cannot sustain an endless stalemate.
      if (
        share < 0.48 &&
        this.highWater[side] - owned > this.owners.length * 0.15 &&
        this.emergency[side] > 0
      ) {
        const reinforcement = Math.min(
          this.emergency[side],
          this.owners.length * 1.5,
        );
        this.emergency[side] -= reinforcement;
        this.reserves[side] += reinforcement;
        this.campaigns[side] += reinforcement;
        this.highWater[side] = owned;
        this.rallies++;
      }
      const underdog = 1 + Math.max(0, 0.5 - share) * 5;
      const count = this.factories.filter((f) => f.side === side).length;
      if (
        count < Math.min(12, 1 + Math.floor(owned / 180)) &&
        this.reserves[side] > 35 &&
        this.random() < dt * 3
      ) {
        const cell = Math.floor(this.random() * this.owners.length);
        if (
          this.owners[cell] === side &&
          !this.factories.some(
            (f) =>
              Math.abs((f.cell % this.columns) - (cell % this.columns)) +
                Math.abs(
                  Math.floor(f.cell / this.columns) -
                    Math.floor(cell / this.columns),
                ) <
              5,
          )
        ) {
          this.factories.push({ cell, side, progress: 0 });
          this.reserves[side] -= 35;
        }
      }
      const border = [...this.fronts[side]];
      // Save reinforcements for a concentrated offensive instead of spending every unit on arrival.
      if (
        this.campaigns[side] <= 0 &&
        (side === 1 || this.time >= this.mobilization) &&
        this.reserves[side] > this.owners.length * 0.35
      ) {
        this.campaigns[side] = this.reserves[side] * 0.85;
        this.objectives[side] =
          border[Math.floor(this.random() * border.length)] ?? this.seed;
      }
      const mobilized = this.campaigns[side] > 0;
      const attempts = Math.ceil(
        this.owners.length * dt * (mobilized ? 0.22 : 0.018) * underdog,
      );
      for (let i = 0; i < attempts && this.reserves[side] >= 2; i++) {
        let from = border[Math.floor(this.random() * border.length)];
        if (mobilized) {
          const objective = this.objectives[side];
          const distance = (cell: number) =>
            Math.abs((cell % this.columns) - (objective % this.columns)) +
            Math.abs(
              Math.floor(cell / this.columns) -
                Math.floor(objective / this.columns),
            );
          for (let candidate = 0; candidate < 2; candidate++) {
            const cell = border[Math.floor(this.random() * border.length)];
            if (
              cell !== undefined &&
              (from === undefined || distance(cell) < distance(from))
            )
              from = cell;
          }
        }
        if (from === undefined || this.owners[from] !== side) continue;
        const targets =
          this.neighbors[from]?.filter((n) => this.owners[n] !== side) ?? [];
        const target = targets[Math.floor(this.random() * targets.length)];
        if (target === undefined) continue;
        const opponent = side === 1 ? 0 : 1;
        const commitment = Math.min(this.reserves[side], 2 + this.random() * 2);
        const defense = Math.min(
          this.reserves[opponent],
          0.2 + this.random() * this.industry[opponent] * 1.8,
        );
        this.reserves[side] -= commitment / underdog;
        this.campaigns[side] = Math.max(0, this.campaigns[side] - commitment);
        this.reserves[opponent] -= defense;
        if (this.random() < commitment / (commitment + defense))
          this.claim(target, side);
      }
    }
    if (this.claimed === 0) this.winner = 0;
    else if (this.claimed === this.owners.length) this.winner = 1;
    else {
      // Exhaustion ends resistance, but occupation must still cross the remaining territory.
      const strength = ([0, 1] as const).map(
        (side) =>
          this.reserves[side] +
          (this.factories.some((factory) => factory.side === side) &&
          this.supplies[side] >= this.owners.length * 0.045
            ? this.supplies[side]
            : 0) +
          this.troops.filter((troop) => troop.side === side).length *
            this.owners.length *
            0.045,
      );
      for (const side of [0, 1] as const) {
        if ((strength[side] ?? 0) >= 2) continue;
        if (this.emergency[side] > 0) {
          this.reserves[side] += this.emergency[side];
          this.campaigns[side] += this.emergency[side];
          this.emergency[side] = 0;
          this.rallies++;
        } else this.routed = side;
      }
    }
  }
}

/** Deterministic randomness makes battle outcomes reproducible in tests. */
export function battleRandom(seed: number): () => number {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
