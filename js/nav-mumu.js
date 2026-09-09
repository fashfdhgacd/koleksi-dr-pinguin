(function () {
  function add() {
    document.querySelectorAll('a[href="/putarin"]').forEach(function (a) {
      var wrap = a.parentNode;
      if (!wrap || wrap.querySelector('a[href="/mumu"]')) return;
      var n = a.cloneNode(true);
      n.setAttribute("href", "/mumu");
      n.textContent = "AI China";
      wrap.insertBefore(n, a.nextSibling);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", add);
  else add();
})();
