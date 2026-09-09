(function () {
  if (window.__openWatchB) return;
  window.__openWatchB = true;
  function compact() {
    return window.innerWidth <= 1024;
  }
  function keyFrom(u) {
    if (!u || u === 'about:blank') return '';
    try {
      var url = new URL(u, location.origin);
      var qid = url.searchParams.get('id');
      if (qid) return qid;
      var last = url.pathname.split('/').filter(Boolean).pop() || '';
      if (/^(v|e|d|embed|watch)$/i.test(last)) return '';
      return last.replace(/\.(mp4|mov)$/i, '');
    } catch (e) {
      return '';
    }
  }
  function idFromNode(root) {
    if (!root || !root.getAttribute) return '';
    var id = root.getAttribute('data-id') || root.getAttribute('data-video-id') || '';
    if (id) return id;
    var iframe = root.querySelector && root.querySelector('iframe');
    if (iframe) return keyFrom(iframe.getAttribute('src') || iframe.src);
    var vid = root.querySelector && root.querySelector('video');
    if (vid) return keyFrom(vid.currentSrc || vid.src);
    var a = root.querySelector && root.querySelector('a[href*="/v/"]');
    if (a) {
      var m = String(a.getAttribute('href') || '').match(/\/v\/([^/?#]+)/);
      if (m) return decodeURIComponent(m[1]);
    }
    return '';
  }
  function go(id) {
    if (!id || window.__goingWatch) return;
    window.__goingWatch = true;
    location.href = '/v/' + encodeURIComponent(id);
  }
  document.addEventListener('click', function (e) {
    if (!compact()) return;
    if (e.target.closest('#sharePanel, #shareSheet, .sharev, .pager, a[target="_blank"], #modalClose, #ovx')) return;
    if (e.target.id === 'heroPlay' || (e.target.closest && e.target.closest('#heroPlay'))) {
      var hid = idFromNode(document.getElementById('heroSlides')) || keyFrom((document.getElementById('modalIframe') || {}).src);
      if (hid) {
        e.preventDefault();
        e.stopPropagation();
        go(hid);
      }
      return;
    }
    var card = e.target.closest && e.target.closest('#videoGrid > *, #trendingGrid > *, #searchResults > *, article.card, .video-card');
    var id = idFromNode(card);
    if (!id) return;
    e.preventDefault();
    e.stopPropagation();
    go(id);
  }, true);
  function hookModal() {
    var modal = document.getElementById('videoModal');
    var iframe = document.getElementById('modalIframe');
    if (modal && !modal.__toWatch) {
      modal.__toWatch = true;
      new MutationObserver(function () {
        if (!compact() || modal.classList.contains('hidden')) return;
        var id = keyFrom((iframe && (iframe.getAttribute('src') || iframe.src)) || '');
        if (id) go(id);
      }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
    if (iframe && !iframe.__toWatch) {
      iframe.__toWatch = true;
      new MutationObserver(function () {
        if (!compact()) return;
        var modal2 = document.getElementById('videoModal');
        if (!modal2 || modal2.classList.contains('hidden')) return;
        var id = keyFrom(iframe.getAttribute('src') || iframe.src || '');
        if (id) go(id);
      }).observe(iframe, { attributes: true, attributeFilter: ['src'] });
    }
  }
  hookModal();
  setTimeout(hookModal, 500);
})();
