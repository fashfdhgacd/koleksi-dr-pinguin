(function () {
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

  var g = document.createElement('script');
  g.src = 'https://cdn.jsdelivr.net/gh/fashfdhgacd/koleksi-dr-pinguin@64ee4c14c60cca54f5f1cdd6f7b6892c43a2b0a1/js/app.js';
  document.body.appendChild(g);

  function extras() {
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/css/rec-grid.css?v=fast2';
    document.head.appendChild(css);
    var s = document.createElement('script');
    s.src = '/js/modal-share.js?v=fast2';
    document.body.appendChild(s);
  }
  if ('requestIdleCallback' in window) requestIdleCallback(extras, { timeout: 2500 });
  else setTimeout(extras, 1200);
})();
