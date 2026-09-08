(function () {
  if (window.__playerKit) return;
  window.__playerKit = true;
  function videyId(url) {
    if (!url || url === 'about:blank') return '';
    var s = String(url);
    try {
      var u = new URL(s, location.origin);
      if (/videy\.co/i.test(u.hostname)) {
        var q = u.searchParams.get('id');
        if (q) return q;
        var last = (u.pathname.split('/').filter(Boolean).pop() || '').replace(/\.(mp4|mov)$/i, '');
        if (last && !/^(v|e|d|embed|watch)$/i.test(last)) return last;
      }
    } catch (e) {}
    var m = s.match(/[?&]id=([A-Za-z0-9_-]+)/);
    return m ? m[1] : '';
  }
  function listFor(id) {
    var mov = 'https://cdn.videy.co/' + id + '.mov';
    var mp4 = 'https://cdn.videy.co/' + id + '.mp4';
    return (id.length === 9 && id.charAt(8) === '2') ? [mov, mp4] : [mp4, mov];
  }
  function nativeEl() {
    var frame = document.querySelector('#videoModal .player-frame');
    if (!frame) return null;
    var vid = document.getElementById('modalNativeVideo');
    if (vid) return vid;
    vid = document.createElement('video');
    vid.id = 'modalNativeVideo';
    vid.controls = true;
    vid.setAttribute('playsinline', '');
    vid.setAttribute('webkit-playsinline', '');
    vid.preload = 'metadata';
    vid.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;background:#000;z-index:2;display:none';
    frame.appendChild(vid);
    return vid;
  }
  function playVidey(id) {
    var iframe = document.getElementById('modalIframe');
    var vid = nativeEl();
    if (!vid || !id) return;
    if (iframe) iframe.style.display = 'none';
    vid.style.display = 'block';
    if (vid.getAttribute('data-id') === id && vid.src) return;
    var urls = listFor(id);
    var n = 0;
    vid.onerror = function () {
      n += 1;
      if (n < urls.length) vid.src = urls[n];
    };
    vid.setAttribute('data-id', id);
    vid.src = urls[0];
  }
  function stopVidey() {
    var vid = document.getElementById('modalNativeVideo');
    var iframe = document.getElementById('modalIframe');
    if (vid) {
      try { vid.pause(); } catch (e) {}
      if (vid.getAttribute('data-id')) {
        vid.removeAttribute('data-id');
        vid.removeAttribute('src');
        try { vid.load(); } catch (e2) {}
      }
      vid.style.display = 'none';
    }
    if (iframe) iframe.style.display = '';
  }
  function closeModal() {
    var modal = document.getElementById('videoModal');
    stopVidey();
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
      modal.style.pointerEvents = 'none';
    }
    var iframe = document.getElementById('modalIframe');
    if (iframe) iframe.src = 'about:blank';
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.classList.remove('overflow-hidden');
  }
  function openFix(modal) {
    modal.style.display = '';
    modal.style.pointerEvents = '';
  }
  function syncVidey() {
    var modal = document.getElementById('videoModal');
    if (!modal || modal.classList.contains('hidden')) {
      stopVidey();
      return;
    }
    var iframe = document.getElementById('modalIframe');
    var live = iframe ? (iframe.getAttribute('src') || iframe.src || '') : '';
    var id = videyId(live);
    if (id) playVidey(id);
    else if (live && live !== 'about:blank') stopVidey();
  }
  function hook() {
    var btn = document.getElementById('modalClose');
    var backdrop = document.getElementById('modalBackdrop');
    var iframe = document.getElementById('modalIframe');
    var modal = document.getElementById('videoModal');
    if (btn && !btn.__kit) {
      btn.__kit = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      }, true);
    }
    if (backdrop && !backdrop.__kit) {
      backdrop.__kit = true;
      backdrop.addEventListener('click', function (e) {
        e.preventDefault();
        closeModal();
      }, true);
    }
    if (iframe && !iframe.__kit) {
      iframe.__kit = true;
      new MutationObserver(syncVidey).observe(iframe, { attributes: true, attributeFilter: ['src'] });
    }
    if (modal && !modal.__kit) {
      modal.__kit = true;
      new MutationObserver(function () {
        if (modal.classList.contains('hidden')) closeModal();
        else {
          openFix(modal);
          setTimeout(syncVidey, 40);
        }
      }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
  }
  hook();
  setTimeout(hook, 400);
})();
