"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const LessonPack = require("../core.js");

const sample = fs.readFileSync(path.join(__dirname, "../examples/at-the-station.txt"), "utf8");

test("sample lesson parses without errors", () => {
  const { lesson, errors } = LessonPack.parse(sample);
  assert.deepStrictEqual(errors, []);
  assert.strictEqual(lesson.title, "At the Train Station");
  assert.strictEqual(lesson.lang, "en-US");
  assert.strictEqual(lesson.ui, "ja");
  assert.strictEqual(lesson.vocab.length, 5);
  assert.strictEqual(lesson.dialogue.length, 5);
  assert.strictEqual(lesson.dialogue[0].speaker, "Mika");
  assert.strictEqual(lesson.quiz.length, 4);
  assert.strictEqual(lesson.quiz[2].type, "typed");
  assert.deepStrictEqual(lesson.quiz[2].answers, ["Green Park", "to Green Park"]);
});

test("generated file is small and self-contained", () => {
  const res = LessonPack.generate(sample);
  assert.ok(res.ok);
  assert.ok(res.bytes < 100 * 1024, `size ${res.bytes}`);
  assert.doesNotMatch(res.html, /<script[^>]+src=/i);
  assert.doesNotMatch(res.html, /<link[^>]+href=/i);
  assert.doesNotMatch(res.html, /https?:\/\//);
});

test("teacher mistakes are reported with line numbers", () => {
  const bad = "Title: X\n[Questions]\nQ: one?\n+ a\n+ b\nQ: two?\n[Nope]\nhello";
  const { errors } = LessonPack.parse(bad);
  const lines = errors.map((e) => e.line);
  assert.ok(lines.includes(3), "two correct choices -> line 3");
  assert.ok(lines.includes(6), "no answers -> line 6");
  assert.ok(lines.includes(7), "unknown section -> line 7");
});

test("lesson text cannot inject markup or script", () => {
  const evil = 'Title: <img src=x onerror=alert(1)>\n[Dialogue]\nA: </script><script>alert(1)</script> = "x"\n[Questions]\nQ: "q\'\n+ <b>a</b>\n- b';
  const res = LessonPack.generate(evil);
  assert.ok(res.ok);
  assert.doesNotMatch(res.html, /<img src=x/);
  assert.doesNotMatch(res.html, /<script>alert/);
  assert.doesNotMatch(res.html, /<b>a<\/b>/);
  assert.strictEqual((res.html.match(/<script/g) || []).length, 2, "only the data block and the runtime");
});

test("the example in the web page matches examples/at-the-station.txt", () => {
  const ctx = { window: {}, document: { getElementById: () => ({ addEventListener() {}, value: "", hidden: true }), querySelector: () => null },
    localStorage: { getItem: () => null, setItem() {} }, location: { protocol: "file:", hostname: "" }, navigator: {}, LessonPack };
  ctx.window = ctx;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../app.js"), "utf8"), ctx);
  assert.strictEqual(ctx.LessonPackExample.trim(), sample.replace(/\r\n/g, "\n").trim());
});

test("typed answers ignore case, punctuation and extra spaces", () => {
  assert.strictEqual(LessonPack.normalize("  The  Stairs. "), LessonPack.normalize("the stairs"));
  assert.strictEqual(LessonPack.normalize("Green Park!"), "green park");
});
