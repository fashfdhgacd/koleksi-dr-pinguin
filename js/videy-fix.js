(function () {
  if (window.__videyFix) return;
  window.__videyFix = true;
  function videyId(url) {
    if (!url || url === 'about:blank') return '';
    try {
      var u = new URL(url, location.origin);
      if (/cdn\.videy\.co/i.test(u.hostname)) {
        return (u.pathname.split('/').pop() || '').replace(/\.(mp4|mov)$/i, '');
      }
      if (!/videy\.co/i.test(u.hostname)) return '';
      var id = u.searchParams.get('id');
      if (id) return id;
      var parts = u.pathname.split('/').filter(Boolean);
      var last = parts.pop() || '';
      if (/^(v|e|d|embed|watch)$/i.test(last)) last = '';
      return last.replace(/\.(mp4|mov)$/i, '');
    } catch (e) {
      return '';
    }
  }
  function candidates(id) {
    if (!id) return [];
    var a = 'https://cdn.videy.co/' + id + '.mov';
    var b = 'https://cdn.videy.co/' + id + '.mp4';
    if (id.length === 9 && id.charAt(8) === '2') return [a, b];
    return [b, a];
  }
  function apply() {
    var iframe = document.getElementById('modalIframe');
    var frame = document.querySelector('#videoModal .player-frame');
    if (!iframe || !frame) return;
    var src = iframe.getAttribute('data-orig') || iframe.getAttribute('src') || iframe.src || '';
    var id = videyId(src);
    if (!id) return;
    iframe.setAttribute('data-orig', src);
    var list = candidates(id);
    var vid = document.getElementById('modalNativeVideo');
    if (!vid) {
      vid = document.createElement('video');
      vid.id = 'modalNativeVideo';
      vid.setAttribute('controls', '');
      vid.setAttribute('playsinline', '');
      vid.setAttribute('webkit-playsinline', '');
      vid.setAttribute('preload', 'metadata');
      vid.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;background:#000;z-index:2';
      frame.appendChild(vid);
    }
    iframe.style.display = 'none';
    vid.style.display = 'block';
    var i = 0;
    vid.onerror = function () {
      i += 1;
      if (i < list.length) vid.src = list[i];
    };
    if (vid.getAttribute('data-id') !== id) {
      vid.setAttribute('data-id', id);
      vid.src = list[0];
    }
  }
  function hook() {
    var iframe = document.getElementById('modalIframe');
    var modal = document.getElementById('videoModal');
    if (iframe && !iframe.__videyObs) {
      iframe.__videyObs = true;
      new MutationObserver(apply).observe(iframe, { attributes: true, attributeFilter: ['src'] });
    }
    if (modal && !modal.__videyObs) {
      modal.__videyObs = true;
      new MutationObserver(function () {
        if (!modal.classList.contains('hidden')) setTimeout(apply, 40);
      }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
  }
  hook();
  setTimeout(hook, 400);
  setTimeout(hook, 1500);
})();
