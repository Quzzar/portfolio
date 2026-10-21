import { test, expect } from "@playwright/test";

test("theme changes paint in both directions and respect reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const input = page.getByRole("textbox", { name: "Terminal command" });
  await input.fill("about");
  await input.press("Enter");
  const output = page.getByRole("log");
  const before = await output.innerText();
  const painting = page.locator('[data-painting="true"]');
  for (const [from, to] of [
    ["dark", "light"],
    ["light", "dark"],
  ]) {
    await page.getByRole("button", { name: `Use ${from} theme` }).click();
    await expect(painting).toBeAttached();
    // The complete destination UI already exists while the mask paints it in.
    await expect(page.locator(`[data-theme="${from}"]`)).toBeVisible();
    await page.waitForFunction(() =>
      document.documentElement.style
        .getPropertyValue("--theme-brush-mask")
        .includes("%3Cpath"),
    );
    await page.waitForTimeout(400);
    await page.screenshot({
      path: `.impeccable/review/brush-${from}-${test.info().project.name}.png`,
    });
    await expect(
      page.getByRole("button", { name: `Use ${to} theme` }),
    ).toBeEnabled();
    expect(await output.innerText()).toBe(before);
    await expect(input).toHaveValue("");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator('[data-theme="dark"]')).toBeVisible();
  await expect(painting).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      document.documentElement.style.getPropertyValue("--theme-brush-mask"),
    ),
  ).toBe("");
});

test("the real homepage ships with working local assets and accessible identity", async ({
  page,
}) => {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      response.url().startsWith("http://localhost")
    )
      failures.push(response.url());
  });
  await page.goto("/");
  await expect(page).toHaveTitle("Aaron Cassar");
  await expect(
    page.getByRole("heading", { name: "Aaron Cassar" }),
  ).toBeVisible();
  await expect(
    page.getByText("Founder, engineer, designer.", { exact: true }),
  ).toBeAttached();
  await expect(
    page.getByRole("link", { name: "Resume", exact: true }),
  ).toHaveAttribute("href", "/resume/Resume.pdf");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const resume = await page.request.get("/resume/Resume.pdf");
  expect(resume.status()).toBe(200);
  await expect(page.locator("footer a")).toHaveText([
    "GitHub",
    "Resume",
    "LinkedIn",
  ]);
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(
    page.getByRole("textbox", { name: "Terminal command" }),
  ).toHaveValue("");
  expect(resume.headers()["content-type"]).toContain("pdf");
  expect(failures).toEqual([]);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `.impeccable/review/${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  if (test.info().project.name === "desktop") {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.screenshot({
      path: ".impeccable/review/user-2560.png",
      fullPage: true,
      animations: "disabled",
    });
  }
});

test("commands, errors, completion, history, clear and clickable alternatives work", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Terminal command" });
  await input.fill("wor");
  await input.press("Tab");
  await expect(input).toHaveValue("work");
  await input.fill("help");
  await input.press("Enter");
  await expect(page.getByRole("log")).toContainText(
    "Things I’ve put into the world.",
  );
  await input.fill("<script>alert(1)</script>");
  await input.press("Enter");
  await expect(page.getByRole("log")).toContainText(
    "Command not found: <script>alert(1)</script>.",
  );
  await input.press("ArrowUp");
  await expect(input).toHaveValue("<script>alert(1)</script>");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("help");
  await input.press("ArrowDown");
  await input.press("ArrowDown");
  await expect(input).toHaveValue("");
  await input.fill("wor");
  await expect(
    page.getByRole("group", { name: "Command completions" }),
  ).toContainText("work");
  await expect(
    page.getByRole("link", { name: "Wanderer’s Guide" }),
  ).toHaveCount(0);
  await input.press("ArrowRight");
  await expect(input).toHaveValue("work");
  await input.press("Enter");
  await expect(
    page.getByRole("link", { name: "Wanderer’s Guide" }),
  ).toHaveAttribute("href", "https://wanderersguide.app/");
  await input.fill("clear");
  await input.press("Enter");
  await expect(page.getByRole("log")).toHaveCount(0);
  await expect(input).toBeFocused();
});

test("hidden play field returns to the previous transcript and theme works", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Terminal command" });
  await input.fill("ls -a");
  await input.press("Enter");
  await page.getByRole("button", { name: "./play", exact: true }).click();
  await expect(input).toHaveValue("play");
  await input.press("Enter");
  await expect(
    page.getByRole("main", { name: "Interactive ASCII playground" }),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: /ASCII waves/ })).toBeVisible();
  await page.screenshot({
    path: `.impeccable/review/play-${test.info().project.name}.png`,
    fullPage: true,
  });
  if (test.info().project.name === "mobile")
    await page.getByRole("button", { name: "back to almost nothing" }).click();
  else await page.keyboard.press("Escape");
  await expect(page.getByRole("log")).toContainText("Entirely unnecessary.");
  await expect(input).toBeFocused();
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator('[data-theme="dark"]')).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Use light theme" }),
  ).toBeEnabled();
  await page.screenshot({
    path: `.impeccable/review/dark-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  await input.fill("theme");
  await input.press("Enter");
  await expect(page.locator('[data-theme="light"]')).toBeVisible();
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

test("terminal offers cycling completion, file commands, editing, and keyboard escape", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Terminal command" });
  await input.fill("c");
  const options = page.getByRole("group", { name: "Command completions" });
  await expect(options).toContainText("contact");
  await expect(options).toContainText("clear");
  await page.screenshot({
    path: `.impeccable/review/completion-${test.info().project.name}.png`,
  });
  await input.press("Tab");
  await expect(input).toHaveValue("contact");
  await input.press("Tab");
  await expect(input).toHaveValue("clear");
  await input.press("Shift+Tab");
  await expect(input).toHaveValue("contact");
  await input.press("Enter");
  await expect(page.getByRole("log")).toContainText("contact@aaroncassar.com");
  await input.fill("cat a");
  await input.press("Tab");
  await expect(input).toHaveValue("cat about.txt");
  await input.press("Enter");
  await expect(page.getByRole("log")).toContainText("I’m Aaron.");
  await input.fill("hello world");
  await input.press("Control+w");
  await expect(input).toHaveValue("hello ");
  await input.press("Control+a");
  await input.press("Control+k");
  await expect(input).toHaveValue("");
  await input.fill("draft");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("cat about.txt");
  await input.press("ArrowDown");
  await expect(input).toHaveValue("draft");
  await input.press("Control+c");
  await expect(input).toHaveValue("");
  await input.press("Tab");
  await expect(options).toContainText("help");
  await input.press("Escape");
  await expect(options).toHaveCount(0);
  await expect(input).not.toBeFocused();
  await input.fill("help");
  await input.press("Tab");
  await expect(input).not.toBeFocused();
});
