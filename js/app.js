(function () {
  try {
    var gate = document.getElementById("ageGate");
    var KEY = "kdp_age_ok";
    var raw = null;
    try { raw = localStorage.getItem(KEY) || sessionStorage.getItem("age_ok"); } catch (e) {}
    var ok = raw === "1" || (!!parseInt(raw, 10) && Date.now() < parseInt(raw, 10));
    if (ok && gate) {
      gate.classList.add("hidden");
      var main = document.getElementById("mainContent");
      if (main) { main.classList.remove("opacity-0"); main.classList.add("opacity-100"); }
    }
  } catch (e) {}
  var css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/css/rec-grid.css?v=lock1";
  document.head.appendChild(css);
  function add(src) {
    var s = document.createElement("script");
    s.src = src;
    document.body.appendChild(s);
  }
  add("/js/nav-mumu.js?v=1");
  add("https://cdn.jsdelivr.net/gh/fashfdhgacd/koleksi-dr-pinguin@64ee4c14c60cca54f5f1cdd6f7b6892c43a2b0a1/js/app.js");
  setTimeout(function () {
    add("/js/poster-map.js?v=p3");
    add("/js/videy-escape.js?v=1");
    add("/js/modal-share.js?v=swap2");
  }, 600);
})();
