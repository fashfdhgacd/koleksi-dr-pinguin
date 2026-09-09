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
  function posterOf(v) {
    var raw = String((v && (v.embed || v.direct || v.embedUrl)) || '');
    var id = keyFromEmbed(raw);
    if (/mumu\.watch/i.test(raw)) return 'https://m-cdn.video/hls/' + id + '/thumbnail.jpg';
    if (/putarin|puterin/i.test(raw + ' ' + (v.source || '') + ' ' + (v.category || ''))) return '/api/poster?id=' + encodeURIComponent(id);
    return v.thumb || v.thumbnail || v.poster || '';
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
  function previewHtml(v) {
    var th = posterOf(v);
    if (th) return '<img src="' + th + '" alt="">';
    var raw = String(v.embed || v.direct || '');
    if (/\.mp4($|\?)/i.test(raw) || /videy/i.test(raw)) {
      var mp4 = /\.mp4($|\?)/i.test(raw) ? raw : '';
      return mp4 ? '<video src="' + mp4 + '" muted playsinline preload="metadata"></video>' : '';
    }
    if (/indoav|userbokep/i.test(raw)) return '<iframe src="' + raw.replace('/d/', '/e/') + '" loading="lazy" tabindex="-1"></iframe>';
    return '';
  }
  function hideOldMobileShare() {
    var a = document.getElementById('modalShareMobile');
    if (a && a.parentElement) a.parentElement.style.display = 'none';
  }
  function playVideo(v) {
    if (!v) return;
    var raw = String(v.embed || v.direct || '');
    var titleEl = document.getElementById('modalTitle');
    var metaEl = document.getElementById('modalMeta');
    var iframe = document.getElementById('modalIframe');
    if (titleEl) titleEl.textContent = cleanTitle(v.title || '');
    if (metaEl) metaEl.textContent = v.folder || v.category || '';
    if (iframe) iframe.src = raw.replace('/d/', '/e/');
    setTimeout(draw, 80);
  }
  function cardHtml(v, idx) {
    return '<button type="button" class="vcard modalNextBtn" data-idx="' + idx + '"><div class="vph">' + previewHtml(v) + '</div><span>' + cleanTitle(v.title) + '</span></button>';
  }
  function drawNext(stage) {
    var box = document.getElementById('modalNextCard');
    if (!box) { box = document.createElement('div'); box.id = 'modalNextCard'; stage.appendChild(box); }
    else if (box.parentNode !== stage) stage.appendChild(box);
    var items = nextVideos();
    if (!items.length) { box.innerHTML = ''; return; }
    box.innerHTML = '<div style="font-size:13px;font-weight:800;margin:0 0 10px;display:flex;align-items:center;gap:8px"><span style="width:3px;height:14px;background:#ff9000;border-radius:2px;display:inline-block"></span>Rekomendasi</div><div class="vgrid">' + items.map(cardHtml).join('') + '</div>';
    box.querySelectorAll('.modalNextBtn').forEach(function (btn) {
      btn.onclick = function () { playVideo(items[parseInt(btn.getAttribute('data-idx'), 10)]); };
    });
  }
  function draw() {
    var modal = document.getElementById('videoModal');
    var shell = modal && modal.querySelector('.player-shell');
    var stage = shell && shell.querySelector('.player-stage');
    if (!shell || !stage) return;
    hideOldMobileShare();
    var title = cleanTitle(((document.getElementById('modalTitle') || {}).textContent || '').trim());
    var cat = ((document.getElementById('modalMeta') || {}).textContent || '').trim();
    var info = document.getElementById('modalInfoBar');
    if (!info) {
      info = document.createElement('div');
      info.id = 'modalInfoBar';
      stage.appendChild(info);
    } else if (info.parentNode !== stage) stage.appendChild(info);
    info.innerHTML = '<h1>' + title + '</h1><p>' + (cat || 'Video') + ' · 18+</p>';
    var bar = document.getElementById('modalShareBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'modalShareBar';
      stage.appendChild(bar);
    } else if (bar.parentNode !== stage) stage.appendChild(bar);
    var iframe = document.getElementById('modalIframe');
    var src = (iframe && (iframe.getAttribute('src') || iframe.src)) || '';
    var key = keyFromEmbed(src);
    var page = location.origin + '/v/' + encodeURIComponent(key || title || '');
    var t = encodeURIComponent(title);
    var u = encodeURIComponent(page);
    var txt = encodeURIComponent(title + '\n' + page);
    bar.innerHTML =
      '<a href="https://wa.me/?text=' + txt + '" target="_blank" rel="noopener" style="background:#ff9000;color:#111;display:flex;align-items:center;justify-content:center;text-decoration:none">Bagikan</a>' +
      '<a href="' + page + '">Buka halaman</a>' +
      '<a href="https://t.me/share/url?url=' + u + '&text=' + t + '" target="_blank" rel="noopener">Tele</a>' +
      '<button type="button" id="modalCopyLink">Salin</button>';
    var c = document.getElementById('modalCopyLink');
    if (c) c.onclick = function () {
      navigator.clipboard.writeText(page).then(function () {
        c.textContent = 'Tersalin';
        setTimeout(function () { c.textContent = 'Salin'; }, 1200);
      });
    };
    drawNext(stage);
  }
  function hook() {
    var modal = document.getElementById('videoModal');
    if (!modal || modal.__shareObs) return;
    modal.__shareObs = true;
    hideOldMobileShare();
    new MutationObserver(function () {
      if (!modal.classList.contains('hidden')) setTimeout(draw, 50);
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  }
  hook();
  setTimeout(hook, 400);
  setTimeout(hook, 1500);
})();
