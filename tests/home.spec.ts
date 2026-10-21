import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const screen = (page: Page) => page.locator(".xterm-rows");
const currentLine = (page: Page) =>
  page
    .locator(".xterm-rows > div")
    .filter({ has: page.locator(".xterm-cursor") });
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
  await expect(page.locator("#terminal-hint")).toHaveCount(0);
  await expect(
    page.getByText("Esc leaves the terminal", { exact: false }),
  ).toHaveCount(0);
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
  await expect(currentLine(page)).toContainText("% about ");
  await input.press("Enter");
  await expect(screen(page)).toContainText("System design. Product design.");
  await input.pressSequentially("cat ");
  await input.press("Tab");
  await expect(screen(page)).toContainText("about.txt");
  await expect(screen(page)).toContainText("work.txt");
  await expect(screen(page)).toContainText("contact.txt");
  await expect(currentLine(page)).toHaveText(/% cat\s*$/);
  await input.press("Tab");
  await expect(currentLine(page)).toContainText("% cat about.txt");
  await input.press("Tab");
  await expect(currentLine(page)).toContainText("% cat contact.txt");
  await input.press("Shift+Tab");
  await expect(currentLine(page)).toContainText("% cat about.txt");
  await input.press("Enter");
  await expect(screen(page)).toContainText("System design. Product design.");
  await input.press("ArrowUp");
  await expect(currentLine(page)).toContainText("% cat about.txt");
  await page.screenshot({
    path: `.impeccable/review/terminal-tab-${test.info().project.name}.png`,
    fullPage: true,
  });
  await input.press("Control+c");
  await expect(screen(page)).toContainText("^C");
  await command(page, "clear");
  await expect(screen(page)).not.toContainText(
    "System design. Product design.",
  );
  await input.pressSequentially("ct about.txt");
  await input.press("Home");
  await input.press("ArrowRight");
  await input.pressSequentially("a");
  await input.press("End");
  await input.press("Enter");
  await expect(screen(page)).toContainText("System design. Product design.");
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
  await page.getByRole("button", { name: "Back" }).click();
  await expect(input).toBeFocused();
  await input.press("Control+l");
  await expect(screen(page)).not.toContainText("Command not found:");
  await command(page, "about");
  await expect(screen(page)).toContainText("System design. Product design.");
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
  await expect(screen(page)).toContainText("System design. Product design.");
  for (const [next, after] of [
    ["dark", "light"],
    ["light", "dark"],
  ]) {
    await page.getByRole("button", { name: `Use ${next} theme` }).click();
    await expect(page.locator(`[data-theme="${next}"]`)).toBeVisible();
    await page.waitForFunction(() =>
      document.documentElement.style
        .getPropertyValue("--theme-brush-mask")
        .includes("data:image/png"),
    );
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `.impeccable/review/slather-${next}-${test.info().project.name}.png`,
    });
    await expect(
      page.getByRole("button", { name: `Use ${after} theme` }),
    ).toBeEnabled();
    await expect(screen(page)).toContainText("System design. Product design.");
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
  await terminal(page);
  await page.evaluate(() => {
    const root = document.documentElement;
    new MutationObserver(() => {
      const mask = root.style.getPropertyValue("--theme-brush-mask");
      if (mask) root.dataset.lastMask = mask;
    }).observe(root, { attributes: true, attributeFilter: ["style"] });
  });
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(
    page.getByRole("button", { name: "Use light theme" }),
  ).toBeEnabled();
  const coverage = await page.evaluate(async () => {
    const image = new Image();
    image.src = document.documentElement.dataset.lastMask!.slice(5, -2);
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 240;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0, 240, 240);
    const pixels = context.getImageData(0, 0, 240, 240).data;
    let covered = 0;
    for (let index = 3; index < pixels.length; index += 4)
      if ((pixels[index] ?? 0) >= 250) covered++;
    return covered / (240 * 240);
  });
  expect(coverage).toBeGreaterThan(0.999);
});

