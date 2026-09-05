(function () {
  var list = [];
  fetch('/data/videos.json?t=' + Date.now()).then(function (r) { return r.json(); }).then(function (d) { list = d || []; }).catch(function () {});
  function keyOf(v) {
    var u = String((v && (v.embed || v.direct || v.embedUrl)) || '');
    try {
      var url = new URL(u, location.origin);
      var qid = url.searchParams.get('id');
      if (qid) return qid;
      var last = url.pathname.split('/').filter(Boolean).pop() || '';
      return last.replace(/\.(mp4|mov)$/i, '') || String(v.id || '');
    } catch (e) {
      return String((v && v.id) || '');
    }
  }
  function go(v) {
    if (!v) return;
    location.href = '/v/' + encodeURIComponent(keyOf(v));
  }
  function findById(id) {
    return list.find(function (v) { return String(v.id) === String(id); });
  }
  document.addEventListener('click', function (e) {
    var hero = e.target.closest('#heroPlay');
    if (hero) {
      var title = (document.getElementById('heroTitle') || {}).textContent || '';
      var hit = list.find(function (v) { return String(v.title || '') === title.trim(); });
      if (hit) { e.preventDefault(); e.stopPropagation(); go(hit); }
      return;
    }
    var card = e.target.closest('.video-card, [data-id]');
    if (!card || e.target.closest('.card-share')) return;
    if (!card.classList.contains('video-card') && !card.closest('#videoGrid, #trendingGrid, #searchResults')) return;
    var id = card.getAttribute('data-id');
    if (!id) return;
    var video = findById(id);
    if (!video) return;
    e.preventDefault();
    e.stopPropagation();
    go(video);
  }, true);
})();
