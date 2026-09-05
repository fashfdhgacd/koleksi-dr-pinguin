(function () {
  var s = document.createElement('script');
  s.src = '/js/gallery.js?v=20260906a';
  s.onerror = function () {
    s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/gh/fashfdhgacd/koleksi-dr-pinguin@64ee4c14c60cca54f5f1cdd6f7b6892c43a2b0a1/js/app.js';
    s.onload = bootNav;
    document.head.appendChild(s);
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
      var enter = document.getElementById('btnEnter');
      if (enter) enter.addEventListener('click', function () {
        try {
          localStorage.setItem(KEY, String(Date.now() + 30 * 24 * 60 * 60 * 1000));
          sessionStorage.setItem('age_ok', '1');
        } catch (e) {}
      });
    } catch (e) {}
    var n = document.createElement('script');
    n.src = '/js/putarin-nav.js?t=' + Date.now();
    document.body.appendChild(n);
    var m = document.createElement('script');
    m.src = '/js/modal-share.js?t=' + Date.now();
    document.body.appendChild(m);
  }
})();
