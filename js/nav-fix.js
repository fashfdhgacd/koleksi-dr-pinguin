(function () {
  function clean() {
    document.querySelectorAll("a").forEach(function (a) {
      var t = String(a.textContent || "").replace(/\s+/g, " ").trim();
      if (/AI China/i.test(t) || a.getAttribute("href") === "/mumu") a.remove();
      if (a.getAttribute("href") === "/campur" || /campur/i.test(t)) {
        a.setAttribute("href", "/mix");
        a.textContent = a.className.indexOf("block") >= 0 ? "Mix" : "Mix";
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", clean);
  else clean();
  setTimeout(clean, 400);
})();
