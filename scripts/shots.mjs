// Screenshots (1280x800) and thumbnail (1200x800) for the submission.
// Usage: node scripts/shots.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sub = join(root, "submission");
mkdirSync(join(sub, "screenshots"), { recursive: true });
const lesson = pathToFileURL(join(root, "examples", "at-the-station.html")).href;
const stage = (title, text) => pathToFileURL(join(root, "scripts", "stage.html")).href + "?src=" + encodeURIComponent(lesson) + "&size=23.6%20KB&title=" + encodeURIComponent(title) + "&text=" + encodeURIComponent(text);
const browser = await chromium.launch({ headless: true });

async function ctx(w, h) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await c.setOffline(true);
  // Headless Chromium here lists no English voice; a typical phone has one, so show that case.
  await c.addInitScript(() => { if (window.speechSynthesis) window.speechSynthesis.getVoices = () => [{ lang: "en-US", name: "English (phone)" }]; });
  return [c, await c.newPage()];
}

// 1. Generator with result and preview
{
  const [c, p] = await ctx(1280, 800);
  await p.goto(pathToFileURL(join(root, "index.html")).href);
  await p.click("#generate");
  await p.waitForSelector("#preview");
  await p.waitForTimeout(800);
  await p.evaluate(() => window.scrollTo(0, document.getElementById("write-h").getBoundingClientRect().top + window.scrollY - 12));
  await p.screenshot({ path: join(sub, "screenshots", "1-teacher-generator.png") });
  await c.close();
}
// 2. Learner file on the phone, default view
{
  const [c, p] = await ctx(1280, 800);
  await p.goto(stage("After: the lesson on Aya's phone", "Opened offline from the Files app. Every word and line has a Listen button; instructions are in Japanese, her language."));
  const f = p.frameLocator("#app");
  await f.locator("#vocab").evaluate((n) => n.scrollIntoView({ block: "start" }));
  await p.waitForTimeout(500);
  await p.screenshot({ path: join(sub, "screenshots", "2-learner-offline-listen.png") });
  await c.close();
}
// 3. Large text + high contrast + easy-read spacing, quiz feedback
{
  const [c, p] = await ctx(1280, 800);
  await p.goto(stage("Large text, high contrast, easy-read spacing", "Self-check quiz with immediate feedback. Fully keyboard-operable; progress is saved on the phone."));
  const f = p.frameLocator("#app");
  for (const n of ["文字を大きく", "ハイコントラスト", "読みやすい間隔"]) await f.getByRole("button", { name: n }).click();
  const q = f.locator("fieldset.q").first();
  await q.locator("input[type=radio]").first().check();
  await q.getByRole("button", { name: "答え合わせ" }).click();
  await q.evaluate((n) => n.scrollIntoView({ block: "start" }));
  await p.waitForTimeout(500);
  await p.screenshot({ path: join(sub, "screenshots", "3-learner-contrast-quiz.png") });
  await c.close();
}
// Thumbnail 3:2
{
  const [c, p] = await ctx(1200, 800);
  await p.goto(stage("LessonPack", "Paste a language lesson. Get one small HTML file that works on an old phone with no data: read-aloud, self-check quiz, large text, high contrast."));
  const f = p.frameLocator("#app");
  await f.locator("h1").waitFor();
  await p.waitForTimeout(500);
  await p.screenshot({ path: join(sub, "thumbnail.png") });
  await c.close();
}
await browser.close();
console.log("screenshots written");
