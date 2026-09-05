(function () {
  var s = document.createElement('script');
  s.src = '/js/app-gallery.js?v=watchpage1';
  s.onload = function () {
    var n = document.createElement('script');
    n.src = '/js/putarin-nav.js?t=' + Date.now();
    document.body.appendChild(n);
  };
  document.head.appendChild(s);
})();