test("Tab lists choices then cycles forward and backward", async ({ page }) => {
  const input = await terminal(page);
  const host = page.locator('[data-ready="true"]');
  const box = await host.boundingBox();
  const heading = await page
    .getByRole("heading", { name: "Aaron Cassar" })
    .boundingBox();
  await input.pressSequentially("he");
  await input.press("Tab");
  await expect(screen(page)).toContainText("hello");
  await expect(screen(page)).toContainText("help");
  await expect(currentLine(page)).toHaveText(/% he\s*$/);
  await input.press("Tab");
  await expect(currentLine(page)).toContainText("% hello");
  await input.press("Tab");
  await expect(currentLine(page)).toContainText("% help");
  await input.press("Shift+Tab");
  await expect(currentLine(page)).toContainText("% hello");
  await input.press("Shift+Tab");
  await expect(currentLine(page)).toContainText("% help");
  await input.press("Tab");
  await expect(currentLine(page)).toContainText("% hello");
  expect(await host.boundingBox()).toEqual(box);
  expect(
    await page.getByRole("heading", { name: "Aaron Cassar" }).boundingBox(),
  ).toEqual(heading);
  await page.screenshot({
    path: `.impeccable/review/mac-completion-${test.info().project.name}.png`,
  });
  await input.pressSequentially("x");
  await expect(currentLine(page)).toContainText("% hellox");
  await input.press("Backspace");
  await input.press("Enter");
  await expect(screen(page)).toContainText("resume");
  await expect(screen(page)).not.toContainText("Hello, stranger");
  await input.pressSequentially("draft");
  await input.press("ArrowUp");
  await expect(currentLine(page)).toContainText("% hello");
  await input.press("ArrowDown");
  await expect(currentLine(page)).toContainText("% draft");
  await input.press("Control+u");
  await input.pressSequentially("cat ab --flag");
  await input.press("Home");
  for (let step = 0; step < 6; step++) await input.press("ArrowRight");
  await input.press("Tab");
  await expect(screen(page)).toContainText("% cat about.txt --flag");
  await input.press("Control+u");
  await input.pressSequentially("zz");
  await input.press("Tab");
  await input.pressSequentially("z");
  await expect(currentLine(page)).toContainText("% zzz");
  await input.press("Control+u");
  await input.pressSequentially("hello world");
  await input.press("Alt+Backspace");
  await expect(currentLine(page)).toContainText("% hello ");
  await input.press("Meta+ArrowLeft");
  await input.pressSequentially("x");
  await expect(currentLine(page)).toContainText("% xhello ");
  await input.press("Meta+ArrowRight");
  await input.press("Control+w");
  await input.pressSequentially("about");
  await expect(currentLine(page)).toContainText("% about");
});

