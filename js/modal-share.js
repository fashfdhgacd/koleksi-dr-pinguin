(function () {
  if (window.__modalShare) return;
  window.__modalShare = true;
  var list = [];
  Promise.all([
    fetch('/data/videos.json').then(function (r) { return r.json(); }).catch(function () { return []; }),
    fetch('/data/putarin.json').then(function (r) { return r.json(); }).catch(function () { return []; }),
    fetch('/data/mumu.json').then(function (r) { return r.json(); }).catch(function () { return []; })
  ]).then(function (arr) {
    list = [].concat(arr[1] || [], arr[2] || [], arr[0] || []);
  });
  if (!document.getElementById('modalShareCss')) {
    var css = document.createElement('style');
    css.id = 'modalShareCss';
    css.textContent = [
      '@media(max-width:1024px){',
      '#videoModal .player-stage{flex:0 0 auto!important;padding:0!important;background:#000!important}',
      '#videoModal .player-frame{aspect-ratio:16/9;width:100%;max-height:none;border-radius:0}',
      '#videoModal .player-shell{background:#0f0f0f}',
      '#modalShareMobile,#modalOpenExternalMobile,#modalShare{display:none!important}',
      '#modalShareBar{display:grid!important;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;padding:10px 12px!important;border-top:1px solid #272727;background:#0f0f0f}',
      '#modalShareBar a,#modalShareBar button{height:40px!important;width:100%!important;padding:0!important;border-radius:10px!important;font-size:12px!important}',
      '#modalNextCard{display:block!important;padding:8px 12px 18px;border-top:1px solid #272727;background:#0f0f0f}',
      '}',
      '@media(min-width:1025px){#modalShareBar,#modalNextCard{display:none!important}}'
    ].join('');
    document.head.appendChild(css);
  }
  function isPhone() { return window.innerWidth < 600; }
  function showNext() { return window.innerWidth <= 1024; }
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
  function toVideyMp4(url) {
    if (!url) return '';
    try {
      var u = new URL(url, location.origin);
      if (u.hostname.indexOf('cdn.videy.co') !== -1 && /\.(mp4|mov)($|\?)/i.test(u.pathname)) return url;
      if (u.hostname.indexOf('videy.co') !== -1) {
        var id = u.searchParams.get('id');
        if (id) return 'https://cdn.videy.co/' + id + ((id.length === 9 && id[8] === '2') ? '.mov' : '.mp4');
      }
    } catch (e) {}
    return '';
  }
  function posterOf(v) {
    var raw = String((v && (v.embed || v.direct || v.embedUrl)) || '');
    var id = keyFromEmbed(raw);
    if (/mumu\.watch/i.test(raw)) return 'https://m-cdn.video/hls/' + id + '/thumbnail.jpg';
    if (/putarin|puterin/i.test(raw + ' ' + (v.source || '') + ' ' + (v.category || ''))) return '/api/poster?id=' + encodeURIComponent(id);
    return v.thumb || v.thumbnail || v.poster || '';
  }
  function norm(s) { return cleanTitle(s).toLowerCase(); }
  function info() {
    var title = cleanTitle(((document.getElementById('modalTitle') || {}).textContent || '').trim());
    var iframe = document.getElementById('modalIframe');
    var native = document.getElementById('modalNativeVideo');
    var src = (iframe && iframe.getAttribute('src')) || (native && native.currentSrc) || (native && native.src) || '';
    var key = keyFromEmbed(src);
    var page = location.origin + '/v/' + encodeURIComponent(key || title || '');
    return { title: title, page: page, src: src };
  }
  function nextVideos() {
    var title = cleanTitle(((document.getElementById('modalTitle') || {}).textContent || '').trim());
    var cat = ((document.getElementById('modalMeta') || {}).textContent || '').trim().toLowerCase();
    var pool = list.filter(function (v) {
      var raw = String(v.embed || v.direct || v.source || '');
      return /putarin|puterin|mumu\.watch/i.test(raw + ' ' + (v.category || '') + ' ' + (v.source || ''));
    });
    if (!pool.length) pool = list.slice();
    var same = pool.filter(function (v) {
      return String(v.category || '').toLowerCase() === cat && norm(v.title) !== norm(title);
    });
    if (same.length < 3) same = pool.filter(function (v) { return norm(v.title) !== norm(title); });
    var seed = title.length + cat.length;
    same = same.slice().sort(function (a, b) {
      return ((String(a.title).length + seed) % 17) - ((String(b.title).length + seed) % 17);
    });
    return same.slice(0, isPhone() ? 4 : 6);
  }
  function previewHtml(v) {
    var th = posterOf(v);
    var mp4 = toVideyMp4(v.direct || v.embed || '');
    if (th) return '<img src="' + th + '" alt="" style="width:100%;height:100%;object-fit:cover">';
    if (mp4) return '<video src="' + mp4 + '" muted playsinline preload="metadata" style="width:100%;height:100%;object-fit:cover"></video>';
    return '';
  }
  function hideOldMobileShare() {
    var a = document.getElementById('modalShareMobile');
    if (a && a.parentElement) a.parentElement.style.display = 'none';
  }
  function playVideo(v) {
    if (!v) return;
    var titleEl = document.getElementById('modalTitle');
    var metaEl = document.getElementById('modalMeta');
    var iframe = document.getElementById('modalIframe');
    if (titleEl) titleEl.textContent = cleanTitle(v.title || '');
    if (metaEl) metaEl.textContent = v.category || '';
    if (iframe) iframe.src = v.embed || v.direct || '';
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
    if (!showNext()) {
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
    var x = info();
    var t = encodeURIComponent(x.title);
    var u = encodeURIComponent(x.page);
    var txt = encodeURIComponent(x.title + '\n' + x.page);
    bar.innerHTML =
      '<a href="https://wa.me/?text=' + txt + '" target="_blank" rel="noopener" style="background:#ff9000;color:#111;display:flex;align-items:center;justify-content:center;text-decoration:none;font-weight:700">WA</a>' +
      '<a href="https://t.me/share/url?url=' + u + '&text=' + t + '" target="_blank" rel="noopener" style="background:#272727;color:#fff;display:flex;align-items:center;justify-content:center;text-decoration:none;font-weight:700">Tele</a>' +
      '<a href="https://x.com/intent/post?text=' + txt + '" target="_blank" rel="noopener" style="background:#272727;color:#fff;display:flex;align-items:center;justify-content:center;text-decoration:none;font-weight:700">X</a>' +
      '<button type="button" id="modalCopyLink" style="background:#272727;color:#fff;font-weight:700">Salin</button>';
    var c = document.getElementById('modalCopyLink');
    if (c) c.onclick = function () {
      navigator.clipboard.writeText(x.page).then(function () {
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
