// Records the demo video headless with Playwright and burns in English captions (DOM caption band).
// Usage: node scripts/record-demo.mjs   -> submission/demo.mp4 and submission/transcript.md
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, statSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "demo-out");
const sub = join(root, "submission");
mkdirSync(out, { recursive: true });
mkdirSync(join(sub, "tmp"), { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: out, size: { width: 1280, height: 720 } }, acceptDownloads: true });
const page = await context.newPage();
const t0 = Date.now();
const lines = [];
const pause = (ms) => page.waitForTimeout(ms);
async function caption(text) {
  lines.push({ t: (Date.now() - t0) / 1000, text });
  await page.evaluate((t) => {
    let c = document.getElementById("demo-caption");
    if (!c) {
      c = document.createElement("div");
      c.id = "demo-caption";
      c.setAttribute("aria-hidden", "true");
      c.style.cssText = "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);width:max-content;max-width:1180px;background:rgba(10,18,30,.93);color:#fff;font:600 23px/1.35 system-ui,'Segoe UI',sans-serif;padding:10px 22px;border-radius:10px;z-index:99999;text-align:center;pointer-events:none";
      document.body.appendChild(c);
    }
    c.textContent = t;
  }, text);
}

// ---- Before ----
await page.setContent(`<body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#13202f;color:#fff;font:28px/1.5 system-ui,sans-serif"><div style="max-width:900px"><h1 style="font-size:52px;margin:0 0 12px">LessonPack</h1><p>Aya, 14, is learning English. Her family shares one old Android phone with no data plan.</p><p style="color:#ffb4ab">Before: the class lesson is on an online platform. At home, Aya opens nothing.</p></div></body>`);
await caption("Meet Aya (fictional): a beginner English learner with an old shared phone and no mobile data.");
await pause(5500);
await caption("Before: her teacher's lesson lives online. With no connection, she can't study at home at all.");
await pause(5500);

// ---- Teacher: generator ----
await page.goto(pathToFileURL(join(root, "index.html")).href);
await page.evaluate(() => localStorage.clear());
await page.reload();
await caption("LessonPack: the teacher pastes a short lesson in plain text: words, a dialogue, questions.");
await pause(2500);
await page.locator("#src").evaluate((t) => t.scrollTop = 0);
await page.locator("#src").focus();
await pause(3500);
await caption("Simple format: 'word = meaning', 'Speaker: line = translation', '+' marks the right answer.");
await page.locator("#src").evaluate((t) => { t.scrollTop = 260; });
await pause(5000);
await caption("One click (or Enter) makes ONE self-contained HTML file. No account, no server, no upload.");
await page.locator("#generate").focus();
await pause(800);
const [download] = await Promise.all([page.waitForEvent("download"), (async () => { await page.keyboard.press("Enter"); await page.waitForSelector("#download"); await pause(3500); await page.keyboard.press("Enter"); })()]);
const lessonFile = join(sub, "tmp", download.suggestedFilename());
await download.saveAs(lessonFile);
const kb = (statSync(lessonFile).size / 1024).toFixed(0);
await caption(`${kb} KB. Send it by Bluetooth, USB cable, SD card or a chat app. It never needs the internet again.`);
await page.locator("#preview").scrollIntoViewIfNeeded();
await pause(5000);

