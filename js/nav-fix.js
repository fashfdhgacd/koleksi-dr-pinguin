(function () {
  function clean() {
    document.querySelectorAll("a").forEach(function (a) {
      var t = String(a.textContent || "").replace(/\s+/g, " ").trim();
      if (/AI China/i.test(t) || a.getAttribute("href") === "/mumu") a.remove();
      var href = a.getAttribute("href") || "";
      if (href === "/campur" || href === "/mix" || /^(mix|campur)$/i.test(t)) {
        a.setAttribute("href", "/campur");
        a.textContent = "Pilihan Dr Harimau \uD83D\uDD1E 18+";
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", clean);
  else clean();
  setTimeout(clean, 400);
})();
