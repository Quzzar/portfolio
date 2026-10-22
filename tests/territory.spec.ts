import { test, expect } from "@playwright/test";
import { Territory, BATTLE } from "../src/lib/territory";

function random(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

test("resource battles can win or lose, reclaim territory, and conquer fully without a surrender shortcut", () => {
  const outcomes = new Set<number>();
  let reversals = 0;
  let retreats = 0;
  const durations = new Set<number>();
  for (let seed = 1; seed <= 80; seed++) {
    const model = new Territory(
      390,
      844,
      { x: 350, y: 800 },
      random(seed * 7919),
    );
    expect(model.owners[model.seed]).toBe(1);
    let peak = model.claimed;
    let retreat = 0;
    while (model.winner === null && model.time < 120) {
      model.step(BATTLE.tick);
      peak = Math.max(peak, model.claimed);
      retreat = Math.max(retreat, peak - model.claimed);
    }
    if (retreat > model.owners.length * 0.15) retreats++;
    durations.add(Math.round(model.time));
    expect(model.winner).not.toBeNull();
    if (model.winner === null) throw new Error("Battle did not resolve");
    outcomes.add(model.winner);
    reversals += model.reversals;
    expect(model.reserves.every((n) => n >= 0 && Number.isFinite(n))).toBe(
      true,
    );
    expect(model.time).toBeLessThan(120);
    expect([...model.owners].every((side) => side === model.winner)).toBe(true);
  }
  expect(outcomes).toEqual(new Set([0, 1]));
  expect(reversals).toBeGreaterThan(0);
  expect(retreats).toBeGreaterThan(50);
  expect(durations.size).toBeGreaterThan(4);
});

test("button battle starts at the icon, renders fluid territory, and finishes without losing the terminal", async ({
  page,
}) => {
  test.setTimeout(65000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator('[data-ready="true"]')).toBeAttached();
  const button = page.getByRole("button", { name: "Use dark theme" });
  const bounds = await button.boundingBox();
  const started = Date.now();
  await button.click();
  const canvas = page.locator("canvas[data-battle]");
  await expect(canvas).toHaveAttribute("data-battle", "true");
  expect(Number(await canvas.getAttribute("data-origin-x"))).toBeCloseTo(
    bounds!.x + bounds!.width / 2,
  );
  expect(Number(await canvas.getAttribute("data-origin-y"))).toBeCloseTo(
    bounds!.y + bounds!.height / 2,
  );
  await page.waitForTimeout(5000);
  expect(Number(await canvas.getAttribute("data-reversals"))).toBeGreaterThan(
    0,
  );
  expect(Number(await canvas.getAttribute("data-factories"))).toBeGreaterThan(
    4,
  );
  await page.screenshot({
    path: `.impeccable/review/fluid-dark-${test.info().project.name}.png`,
  });
  await expect(canvas).toHaveAttribute("data-battle", "false", {
    timeout: 60000,
  });
  expect(Date.now() - started).toBeGreaterThan(0);
  expect(Date.now() - started).toBeLessThan(60000);
  await expect(page.locator("#root [data-battling]")).toBeEnabled();
  expect(
    await page.evaluate(() =>
      document.documentElement.style.getPropertyValue("--theme-territory-mask"),
    ),
  ).toBe("");
  const input = page.getByRole("textbox", { name: "Terminal input" });
  await input.pressSequentially("about");
  await input.press("Enter");
  await expect(page.locator(".xterm-rows")).toContainText(
    "System design. Product design.",
  );
  expect(errors).toEqual([]);
});

test("terminal battle starts at the submitted word and reduced motion switches immediately", async ({
  page,
}) => {
  test.setTimeout(65000);
  await page.goto("/");
  await expect(page.locator('[data-ready="true"]')).toBeAttached();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator('[data-theme="dark"]')).toBeVisible();
  await expect(page.locator("canvas[data-battle]")).toHaveAttribute(
    "data-battle",
    "false",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const input = page.getByRole("textbox", { name: "Terminal input" });
  await input.pressSequentially("theme");
  const row = page.locator(".xterm-rows > div").filter({ hasText: "theme" });
  const bounds = await row.boundingBox();
  await input.press("Enter");
  const canvas = page.locator("canvas[data-battle]");
  await expect(canvas).toHaveAttribute("data-battle", "true");
  expect(
    Number(await canvas.getAttribute("data-origin-y")),
  ).toBeGreaterThanOrEqual(bounds!.y);
  expect(
    Number(await canvas.getAttribute("data-origin-y")),
  ).toBeLessThanOrEqual(bounds!.y + bounds!.height);
  await page.waitForTimeout(5000);
  await page.screenshot({
    path: `.impeccable/review/fluid-light-${test.info().project.name}.png`,
  });
  await expect(canvas).toHaveAttribute("data-battle", "false", {
    timeout: 60000,
  });
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("a wrapped mixed-case theme command starts a battle without stopping the shell", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('[data-ready="true"]')).toBeAttached();
  const columns = await page.locator(".xterm-screen").evaluate((screen) => {
    const row = screen.querySelector(".xterm-rows > div");
    const text = row?.querySelector("span")?.firstChild;
    if (!text) throw new Error("No terminal prompt");
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 1);
    return Math.round(
      screen.getBoundingClientRect().width /
        range.getBoundingClientRect().width,
    );
  });
  const input = page.getByRole("textbox", { name: "Terminal input" });
  await input.pressSequentially(" ".repeat(columns - 19) + "ThEmE");
  await input.press("Enter");
  await expect(page.locator("canvas[data-battle]")).toHaveAttribute(
    "data-battle",
    "true",
  );
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("a victorious defender retains the original theme and restores controls", async ({
  page,
}) => {
  test.setTimeout(65000);
  await page.addInitScript((seed: number) => {
    Object.defineProperty(crypto, "getRandomValues", {
      value: (array: Uint32Array) => {
        array[0] = seed;
        return array;
      },
    });
  }, 87109);
  await page.goto("/");
  await page.getByRole("button", { name: "Use dark theme" }).click();
  const canvas = page.locator("canvas[data-battle]");
  await expect(canvas).toHaveAttribute("data-battle", "true");
  await expect(canvas).toHaveAttribute("data-battle", "false", {
    timeout: 60000,
  });
  await expect(page.locator('[data-theme="light"]')).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Use dark theme" }),
  ).toBeEnabled();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("interaction and repeated theme commands leave the current battle running", async ({
  page,
}) => {
  test.setTimeout(65000);
  await page.goto("/");
  await expect(page.locator('[data-ready="true"]')).toBeAttached();
  const input = page.getByRole("textbox", { name: "Terminal input" });
  await input.pressSequentially("theme");
  await input.press("Enter");
  const canvas = page.locator("canvas[data-battle]");
  await expect(canvas).toHaveAttribute("data-battle", "true");
  const origin = await canvas.getAttribute("data-origin-y");
  await page.getByRole("heading", { name: "Aaron Cassar" }).click();
  await input.pressSequentially("about");
  await input.press("Enter");
  await expect(page.locator("#root .xterm-rows")).toContainText(
    "System design. Product design.",
  );
  await expect(page.locator("[data-territory-copy] .xterm-rows")).toContainText(
    "System design. Product design.",
  );
  await input.pressSequentially("theme");
  await input.press("Enter");
  await expect(canvas).toHaveAttribute("data-battle", "true");
  await expect(canvas).toHaveAttribute("data-origin-y", origin!);
  await expect(page.locator("[data-territory-copy]")).toHaveCount(1);
  await page.screenshot({
    path: `.impeccable/review/fluid-interaction-${test.info().project.name}.png`,
  });
  await expect(canvas).toHaveAttribute("data-battle", "false", {
    timeout: 60000,
  });
  await expect(page.locator("[data-territory-copy]")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("territory only expands from existing borders", () => {
  for (let seed = 1; seed <= 12; seed++) {
    const model = new Territory(
      390,
      664,
      { x: 344, y: 626 },
      random(seed * 7919),
    );
    while (model.winner === null && model.time < 120) {
      const previous = model.owners.slice();
      model.step(BATTLE.tick);
      for (const side of [0, 1]) {
        const gained = new Set<number>();
        for (let cell = 0; cell < previous.length; cell++)
          if (previous[cell] !== side && model.owners[cell] === side)
            gained.add(cell);
        const connected = [...gained].filter((cell) =>
          model.neighbors[cell]?.some((n) => previous[n] === side),
        );
        for (const cell of connected) gained.delete(cell);
        while (connected.length) {
          const cell = connected.pop()!;
          for (const neighbor of model.neighbors[cell] ?? [])
            if (gained.delete(neighbor)) connected.push(neighbor);
        }
        if (gained.size)
          throw new Error(
            `Seed ${seed} spawned ${gained.size} remote cells at ${model.time}`,
          );
      }
    }
    expect(model.winner).not.toBeNull();
  }
});
