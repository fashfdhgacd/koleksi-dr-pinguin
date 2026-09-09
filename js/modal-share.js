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
    css.textContent = '#videoModal{background:#0b0d12!important}#hubGrid{display:grid;grid-template-columns:1fr;gap:16px}@media(min-width:960px){#hubGrid{grid-template-columns:minmax(0,1fr) 300px}}#hubRight .vgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}#hubRight .vph{position:relative;aspect-ratio:16/9;background:#1c1c1c;border-radius:10px;overflow:hidden}#hubRight .vph img,#hubRight .vph video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:0;pointer-events:none}#hubRight .vcard{display:block;background:0;border:0;padding:0;color:#fff;text-align:left;cursor:pointer;width:100%}#hubActs a,#hubActs button{height:36px;padding:0 14px;border-radius:10px;border:1px solid #232838;background:#171b26;color:#fff;font-weight:800}#hubActs .pri{background:#ff9000;color:#111;border-color:#ff9000}';
    document.head.appendChild(css);
  }
  function cleanTitle(s) {
    return String(s || 'Video').replace(/\(Koleksi[^)]*Pinguin[^)]*\)/ig, '').replace(/koleksidrpinguin\.com/ig, '').replace(/\s+/g, ' ').trim();
  }
  function seriesKey(s) {
    return cleanTitle(s).replace(/s\d{1,2}\s*e\d{1,3}/ig, '').replace(/episode\s*\d+/ig, '').replace(/part\s*\d+/ig, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function keyFromEmbed(u) {
    if (!u || u === 'about:blank') return '';
    try {
      var url = new URL(u, location.origin);
      return String(url.searchParams.get('id') || (url.pathname.split('/').filter(Boolean).pop() || '')).replace(/\.(mp4|mov)$/i, '');
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
      var mapped = (window.KDP_POSTERS && id && window.KDP_POSTERS[id]) || '';
      if (mapped) return '<img src="' + mapped.replace(/"/g, '') + '" alt="" loading="lazy">';
      var host = /userbokep/i.test(raw) ? 'userbokep' : 'indoav';
      return '<img src="/api/thumb?h=' + host + '&id=' + encodeURIComponent(id) + '" alt="" loading="lazy">';
    }
    if (/mumu\.watch/i.test(raw) && id) return '<img src="https://m-cdn.video/hls/' + id + '/thumbnail.jpg" alt="" loading="lazy">';
    if (/putarin|puterin/i.test(raw) && id) return '<img src="/api/poster?id=' + encodeURIComponent(id) + '" alt="" loading="lazy">';
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
  function playVideo(v) {
    if (!v) return;
    var raw = embedOf(v);
    var titleEl = document.getElementById('modalTitle');
    var iframe = document.getElementById('modalIframe');
    if (titleEl) titleEl.textContent = cleanTitle(v.title || '');
    if (iframe) iframe.src = raw;
    var ht = document.getElementById('hubTitle');
    var hm = document.getElementById('hubMeta');
    if (ht) ht.textContent = cleanTitle(v.title || '');
    if (hm) hm.innerHTML = '<span>' + (v.folder || v.category || 'Video') + '</span><span>18+</span>';
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
    if (!ensureLayout()) return;
    var title = cleanTitle(((document.getElementById('modalTitle') || {}).textContent || '').trim());
    var cat = ((document.getElementById('modalMeta') || {}).textContent || '').trim() || 'Video';
    var ht = document.getElementById('hubTitle');
    var hm = document.getElementById('hubMeta');
    var ha = document.getElementById('hubActs');
    var hr = document.getElementById('hubRight');
    if (ht) ht.textContent = title;
    if (hm) hm.innerHTML = '<span>' + cat + '</span><span>18+</span>';
    if (ha) {
      ha.innerHTML = '<button type="button" class="pri" id="hubShare">Bagikan</button>';
      var b = document.getElementById('hubShare');
      if (b) b.onclick = function () {
        if (navigator.share) navigator.share({ title: title, url: location.href }).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(location.href);
      };
    }
    var items = nextVideos();
    if (hr) {
      hr.innerHTML = '<h2>Rekomendasi</h2><div class="vgrid">' +
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
