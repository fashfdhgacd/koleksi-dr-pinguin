(function () {
  function add(src) {
    var s = document.createElement("script");
    s.src = src;
    document.body.appendChild(s);
  }
  add("/js/kdp-bus.js?v=1");
  add("/js/kdp-overlay.js?v=7");
  add("/js/nav-fix.js?v=3");
  add("/js/share-sheet.js?v=1");
  add("/js/home-gallery.js?v=home2");
  var css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/css/rec-grid.css?v=lock4";
  document.head.appendChild(css);
  add("/js/site.js?v=prod4");
  setTimeout(function () {
    add("/js/modal-share.js?v=rec9");
  }, 400);
})();
