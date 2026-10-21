/** A two-sided, finite-resource territory battle. Side 1 is the incoming theme. */
export type Point = { x: number; y: number };
export type Side = 0 | 1;
export type Factory = { cell: number; side: Side; progress: number };
export type Troop = { from: number; to: number; side: Side; progress: number };
export const BATTLE = {
  cell: 18,
  seconds: 12,
  settleSeconds: 1.2,
  tick: 1 / 30,
  playbackSeconds: 11.5,
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
    this.columns = Math.max(8, Math.ceil(width / BATTLE.cell));
    this.rows = Math.max(8, Math.ceil(height / BATTLE.cell));
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
    this.reserves = [count * (0.16 + readiness * 2.8), count * 2.7];
    this.industry = [0.45 + readiness * 2.2, 1.5];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
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
    for (const troop of this.troops) {
      troop.progress += dt * 2;
      if (troop.progress >= 1 && this.owners[troop.to] === troop.side) {
        this.reserves[troop.side] += this.owners.length * 0.007;
      }
    }
    for (let i = this.troops.length - 1; i >= 0; i--)
      if ((this.troops[i]?.progress ?? 1) >= 1) this.troops.splice(i, 1);
    for (const factory of this.factories) {
      factory.progress += dt * this.industry[factory.side];
      if (factory.progress >= 1) {
        factory.progress -= 1;
        const border = [...this.fronts[factory.side]];
        const to = border[Math.floor(this.random() * border.length)];
        if (to !== undefined)
          this.troops.push({
            from: factory.cell,
            to,
            side: factory.side,
            progress: 0,
          });
      }
    }
    // Build out from captured land; new production consumes the army's reserves.
    for (const side of [0, 1] as const) {
      const owned =
        side === 1 ? this.claimed : this.owners.length - this.claimed;
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
      const attempts = Math.ceil(
        this.owners.length * dt * (side === 1 ? 0.65 : 0.32),
      );
      const border = [...this.fronts[side]];
      for (let i = 0; i < attempts && this.reserves[side] >= 2; i++) {
        const from = border[Math.floor(this.random() * border.length)];
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
        this.reserves[side] -= commitment;
        this.reserves[opponent] -= defense;
        if (this.random() < commitment / (commitment + defense))
          this.claim(target, side);
      }
    }
    if (this.claimed === 0) this.winner = 0;
    else if (this.claimed === this.owners.length) this.winner = 1;
    else if (this.time >= BATTLE.seconds) {
      // At the ceasefire, territory plus remaining troops determine who can sustain control.
      const attack = this.claimed + this.reserves[1] * 0.2;
      const defense =
        this.owners.length - this.claimed + this.reserves[0] * 0.2;
      this.winner = attack > defense ? 1 : 0;
    }
  }

  /** After the result, remaining enclaves surrender along the existing front. */
  settle(): void {
    if (this.winner === null) return;
    const side = this.winner;
    const targets = new Set<number>();
    for (const cell of this.fronts[side])
      for (const neighbor of this.neighbors[cell] ?? []) {
        if (this.owners[neighbor] !== side) targets.add(neighbor);
      }
    for (const target of targets) this.claim(target, side);
  }
}

/** Replaying a seed keeps the resource-driven result unchanged when pacing the animation. */
export function battleRandom(seed: number): () => number {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
