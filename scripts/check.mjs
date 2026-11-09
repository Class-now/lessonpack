// Automated testing evidence: axe-core scans, keyboard-only walkthrough, offline/no-network,
// small screens, read-aloud fallback, no-JS fallback, file size.
// Usage: node scripts/check.mjs [generator-url]   (default: local file://.../index.html)
// Writes submission/testing-evidence.json and prints a summary.
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const genUrl = process.argv[2] || pathToFileURL(join(root, "index.html")).href;
const outDir = join(root, "submission");
mkdirSync(join(outDir, "tmp"), { recursive: true });
const ev = { date: new Date().toISOString(), generatorUrl: genUrl, browser: "", checks: [] };
let failed = 0;
function record(name, ok, detail) {
  ev.checks.push({ name, ok, detail });
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + (typeof detail === "string" ? detail : JSON.stringify(detail)) : ""}`);
}
async function axe(page, label) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  const v = r.violations.map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0]?.target}`);
  record(`axe-core: ${label}`, v.length === 0, v.length ? v : `${r.passes.length} rules passed, 0 violations`);
}
async function focusInfo(page) {
  return page.evaluate(() => {
    const a = document.activeElement;
    if (!a || a === document.body) return null;
    const cs = getComputedStyle(a);
    const name = (a.getAttribute("aria-label") || a.labels?.[0]?.textContent || a.textContent || a.value || "").trim().replace(/\s+/g, " ").slice(0, 50);
    return { tag: a.tagName.toLowerCase(), type: a.type || "", name, outline: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2 };
  });
}

const browser = await chromium.launch({ headless: true });
ev.browser = "Chromium " + browser.version();
const external = [];
function guard(ctx) {
  return ctx.route("**/*", (route) => {
    const u = route.request().url();
    if (/^(file|blob|data|about):/.test(u) || u.startsWith(genUrl.replace(/index\.html$/, ""))) return route.continue();
    external.push(u);
    return route.abort();
  });
}

// ---------- 1. Generator ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  await guard(ctx);
  const page = await ctx.newPage();
  await page.goto(genUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await axe(page, "generator page (light)");
  // keyboard only: Tab until "Make the lesson file", press Enter
  const path = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const f = await focusInfo(page);
    path.push(f && `${f.tag}:${f.name}`);
    if (f && /Make the lesson file/.test(f.name)) break;
  }
  record("generator: reach 'Make the lesson file' with Tab only", /Make the lesson file/.test(path.at(-1) || ""), path);
  await page.keyboard.press("Enter");
  await page.waitForSelector("#download");
  const fdl = await focusInfo(page);
  record("generator: focus moves to the Download link after generating", /Download/.test(fdl?.name || ""), fdl?.name);
  const [download] = await Promise.all([page.waitForEvent("download"), page.keyboard.press("Enter")]);
  const lessonPath = join(outDir, "tmp", download.suggestedFilename());
  await download.saveAs(lessonPath);
  const bytes = statSync(lessonPath).size;
  record("lesson file size < 100 KB", bytes < 100 * 1024, `${(bytes / 1024).toFixed(1)} KB (${download.suggestedFilename()})`);
  ev.lessonFile = lessonPath;
  await axe(page, "generator page with preview iframe");
  // error reporting
  await page.fill("#src", "Title: Broken\n[Questions]\nQ: Where?\n+ Here\n+ There");
  await page.click("#generate");
  const err = await page.locator("[role=alert]").innerText();
  record("generator: teacher mistakes are explained with a line number", /Line 3/.test(err), err.split("\n").slice(0, 2).join(" | "));
  await axe(page, "generator page showing an error");
  await ctx.close();

  const dark = await browser.newContext({ colorScheme: "dark" });
  await guard(dark);
  const dp = await dark.newPage();
  await dp.goto(genUrl);
  await axe(dp, "generator page (dark mode)");
  await dark.close();
}

