/* LessonPack core: plain-text lesson -> one self-contained, offline HTML file.
 * Works in the browser (window.LessonPack) and in Node (module.exports). No dependencies.
 * MIT License. */
(function (root) {
  "use strict";

  // ---------- Interface strings (the learner's own language) ----------
  var UI = {
    en: {
      skip: "Skip to the lesson", settings: "Display and sound", large: "Larger text", contrast: "High contrast",
      spacing: "Easy-read spacing", trans: "Show translations", slow: "Slow speech", contents: "In this lesson",
      vocab: "Words", dialogue: "Dialogue", reading: "Reading", quiz: "Check yourself", listen: "Listen",
      listenAll: "Listen to the whole dialogue", stop: "Stop", know: "I know this word", check: "Check",
      correct: "Correct!", wrong: "Not yet. Try again.", showAnswer: "Show the answer", answerIs: "Answer:",
      typeHere: "Type your answer", progress: "Your progress", words: "words known", questions: "questions correct",
      reset: "Clear my progress", resetConfirm: "Clear all saved progress for this lesson on this device?",
      saved: "Your progress is saved on this device only. Nothing is sent anywhere.",
      notSaved: "This browser cannot save progress. You can still use the whole lesson.",
      noTts: "Read-aloud is not available in this browser. All lines are still here as text; you can read them aloud with a partner.",
      noVoice: "No voice for this language was found on this device. The browser may use a different voice.",
      ttsError: "Read-aloud stopped with an error. The text is still on the screen.",
      offline: "This lesson works without internet. Open it in any browser.", level: "Level", from: "From",
      madeWith: "Made with LessonPack", example: "Example", hint: "Hint", allDone: "Well done! You finished every question.",
      noJs: "Some buttons need JavaScript. You can still read the lesson and open each answer below its question."
    },
    ja: {
      skip: "レッスンへ移動", settings: "表示と音声", large: "文字を大きく", contrast: "ハイコントラスト",
      spacing: "読みやすい間隔", trans: "訳を表示", slow: "ゆっくり読む", contents: "このレッスンの内容",
      vocab: "単語", dialogue: "会話", reading: "読み物", quiz: "確認問題", listen: "聞く",
      listenAll: "会話を全部聞く", stop: "止める", know: "この単語は覚えた", check: "答え合わせ",
      correct: "正解！", wrong: "まだです。もう一度やってみましょう。", showAnswer: "答えを見る", answerIs: "答え：",
      typeHere: "答えを入力", progress: "学習の進み具合", words: "語を覚えた", questions: "問正解",
      reset: "記録を消す", resetConfirm: "この端末に保存したこのレッスンの記録をすべて消しますか？",
      saved: "記録はこの端末の中だけに保存されます。どこにも送信しません。",
      notSaved: "このブラウザでは記録を保存できません。レッスンはすべて使えます。",
      noTts: "このブラウザでは読み上げが使えません。文はすべて画面にあります。友だちと声に出して読んでみましょう。",
      noVoice: "この言語の音声が端末に見つかりません。別の声で読まれることがあります。",
      ttsError: "読み上げが止まりました。文は画面に残っています。",
      offline: "このレッスンはインターネットなしで使えます。どのブラウザでも開けます。", level: "レベル", from: "作成",
      madeWith: "LessonPack で作成", example: "例文", hint: "ヒント", allDone: "よくできました！全問正解です。",
      noJs: "一部のボタンには JavaScript が必要です。レッスンは読めますし、答えは各問題の下で開けます。"
    },
    es: {
      skip: "Ir a la lección", settings: "Pantalla y sonido", large: "Texto más grande", contrast: "Alto contraste",
      spacing: "Espaciado de lectura fácil", trans: "Mostrar traducciones", slow: "Voz lenta", contents: "En esta lección",
      vocab: "Palabras", dialogue: "Diálogo", reading: "Lectura", quiz: "Comprueba lo que sabes", listen: "Escuchar",
      listenAll: "Escuchar todo el diálogo", stop: "Parar", know: "Ya sé esta palabra", check: "Comprobar",
      correct: "¡Correcto!", wrong: "Todavía no. Inténtalo otra vez.", showAnswer: "Ver la respuesta", answerIs: "Respuesta:",
      typeHere: "Escribe tu respuesta", progress: "Tu progreso", words: "palabras sabidas", questions: "preguntas correctas",
      reset: "Borrar mi progreso", resetConfirm: "¿Borrar todo el progreso guardado de esta lección en este dispositivo?",
      saved: "Tu progreso se guarda solo en este dispositivo. No se envía nada.",
      notSaved: "Este navegador no puede guardar el progreso. Puedes usar toda la lección.",
      noTts: "La lectura en voz alta no está disponible en este navegador. Todo el texto sigue en pantalla; puedes leerlo en voz alta con un compañero.",
      noVoice: "No se encontró una voz para este idioma. El navegador puede usar otra voz.",
      ttsError: "La lectura se detuvo por un error. El texto sigue en la pantalla.",
      offline: "Esta lección funciona sin internet. Ábrela en cualquier navegador.", level: "Nivel", from: "De",
      madeWith: "Hecho con LessonPack", example: "Ejemplo", hint: "Pista", allDone: "¡Muy bien! Terminaste todas las preguntas.",
      noJs: "Algunos botones necesitan JavaScript. Puedes leer la lección y abrir cada respuesta debajo de su pregunta."
    }
  };

  var SECTION_NAMES = {
    vocabulary: "vocab", vocab: "vocab", words: "vocab", "単語": "vocab",
    dialogue: "dialogue", dialog: "dialogue", conversation: "dialogue", "会話": "dialogue",
    reading: "reading", text: "reading", story: "reading", "読み物": "reading",
    questions: "quiz", quiz: "quiz", comprehension: "quiz", "問題": "quiz"
  };
  var META_KEYS = {
    title: "title", language: "lang", "lesson language": "lang", "notes language": "notesLang",
    "translation language": "notesLang", interface: "ui", "interface language": "ui", level: "level",
    teacher: "teacher", from: "teacher", intro: "intro"
  };

  function trim(s) { return String(s).replace(/^\s+|\s+$/g, ""); }
  function splitOnce(s, sep) {
    var i = s.indexOf(sep);
    return i < 0 ? [s, ""] : [s.slice(0, i), s.slice(i + sep.length)];
  }
  function validLang(s) { return /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(s); }

  // ---------- Parser ----------
  function parse(text) {
    var lesson = { title: "", lang: "en", notesLang: "", ui: "en", level: "", teacher: "", intro: "",
      vocab: [], dialogue: [], reading: [], quiz: [] };
    var errors = [], warnings = [];
    var lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
    var section = null, q = null;

    function err(n, msg) { errors.push({ line: n, message: msg }); }
    function closeQuestion() {
      if (!q) return;
      if (q.type === "choice") {
        var nCorrect = 0;
        for (var i = 0; i < q.options.length; i++) if (q.options[i].correct) nCorrect++;
        if (q.options.length < 2) err(q.line, "Question \"" + q.text + "\" needs at least 2 choices (lines starting with + or -), or one typed answer (A: ...).");
        else if (nCorrect !== 1) err(q.line, "Question \"" + q.text + "\" needs exactly one correct choice (a line starting with +). It has " + nCorrect + ".");
      } else if (q.type === "typed") {
        if (!q.answers.length) err(q.line, "Question \"" + q.text + "\" has an empty answer line.");
      } else {
        err(q.line, "Question \"" + q.text + "\" has no answers. Add choices (+ correct, - wrong) or a typed answer (A: ...).");
      }
      lesson.quiz.push(q);
      q = null;
    }

    for (var n = 0; n < lines.length; n++) {
      var lineNo = n + 1;
      var raw = lines[n];
      var line = trim(raw);
      if (!line) continue;
      if (/^\/\//.test(line)) continue; // comment

      // Section headers: [Vocabulary] or ## Vocabulary
      var h = line.match(/^\[(.+)\]$/) || line.match(/^#{1,3}\s*(.+)$/);
      if (h) {
        var key = trim(h[1]).toLowerCase();
        if (SECTION_NAMES[key]) { closeQuestion(); section = SECTION_NAMES[key]; continue; }
        if (section === null && line.charAt(0) === "#") { lesson.title = lesson.title || trim(h[1]); continue; }
        err(lineNo, "Unknown section \"" + trim(h[1]) + "\". Use [Vocabulary], [Dialogue], [Reading] or [Questions].");
        continue;
      }

      if (section === null) {
        var kv = splitOnce(line, ":");
        var mk = META_KEYS[trim(kv[0]).toLowerCase()];
        if (mk) { lesson[mk] = trim(kv[1]); continue; }
        if (!lesson.title) { lesson.title = line; continue; }
        lesson.intro = lesson.intro ? lesson.intro + " " + line : line;
        continue;
      }

      if (section === "vocab") {
        var ex = splitOnce(line, "|");
        var tw = splitOnce(ex[0], "=");
        var word = trim(tw[0]);
        if (!word) { err(lineNo, "This vocabulary line has no word before \"=\"."); continue; }
        lesson.vocab.push({ word: word, meaning: trim(tw[1]), example: trim(ex[1]), line: lineNo });
      } else if (section === "dialogue" || section === "reading") {
        var parts = splitOnce(line, "=");
        var said = trim(parts[0]), speaker = "";
        if (section === "dialogue") {
          var sp = said.match(/^([^:：]{1,24})[:：]\s*(.+)$/);
          if (sp) { speaker = trim(sp[1]); said = trim(sp[2]); }
        }
        if (!said) { err(lineNo, "This line has no text before \"=\"."); continue; }
        lesson[section].push({ speaker: speaker, text: said, trans: trim(parts[1]), line: lineNo });
      } else if (section === "quiz") {
        var m;
        if ((m = line.match(/^Q\s*[:.)]\s*(.+)$/i)) || (m = line.match(/^\?\s*(.+)$/))) {
          closeQuestion();
          q = { text: trim(m[1]), type: null, options: [], answers: [], hint: "", line: lineNo };
        } else if (!q) {
          err(lineNo, "Start each question with \"Q:\" before its answers.");
        } else if ((m = line.match(/^([+*-])\s*(.+)$/))) {
          if (q.type === "typed") { err(lineNo, "A question can have choices or a typed answer, not both."); continue; }
          q.type = "choice";
          q.options.push({ text: trim(m[2]), correct: m[1] !== "-" });
        } else if ((m = line.match(/^A\s*[:.)]\s*(.*)$/i))) {
          if (q.type === "choice") { err(lineNo, "A question can have choices or a typed answer, not both."); continue; }
          q.type = "typed";
          var alts = m[1].split("|");
          for (var a = 0; a < alts.length; a++) if (trim(alts[a])) q.answers.push(trim(alts[a]));
        } else if ((m = line.match(/^(why|hint|explain|explanation)\s*[:：]\s*(.+)$/i))) {
          q.hint = trim(m[2]);
        } else {
          err(lineNo, "Inside [Questions], a line should start with Q:, +, -, A: or Why:.");
        }
      }
    }
    closeQuestion();

    if (!lesson.title) err(1, "Add a title on the first line, e.g. \"Title: At the Station\".");
    if (!validLang(lesson.lang)) { err(1, "\"Language: " + lesson.lang + "\" should be a language code like en, ja, es or en-GB."); lesson.lang = "en"; }
    if (lesson.notesLang && !validLang(lesson.notesLang)) { warnings.push({ line: 1, message: "Notes language \"" + lesson.notesLang + "\" is not a language code; ignored." }); lesson.notesLang = ""; }
    var uiBase = String(lesson.ui || "en").toLowerCase().split("-")[0];
    if (!UI[uiBase]) { warnings.push({ line: 1, message: "Interface language \"" + lesson.ui + "\" is not built in (en, ja, es). Using English." }); uiBase = "en"; }
    lesson.ui = uiBase;
    if (!lesson.vocab.length && !lesson.dialogue.length && !lesson.reading.length && !lesson.quiz.length)
      err(1, "The lesson is empty. Add at least one section: [Vocabulary], [Dialogue], [Reading] or [Questions].");
    return { lesson: lesson, errors: errors, warnings: warnings };
  }

  // ---------- HTML helpers ----------
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function hash(s) { // djb2 -> base36, used as the storage key so each lesson keeps its own progress
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  function normalize(s) {
    return String(s).toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[.,!?;:"\u3002\u3001\uff01\uff1f\u00bf\u00a1]/g, "").replace(/\s+/g, " ").replace(/^ | $/g, "");
  }

  // ---------- Learner page: CSS ----------
  var CSS = [
    ":root{--bg:#fff;--fg:#1a1a1a;--muted:#4a4a4a;--card:#f5f6f8;--line:#c9ccd1;--accent:#0b57a4;--accent-fg:#fff;--ok:#0f6b2f;--bad:#a3201a;--focus:#b35c00;font-size:100%}",
    "@media (prefers-color-scheme:dark){:root:not(.contrast){--bg:#121417;--fg:#eceff3;--muted:#c3c8cf;--card:#1d2126;--line:#4a515a;--accent:#8cc4ff;--accent-fg:#0b1a2b;--ok:#7be39b;--bad:#ff9e98;--focus:#ffc46b}}",
    ":root.contrast{--bg:#000;--fg:#fff;--muted:#fff;--card:#000;--line:#fff;--accent:#ffeb3b;--accent-fg:#000;--ok:#7dff9b;--bad:#ffb4ab;--focus:#00e5ff}",
    ":root.large{font-size:131.25%}",
    "*{box-sizing:border-box}",
    "body{margin:0;background:var(--bg);color:var(--fg);font:1rem/1.6 system-ui,-apple-system,'Segoe UI',Roboto,'Noto Sans','Noto Sans JP',sans-serif;-webkit-text-size-adjust:100%}",
    ".spacing body{line-height:2;letter-spacing:.12em;word-spacing:.16em}",
    ".spacing p,.spacing li,.spacing dd{margin-bottom:2em;text-align:left;max-width:34em}",
    ".spacing i,.spacing em{font-style:normal}",
    "main,header,footer{max-width:46rem;margin:0 auto;padding:0 1rem}",
    "a{color:var(--accent)}",
    ".skip{position:absolute;left:-999px;top:0;background:var(--accent);color:var(--accent-fg);padding:.6rem 1rem;z-index:9}",
    ".skip:focus{left:0}",
    ":focus{outline:3px solid var(--focus);outline-offset:2px}",
    ":focus:not(:focus-visible){outline:none}",
    ":focus-visible{outline:3px solid var(--focus);outline-offset:2px}",
    "h1{font-size:1.6rem;line-height:1.25;margin:1rem 0 .25rem}",
    "h2{font-size:1.3rem;margin:2rem 0 .5rem;border-bottom:2px solid var(--line);padding-bottom:.25rem}",
    ".meta,.note{color:var(--muted)}",
    ".note{font-size:.95rem}",
    ".card{background:var(--card);border:1px solid var(--line);border-radius:.6rem;padding:.75rem 1rem;margin:.75rem 0}",
    "button,.btn,input[type=text]{font:inherit;min-height:44px}",
    "button,.btn{background:var(--accent);color:var(--accent-fg);border:2px solid var(--accent);border-radius:.5rem;padding:.4rem .9rem;cursor:pointer;margin:.2rem .4rem .2rem 0}",
    "button.secondary{background:transparent;color:var(--accent)}",
    "button[aria-pressed=true]{box-shadow:inset 0 0 0 3px var(--accent-fg)}",
    "button[aria-pressed=true]::before{content:'\\2713  '}",
    ".toolbar{display:flex;flex-wrap:wrap;gap:.25rem;padding:0;margin:0;border:0}",
    ".toolbar legend{font-weight:700;margin-bottom:.25rem;padding:0}",
    "ol.toc{padding-left:1.4rem}",
    "ol.toc a{display:inline-block;padding:.35rem 0}",
    ".line{display:flex;flex-wrap:wrap;align-items:center;gap:.25rem .75rem}",
    ".line .txt{flex:1 1 14rem}",
    ".say{font-size:1.1rem}",
    ".speaker{font-weight:700}",
    ".trans{display:block;color:var(--muted);font-size:.95rem}",
    ".hide-trans .trans{display:none}",
    "dl.vocab dt{font-size:1.2rem;font-weight:700}",
    "dl.vocab dd{margin:0}",
    "label.know{display:flex;align-items:center;gap:.5rem;min-height:44px}",
    "input[type=checkbox],input[type=radio]{width:1.4rem;height:1.4rem;accent-color:var(--accent);flex:none}",
    "fieldset.q{border:1px solid var(--line);border-radius:.6rem;margin:1rem 0;padding:.75rem 1rem;background:var(--card)}",
    "fieldset.q legend{font-weight:700;padding:0 .25rem;font-size:1.05rem}",
    ".opt{display:flex;align-items:center;gap:.6rem;min-height:44px;padding:.15rem 0}",
    "input[type=text]{width:100%;max-width:24rem;padding:.4rem .6rem;border:2px solid var(--line);border-radius:.4rem;background:var(--bg);color:var(--fg)}",
    ".fb{font-weight:700;margin:.5rem 0 0;min-height:1.6em}",
    ".fb.ok{color:var(--ok)}",
    ".fb.ok::before{content:'\\2714  '}",
    ".fb.bad{color:var(--bad)}",
    ".fb.bad::before{content:'\\2716  '}",
    "details.ans summary{cursor:pointer;color:var(--accent);min-height:44px;padding-top:.5rem}",
    ".js details.ans.jsHide{display:none}",
    "progress{width:100%;height:1rem;accent-color:var(--accent)}",
    ".status{min-height:1.4em}",
    "footer{padding:2rem 1rem;color:var(--muted);font-size:.9rem}",
    "[hidden]{display:none!important}",
    "@media print{.toolbar,.skip,button,.tts-note,#progress-box{display:none!important}details.ans{display:block}details.ans>*{display:block}body{color:#000;background:#fff}}",
    "@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}"
  ].join("\n");

  // ---------- Learner page: runtime (ES5 on purpose: old phone browsers) ----------
  // Serialized with Function.prototype.toString and inlined into each lesson file.
  function learnerRuntime() {
    var doc = document, root = doc.documentElement;
    var cfg = JSON.parse(doc.getElementById("lp-data").textContent);
    var T = cfg.ui, KEY = "lessonpack:" + cfg.id;
    root.className += " js";
    function $(sel, el) { return (el || doc).querySelector(sel); }
    function $$(sel, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(sel)); }
    function make(tag, attrs, text) {
      var e = doc.createElement(tag);
      for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
      if (text != null) e.textContent = text;
      return e;
    }

    // --- storage (falls back to memory if the browser blocks it) ---
    var mem = {}, canSave = true;
    try { localStorage.setItem(KEY + ":t", "1"); localStorage.removeItem(KEY + ":t"); } catch (e) { canSave = false; }
    function load() {
      try { return JSON.parse((canSave ? localStorage.getItem(KEY) : mem[KEY]) || "{}") || {}; } catch (e) { return {}; }
    }
    var state = load();
    state.s = state.s || {}; state.w = state.w || {}; state.q = state.q || {};
    function save() {
      var s = JSON.stringify(state);
      if (canSave) { try { localStorage.setItem(KEY, s); } catch (e) { canSave = false; mem[KEY] = s; } } else mem[KEY] = s;
    }
    $("#save-note").textContent = canSave ? T.saved : T.notSaved;

    // --- display settings ---
    var settings = [["large", "large"], ["contrast", "contrast"], ["spacing", "spacing"], ["hideTrans", "hide-trans"]];
    function applySettings() {
      for (var i = 0; i < settings.length; i++) {
        var on = !!state.s[settings[i][0]];
        var cls = " " + settings[i][1];
        root.className = (" " + root.className + " ").replace(cls + " ", " ").replace(/^ +| +$/g, "") + (on ? cls : "");
      }
      $$("[data-setting]").forEach(function (b) {
        var k = b.getAttribute("data-setting");
        var on = k === "hideTrans" ? !state.s.hideTrans : !!state.s[k];
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
    $$("[data-setting]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-setting");
        state.s[k] = !state.s[k];
        save(); applySettings();
      });
    });
    $("#settings").hidden = false;
    applySettings();

    // --- text to speech ---
    var synth = window.speechSynthesis, hasTts = !!(synth && window.SpeechSynthesisUtterance);
    var ttsNote = $("#tts-note"), queue = [];
    function voiceFor(lang) {
      var vs = [];
      try { vs = synth.getVoices() || []; } catch (e) { vs = []; }
      var base = lang.toLowerCase().split("-")[0], best = null;
      for (var i = 0; i < vs.length; i++) {
        var vl = String(vs[i].lang || "").toLowerCase().replace("_", "-");
        if (vl === lang.toLowerCase()) return vs[i];
        if (!best && vl.split("-")[0] === base) best = vs[i];
      }
      return best;
    }
    function speak(texts) {
      if (!hasTts) return;
      try { synth.cancel(); } catch (e) {}
      queue = texts.slice();
      next();
    }
    function next() {
      if (!queue.length) return;
      var u = new SpeechSynthesisUtterance(queue.shift());
      u.lang = cfg.lang;
      var v = voiceFor(cfg.lang);
      if (v) { try { u.voice = v; } catch (e) {} }
      u.rate = state.s.slow ? 0.7 : 1;
      u.onend = next;
      u.onerror = function (ev) {
        queue = [];
        if (ev && (ev.error === "canceled" || ev.error === "interrupted")) return;
        ttsNote.textContent = T.ttsError; ttsNote.hidden = false;
      };
      try { synth.speak(u); } catch (e) { ttsNote.textContent = T.ttsError; ttsNote.hidden = false; }
    }
    if (hasTts) {
      $$("[data-say]").forEach(function (el) {
        var text = el.getAttribute("data-say");
        var b = make("button", { type: "button", "class": "secondary", "aria-label": T.listen + ": " + text }, "\u25B6 " + T.listen);
        b.addEventListener("click", function () { speak([text]); });
        el.parentNode.insertBefore(b, el.nextSibling);
      });
      var all = $("#listen-all");
      if (all) {
        all.hidden = false;
        all.addEventListener("click", function () {
          speak($$("#dialogue [data-say]").map(function (e) { return e.getAttribute("data-say"); }));
        });
      }
      $("#stop").hidden = false;
      $("#stop").addEventListener("click", function () { queue = []; try { synth.cancel(); } catch (e) {} });
      $("#slow").hidden = false;
      var checkVoice = function () { if (!voiceFor(cfg.lang) && (synth.getVoices() || []).length) { ttsNote.textContent = T.noVoice; ttsNote.hidden = false; } };
      if ("onvoiceschanged" in synth) synth.onvoiceschanged = checkVoice;
      setTimeout(checkVoice, 1500);
    } else {
      ttsNote.textContent = T.noTts; ttsNote.hidden = false;
    }

    // --- words I know ---
    $$("input[data-word]").forEach(function (c) {
      var id = c.getAttribute("data-word");
      c.checked = !!state.w[id];
      c.addEventListener("change", function () { state.w[id] = c.checked; save(); updateProgress(); });
    });

    // --- quiz: check answers with immediate feedback ---
    function norm(s) { return String(s).toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[.,!?;:"\u3002\u3001\uff01\uff1f\u00bf\u00a1]/g, "").replace(/\s+/g, " ").replace(/^ | $/g, ""); }
    $$("fieldset.q").forEach(function (fs) {
      var id = fs.getAttribute("data-q"), type = fs.getAttribute("data-type");
      var details = $("details.ans", fs), fb = $(".fb", fs), st = state.q[id] || {};
      details.className += " jsHide";
      var btn = make("button", { type: "button" }, T.check);
      fs.insertBefore(btn, fb);
      function show(ok, tries) {
        fb.className = "fb " + (ok ? "ok" : "bad");
        fb.textContent = ok ? T.correct + (fs.getAttribute("data-hint") ? " " + fs.getAttribute("data-hint") : "")
          : T.wrong + (tries >= 2 && fs.getAttribute("data-hint") ? " " + T.hint + ": " + fs.getAttribute("data-hint") : "");
        if (!ok && tries >= 2) details.className = details.className.replace(/ ?jsHide/, "");
      }
      // restore saved state
      if (st.v != null) {
        if (type === "choice") { var r = $("input[value='" + st.v + "']", fs); if (r) r.checked = true; }
        else $("input[type=text]", fs).value = st.v;
        if (st.ok) show(true, st.n || 1);
      }
      btn.addEventListener("click", function () {
        var v, ok;
        if (type === "choice") {
          var picked = $("input[type=radio]:checked", fs);
          if (!picked) { fb.className = "fb bad"; fb.textContent = T.wrong; return; }
          v = picked.value; ok = picked.hasAttribute("data-c");
        } else {
          v = $("input[type=text]", fs).value;
          var ans = JSON.parse(fs.getAttribute("data-ans")); ok = false;
          for (var i = 0; i < ans.length; i++) if (norm(ans[i]) === norm(v)) ok = true;
        }
        st.n = (st.n || 0) + 1; st.v = v; st.ok = ok;
        state.q[id] = st; save();
        show(ok, st.n);
        updateProgress();
      });
    });

    // --- progress summary ---
    var nWords = $$("input[data-word]").length, nQ = $$("fieldset.q").length;
    function updateProgress() {
      var w = 0, q = 0, k;
      for (k in state.w) if (state.w[k]) w++;
      for (k in state.q) if (state.q[k] && state.q[k].ok) q++;
      var bar = $("#progress-bar");
      bar.max = (nWords + nQ) || 1; bar.value = w + q;
      $("#progress-text").textContent = (nWords ? w + "/" + nWords + " " + T.words : "") + (nWords && nQ ? " \u00B7 " : "") + (nQ ? q + "/" + nQ + " " + T.questions : "");
      $("#done").hidden = !(nQ && q === nQ);
    }
    $("#progress-box").hidden = false;
    $("#reset").addEventListener("click", function () {
      if (!window.confirm(T.resetConfirm)) return;
      state.w = {}; state.q = {}; save();
      $$("input[data-word]").forEach(function (c) { c.checked = false; });
      $$("fieldset.q").forEach(function (fs) {
        $$("input", fs).forEach(function (i) { if (i.type === "text") i.value = ""; else i.checked = false; });
        var fb = $(".fb", fs); fb.textContent = ""; fb.className = "fb";
        var d = $("details.ans", fs); if (d.className.indexOf("jsHide") < 0) d.className += " jsHide";
      });
      updateProgress();
    });
    updateProgress();
    var nj = $("#nojs"); if (nj) nj.hidden = true;
  }

  // ---------- Build ----------
  function build(lesson, opts) {
    opts = opts || {};
    var T = UI[lesson.ui] || UI.en, L = lesson.lang, N = lesson.notesLang;
    var id = hash(JSON.stringify([lesson.title, lesson.vocab, lesson.dialogue, lesson.reading, lesson.quiz]));
    var tl = ' lang="' + esc(L) + '"', nl = N ? ' lang="' + esc(N) + '"' : "";
    var h = [];
    function say(text) { return '<span class="say"' + tl + ' data-say="' + esc(text) + '">' + esc(text) + "</span>"; }
    function trans(t) { return t ? '<span class="trans"' + nl + ">" + esc(t) + "</span>" : ""; }

    h.push("<!DOCTYPE html>");
    h.push('<html lang="' + esc(lesson.ui) + '"><head><meta charset="utf-8">');
    h.push('<meta name="viewport" content="width=device-width, initial-scale=1">');
    h.push('<meta name="generator" content="LessonPack"><meta name="color-scheme" content="light dark">');
    h.push("<title>" + esc(lesson.title) + "</title><style>" + CSS + "</style></head><body>");
    h.push('<a class="skip" href="#lesson">' + esc(T.skip) + "</a>");
    h.push('<header aria-label="' + esc(lesson.title) + '"><h1' + tl + ">" + esc(lesson.title) + "</h1>");
    var meta = [];
    if (lesson.level) meta.push(esc(T.level) + ": " + esc(lesson.level));
    if (lesson.teacher) meta.push(esc(T.from) + ": " + esc(lesson.teacher));
    if (meta.length) h.push('<p class="meta">' + meta.join(" \u00B7 ") + "</p>");
    h.push('<p class="note">' + esc(T.offline) + "</p>");
    h.push('<p class="note" id="nojs">' + esc(T.noJs) + "</p>");
    h.push('<fieldset class="toolbar card" id="settings" hidden><legend>' + esc(T.settings) + "</legend>");
    h.push('<button type="button" data-setting="large" aria-pressed="false">' + esc(T.large) + "</button>");
    h.push('<button type="button" data-setting="contrast" aria-pressed="false">' + esc(T.contrast) + "</button>");
    h.push('<button type="button" data-setting="spacing" aria-pressed="false">' + esc(T.spacing) + "</button>");
    if (N && (lesson.vocab.length || lesson.dialogue.length || lesson.reading.length))
      h.push('<button type="button" data-setting="hideTrans" aria-pressed="true">' + esc(T.trans) + "</button>");
    h.push('<button type="button" data-setting="slow" aria-pressed="false" id="slow" hidden>' + esc(T.slow) + "</button>");
    h.push('<button type="button" class="secondary" id="stop" hidden>\u25A0 ' + esc(T.stop) + "</button>");
    h.push("</fieldset>");
    h.push('<p class="note tts-note" id="tts-note" role="status" hidden></p>');
    var toc = [];
    if (lesson.vocab.length) toc.push(["vocab", T.vocab]);
    if (lesson.dialogue.length) toc.push(["dialogue", T.dialogue]);
    if (lesson.reading.length) toc.push(["reading", T.reading]);
    if (lesson.quiz.length) toc.push(["quiz", T.quiz]);
    h.push('<nav aria-label="' + esc(T.contents) + '"><ol class="toc">');
    for (var t = 0; t < toc.length; t++) h.push('<li><a href="#' + toc[t][0] + '">' + esc(toc[t][1]) + "</a></li>");
    h.push("</ol></nav></header>");
    h.push('<main id="lesson" tabindex="-1">');
    if (lesson.intro) h.push("<p>" + esc(lesson.intro) + "</p>");

    var i;
    if (lesson.vocab.length) {
      h.push('<section aria-labelledby="vocab"><h2 id="vocab">' + esc(T.vocab) + '</h2><dl class="vocab">');
      for (i = 0; i < lesson.vocab.length; i++) {
        var v = lesson.vocab[i];
        h.push('<div class="card"><dt class="line"><span class="txt">' + say(v.word) + "</span></dt>");
        if (v.meaning) h.push("<dd" + nl + ' class="trans">' + esc(v.meaning) + "</dd>");
        if (v.example) h.push('<dd class="line"><span class="txt"><span class="meta">' + esc(T.example) + ": </span>" + say(v.example) + "</span></dd>");
        h.push('<dd><label class="know"><input type="checkbox" data-word="w' + i + '"> ' + esc(T.know) + ": <span" + tl + ">" + esc(v.word) + "</span></label></dd></div>");
      }
      h.push("</dl></section>");
    }
    if (lesson.dialogue.length) {
      h.push('<section aria-labelledby="dialogue-h" id="dialogue"><h2 id="dialogue-h">' + esc(T.dialogue) + "</h2>");
      h.push('<button type="button" id="listen-all" hidden>\u25B6 ' + esc(T.listenAll) + "</button>");
      h.push('<ol class="lines" style="list-style:none;padding:0">');
      for (i = 0; i < lesson.dialogue.length; i++) {
        var d = lesson.dialogue[i];
        h.push('<li class="card"><p class="line" style="margin:0"><span class="txt">' + (d.speaker ? '<span class="speaker">' + esc(d.speaker) + ":</span> " : "") + say(d.text) + "</span></p>" + trans(d.trans) + "</li>");
      }
      h.push("</ol></section>");
    }
    if (lesson.reading.length) {
      h.push('<section aria-labelledby="reading"><h2 id="reading">' + esc(T.reading) + "</h2>");
      for (i = 0; i < lesson.reading.length; i++) {
        var r = lesson.reading[i];
        h.push('<div class="card"><p class="line" style="margin:0"><span class="txt">' + say(r.text) + "</span></p>" + trans(r.trans) + "</div>");
      }
      h.push("</section>");
    }
    if (lesson.quiz.length) {
      h.push('<section aria-labelledby="quiz"><h2 id="quiz">' + esc(T.quiz) + "</h2>");
      for (i = 0; i < lesson.quiz.length; i++) {
        var q = lesson.quiz[i], qid = "q" + i;
        var hint = q.hint ? ' data-hint="' + esc(q.hint) + '"' : "";
        if (q.type === "typed") {
          h.push('<fieldset class="q" data-q="' + qid + '" data-type="typed" data-ans="' + esc(JSON.stringify(q.answers)) + '"' + hint + ">");
          h.push("<legend>" + (i + 1) + ". <span" + tl + ">" + esc(q.text) + "</span></legend>");
          h.push('<label for="' + qid + 'i">' + esc(T.typeHere) + '</label><br><input type="text" id="' + qid + 'i"' + tl + ' autocomplete="off" autocapitalize="off" spellcheck="false">');
          var correctText = q.answers[0];
        } else {
          h.push('<fieldset class="q" data-q="' + qid + '" data-type="choice"' + hint + ">");
          h.push("<legend>" + (i + 1) + ". <span" + tl + ">" + esc(q.text) + "</span></legend>");
          for (var o = 0; o < q.options.length; o++) {
            var op = q.options[o];
            if (op.correct) correctText = op.text;
            h.push('<label class="opt"><input type="radio" name="' + qid + '" value="' + o + '"' + (op.correct ? " data-c" : "") + "> <span" + tl + ">" + esc(op.text) + "</span></label>");
          }
        }
        h.push('<p class="fb" aria-live="polite"></p>');
        h.push('<details class="ans"><summary>' + esc(T.showAnswer) + "</summary><p>" + esc(T.answerIs) + " <span" + tl + ">" + esc(correctText) + "</span>" + (q.hint ? "<br>" + esc(T.hint) + ": " + esc(q.hint) : "") + "</p></details>");
        h.push("</fieldset>");
      }
      h.push('<p id="done" class="fb ok" role="status" hidden>' + esc(T.allDone) + "</p>");
      h.push("</section>");
    }
    h.push('<section id="progress-box" class="card" aria-labelledby="progress-h" hidden><h2 id="progress-h">' + esc(T.progress) + "</h2>");
    h.push('<progress id="progress-bar" value="0" max="1" aria-labelledby="progress-h"></progress><p id="progress-text" aria-live="polite"></p>');
    h.push('<p class="note" id="save-note"></p><button type="button" class="secondary" id="reset">' + esc(T.reset) + "</button></section>");
    h.push("</main>");
    h.push("<footer><p>" + esc(T.madeWith) + (opts.date ? " \u00B7 " + esc(opts.date) : "") + "</p></footer>");
    var data = JSON.stringify({ id: id, lang: L, ui: T });
    h.push('<script type="application/json" id="lp-data">' + data.replace(/</g, "\\u003c") + "</script>");
    h.push("<script>(" + learnerRuntime.toString().replace(/<\//g, "<\\/") + ")();</script>");
    h.push("</body></html>");
    return h.join("\n");
  }

  function generate(text, opts) {
    var p = parse(text);
    if (p.errors.length) return { ok: false, errors: p.errors, warnings: p.warnings };
    var html = build(p.lesson, opts);
    var bytes = typeof TextEncoder !== "undefined" ? new TextEncoder().encode(html).length : html.length;
    return { ok: true, html: html, bytes: bytes, lesson: p.lesson, warnings: p.warnings,
      filename: (p.lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "lesson") + ".html" };
  }

  var api = { parse: parse, build: build, generate: generate, normalize: normalize, UI: UI };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LessonPack = api;
})(this);
