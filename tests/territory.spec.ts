import { test, expect } from "@playwright/test";
import { Territory, BATTLE } from "../src/lib/territory";

function random(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

test("resource battles can win or lose, reclaim territory, and settle completely", () => {
  const outcomes = new Set<number>();
  let reversals = 0;
  for (let seed = 1; seed <= 80; seed++) {
    const model = new Territory(
      390,
      844,
      { x: 350, y: 800 },
      random(seed * 7919),
    );
    expect(model.owners[model.seed]).toBe(1);
    while (model.winner === null) model.step(BATTLE.tick);
    outcomes.add(model.winner);
    reversals += model.reversals;
    expect(model.reserves.every((n) => n >= 0 && Number.isFinite(n))).toBe(
      true,
    );
    expect(model.time).toBeLessThan(12.1);
    for (let i = 0; i < model.columns + model.rows; i++) model.settle();
    expect([...model.owners].every((side) => side === model.winner)).toBe(true);
  }
  expect(outcomes).toEqual(new Set([0, 1]));
  expect(reversals).toBeGreaterThan(0);
});

test("button battle starts at the icon, renders fluid territory, and finishes without losing the terminal", async ({
  page,
}) => {
  test.setTimeout(25000);
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
    timeout: 16000,
  });
  expect(Date.now() - started).toBeGreaterThanOrEqual(10000);
  expect(Date.now() - started).toBeLessThan(16000);
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
  test.setTimeout(25000);
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
    timeout: 16000,
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
  test.setTimeout(25000);
  await page.addInitScript(() => {
    Object.defineProperty(crypto, "getRandomValues", {
      value: (array: Uint32Array) => {
        array[0] = 1946;
        return array;
      },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Use dark theme" }).click();
  const canvas = page.locator("canvas[data-battle]");
  await expect(canvas).toHaveAttribute("data-battle", "true");
  await expect(canvas).toHaveAttribute("data-battle", "false", {
    timeout: 16000,
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
  test.setTimeout(25000);
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
    timeout: 16000,
  });
  await expect(page.locator("[data-territory-copy]")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
});