// ---- Learner: the file on the phone, offline ----
await context.setOffline(true);
const stage = pathToFileURL(join(root, "scripts", "stage.html")).href + "?src=" + encodeURIComponent(pathToFileURL(lessonFile).href) + "&size=" + kb + "%20KB&title=" + encodeURIComponent("After: Aya, offline") + "&text=" + encodeURIComponent("The same lesson, opened from the phone's Files app. Buttons and instructions are in Japanese, her language.");
await page.goto(stage);
const f = page.frameLocator("#app");
await f.locator("h1").waitFor();
await caption("After: Aya opens the file with Wi-Fi and data off. Everything works.");
await pause(5000);
await caption("Display options: larger text, high contrast, and easy-read spacing for dyslexic readers.");
await f.getByRole("button", { name: "文字を大きく" }).click();
await pause(1500);
await f.getByRole("button", { name: "読みやすい間隔" }).click();
await pause(1500);
await f.getByRole("button", { name: "ハイコントラスト" }).click();
await pause(3000);
await caption("Every word and line has a Listen button. It uses the phone's own offline voice, at normal or slow speed.");
await f.locator("#vocab").scrollIntoViewIfNeeded();
await f.getByRole("button", { name: /^聞く: ticket$/ }).focus();
await pause(5000);
await caption("If the phone has no speech engine, the buttons are hidden and a note says so. The text is always there.");
await f.locator("#dialogue-h").evaluate((n) => n.scrollIntoView({ block: "start" }));
await pause(5000);
await caption("Translations can be hidden for self-testing. The page is all real headings, labels and buttons for screen readers.");
await f.getByRole("button", { name: "訳を表示" }).click();
await pause(5000);
await f.getByRole("button", { name: "訳を表示" }).click();

await caption("Self-check quiz with immediate feedback, fully keyboard-operable.");
const q1 = f.locator("fieldset.q").first();
await q1.evaluate((n) => n.scrollIntoView({ block: "start" }));
await pause(1500);
await q1.locator("input[type=radio]").nth(1).check();
await q1.getByRole("button", { name: "答え合わせ" }).click();
await pause(3000);
await caption("Wrong first? 'Not yet, try again' — after two tries it shows a hint from the dialogue.");
await q1.locator("input[type=radio]").nth(0).check();
await q1.getByRole("button", { name: "答え合わせ" }).click();
await pause(4500);
const q3 = f.locator("fieldset.q").nth(2);
await q3.evaluate((n) => n.scrollIntoView({ block: "start" }));
await caption("Typed answers are forgiving about capitals and punctuation.");
await q3.locator("input[type=text]").pressSequentially("green park.", { delay: 90 });
await q3.getByRole("button", { name: "答え合わせ" }).click();
await pause(4000);
await f.getByRole("checkbox").first().check();
await caption("Progress is saved on the phone itself. Close the file, reopen it tomorrow: it is still there.");
await page.reload();
await f.locator("#progress-box").waitFor();
await f.locator("#progress-box").evaluate((n) => n.scrollIntoView({ block: "center" }));
await pause(5500);
await caption("Tested: axe-core 0 violations, keyboard-only walkthrough, 320px screens, JavaScript-off and no-speech fallbacks.");
await pause(5500);
await caption("LessonPack: one barrier removed. No data, no problem. Open source, MIT. class-now.github.io/lessonpack");
await pause(5000);

const total = (Date.now() - t0) / 1000;
await context.close();
await browser.close();
const vid = readdirSync(out).filter((n) => n.endsWith(".webm")).map((n) => ({ n, m: statSync(join(out, n)).mtimeMs })).sort((a, b) => b.m - a.m)[0].n;
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", join(out, vid), "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "24", "-movflags", "+faststart", "-an", join(sub, "demo.mp4")], { stdio: "inherit" });

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const md = ["# LessonPack demo video: transcript", "", "The video has no audio. These are the on-screen English captions, with start times.", "",
  ...lines.map((l) => `- **${fmt(l.t)}** ${l.text}`), "", "All people and lesson content in the video are fictional."].join("\n");
writeFileSync(join(sub, "transcript.md"), md + "\n");
// also an SRT so the captions can be uploaded as a separate track
const srtTime = (s) => { const ms = Math.round(s * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`; };
writeFileSync(join(sub, "demo.srt"), lines.map((l, i) => `${i + 1}\n${srtTime(l.t)} --> ${srtTime(i + 1 < lines.length ? lines[i + 1].t : total)}\n${l.text}\n`).join("\n"));
console.log("recorded", total.toFixed(1), "s");
