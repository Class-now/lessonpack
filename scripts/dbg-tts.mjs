import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ offline: true });
await ctx.addInitScript(() => {
  window.__spoken = [];
  window.__had = !!window.speechSynthesis;
  if (window.speechSynthesis) {
    window.speechSynthesis.speak = (u) => { window.__spoken.push({ text: u.text, lang: u.lang }); };
  }
});
const p = await ctx.newPage();
p.on("console", (m) => console.log("console", m.text()));
p.on("pageerror", (e) => console.log("err", e.message));
await p.goto(pathToFileURL(process.argv[2]).href);
console.log(await p.evaluate(() => ({ had: window.__had, own: Object.prototype.hasOwnProperty.call(speechSynthesis, "speak"), n: document.querySelectorAll("button[aria-label]").length })));
await p.getByRole("button", { name: /^聞く: Excuse me/ }).click();
await p.waitForTimeout(200);
console.log(await p.evaluate(() => window.__spoken));
await b.close();