// ---------- 2. Learner file: offline, keyboard-only ----------
const lessonUrl = pathToFileURL(ev.lessonFile).href;
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, offline: true });
  await guard(ctx);
  // Stub speech so we can see what would be spoken (headless has no audio).
  await ctx.addInitScript(() => {
    window.__spoken = [];
    if (window.speechSynthesis) {
      window.speechSynthesis.speak = (u) => { window.__spoken.push({ text: u.text, lang: u.lang, rate: u.rate }); setTimeout(() => u.onend && u.onend(), 10); };
      window.speechSynthesis.getVoices = () => [{ lang: "en-US", name: "Test voice" }];
    }
  });
  const page = await ctx.newPage();
  await page.goto(lessonUrl);
  await axe(page, "learner file (default)");

  const order = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Tab");
    const f = await focusInfo(page);
    if (!f) break;
    order.push(f);
  }
  const noOutline = order.filter((f) => !f.outline);
  record("learner: every Tab stop shows a visible focus outline (>= 2px)", noOutline.length === 0, `${order.length} stops checked` + (noOutline.length ? `; missing: ${noOutline.map((f) => f.name).join(", ")}` : ""));
  ev.learnerTabOrderFirst15 = order.slice(0, 15).map((f) => `${f.tag}${f.type ? "[" + f.type + "]" : ""}: ${f.name}`);

  // Skip link
  await page.reload();
  await page.keyboard.press("Tab");
  const skip = await focusInfo(page);
  await page.keyboard.press("Enter");
  const afterSkip = await page.evaluate(() => document.activeElement.id);
  record("learner: first Tab is the skip link and it moves focus to the lesson", afterSkip === "lesson", `${skip?.name} -> #${afterSkip}`);

  // Settings by keyboard
  for (const [label, cls] of [["文字を大きく", "large"], ["ハイコントラスト", "contrast"], ["読みやすい間隔", "spacing"]]) {
    await page.getByRole("button", { name: label }).focus();
    await page.keyboard.press("Space");
    const on = await page.evaluate((c) => document.documentElement.classList.contains(c), cls);
    const pressed = await page.getByRole("button", { name: label }).getAttribute("aria-pressed");
    record(`learner: '${label}' toggles with Space and reports aria-pressed`, on && pressed === "true", `class .${cls}=${on}, aria-pressed=${pressed}`);
  }
  await axe(page, "learner file (large + high contrast + easy-read spacing)");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  record("learner: no sideways scrolling at 360px wide with large text + spacing", overflow <= 0, `overflow ${overflow}px`);
  await page.setViewportSize({ width: 320, height: 640 });
  const overflow320 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  record("learner: no sideways scrolling at 320px wide (large + spacing)", overflow320 <= 0, `overflow ${overflow320}px`);
  await page.setViewportSize({ width: 360, height: 740 });

  // Read aloud
  const listen = page.getByRole("button", { name: /^聞く: Excuse me/ });
  await listen.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(100);
  let spoken = await page.evaluate(() => window.__spoken);
  record("learner: Listen button speaks that line in the lesson language", spoken[0]?.text === "Excuse me. Where is platform 3?" && spoken[0]?.lang === "en-US", spoken[0]);
  await page.getByRole("button", { name: /会話を全部聞く/ }).click();
  await page.waitForTimeout(300);
  spoken = await page.evaluate(() => window.__spoken);
  record("learner: 'Listen to the whole dialogue' reads all 5 lines in order", spoken.length === 6, `${spoken.length - 1} lines queued`);

  // Quiz by keyboard: wrong answer, then right answer
  const q1 = page.locator("fieldset.q").first();
  await q1.locator("input[type=radio]").first().focus();
  await page.keyboard.press("ArrowDown"); // -> "Next to the shop" (wrong)
  await page.keyboard.press("Tab"); // -> Check
  await page.keyboard.press("Enter");
  const fbWrong = await q1.locator(".fb").innerText();
  await q1.locator("input[type=radio]").nth(1).focus();
  await page.keyboard.press("ArrowUp"); // -> "Next to the stairs" (right)
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  const fbRight = await q1.locator(".fb").innerText();
  record("learner: quiz gives immediate feedback (arrow keys + Enter only)", /まだ/.test(fbWrong) && /正解/.test(fbRight), { wrong: fbWrong, right: fbRight });
  const live = await q1.locator(".fb").getAttribute("aria-live");
  record("learner: feedback is announced to screen readers (aria-live)", live === "polite", `aria-live=${live}`);

  const q3 = page.locator("fieldset.q").nth(2);
  await q3.locator("input[type=text]").focus();
  await page.keyboard.type("green park.");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  const fbTyped = await q3.locator(".fb").innerText();
  record("learner: typed answer accepts different case and punctuation", /正解/.test(fbTyped), fbTyped);

  await page.getByRole("checkbox").first().check();
  const before = await page.locator("#progress-text").innerText();
  await page.reload();
  const after = await page.locator("#progress-text").innerText();
  const contrastKept = await page.evaluate(() => document.documentElement.classList.contains("contrast"));
  record("learner: progress and display settings survive closing and reopening (offline)", before === after && /1\/5/.test(after) && /2\/4/.test(after) && contrastKept, { before, after, contrastKept });
  await axe(page, "learner file after answering (feedback visible)");
  await ctx.close();
}

