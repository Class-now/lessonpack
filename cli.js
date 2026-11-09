#!/usr/bin/env node
// Command-line version of the generator: node cli.js <lesson.txt> [out.html]
"use strict";
const fs = require("fs");
const path = require("path");
const LessonPack = require("./core.js");

const input = process.argv[2];
if (!input) {
  console.error("Usage: node cli.js <lesson.txt> [out.html]");
  process.exit(2);
}
const res = LessonPack.generate(fs.readFileSync(input, "utf8"));
for (const w of res.warnings) console.warn(`warning (line ${w.line}): ${w.message}`);
if (!res.ok) {
  for (const e of res.errors) console.error(`error (line ${e.line}): ${e.message}`);
  process.exit(1);
}
const out = process.argv[3] || path.join(path.dirname(input), res.filename);
fs.writeFileSync(out, res.html);
console.log(`wrote ${out} (${(res.bytes / 1024).toFixed(1)} KB)`);
