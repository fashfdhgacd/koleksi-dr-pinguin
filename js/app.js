(function () {
  var s = document.createElement('script');
  s.src = '/js/gallery.js?v=' + Date.now();
  s.onload = bootNav;
  s.onerror = bootNav;
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
      var leave = document.getElementById('btnLeave');
      if (leave) leave.addEventListener('click', function () {
        window.location.href = 'https://www.google.com';
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
