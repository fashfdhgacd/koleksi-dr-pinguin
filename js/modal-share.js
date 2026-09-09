(function () {
  if (window.__modalShare) return;
  window.__modalShare = true;
  var putList = [];
  var mumuList = [];
  var vidList = [];
  Promise.all([
    fetch('/data/videos.json').then(function (r) { return r.json(); }).catch(function () { return []; }),
    fetch('/data/putarin.json').then(function (r) { return r.json(); }).catch(function () { return []; }),
    fetch('/data/mumu.json').then(function (r) { return r.json(); }).catch(function () { return []; })
  ]).then(function (arr) {
    vidList = arr[0] || [];
    putList = arr[1] || [];
    mumuList = arr[2] || [];
  });

  if (!document.getElementById('hubModalCss')) {
    var css = document.createElement('style');
    css.id = 'hubModalCss';
    css.textContent = [
      '#videoModal{background:#0b0d12!important}',
      '#videoModal:not(.hidden){display:block!important;overflow-y:auto!important}',
      '#modalBackdrop{background:#0b0d12!important;opacity:1!important}',
      '#videoModal .player-shell{display:block!important;width:min(1180px,100%)!important;margin:0 auto!important;height:auto!important;min-height:100dvh!important;max-height:none!important;padding:0 12px 36px!important;background:transparent!important;overflow:visible!important}',
      '#videoModal .player-topbar{position:sticky!important;top:0!important;z-index:5!important;height:52px!important;margin:0 -12px 14px!important;padding:0 12px!important;background:#0b0d12!important;border:0!important;border-bottom:1px solid #232838!important}',
      '#hubGrid{display:grid;grid-template-columns:1fr;gap:16px;align-items:start}',
      '@media(min-width:960px){#hubGrid{grid-template-columns:minmax(0,1fr) 300px;gap:20px}}',
      '#hubLeft,#hubRight{min-width:0}',
      '#videoModal .player-stage{display:block!important;padding:0!important;height:auto!important;min-height:0!important;background:transparent!important;flex:none!important}',
      '#videoModal .player-frame{width:100%!important;max-width:none!important;max-height:none!important;aspect-ratio:16/9!important;height:auto!important;margin:0!important;border-radius:12px!important;border:1px solid #232838!important;overflow:hidden!important;background:#000!important}',
      '#videoModal .player-iframe,#modalIframe{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;border:0!important}',
      '#hubTitle{margin:12px 0 8px;font-size:20px;line-height:1.3;font-weight:800}',
      '#hubMeta{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}',
      '#hubMeta span{height:26px;padding:0 10px;border-radius:999px;background:#1a1f2c;color:#c5ccda;font-size:11px;font-weight:700;display:inline-flex;align-items:center}',
      '#hubActs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 4px}',
      '#hubActs a,#hubActs button{height:36px;padding:0 14px;border-radius:10px;border:1px solid #232838;background:#171b26;color:#fff;font-size:12px;font-weight:800;display:inline-flex;align-items:center}',
      '#hubActs .pri{background:#ff9000;color:#111;border-color:#ff9000}',
      '#hubRight h2{margin:0 0 10px;font-size:14px;font-weight:800;display:flex;align-items:center;gap:8px}',
      '#hubRight h2 i{width:3px;height:14px;background:#ff9000;border-radius:2px;display:inline-block}',
      '#hubRight .vgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '#hubRight .vcard{display:block;background:0;border:0;padding:0;color:#fff;text-align:left;cursor:pointer;width:100%}',
      '#hubRight .vph{position:relative;aspect-ratio:16/9;background:#1c1c1c;border-radius:10px;overflow:hidden}',
      '#hubRight .vph img,#hubRight .vph video,#hubRight .vph iframe{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:0;pointer-events:none}',
      '#hubRight .vcard span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:6px;font-size:12px;line-height:1.3}',
      '#modalShare,#modalOpenExternal{display:none!important}',
      '#videoModal .sm\\:hidden,#modalShareMobile,#modalOpenExternalMobile{display:none!important}',
      '@media(max-width:959px){#videoModal .player-frame{border-radius:0!important;border-left:0!important;border-right:0!important}#hubTitle{font-size:17px}}'
    ].join('');
    document.head.appendChild(css);
  }

  function cleanTitle(s) {
    return String(s || 'Video').replace(/\(Koleksi[^)]*Pinguin[^)]*\)/ig, '').replace(/Koleksi Dr\.?\s*Pinguin[^\n]*/ig, '').replace(/koleksidrpinguin\.com/ig, '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
  }
  function seriesKey(s) {
    return cleanTitle(s).replace(/s\d{1,2}\s*e\d{1,3}/ig, '').replace(/episode\s*\d+/ig, '').replace(/part\s*\d+/ig, '').replace(/\b\d{1,3}\b/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function keyFromEmbed(u) {
    if (!u || u === 'about:blank') return '';
    try {
      var url = new URL(u, location.origin);
      var qid = url.searchParams.get('id');
      if (qid) return qid;
      var last = url.pathname.split('/').filter(Boolean).pop() || '';
      return last.replace(/\.(mp4|mov)$/i, '');
    } catch (e) { return ''; }
  }
  function embedOf(v) {
    return String((v && (v.embed || v.direct || v.embedUrl)) || '').replace('/d/', '/e/');
  }
  function previewHtml(v) {
    var ready = v && (v.poster || v.thumb || v.thumbnail);
    if (ready) return '<img src="' + String(ready).replace(/"/g, '') + '" alt="" loading="lazy">';
    var raw = embedOf(v);
    var id = keyFromEmbed(raw);
    if (/indoav|userbokep/i.test(raw)) {
      return '<iframe src="' + raw.replace(/"/g, '') + '" loading="lazy" tabindex="-1"></iframe>';
    }
    if (/mumu\.watch/i.test(raw) && id) {
      return '<img src="https://m-cdn.video/hls/' + id + '/thumbnail.jpg" alt="" loading="lazy">';
    }
    if (/putarin|puterin/i.test(raw + ' ' + ((v && (v.source || v.category)) || '')) && id) {
      return '<img src="/api/poster?id=' + encodeURIComponent(id) + '" alt="" loading="lazy">';
    }
    if (/\.mp4($|\?)/i.test(raw) || (/videy/i.test(raw) && id)) {
      var mp4 = /\.mp4($|\?)/i.test(raw) ? raw : ('https://cdn.videy.co/' + id + '.mp4');
      return '<video src="' + mp4.replace(/"/g, '') + '" muted playsinline preload="metadata"></video>';
    }
    return '<img src="/api/thumb" alt="">';
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pickBucket(list, currentTitle, used, n) {
    var cur = seriesKey(currentTitle);
    var pool = shuffle(list || []);
    var out = [];
    for (var i = 0; i < pool.length && out.length < n; i++) {
      var v = pool[i];
      var title = cleanTitle(v.title);
      var sk = seriesKey(title);
      if (!title || (cur && sk === cur) || (sk && used[sk])) continue;
      if (sk) used[sk] = 1;
      out.push(v);
    }
    return out;
  }
  function nextVideos() {
    var title = cleanTitle(((document.getElementById('modalTitle') || {}).textContent || '').trim());
    var used = {};
    return shuffle(pickBucket(putList, title, used, 3).concat(pickBucket(mumuList, title, used, 3), pickBucket(vidList, title, used, 2))).slice(0, 8);
  }
  function hideOld() {
    var a = document.getElementById('modalShareMobile');
    if (a && a.parentElement) a.parentElement.style.display = 'none';
  }
  function playVideo(v) {
    if (!v) return;
    var raw = embedOf(v);
    var titleEl = document.getElementById('modalTitle');
    var metaEl = document.getElementById('modalMeta');
    var iframe = document.getElementById('modalIframe');
    if (titleEl) titleEl.textContent = cleanTitle(v.title || '');
    if (metaEl) metaEl.textContent = v.folder || v.category || '';
    if (iframe) iframe.src = raw;
    setTimeout(draw, 60);
  }
  function ensureLayout() {
    var shell = document.querySelector('#videoModal .player-shell');
    var stage = shell && shell.querySelector('.player-stage');
    var frame = stage && stage.querySelector('.player-frame');
    if (!shell || !stage || !frame) return null;
    var grid = document.getElementById('hubGrid');
    if (!grid) {
      grid = document.createElement('div');
      grid.id = 'hubGrid';
      var left = document.createElement('div');
      left.id = 'hubLeft';
      var right = document.createElement('div');
      right.id = 'hubRight';
      stage.parentNode.insertBefore(grid, stage);
      grid.appendChild(left);
      grid.appendChild(right);
      left.appendChild(stage);
      var title = document.createElement('h1');
      title.id = 'hubTitle';
      var meta = document.createElement('div');
      meta.id = 'hubMeta';
      var acts = document.createElement('div');
      acts.id = 'hubActs';
      left.appendChild(title);
      left.appendChild(meta);
      left.appendChild(acts);
    }
    return grid;
  }
  function draw() {
    hideOld();
    if (!ensureLayout()) return;
    var title = cleanTitle(((document.getElementById('modalTitle') || {}).textContent || '').trim());
    var cat = ((document.getElementById('modalMeta') || {}).textContent || '').trim() || 'Video';
    var ht = document.getElementById('hubTitle');
    var hm = document.getElementById('hubMeta');
    var ha = document.getElementById('hubActs');
    var hr = document.getElementById('hubRight');
    if (ht) ht.textContent = title;
    if (hm) hm.innerHTML = '<span>' + cat + '</span><span>18+</span>';
    var iframe = document.getElementById('modalIframe');
    var src = (iframe && (iframe.getAttribute('src') || iframe.src)) || '';
    var key = keyFromEmbed(src);
    var page = location.origin + '/v/' + encodeURIComponent(key || title || '');
    var txt = encodeURIComponent(title + '\n' + page);
    if (ha) {
      ha.innerHTML =
        '<button type="button" class="pri" id="hubShare">Bagikan</button>' +
        '<a href="' + page + '">Buka halaman</a>' +
        '<a href="https://wa.me/?text=' + txt + '" target="_blank" rel="noopener">WA</a>';
      var b = document.getElementById('hubShare');
      if (b) b.onclick = function () {
        if (navigator.share) { navigator.share({ title: title, url: page }).catch(function () {}); return; }
        navigator.clipboard.writeText(page).then(function () { b.textContent = 'Tersalin'; });
      };
    }
    var items = nextVideos();
    if (hr) {
      hr.innerHTML = '<h2><i></i>Rekomendasi</h2><div class="vgrid">' +
        items.map(function (v, i) {
          return '<button type="button" class="vcard" data-i="' + i + '"><div class="vph">' + previewHtml(v) + '</div><span>' + cleanTitle(v.title) + '</span></button>';
        }).join('') + '</div>';
      hr.querySelectorAll('.vcard').forEach(function (btn) {
        btn.onclick = function () { playVideo(items[parseInt(btn.getAttribute('data-i'), 10)]); };
      });
    }
  }
  function hook() {
    var modal = document.getElementById('videoModal');
    if (!modal || modal.__hubObs) return;
    modal.__hubObs = true;
    new MutationObserver(function () {
      if (!modal.classList.contains('hidden')) setTimeout(draw, 40);
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  }
  hook();
  setTimeout(hook, 400);
  setTimeout(hook, 1500);
})();
