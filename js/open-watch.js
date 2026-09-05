(function () {
  if (window.__openWatchHooked) return;
  window.__openWatchHooked = true;
  function keyFromEmbed(u) {
    if (!u) return '';
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
  function jump(src) {
    var key = keyFromEmbed(src);
    if (!key) return;
    if (location.pathname.indexOf('/v/') === 0) return;
    location.href = '/v/' + encodeURIComponent(key);
  }
  function hook() {
    var modal = document.getElementById('videoModal');
    var iframe = document.getElementById('modalIframe');
    if (!iframe || iframe.__openWatchObs) return;
    iframe.__openWatchObs = true;
    function check() {
      if (modal && modal.classList.contains('hidden')) return;
      var src = iframe.getAttribute('src') || iframe.src || '';
      if (src) jump(src);
    }
    new MutationObserver(check).observe(iframe, { attributes: true, attributeFilter: ['src'] });
    if (modal) new MutationObserver(check).observe(modal, { attributes: true, attributeFilter: ['class'] });
  }
  hook();
  setTimeout(hook, 400);
  setTimeout(hook, 1500);
  setTimeout(hook, 3000);
})();
