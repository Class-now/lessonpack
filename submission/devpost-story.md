## Inspiration

Most "digital learning" quietly assumes a connection. A beginner learner whose family shares one old phone with no data plan can see the class platform for two minutes at school, then nothing at home: the page does not load, the audio does not play, the quiz is never done. Offline worksheets exist, but they are usually PDFs with tiny text, no audio, and nothing a screen reader or a keyboard can use. We wanted the smallest possible thing that removes that one barrier for one concrete learner.

**Learner:** Aya (fictional), 14, beginner English learner, one shared old Android phone, no data at home.
**Task:** practise this week's lesson at home: 5 words, a 5-line dialogue, 4 comprehension questions.
**Barrier:** Connect (no reliable connectivity), plus Interact (small text, no audio, mouse-only quizzes, inaccessible to screen readers).

## What it does

A teacher pastes a short lesson in plain text (`word = meaning | example`, `Speaker: line = translation`, `Q:` with `+` right / `-` wrong choices or `A:` typed answers). LessonPack makes **one self-contained HTML file** (the example is 23.5 KB) that the learner gets once by Bluetooth, USB cable, SD card or a chat app, and then opens offline in any browser.

**Before:** the lesson is online; at home with no data, Aya does none of it.
**After:** the same lesson is a 23.5 KB file on her phone. Offline she gets:

- every word and dialogue line with a **Listen** button (the phone's own offline speech voice, normal or slow);
- translations she can hide to test herself;
- a **self-check quiz with immediate feedback**, a hint after two tries, and forgiving typed answers;
- **Larger text**, **High contrast** and **Easy-read spacing** (WCAG 1.4.12 values, no italics) toggles;
- **progress saved on the phone**, so she can stop and continue tomorrow;
- buttons and instructions in **her** language (Japanese in the demo; English and Spanish built in), while lesson text is marked `lang="en"` so speech and screen readers pronounce it correctly;
- clean printing with answers for learners with no phone at all.

The generator itself also works offline (service worker after one visit, or a one-file download of the tool), and there is a command-line version.

## How we built it

Plain HTML, CSS and vanilla JavaScript; no build step, no frameworks, no network requests. `core.js` parses the lesson (with line-numbered error messages for teachers) and writes the learner file as **static, semantic HTML**: headings, landmarks, a skip link, `fieldset`/`legend` questions, real labels, `lang` attributes, 44 px touch targets, a visible 3 px focus ring. A small ES5 script (for old phone browsers) is inlined to add Listen and Check buttons, the display toggles and saved progress. With JavaScript off the whole lesson is still readable and every answer can be opened in a `<details>`. All lesson text is escaped.

Testing is automated with Playwright and axe-core in headless Chromium, with every external request blocked and the learner's browser set to offline.

## Challenges we ran into

- **Graceful failure everywhere.** Speech synthesis may be missing, may have no voice for the language, or may throw on voice assignment; storage may be blocked on `file://`. Each case now degrades to a clear note instead of a dead button or a crash, and each has an automated check.
- **Staying tiny and dependency-free** while keeping real accessibility: no web fonts, no icons, no libraries in the learner file.
- **Two languages on one page.** The interface is in the learner's language and the lesson in the target language, so every piece of text carries the right `lang` for screen readers and speech.

## Accomplishments that we're proud of

- 23.5 KB for a complete interactive lesson, well under our 100 KB target.
- 0 axe-core violations (WCAG 2.2 AA + best-practice rules) on the generator and the learner file in default, dark, high-contrast + large + spacing, after-answering and no-script states.
- A full **keyboard-only walkthrough** passes automatically: skip link, all toggles with Space, quiz with arrow keys and Enter, visible focus on every one of 40 tab stops; no sideways scrolling at 320 px with large text.

## What we learned

The most inclusive feature was not a feature: rendering everything as plain semantic HTML first, then adding interaction on top, made the no-JS, screen-reader, print and old-browser cases mostly work for free. And honest fallbacks ("read-aloud is not available here; read it with a partner") are better than silently broken buttons.

## What's next

- Test with real learners, teachers and screen-reader users, and on physical low-end phones.
- Optional tiny recorded audio for languages without an offline voice.
- An export of the learner's results as a short code the teacher can read back, so progress can reach the teacher without data.
- More interface languages and question types (matching, ordering).

## Limitations

- Read-aloud quality depends on the voices installed on the phone.
- Progress is per device and per browser; on a shared phone, learners share one record unless they keep separate copies.
- Automated checks are not user testing: we have not yet tested with disabled learners or on real old phones.
- Only multiple-choice and typed questions.

## Credits & AI disclosure

- Built during the hackathon (2026-11-10) from scratch; no pre-existing project code.
- Built with substantial help from **Claude Code** (Anthropic's AI coding assistant), which wrote most of the code, tests, demo recording script and documentation under human direction.
- Testing and video only (not shipped to learners): Playwright, axe-core (`@axe-core/playwright`), FFmpeg.
- All names, lessons and places are fictional (synthetic examples only). MIT License.
