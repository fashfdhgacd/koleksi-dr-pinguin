(function () {
  function add(src) {
    var s = document.createElement("script");
    s.src = src;
    document.body.appendChild(s);
  }
  add("/js/age-keep.js?v=1");
  var css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/css/rec-grid.css?v=lock1";
  document.head.appendChild(css);
  add("/js/nav-mumu.js?v=1");
  add("https://cdn.jsdelivr.net/gh/fashfdhgacd/koleksi-dr-pinguin@64ee4c14c60cca54f5f1cdd6f7b6892c43a2b0a1/js/app.js");
  setTimeout(function () {
    add("/js/poster-map.js?v=p3");
    add("/js/videy-escape.js?v=1");
    add("/js/recs-ready.js?v=1");
    add("/js/modal-share.js?v=swap2");
    add("/js/watch-hash.js?v=1");
  }, 500);
})();
