(function () {
  if (window.__openWatchHooked) return;
  window.__openWatchHooked = true;
  try {
    if (/[?&]v=/.test(location.search)) {
      history.replaceState(null, '', location.pathname + location.hash);
    }
  } catch (e) {}
  var list = [];
  var pendingTitle = '';
  fetch('/data/videos.json?t=' + Date.now()).then(function (r) { return r.json(); }).then(function (d) {
    list = d || [];
    if (pendingTitle) goFromTitle(pendingTitle);
  }).catch(function () {});
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
  function goFromTitle(title) {
    var hit = findByTitle(title);
    var key = hit ? keyOf(hit) : '';
    if (key) return go(key);
    return false;
  }
  function closeModalQuiet() {
    var modal = document.getElementById('videoModal');
    var iframe = document.getElementById('modalIframe');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    if (iframe) iframe.src = 'about:blank';
  }
  closeModalQuiet();
  setTimeout(closeModalQuiet, 300);
  document.addEventListener('click', function (e) {
    if (e.target.closest('.card-share')) return;
    var card = e.target.closest('.video-card');
    if (!card) return;
    var titleEl = card.querySelector('h3');
    var title = titleEl ? titleEl.textContent : '';
    if (list.length) {
      if (goFromTitle(title)) {
        e.preventDefault();
        e.stopPropagation();
      }
    } else {
      pendingTitle = title;
    }
  }, true);
})();
