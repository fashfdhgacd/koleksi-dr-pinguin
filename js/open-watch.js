(function () {
  if (window.__openWatch) return;
  window.__openWatch = true;
  function isCompact() {
    return window.innerWidth <= 1024;
  }
  function keyFrom(u) {
    if (!u || u === 'about:blank') return '';
    try {
      var url = new URL(u, location.origin);
      var qid = url.searchParams.get('id');
      if (qid) return qid;
      var last = url.pathname.split('/').filter(Boolean).pop() || '';
      return last.replace(/\.(mp4|mov)$/i, '');
    } catch (e) {
      return '';
    }
  }
  function go(id) {
    if (!id || window.__goingWatch) return;
    window.__goingWatch = true;
    location.href = '/v/' + encodeURIComponent(id);
  }
  function currentSrc() {
    var iframe = document.getElementById('modalIframe');
    var native = document.getElementById('modalNativeVideo');
    return (iframe && (iframe.getAttribute('src') || iframe.src)) || (native && (native.currentSrc || native.src)) || '';
  }
  function tryGo() {
    if (!isCompact()) return;
    var modal = document.getElementById('videoModal');
    if (!modal || modal.classList.contains('hidden')) return;
    var id = keyFrom(currentSrc());
    if (id) go(id);
  }
  function hook() {
    var modal = document.getElementById('videoModal');
    var iframe = document.getElementById('modalIframe');
    if (modal && !modal.__watchHook) {
      modal.__watchHook = true;
      new MutationObserver(tryGo).observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
    if (iframe && !iframe.__watchHook) {
      iframe.__watchHook = true;
      new MutationObserver(tryGo).observe(iframe, { attributes: true, attributeFilter: ['src'] });
    }
    tryGo();
  }
  hook();
  setInterval(hook, 250);
  setTimeout(hook, 80);
  setTimeout(hook, 400);
})();
