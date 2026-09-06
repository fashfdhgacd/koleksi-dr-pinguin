(function () {
  if (window.__modalShare) return;
  window.__modalShare = true;
  var list = [];
  fetch('/data/videos.json?t=' + Date.now()).then(function (r) { return r.json(); }).then(function (d) { list = d || []; }).catch(function () {});
  if (!document.getElementById('modalShareCss')) {
    var css = document.createElement('style');
    css.id = 'modalShareCss';
    css.textContent = '@media(max-width:899px){#videoModal .player-stage{flex:0 0 auto!important;padding:0 0 8px!important}#videoModal .player-frame{aspect-ratio:16/9;width:100%}#modalShareMobile,#modalOpenExternalMobile{display:none!important}#modalShare{display:none!important}#modalShareBar{display:flex!important;padding:14px 12px 12px!important;border-top:1px solid #2a2a2a;background:#050505}}@media(min-width:900px){#modalShareBar{display:none!important}}#modalNextCard{display:none;padding:10px 12px 16px;border-top:1px solid #2a2a2a;background:#050505;flex-shrink:0}@media(max-width:1100px){#modalNextCard{display:block!important}}@media(min-width:600px) and (max-width:1100px){#modalShareBar{display:flex!important}}';
    document.head.appendChild(css);
  }
  function isPhone() { return window.innerWidth < 600; }
  function showNext() { return window.innerWidth <= 1100; }
  function cleanTitle(s) {
    return String(s || 'Video')
      .replace(/\s*-\s*koleksidrpinguin[^.\s]*/ig, '')
      .replace(/\s*-\s*koleksidrpinguin\.com/ig, '')
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
    var same = list.filter(function (v) {
      return String(v.category || '').toLowerCase() === cat && norm(v.title) !== norm(title);
    });
    if (!same.length) same = list.filter(function (v) { return norm(v.title) !== norm(title); });
    return same.slice(0, isPhone() ? 1 : 3);
  }
  function previewHtml(v) {
    var th = v.thumb || v.thumbnail || v.poster || '';
    var mp4 = toVideyMp4(v.direct || v.embed || '');
    if (th) return '<img src="' + th + '" alt="" style="width:100%;height:100%;object-fit:cover">';
    if (mp4) return '<video src="' + mp4 + '" muted playsinline preload="metadata" style="width:100%;height:100%;object-fit:cover"></video>';
    return '';
  }
  function chip(label, href) {
    return '<a href="' + href + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;justify-content:center;height:42px;padding:0 12px;border-radius:10px;font-size:12px;font-weight:700;border:1px solid #2a2a2a;background:#161616;color:#ddd;text-decoration:none">' + label + '</a>';
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
    return '<button type="button" class="modalNextBtn" data-idx="' + idx + '" style="display:flex;width:100%;gap:12px;align-items:center;padding:0;margin-bottom:8px;border:1px solid #222;border-radius:12px;overflow:hidden;background:#111;color:#eee;text-align:left">' +
      '<div style="position:relative;width:132px;min-width:132px;height:74px;background:#1a1a1a;flex-shrink:0">' + previewHtml(v) +
      '<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><span style="width:28px;height:28px;border-radius:999px;background:#ff9000;color:#000;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11px">▶</span></span></div>' +
      '<div style="padding:8px 10px 8px 0;font-size:13px;font-weight:700;line-height:1.35">' + cleanTitle(v.title) + '</div></button>';
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
      bar.style.cssText = 'flex-shrink:0;padding:14px 12px 12px;display:flex;flex-wrap:wrap;gap:8px;background:#050505;border-top:1px solid #2a2a2a;margin-top:8px';
      shell.appendChild(bar);
    }
    var x = info();
    var t = encodeURIComponent(x.title);
    var u = encodeURIComponent(x.page);
    var txt = encodeURIComponent(x.title + '\n' + x.page);
    bar.innerHTML =
      chip('WhatsApp', 'https://wa.me/?text=' + txt) +
      chip('Telegram', 'https://t.me/share/url?url=' + u + '&text=' + t) +
      chip('X', 'https://x.com/intent/post?text=' + txt) +
      chip('Threads', 'https://www.threads.net/intent/post?text=' + txt) +
      chip('Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + u) +
      chip('LINE', 'https://social-plugins.line.me/lineit/share?url=' + u) +
      '<button type="button" id="modalCopyLink" style="display:inline-flex;align-items:center;justify-content:center;height:42px;padding:0 12px;border-radius:10px;font-size:12px;font-weight:700;border:1px solid #2a2a2a;background:#161616;color:#ddd">Salin link</button>' +
      '<button type="button" id="modalNativeShare" style="display:inline-flex;align-items:center;justify-content:center;height:42px;padding:0 12px;border-radius:10px;font-size:12px;font-weight:700;border:1px solid #2a2a2a;background:#161616;color:#ddd">Bagikan</button>';
    var c = document.getElementById('modalCopyLink');
    if (c) c.onclick = function () {
      navigator.clipboard.writeText(x.page).then(function () {
        c.textContent = 'Tersalin';
        setTimeout(function () { c.textContent = 'Salin link'; }, 1200);
      });
    };
    var n = document.getElementById('modalNativeShare');
    if (n) n.onclick = function () {
      if (navigator.share) navigator.share({ title: x.title, url: x.page, text: x.title }).catch(function () {});
      else navigator.clipboard.writeText(x.page);
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
