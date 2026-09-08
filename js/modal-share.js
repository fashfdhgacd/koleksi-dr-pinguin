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
  if (!document.getElementById('modalShareCss')) {
    var css = document.createElement('style');
    css.id = 'modalShareCss';
    css.textContent = [
      '@media(max-width:1024px){',
      '#videoModal .player-stage{flex:0 0 auto!important;padding:0!important;background:#000!important}',
      '#videoModal .player-frame{aspect-ratio:16/9;width:100%}',
      '#modalShareMobile,#modalOpenExternalMobile,#modalShare{display:none!important}',
      '#modalShareBar{display:grid!important;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;padding:10px 12px!important;border-top:1px solid #272727;background:#0f0f0f}',
      '#modalShareBar a,#modalShareBar button{height:40px!important;width:100%!important;padding:0!important;border-radius:10px!important;font-size:12px!important}',
      '#modalNextCard{display:block!important;padding:8px 12px 18px;border-top:1px solid #272727;background:#0f0f0f}',
      '}',
      '@media(min-width:1025px){#modalShareBar,#modalNextCard{display:none!important}}'
    ].join('');
    document.head.appendChild(css);
  }
  function cleanTitle(s) {
    return String(s || 'Video')
      .replace(/\(Koleksi[^)]*Pinguin[^)]*\)/ig, '')
      .replace(/Koleksi Dr\.?\s*Pinguin[^\n]*/ig, '')
      .replace(/\s*[-|\u2013\u2014]\s*koleksidrpinguin\.com/ig, '')
      .replace(/koleksidrpinguin\.com/ig, '')
      .replace(/[<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function seriesKey(s) {
    return cleanTitle(s)
      .replace(/s\d{1,2}\s*e\d{1,3}/ig, '')
      .replace(/episode\s*\d+/ig, '')
      .replace(/eps?\.?\s*\d+/ig, '')
      .replace(/part\s*\d+/ig, '')
      .replace(/\b\d{1,3}\b/g, '')
      .replace(/[-\u2013\u2014:|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }
  function keyFromEmbed(u) {
    if (!u || u === 'about:blank') return '';
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
    var a = pickBucket(putList, title, used, 2);
    var b = pickBucket(mumuList, title, used, 2);
    var c = pickBucket(vidList, title, used, 2);
    return shuffle(a.concat(b, c)).slice(0, 6);
  }
  function previewHtml(v) {
    var th = posterOf(v);
    if (th) return '<img src="' + th + '" alt="" style="width:100%;height:100%;object-fit:cover">';
    return '';
  }
  function hideOldMobileShare() {
    var a = document.getElementById('modalShareMobile');
    if (a && a.parentElement) a.parentElement.style.display = 'none';
  }
  function playVideo(v) {
    if (!v) return;
    var raw = String(v.embed || v.direct || '');
    var id = keyFromEmbed(raw);
    if (id && window.innerWidth <= 1024) {
      location.href = '/v/' + encodeURIComponent(id);
      return;
    }
    var titleEl = document.getElementById('modalTitle');
    var metaEl = document.getElementById('modalMeta');
    var iframe = document.getElementById('modalIframe');
    if (titleEl) titleEl.textContent = cleanTitle(v.title || '');
    if (metaEl) metaEl.textContent = v.category || '';
    if (iframe) iframe.src = raw;
    setTimeout(draw, 80);
  }
  function rowHtml(v, idx) {
    return '<button type="button" class="modalNextBtn" data-idx="' + idx + '" style="display:flex;width:100%;gap:10px;align-items:center;padding:0;margin-bottom:8px;border:0;border-radius:10px;overflow:hidden;background:#161616;color:#eee;text-align:left">' +
      '<div style="width:120px;min-width:120px;height:68px;background:#111;flex-shrink:0;overflow:hidden">' + previewHtml(v) + '</div>' +
      '<div style="padding:6px 10px 6px 0;font-size:13px;font-weight:700;line-height:1.3">' + cleanTitle(v.title) + '</div></button>';
  }
  function drawNext(shell) {
    var box = document.getElementById('modalNextCard');
    if (!box) {
      box = document.createElement('div');
      box.id = 'modalNextCard';
      shell.appendChild(box);
    }
    if (window.innerWidth > 1024) {
      box.innerHTML = '';
      return;
    }
    var items = nextVideos();
    if (!items.length) {
      box.innerHTML = '';
      return;
    }
    box.innerHTML = '<div style="font-size:10px;letter-spacing:.14em;font-weight:800;color:#888;margin-bottom:8px">BERIKUTNYA</div>' + items.map(rowHtml).join('');
    box.querySelectorAll('.modalNextBtn').forEach(function (btn) {
      btn.onclick = function () {
        playVideo(items[parseInt(btn.getAttribute('data-idx'), 10)]);
      };
    });
  }
  function draw() {
    var modal = document.getElementById('videoModal');
    var shell = modal && modal.querySelector('.player-shell');
    if (!shell) return;
    hideOldMobileShare();
    var bar = document.getElementById('modalShareBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'modalShareBar';
      shell.appendChild(bar);
    }
    var iframe = document.getElementById('modalIframe');
    var src = (iframe && (iframe.getAttribute('src') || iframe.src)) || '';
    var key = keyFromEmbed(src);
    var title = cleanTitle(((document.getElementById('modalTitle') || {}).textContent || '').trim());
    var page = location.origin + '/v/' + encodeURIComponent(key || title || '');
    var t = encodeURIComponent(title);
    var u = encodeURIComponent(page);
    var txt = encodeURIComponent(title + '\n' + page);
    bar.innerHTML =
      '<a href="https://wa.me/?text=' + txt + '" target="_blank" rel="noopener" style="background:#ff9000;color:#111;display:flex;align-items:center;justify-content:center;text-decoration:none;font-weight:700">WA</a>' +
      '<a href="https://t.me/share/url?url=' + u + '&text=' + t + '" target="_blank" rel="noopener" style="background:#272727;color:#fff;display:flex;align-items:center;justify-content:center;text-decoration:none;font-weight:700">Tele</a>' +
      '<a href="https://x.com/intent/post?text=' + txt + '" target="_blank" rel="noopener" style="background:#272727;color:#fff;display:flex;align-items:center;justify-content:center;text-decoration:none;font-weight:700">X</a>' +
      '<button type="button" id="modalCopyLink" style="background:#272727;color:#fff;font-weight:700">Salin</button>';
    var c = document.getElementById('modalCopyLink');
    if (c) c.onclick = function () {
      navigator.clipboard.writeText(page).then(function () {
        c.textContent = 'Tersalin';
        setTimeout(function () { c.textContent = 'Salin'; }, 1200);
      });
    };
    drawNext(shell);
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
