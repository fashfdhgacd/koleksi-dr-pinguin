(function () {
  function add(src) {
    var s = document.createElement("script");
    s.src = src;
    document.body.appendChild(s);
  }
  add("/js/kdp-overlay.js?v=3");
  add("/js/nav-fix.js?v=2");
  add("/js/share-sheet.js?v=1");
  var css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/css/rec-grid.css?v=lock3";
  document.head.appendChild(css);
  add("https://cdn.jsdelivr.net/gh/fashfdhgacd/koleksi-dr-pinguin@64ee4c14c60cca54f5f1cdd6f7b6892c43a2b0a1/js/app.js");
  setTimeout(function () {
    add("/js/poster-map.js?v=hero3");
    add("/js/force-posters.js?v=5");
    add("/js/modal-share.js?v=rec9");
    add("/js/gallery-fallback.js?v=1");
  }, 400);
})();
