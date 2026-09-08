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
    if (!id) return;
    location.href = '/v/' + encodeURIComponent(id);
  }
  function hookModal() {
    var modal = document.getElementById('videoModal');
    if (!modal || modal.__watchHook) return;
    modal.__watchHook = true;
    new MutationObserver(function () {
      if (!isCompact()) return;
      if (modal.classList.contains('hidden')) return;
      var iframe = document.getElementById('modalIframe');
      var native = document.getElementById('modalNativeVideo');
      var src = (iframe && (iframe.getAttribute('src') || iframe.src)) || (native && (native.currentSrc || native.src)) || '';
      var id = keyFrom(src);
      if (id) go(id);
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  }
  hookModal();
  setTimeout(hookModal, 400);
  setTimeout(hookModal, 1500);
})();
