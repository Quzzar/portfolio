import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { brushMask, createBrushStrokes } from "../src/lib/paint-brush";

const screen = (page: Page) => page.locator(".xterm-rows");
async function terminal(page: Page) {
  await page.goto("/");
  await expect(page.locator('[data-ready="true"]')).toBeAttached();
  const input = page.getByRole("textbox", { name: "Terminal input" });
  await input.focus();
  await expect(screen(page)).toContainText("visitor@aaron ~ %");
  return input;
}
async function command(page: Page, value: string) {
  const input = page.getByRole("textbox", { name: "Terminal input" });
  await input.pressSequentially(value);
  await input.press("Enter");
}

test("homepage ships a terminal emulator, assets, and no form navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await terminal(page);
  await expect(page).toHaveTitle("Aaron Cassar");
  await expect(
    page.getByRole("heading", { name: "Aaron Cassar" }),
  ).toBeVisible();
  await expect(page.locator("input, form")).toHaveCount(0);
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(page.locator(".xterm-cursor-block")).toBeAttached();
  await expect(page.locator("footer a")).toHaveText([
    "GitHub",
    "Resume",
    "LinkedIn",
  ]);
  const resume = await page.request.get("/resume/Resume.pdf");
  expect(resume.status()).toBe(200);
  expect(resume.headers()["content-type"]).toContain("pdf");
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `.impeccable/review/emulator-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("terminal Tab completes and prints ambiguous matches inside the terminal", async ({
  page,
}) => {
  const input = await terminal(page);
  await input.pressSequentially("ab");
  await input.press("Tab");
  await expect(screen(page)).toContainText("% about ");
  await input.press("Enter");
  await expect(screen(page)).toContainText("worlds.");
  await input.pressSequentially("cat ");
  await input.press("Tab");
  await expect(screen(page)).toContainText("about.txt");
  await expect(screen(page)).toContainText("work.txt");
  await expect(screen(page)).toContainText("contact.txt");
  await input.pressSequentially("ab");
  await input.press("Tab");
  await expect(screen(page)).toContainText("% cat about.txt");
  await input.press("Enter");
  await expect(screen(page)).toContainText("worlds.");
  await input.press("ArrowUp");
  await expect(screen(page)).toContainText("% cat about.txt");
  await page.screenshot({
    path: `.impeccable/review/terminal-tab-${test.info().project.name}.png`,
    fullPage: true,
  });
  await input.press("Control+c");
  await expect(screen(page)).toContainText("^C");
  await command(page, "clear");
  await expect(screen(page)).not.toContainText("worlds.");
  await input.pressSequentially("ct about.txt");
  await input.press("Home");
  await input.press("ArrowRight");
  await input.pressSequentially("a");
  await input.press("End");
  await input.press("Enter");
  await expect(screen(page)).toContainText("worlds.");
});

test("terminal commands, history, resize, interruption, and playground work", async ({
  page,
}) => {
  const input = await terminal(page);
  await command(page, "work");
  await expect(screen(page)).toContainText("More on GitHub");
  await command(page, "nonsense");
  await expect(screen(page)).toContainText("Command not found:");
  await input.press("ArrowUp");
  await input.press("Control+c");
  await command(page, "ls -a");
  await expect(screen(page)).toContainText("./play");
  await command(page, "play");
  await expect(
    page.getByRole("main", { name: "Interactive ASCII playground" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "back to almost nothing" }).click();
  await expect(input).toBeFocused();
  await input.press("Control+l");
  await expect(screen(page)).not.toContainText("Command not found:");
  await command(page, "about");
  await expect(screen(page)).toContainText("worlds.");
  await page.setViewportSize({ width: 320, height: 740 });
  await expect
    .poll(async () => {
      const width = await page
        .locator(".xterm-screen")
        .evaluate((node) => node.getBoundingClientRect().width);
      const host = await page
        .locator('[data-ready="true"]')
        .evaluate((node) => node.getBoundingClientRect().width);
      return width <= host;
    })
    .toBe(true);
  await input.press("Escape");
  await expect(input).not.toBeFocused();
});

test("paint slathers partial patches over the complete opposite theme in both directions", async ({
  page,
}) => {
  await terminal(page);
  await command(page, "about");
  await expect(screen(page)).toContainText("worlds.");
  for (const [next, after] of [
    ["dark", "light"],
    ["light", "dark"],
  ]) {
    await page.getByRole("button", { name: `Use ${next} theme` }).click();
    await expect(page.locator(`[data-theme="${next}"]`)).toBeVisible();
    await page.waitForFunction(() =>
      document.documentElement.style
        .getPropertyValue("--theme-brush-mask")
        .includes("%3Cpath"),
    );
    await page.waitForTimeout(350);
    await page.screenshot({
      path: `.impeccable/review/slather-${next}-${test.info().project.name}.png`,
    });
    await expect(
      page.getByRole("button", { name: `Use ${after} theme` }),
    ).toBeEnabled();
    await expect(screen(page)).toContainText("worlds.");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator('[data-theme="dark"]')).toBeVisible();
  await expect(page.locator('[data-painting="true"]')).toHaveCount(0);
});
test("identity columns change independently without shifting and reduced motion stays still", async ({
  page,
}) => {
  const start = new Date("2026-10-21T12:00:00Z");
  await page.clock.install({ time: start });
  await page.addInitScript(() => {
    let seed = 42;
    Math.random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  });
  if (test.info().project.name === "mobile")
    await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  const header = page.locator("header");
  const columns = page.locator("[data-identity-column]");
  await page.evaluate(() => document.fonts.ready);
  const initial = await header.boundingBox();
  await page.clock.pauseAt(
    new Date(await page.evaluate(() => Date.now() + 10000)),
  );
  let previous = await columns.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-word")),
  );
  const changes: number[][] = [[], [], []];
  for (let elapsed = 500; elapsed <= 24000; elapsed += 500) {
    await page.clock.runFor(500);
    const words = await columns.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-word")),
    );
    expect(new Set(words).size).toBe(3);
    words.forEach((word, column) => {
      if (word !== previous[column]) changes[column]?.push(elapsed);
    });
    previous = words;
  }
  changes.forEach((times) => {
    expect(times.length).toBeGreaterThanOrEqual(4);
    for (let index = 1; index < times.length; index++) {
      const interval = (times[index] ?? 0) - (times[index - 1] ?? 0);
      expect(interval).toBeGreaterThanOrEqual(3000);
      expect(interval).toBeLessThanOrEqual(6000);
    }
  });
  expect(changes[0]).not.toEqual(changes[1]);
  expect(changes[1]).not.toEqual(changes[2]);
  await page.clock.resume();
  const after = await header.boundingBox();
  expect(after?.height).toBe(initial?.height);
  await expect(
    page.getByRole("button", { name: /changing words/ }),
  ).toHaveCount(0);
  const centered = await page
    .locator('header [aria-hidden="true"]')
    .evaluateAll((columns) =>
      columns.every((column) => {
        const word = column.querySelector("span");
        if (!word) return false;
        const range = document.createRange();
        range.selectNodeContents(word);
        const textBox = range.getBoundingClientRect();
        const columnBox = column.getBoundingClientRect();
        return (
          Math.abs(
            (textBox.left + textBox.right) / 2 -
              (columnBox.left + columnBox.right) / 2,
          ) < 1
        );
      }),
    );
  expect(centered).toBe(true);
  const fits = await columns.evaluateAll((nodes) =>
    nodes.every((node) => {
      const box = node.getBoundingClientRect();
      return [...node.querySelectorAll("span")].every((span) => {
        const range = document.createRange();
        range.selectNodeContents(span);
        return range.getBoundingClientRect().width <= box.width;
      });
    }),
  );
  expect(fits).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(header).toContainText("founder.");
  await expect(header).toContainText("engineer.");
  await expect(header).toContainText("designer.");
  await expect(
    page.getByRole("button", { name: "Pause changing words" }),
  ).toHaveCount(0);
});

test("the final slather covers the viewport without a cleanup fade", async ({
  page,
}) => {
  const viewport = page.viewportSize() ?? { width: 390, height: 844 };
  for (let sample = 0; sample < 5; sample++) {
    const mask = brushMask(
      createBrushStrokes(viewport.width, viewport.height),
      1,
    );
    const coverage = await page.evaluate(async (mask) => {
      const image = new Image();
      image.src = mask.slice(5, -2);
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 240;
      canvas.height = 240;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.drawImage(image, 0, 0, 240, 240);
      const pixels = context.getImageData(0, 0, 240, 240).data;
      let covered = 0;
      for (let index = 3; index < pixels.length; index += 4)
        if ((pixels[index] ?? 0) >= 250) covered++;
      return covered / (240 * 240);
    }, mask);
    expect(coverage).toBeGreaterThan(0.999);
  }
});