// ---------- 3. Learner file: dark mode ----------
{
  const ctx = await browser.newContext({ colorScheme: "dark", offline: true });
  const page = await ctx.newPage();
  await page.goto(lessonUrl);
  await axe(page, "learner file (dark mode)");
  await ctx.close();
}

// ---------- 4. No read-aloud in this browser ----------
{
  const ctx = await browser.newContext({ offline: true });
  await ctx.addInitScript(() => { delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; Object.defineProperty(window, "speechSynthesis", { value: undefined }); });
  const page = await ctx.newPage();
  await page.goto(lessonUrl);
  const note = await page.locator("#tts-note").innerText();
  const buttons = await page.getByRole("button", { name: /^聞く/ }).count();
  record("fallback: without speechSynthesis there are no dead Listen buttons and a clear note", buttons === 0 && /読み上げが使えません/.test(note), { listenButtons: buttons, note });
  await ctx.close();
}

// ---------- 5. Storage blocked ----------
{
  const ctx = await browser.newContext({ offline: true });
  await ctx.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } }); });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(lessonUrl);
  await page.locator("fieldset.q").first().locator("input[type=radio]").first().check();
  await page.locator("fieldset.q").first().getByRole("button").click();
  const fb = await page.locator("fieldset.q .fb").first().innerText();
  const note = await page.locator("#save-note").innerText();
  record("fallback: if storage is blocked the lesson still works and says progress is not saved", errors.length === 0 && /正解/.test(fb) && /保存できません/.test(note), { errors, note });
  await ctx.close();
}

// ---------- 6. JavaScript off ----------
{
  const ctx = await browser.newContext({ javaScriptEnabled: false, offline: true });
  const page = await ctx.newPage();
  await page.goto(lessonUrl);
  const text = await page.locator("main").innerText();
  const answers = await page.locator("details.ans").count();
  const settingsHidden = await page.locator("#settings").isHidden();
  record("fallback: with JavaScript off, all text is readable and each answer can be opened", /Excuse me/.test(text) && answers === 4 && settingsHidden, { answers, settingsHidden });
  await ctx.close();
  // axe needs JS to run, so scan the same static markup with the lesson's runtime script removed.
  const ctx2 = await browser.newContext({ offline: true });
  const p2 = await ctx2.newPage();
  const staticHtml = readFileSync(ev.lessonFile, "utf8").replace(/<script>\(function learnerRuntime[\s\S]*?<\/script>/, "");
  await p2.setContent(staticHtml);
  await axe(p2, "learner file without its script (what a no-JS browser shows)");
  await ctx2.close();
}

record("no network requests to any other host", external.length === 0, external.length ? external : "0 external requests");
const sampleBytes = statSync(join(root, "examples", "at-the-station.html")).size;
ev.sizes = { sampleLessonKB: +(sampleBytes / 1024).toFixed(1), generatorKB: +((statSync(join(root, "index.html")).size + statSync(join(root, "core.js")).size + statSync(join(root, "app.js")).size) / 1024).toFixed(1) };
await browser.close();
ev.summary = { passed: ev.checks.length - failed, failed };
ev.lessonFile = ev.lessonFile.slice(root.length + 1).replace(/\\/g, "/");
writeFileSync(join(outDir, "testing-evidence.json"), JSON.stringify(ev, null, 2));
console.log(`\n${ev.checks.length - failed}/${ev.checks.length} checks passed. Sizes: ${JSON.stringify(ev.sizes)}`);
process.exit(failed ? 1 : 0);
