(function () {
  function clean() {
    document.querySelectorAll("a").forEach(function (a) {
      var href = String(a.getAttribute("href") || "");
      var t = String(a.textContent || "").replace(/\s+/g, " ").trim();
      if (href === "/mumu" || /AI China/i.test(t)) {
        a.remove();
        return;
      }
      if (href === "/putarin" || href === "/putarin/" || /^JAV/i.test(t)) {
        a.setAttribute("href", "/?cat=jav");
        a.textContent = "JAV";
      }
      if (href === "/campur" || href === "/campur/" || href === "/mix" || href === "/mix/" || /Pilihan Dr|Harimau|campur|mix/i.test(t)) {
        a.setAttribute("href", "/#genre");
        a.textContent = "Kategori";
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", clean);
  else clean();
  setTimeout(clean, 400);
})();
