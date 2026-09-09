(function () {
  if (window.__openWatchPage) return;
  window.__openWatchPage = true;

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

  function fromModal() {
    var iframe = document.getElementById('modalIframe');
    var src = (iframe && (iframe.getAttribute('src') || iframe.src)) || '';
    var id = keyFrom(src);
    if (id) go(id);
  }

  var modal = document.getElementById('videoModal');
  if (modal && !modal.__watchRedirect) {
    modal.__watchRedirect = true;
    new MutationObserver(function () {
      if (modal.classList.contains('hidden')) return;
      fromModal();
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('#heroPlay')) {
      var title = ((document.getElementById('heroTitle') || {}).textContent || '').trim();
      var cards = document.querySelectorAll('[data-embed],[data-src],[data-id]');
      return;
    }
    var a = t.closest('a[href*="/v/"]');
    if (a) return;
  }, true);
})();
