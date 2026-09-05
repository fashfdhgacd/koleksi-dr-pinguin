(function () {
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/gh/fashfdhgacd/koleksi-dr-pinguin@64ee4c14c60cca54f5f1cdd6f7b6892c43a2b0a1/js/app.js';
  s.onload = function () {
    var n = document.createElement('script');
    n.src = '/js/putarin-nav.js?t=' + Date.now();
    document.body.appendChild(n);
    var w = document.createElement('script');
    w.src = '/js/open-watch.js?t=' + Date.now();
    document.body.appendChild(w);
  };
  document.head.appendChild(s);
})();
