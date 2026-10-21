import { test, expect } from "@playwright/test";

test("theme changes paint in both directions and respect reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "about", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Terminal command" });
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
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "about", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Terminal command" }),
  ).toHaveValue("about");
  await expect(
    page.getByRole("textbox", { name: "Terminal command" }),
  ).toBeFocused();
  await expect(page.getByRole("log")).toHaveCount(0);
  await page.getByRole("textbox", { name: "Terminal command" }).press("Escape");
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
  await page
    .getByRole("navigation", { name: "Explore" })
    .getByRole("button", { name: "work", exact: true })
    .click();
  await expect(input).toHaveValue("work");
  await expect(input).toBeFocused();
  await expect(
    page.getByRole("link", { name: "Wanderer’s Guide" }),
  ).toHaveCount(0);
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
  await page.goto("/");
  const header = page.locator("header");
  const initial = await header.boundingBox();
  await expect(header).toContainText("founder.");
  await expect(header).toContainText("builder.", { timeout: 7500 });
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
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(header).toContainText("founder.");
  await expect(header).toContainText("engineer.");
  await expect(header).toContainText("designer.");
  await expect(
    page.getByRole("button", { name: "Pause changing words" }),
  ).toHaveCount(0);
});
