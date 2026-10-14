// StitchMate privacy policy: theme toggle, table-of-contents highlight,
// reading progress and "copy email". The page works fully without this script.
(function () {
  "use strict";

  var root = document.documentElement;
  var THEME_KEY = "stitchmate-theme";
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  // --- Theme (follows the system unless the visitor picks one, like the app) ---

  function storedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }

  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") {
      root.setAttribute("data-theme", theme);
    } else {
      root.removeAttribute("data-theme");
    }
    var isDark = theme ? theme === "dark" : darkQuery.matches;
    root.setAttribute("data-dark", String(isDark));

    var toggle = document.querySelector(".theme-toggle");
    if (toggle) toggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");

    var meta = document.querySelectorAll('meta[name="theme-color"]');
    meta.forEach(function (m) { m.setAttribute("content", isDark ? "#1E1814" : "#FBF6EE"); });
  }

  applyTheme(storedTheme());

  darkQuery.addEventListener("change", function () {
    if (!storedTheme()) applyTheme(null);
  });

  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-dark") === "true" ? "light" : "dark";
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode: still switch */ }
      applyTheme(next);
    });
  }

  // --- Table of contents: highlight the section being read ---

  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  function setActive(id) {
    links.forEach(function (a) {
      var on = a.getAttribute("href") === "#" + id;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    var visible = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting; });
      var first = sections.find(function (s) { return visible[s.id]; });
      if (first) setActive(first.id);
    }, { rootMargin: "-90px 0px -55% 0px" });
    sections.forEach(function (s) { observer.observe(s); });
  }

  // --- Reading progress bar ---

  var bar = document.querySelector(".progress span");
  var ticking = false;

  function updateProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (bar) bar.style.transform = "scaleX(" + ratio + ")";
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateProgress);
    }
  }, { passive: true });
  updateProgress();

  // --- Copy the support email ---

  var copyButton = document.querySelector(".copy-email");
  var status = document.querySelector(".copy-status");

  function fallbackCopy(text) {
    var input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "absolute";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(input);
    return ok;
  }

  if (copyButton && status) {
    copyButton.addEventListener("click", function () {
      var email = copyButton.getAttribute("data-email");
      var done = function () { status.textContent = "Copied " + email; };
      var failed = function () { status.textContent = "Couldn't copy. The address is " + email; };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(done, function () {
          if (fallbackCopy(email)) done(); else failed();
        });
      } else if (fallbackCopy(email)) {
        done();
      } else {
        failed();
      }
      window.setTimeout(function () { status.textContent = ""; }, 4000);
    });
  }

  // --- Footer year ---

  var year = document.querySelector(".year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