test("typing never clears the prompt or changes the terminal geometry", async ({
  page,
}) => {
  const input = await terminal(page);
  const host = page.locator('[data-ready="true"]');
  const before = await host.boundingBox();
  const samples = page.evaluate(
    () =>
      new Promise<string[]>((resolve) => {
        const frames: string[] = [];
        const sample = () => {
          frames.push(document.querySelector(".xterm-rows")?.textContent ?? "");
          if (frames.length === 45) resolve(frames);
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }),
  );
  await input.pressSequentially("about", { delay: 35 });
  await input.press("ArrowLeft");
  await input.press("Backspace");
  await input.pressSequentially("u");
  await input.press("End");
  await expect(currentLine(page)).toContainText("% about");
  const frames = await samples;
  expect(frames.every((frame) => frame.includes("visitor@aaron ~ %"))).toBe(
    true,
  );
  expect(await host.boundingBox()).toEqual(before);
});

test("terminal has room to read output without moving the prompt layout", async ({
  page,
}) => {
  await terminal(page);
  const host = page.locator('[data-ready="true"]');
  const box = await host.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(352);
  if (test.info().project.name === "desktop")
    expect(box?.width).toBeGreaterThanOrEqual(850);
  await command(page, "help");
  await expect(screen(page)).not.toContainText(
    /Tab completes|Curious|A little|conversation|Things I’ve/,
  );
  if (test.info().project.name === "desktop") {
    await expect(screen(page)).toContainText("work");
    await expect(screen(page)).toContainText("resume");
  }
  expect(await host.boundingBox()).toEqual(box);
  await page.screenshot({
    path: `.impeccable/review/roomier-terminal-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("ambiguous Tab lists matches before selecting or cycling", async ({
  page,
}) => {
  const input = await terminal(page);
  const press = async (key: string) => {
    await input.press(key);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
  };
  await input.pressSequentially("c");
  await press("Tab");
  await expect(screen(page)).toContainText("coffee");
  await expect(currentLine(page)).toHaveText(/% c\s*$/);
  for (const choice of ["cat", "clear", "coffee", "contact", "cat"]) {
    await press("Tab");
    await expect(currentLine(page)).toHaveText(new RegExp(`% ${choice}\\s*$`));
  }
  await press("Shift+Tab");
  await expect(currentLine(page)).toHaveText(/% contact\s*$/);
});

test("page fits short viewports with a compact top inset", async ({ page }) => {
  await terminal(page);
  for (const [width, height] of [
    [1180, 700],
    [760, 600],
    [390, 700],
    [320, 568],
    [844, 390],
  ]) {
    await page.setViewportSize({ width: width!, height: height! });
    await expect
      .poll(() =>
        page.evaluate(() => ({
          fits:
            document.documentElement.scrollHeight <= innerHeight + 1 &&
            document.documentElement.scrollWidth <= innerWidth,
          footer:
            document.querySelector("footer")!.getBoundingClientRect().bottom <=
            innerHeight + 1,
          top:
            document.querySelector("header")!.getBoundingClientRect().top <= 55,
        })),
      )
      .toEqual({ fits: true, footer: true, top: true });
  }
});

test("identity keeps changing after terminal output", async ({ page }) => {
  await page.clock.install();
  await terminal(page);
  await command(page, "contact");
  await expect(screen(page)).toContainText("contact@aaroncassar.com");
  await page.clock.pauseAt(
    new Date(await page.evaluate(() => Date.now() + 1000)),
  );
  const columns = page.locator("[data-identity-column]");
  const before = await columns.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-word")),
  );
  const changed = [false, false, false];
  for (let elapsed = 0; elapsed < 6500; elapsed += 500) {
    await page.clock.runFor(500);
    const words = await columns.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-word")),
    );
    words.forEach((word, index) => {
      if (word !== before[index]) changed[index] = true;
    });
    expect(new Set(words).size).toBe(3);
  }
  expect(changed).toEqual([true, true, true]);
});

test("clear removes the submitted command and all earlier output", async ({
  page,
}) => {
  const input = await terminal(page);
  await command(page, "about");
  await expect(screen(page)).toContainText("System design. Product design.");
  await command(page, "clear");
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(screen(page)).toHaveText(/^\s*visitor@aaron ~ %\s*$/);
  await input.pressSequentially("contact");
  await input.press("Enter");
  await expect(screen(page)).toContainText("contact@aaroncassar.com");
  await command(page, "work");
  await expect(screen(page)).toContainText("More on GitHub");
  await command(page, "work");
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await command(page, "clear");
  await expect(screen(page)).toHaveText(/^\s*visitor@aaron ~ %\s*$/);
  await expect(page.locator(".xterm-rows > div").first()).toHaveText(
    /^visitor@aaron ~ %\s*$/,
  );
  await page.locator('[data-ready="true"]').hover();
  await page.mouse.wheel(0, -1000);
  await expect(screen(page)).toHaveText(/^\s*visitor@aaron ~ %\s*$/);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.screenshot({
    path: `.impeccable/review/cleared-terminal-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("failed brush download reports the error and allows retry", async ({
  page,
}) => {
  await terminal(page);
  await page.route("**/brushes/*.mp4", (route) => route.abort());
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Brush could not load. Try again.",
  );
  await expect(
    page.getByRole("button", { name: "Use dark theme" }),
  ).toBeEnabled();
  await expect(page.locator('[data-theme="light"]')).toBeVisible();
  await page.unroute("**/brushes/*.mp4");
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(
    page.getByRole("button", { name: "Use light theme" }),
  ).toBeEnabled();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
