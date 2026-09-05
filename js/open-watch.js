(function () {
  if (window.__openWatchHooked) return;
  window.__openWatchHooked = true;
  var list = [];
  fetch('/data/videos.json?t=' + Date.now()).then(function (r) { return r.json(); }).then(function (d) { list = d || []; }).catch(function () {});
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
  function keyOf(v) {
    return keyFromEmbed(String((v && (v.embed || v.direct || v.embedUrl)) || ''));
  }
  function norm(s) {
    return String(s || '')
      .replace(/\(koleksi[^)]*\)/ig, '')
      .replace(/-\s*koleksidrpinguin.*/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }
  function findByTitle(title) {
    var n = norm(title);
    if (!n) return null;
    return list.find(function (v) { return norm(v.title) === n; })
      || list.find(function (v) { return n.indexOf(norm(v.title)) !== -1 || norm(v.title).indexOf(n) !== -1; })
      || null;
  }
  function go(key) {
    if (!key) return false;
    if (location.pathname.indexOf('/v/') === 0) return false;
    location.href = '/v/' + encodeURIComponent(key);
    return true;
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('.card-share')) return;
    var card = e.target.closest('.video-card');
    if (!card) return;
    var titleEl = card.querySelector('h3');
    var hit = findByTitle(titleEl ? titleEl.textContent : '');
    var key = hit ? keyOf(hit) : '';
    if (!key) return;
    e.preventDefault();
    e.stopPropagation();
    go(key);
  }, true);
  function hookModal() {
    var modal = document.getElementById('videoModal');
    var iframe = document.getElementById('modalIframe');
    if (!modal || !iframe || modal.__openWatchObs) return;
    modal.__openWatchObs = true;
    function check() {
      if (modal.classList.contains('hidden')) return;
      modal.style.display = 'none';
      var src = iframe.getAttribute('src') || iframe.src || '';
      var key = keyFromEmbed(src);
      if (key) go(key);
    }
    new MutationObserver(check).observe(modal, { attributes: true, attributeFilter: ['class'] });
    new MutationObserver(check).observe(iframe, { attributes: true, attributeFilter: ['src'] });
  }
  hookModal();
  setTimeout(hookModal, 400);
  setTimeout(hookModal, 1500);
})();
