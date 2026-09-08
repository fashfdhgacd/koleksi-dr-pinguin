(function () {
  if (window.__videyFix) return;
  window.__videyFix = true;
  function videyMp4(url) {
    if (!url) return '';
    try {
      var u = new URL(url, location.origin);
      if (/cdn\.videy\.co/i.test(u.hostname) && /\.(mp4|mov)($|\?)/i.test(u.pathname)) return url;
      if (!/videy\.co/i.test(u.hostname)) return '';
      var id = u.searchParams.get('id');
      if (!id) {
        var last = (u.pathname.split('/').filter(Boolean).pop() || '').replace(/\.(mp4|mov)$/i, '');
        id = last;
      }
      if (!id) return '';
      var ext = (id.length === 9 && id.charAt(8) === '2') ? '.mov' : '.mp4';
      return 'https://cdn.videy.co/' + id + ext;
    } catch (e) {
      return '';
    }
  }
  function apply() {
    var iframe = document.getElementById('modalIframe');
    var frame = document.querySelector('#videoModal .player-frame');
    if (!iframe || !frame) return;
    var src = iframe.getAttribute('src') || iframe.src || '';
    var mp4 = videyMp4(src);
    if (!mp4) return;
    iframe.style.display = 'none';
    iframe.src = 'about:blank';
    var vid = document.getElementById('modalNativeVideo');
    if (!vid) {
      vid = document.createElement('video');
      vid.id = 'modalNativeVideo';
      vid.setAttribute('controls', '');
      vid.setAttribute('playsinline', '');
      vid.setAttribute('webkit-playsinline', '');
      vid.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;background:#000';
      frame.appendChild(vid);
    }
    vid.style.display = 'block';
    if (vid.src !== mp4) vid.src = mp4;
  }
  function resetNative() {
    var iframe = document.getElementById('modalIframe');
    var src = iframe && (iframe.getAttribute('src') || iframe.src) || '';
    if (videyMp4(src)) return;
    var vid = document.getElementById('modalNativeVideo');
    if (vid) {
      try { vid.pause(); } catch (e) {}
      vid.removeAttribute('src');
      vid.style.display = 'none';
    }
    if (iframe) iframe.style.display = '';
  }
  function hook() {
    var iframe = document.getElementById('modalIframe');
    var modal = document.getElementById('videoModal');
    if (iframe && !iframe.__videyObs) {
      iframe.__videyObs = true;
      new MutationObserver(function () {
        resetNative();
        apply();
      }).observe(iframe, { attributes: true, attributeFilter: ['src'] });
    }
    if (modal && !modal.__videyObs) {
      modal.__videyObs = true;
      new MutationObserver(function () {
        if (!modal.classList.contains('hidden')) setTimeout(apply, 30);
      }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
  }
  hook();
  setTimeout(hook, 400);
  setTimeout(hook, 1500);
})();
