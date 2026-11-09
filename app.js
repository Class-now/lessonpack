/* LessonPack generator page. Runs fully in the browser; nothing is uploaded. */
(function () {
  "use strict";
  var EXAMPLE = [
    "Title: At the Train Station",
    "Language: en-US",
    "Notes language: ja",
    "Interface: ja",
    "Level: Beginner (A1)",
    "Teacher: Sample class (fictional)",
    "Intro: Learn five words and a short conversation for asking the way at a station.",
    "",
    "[Vocabulary]",
    "ticket = 切符 | One ticket to Green Park, please.",
    "platform = ホーム（乗り場） | The train leaves from platform 3.",
    "stairs = 階段 | The stairs are on the left.",
    "next to = ～の隣に | The shop is next to the gate.",
    "leave = 出発する | The next train leaves at ten.",
    "",
    "[Dialogue]",
    "Mika: Excuse me. Where is platform 3? = すみません。3番ホームはどこですか？",
    "Staff: It's next to the stairs, on the left. = 階段の隣、左側です。",
    "Mika: Thank you. When does the next train leave? = ありがとうございます。次の電車はいつ出発しますか？",
    "Staff: It leaves at ten o'clock. = 10時に出発します。",
    "Mika: Great. One ticket to Green Park, please. = よかった。グリーンパークまで切符を1枚ください。",
    "",
    "[Questions]",
    "Q: Where is platform 3?",
    "+ Next to the stairs",
    "- Next to the shop",
    "- On the second floor",
    "Why: The staff member says \"It's next to the stairs, on the left.\"",
    "",
    "Q: When does the next train leave?",
    "- At nine o'clock",
    "+ At ten o'clock",
    "- At eleven o'clock",
    "Why: \"It leaves at ten o'clock.\"",
    "",
    "Q: Where does Mika want to go?",
    "A: Green Park | to Green Park",
    "Why: Mika says \"One ticket to Green Park, please.\"",
    "",
    "Q: Type the English word for 階段.",
    "A: stairs | the stairs",
    ""
  ].join("\n");

  var src = document.getElementById("src");
  var result = document.getElementById("result");
  var draftNote = document.getElementById("draft-note");
  var DRAFT = "lessonpack:draft";
  var lastUrl = null;

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) {
      if (k === "text") e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) { e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function store(v) { try { localStorage.setItem(DRAFT, v); return true; } catch (e) { return false; } }
  function restore() { try { return localStorage.getItem(DRAFT); } catch (e) { return null; } }

  var saved = restore();
  src.value = saved != null && saved !== "" ? saved : EXAMPLE;
  var timer;
  src.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(function () { draftNote.textContent = store(src.value) ? "Draft saved in this browser." : ""; }, 600);
  });

  function goToLine(n) {
    var lines = src.value.split("\n"), start = 0;
    for (var i = 0; i < n - 1 && i < lines.length; i++) start += lines[i].length + 1;
    src.focus();
    src.setSelectionRange(start, start + (lines[n - 1] || "").length);
  }

  function render() {
    var res = LessonPack.generate(src.value, { date: new Date().toISOString().slice(0, 10) });
    result.innerHTML = "";
    if (lastUrl) { URL.revokeObjectURL(lastUrl); lastUrl = null; }
    if (!res.ok) {
      var list = el("ul");
      res.errors.forEach(function (e) {
        var b = el("button", { type: "button", "class": "secondary", text: "Go to line " + e.line });
        b.addEventListener("click", function () { goToLine(e.line); });
        list.appendChild(el("li", {}, [el("strong", { text: "Line " + e.line + ": " }), e.message + " ", b]));
      });
      result.appendChild(el("div", { "class": "card errors", role: "alert" }, [
        el("h3", { text: "Please fix " + res.errors.length + (res.errors.length === 1 ? " problem" : " problems") }), list]));
      result.focus();
      return;
    }
    var L = res.lesson;
    var blob = new Blob([res.html], { type: "text/html" });
    lastUrl = URL.createObjectURL(blob);
    var kb = (res.bytes / 1024).toFixed(1);
    var dl = el("a", { "class": "btn", href: lastUrl, download: res.filename, id: "download", text: "Download " + res.filename + " (" + kb + " KB)" });
    var counts = [L.vocab.length + " words", L.dialogue.length + " dialogue lines", L.reading.length + " reading lines", L.quiz.length + " questions"];
    var box = el("div", { "class": "card success", role: "status" }, [
      el("h3", { text: "Ready: “" + L.title + "”" }),
      el("p", { text: counts.join(", ") + ". File size " + kb + " KB, works offline, no other files needed." }),
      dl
    ]);
    if (res.warnings.length) {
      var wl = el("ul");
      res.warnings.forEach(function (w) { wl.appendChild(el("li", { text: "Line " + w.line + ": " + w.message })); });
      box.appendChild(wl);
    }
    result.appendChild(box);
    var frame = el("iframe", { title: "Preview of the learner's lesson file", id: "preview" });
    frame.srcdoc = res.html;
    result.appendChild(el("h3", { text: "Preview (as the learner sees it)" }));
    result.appendChild(frame);
    dl.focus();
  }

  document.getElementById("generate").addEventListener("click", render);
  document.getElementById("example").addEventListener("click", function () {
    src.value = EXAMPLE; store(EXAMPLE); draftNote.textContent = "Example lesson loaded."; src.focus();
  });
  document.getElementById("clear").addEventListener("click", function () {
    src.value = ""; store(""); draftNote.textContent = "Cleared."; src.focus();
  });

  // Offline: cache this page with a service worker, and offer a single-file copy of the tool.
  var online = /^https?:$/.test(location.protocol);
  if (online && "serviceWorker" in navigator && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
  var saveTool = document.getElementById("save-tool");
  if (online && document.querySelector('script[src="core.js"]')) {
    saveTool.hidden = false;
    saveTool.addEventListener("click", function () {
      Promise.all(["index.html", "core.js", "app.js"].map(function (u) { return fetch(u).then(function (r) { return r.text(); }); }))
        .then(function (t) {
          var inline = function (code) { return "<script>\n" + code.replace(/<\/script/gi, "<\\/script") + "\n</script>"; };
          var html = t[0].replace('<script src="core.js"></script>', function () { return inline(t[1]); })
            .replace('<script src="app.js"></script>', function () { return inline(t[2]); });
          var a = el("a", { href: URL.createObjectURL(new Blob([html], { type: "text/html" })), download: "lessonpack-offline.html" });
          document.body.appendChild(a); a.click(); a.remove();
        })
        .catch(function () { alert("Could not build the offline copy. Try again when this page has loaded fully."); });
    });
  }
  window.LessonPackExample = EXAMPLE;
})();
