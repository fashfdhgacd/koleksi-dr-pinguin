(function () {
  var l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = '/css/rec-grid.css?v=ui2';
  document.head.appendChild(l);
  function add(src) {
    var el = document.createElement('script');
    el.src = src;
    document.body.appendChild(el);
  }
  add('/js/related-pick.js?v=ui2');
  add('/js/modal-share.js?v=ui2');
  add('/js/rec-boot.js?v=ui2');
  add('/js/putarin-nav.js?v=ui2');
  add('/js/thumb-fix.js?v=ui2');
  add('/js/modal-close.js?v=ui2');
  add('/js/videy-fix.js?v=ui2');
  var s = document.createElement('script');
  s.src = '/js/gallery-full.js?v=20260909thumb';
  s.onerror = function () {
    var f = document.createElement('script');
    f.src = 'https://cdn.jsdelivr.net/gh/fashfdhgacd/koleksi-dr-pinguin@64ee4c14c60cca54f5f1cdd6f7b6892c43a2b0a1/js/app.js';
    document.head.appendChild(f);
  };
  document.head.appendChild(s);
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
})();
