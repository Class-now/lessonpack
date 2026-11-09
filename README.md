# LessonPack

**A teacher pastes a short language lesson. LessonPack turns it into one small HTML file that works on an old shared phone with no data.**

- Live generator: https://class-now.github.io/lessonpack/
- Example lesson file (open it, then turn off Wi-Fi and reload): https://class-now.github.io/lessonpack/examples/at-the-station.html
- Demo video (no audio, captions burned in; transcript in [`submission/transcript.md`](submission/transcript.md), SRT in [`submission/demo.srt`](submission/demo.srt)): [`submission/demo.mp4`](submission/demo.mp4)

Built for [AccessED Hacks](https://accessed-hacks.devpost.com/). Barrier category: **Connect** (no reliable connectivity), plus **Interact** (keyboard, screen reader, low vision, dyslexia, no audio).

## The learner, the task, the barrier

| | |
|---|---|
| **Learner** | Aya (a fictional example), 14, a beginner English learner. Her family shares one old Android phone with no mobile data plan; home has no Wi-Fi. |
| **Learning task** | Practise this week's lesson at home: learn 5 words, read and listen to a short dialogue, and check understanding with 4 questions. |
| **Barrier** | The lesson lives on an online platform (or in a video, or in a chat app that needs data to load). Without a connection, Aya gets nothing at home. Many offline options are also hard to use: tiny text, no audio, mouse-only quizzes, nothing for screen readers. |

## Before and after (one concrete example)

**Before.** Aya's teacher posts "At the Train Station" on the class platform: a word list, a 5-line dialogue with audio, and a quiz. At school Aya sees it for two minutes. At home the phone has no data: the page never loads, the audio never plays, the quiz is never done. Next week she starts behind.

**After.** The teacher pastes the same lesson as plain text into LessonPack and clicks **Make the lesson file**. Out comes `at-the-train-station.html`, **23.5 KB**, with nothing else needed. It reaches Aya's phone once by Bluetooth / USB cable / a chat app while at school. At home, offline, she opens it from the Files app and gets:

- the 5 words with Japanese meanings and example sentences, each with a **Listen** button (the phone's own offline voice, normal or slow speed);
- the dialogue, line by line, with translations she can hide to test herself, and "Listen to the whole dialogue";
- 4 self-check questions (multiple choice and typed) with **immediate feedback** and a hint after two tries;
- **Larger text**, **High contrast** and **Easy-read spacing** (WCAG 1.4.12 spacing, no italics) toggles;
- **progress saved on the phone**: close it, reopen tomorrow, her answers and settings are still there;
- buttons and instructions in **her** language (Japanese here; English and Spanish also built in), while the lesson text is marked as English so read-aloud and screen readers pronounce it correctly.

## How to use it

1. Open https://class-now.github.io/lessonpack/ (after one visit it also works offline; or click "Download LessonPack itself as one offline file").
2. Click **Load the example lesson** or write your own (format below).
3. Click **Make the lesson file**. Mistakes are listed with line numbers and a "Go to line" button.
4. Download the file and share it however works: Bluetooth, Nearby Share, AirDrop, USB cable, SD card, or as a document in a chat app. It also prints cleanly with answers for learners without a phone.

Command line (same engine): `node cli.js examples/at-the-station.txt`

### Lesson format

```text
Title: At the Train Station
Language: en-US        (the language being learned; used for read-aloud and lang= markup)
Notes language: ja     (language of meanings/translations, optional)
Interface: ja          (buttons and instructions: en, ja or es)
Level: Beginner (A1)

[Vocabulary]
ticket = 切符 | One ticket to Green Park, please.

[Dialogue]
Mika: Excuse me. Where is platform 3? = すみません。3番ホームはどこですか？

[Reading]
The station is small but busy. = 駅は小さいけれど混んでいます。

[Questions]
Q: Where is platform 3?
+ Next to the stairs
- Next to the shop
Why: The staff member says "It's next to the stairs."

Q: Where does Mika want to go?
A: Green Park | to Green Park
```

## How it is built

- Plain HTML, CSS and JavaScript. No build step, no runtime dependencies, no network requests, no tracking.
- `core.js` parses the lesson and writes the learner file. The learner file is **server-rendered static HTML** (real headings, lists, `fieldset`/`legend` questions, `label`s, `lang` attributes), so it is readable even with JavaScript off: every answer sits in a `<details>` under its question.
- A small ES5 script (for old phone browsers) then adds the Listen buttons, Check buttons, settings and saved progress. Speech uses the browser's built-in `speechSynthesis`; if it is missing, no Listen buttons are shown and a note explains. If storage is blocked, the lesson still works and says progress cannot be saved.
- Lesson text is escaped everywhere (tested against script injection).
- `sw.js` caches the generator after one visit so teachers can also make lessons offline.

## Testing evidence

All checks are automated in [`scripts/check.mjs`](scripts/check.mjs) (Playwright, headless Chromium, with every non-local request blocked and the learner contexts set to offline). Full results: [`submission/testing-evidence.json`](submission/testing-evidence.json). Unit tests: `npm test` (parser, file size, injection, typed-answer matching).

TESTING_RESULTS

What these checks do **not** prove: we have not yet tested with a real screen reader user, on a physical low-end phone, or with real teachers and learners. axe-core finds roughly a third to a half of accessibility problems; the rest needs people.

## Limitations

- Read-aloud depends on the voices installed on the phone. Many old Android phones have an English voice but not every language. Recorded audio is not embedded (it would make files much larger).
- Progress is stored per browser on one device. On a shared phone, two learners share one progress record unless they use separate copies of the file.
- Only multiple-choice and typed questions. No speaking practice or teacher feedback loop: results stay on the phone.
- The interface is translated into English, Japanese and Spanish only (adding a language is one table in `core.js`).
- Typed answers are matched exactly after ignoring case and punctuation, so teachers should list accepted variants with `|`.

## What was made during the hackathon

Everything in this repository was created from scratch on 2026-11-10 for AccessED Hacks. No pre-existing code was used.

## Credits and AI disclosure

- Built with the help of **Claude Code** (Anthropic), an AI coding assistant, which wrote most of the code, the tests, the demo recording script and this README under human direction.
- Libraries used only for testing and the demo video (not shipped to learners): [Playwright](https://playwright.dev/), [axe-core](https://github.com/dequelabs/axe-core) via `@axe-core/playwright`, and FFmpeg.
- All example lessons, names (Aya, Mika) and places (Green Park) are fictional. No real learner data was used.

## License

MIT, see [LICENSE](LICENSE).
