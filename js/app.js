(function () {
  function add(src) {
    var s = document.createElement("script");
    s.src = src;
    document.body.appendChild(s);
  }
  var css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/css/home-lite.css?v=2";
  document.head.appendChild(css);
  add("/js/kdp-bus.js?v=2");
  add("/js/kdp-overlay.js?v=6");
  add("/js/kdp-persist.js?v=2");
  add("/js/nav-fix.js?v=2");
  add("/js/share-sheet.js?v=1");
  add("/js/home-gallery.js?v=2");
  setTimeout(function () {
    add("/js/modal-share.js?v=rec10");
  }, 400);
})();
