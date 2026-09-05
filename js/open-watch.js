(function () {
  if (window.__openWatchHooked) return;
  window.__openWatchHooked = true;
  var list = [];
  fetch('/data/videos.json?t=' + Date.now()).then(function (r) { return r.json(); }).then(function (d) { list = d || []; }).catch(function () {});
  function keyOf(v) {
    var u = String((v && (v.embed || v.direct || v.embedUrl)) || '');
    try {
      var url = new URL(u, location.origin);
      var qid = url.searchParams.get('id');
      if (qid) return qid;
      var last = url.pathname.split('/').filter(Boolean).pop() || '';
      return last.replace(/\.(mp4|mov)$/i, '') || '';
    } catch (e) {
      return '';
    }
  }
  function norm(s) {
    return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function findByTitle(title) {
    var n = norm(title);
    if (!n) return null;
    return list.find(function (v) { return norm(v.title) === n; }) || list.find(function (v) { return norm(v.title).indexOf(n) !== -1 || n.indexOf(norm(v.title)) !== -1; }) || null;
  }
  function goKey(key) {
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
    var title = titleEl ? titleEl.textContent : '';
    var hit = findByTitle(title);
    var key = hit ? keyOf(hit) : '';
    if (!key) return;
    e.preventDefault();
    e.stopPropagation();
    goKey(key);
  }, true);
})();
