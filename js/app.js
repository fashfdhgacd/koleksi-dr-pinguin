(function () {
  var s = document.createElement('script');
  s.src = '/js/gallery-full.js?v=20260909thumb';
  s.onerror = function () {
    var f = document.createElement('script');
    f.src = 'https://cdn.jsdelivr.net/gh/fashfdhgacd/koleksi-dr-pinguin@64ee4c14c60cca54f5f1cdd6f7b6892c43a2b0a1/js/app.js';
    f.onload = bootNav;
    document.head.appendChild(f);
  };
  s.onload = bootNav;
  document.head.appendChild(s);
  function bootNav() {
    try {
      var gate = document.getElementById('ageGate');
      var KEY = 'kdp_age_ok';
      var raw = null;
      try { raw = localStorage.getItem(KEY) || sessionStorage.getItem('age_ok'); } catch (e) {}
      var ok = raw === '1' || (!!parseInt(raw, 10) && Date.now() < parseInt(raw, 10));
      if (ok && gate) {
        gate.classList.add('hidden');
        var main = document.getElementById('mainContent');
        if (main) { main.classList.remove('opacity-0'); main.classList.add('opacity-100'); }
      }
    } catch (e) {}
    ['/js/putarin-nav.js', '/js/modal-share.js', '/js/thumb-fix.js', '/js/modal-close.js', '/js/videy-fix.js'].forEach(function (src) {
      var el = document.createElement('script');
      el.src = src + '?v=hubmodal3';
      document.body.appendChild(el);
    });
  }
})();
