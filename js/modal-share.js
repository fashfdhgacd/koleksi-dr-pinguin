(function () {
  if (window.__modalShare) return;
  window.__modalShare = true;
  if (!document.getElementById('modalShareCss')) {
    var css = document.createElement('style');
    css.id = 'modalShareCss';
    css.textContent = [
      '@media(max-width:899px){',
      '#videoModal .player-stage{flex:0 0 auto!important;padding:0 0 8px!important;}',
      '#videoModal .player-frame{aspect-ratio:16/9;width:100%;}',
      '#modalShareMobile,#modalOpenExternalMobile{display:none!important;}',
      '#videoModal .sm\\:hidden.shrink-0{display:none!important;}',
      '#modalShare{display:none!important;}',
      '#modalShareBar{display:flex!important;margin-top:4px;padding:14px 12px 20px!important;border-top:1px solid #2a2a2a;background:#050505;}',
      '}',
      '@media(min-width:900px){',
      '#modalShareBar{display:none!important;}',
      '}'
    ].join('');
    document.head.appendChild(css);
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
  function info() {
    var title = ((document.getElementById('modalTitle') || {}).textContent || '').trim();
    var iframe = document.getElementById('modalIframe');
    var native = document.getElementById('modalNativeVideo');
    var src = (iframe && iframe.getAttribute('src')) || (native && native.currentSrc) || (native && native.src) || '';
    var key = keyFromEmbed(src);
    var page = location.origin + '/v/' + encodeURIComponent(key || title || '');
    return { title: title, page: page };
  }
  function chip(label, href) {
    return '<a href="' + href + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;justify-content:center;height:30px;padding:0 10px;border-radius:999px;font-size:11px;font-weight:700;border:1px solid #2a2a2a;background:#161616;color:#ddd;text-decoration:none">' + label + '</a>';
  }
  function hideOldMobileShare() {
    var a = document.getElementById('modalShareMobile');
    if (a && a.parentElement) a.parentElement.style.display = 'none';
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
      bar.style.cssText = 'flex-shrink:0;padding:14px 12px 20px;display:flex;flex-wrap:wrap;gap:8px;background:#050505;border-top:1px solid #2a2a2a;margin-top:8px';
      shell.appendChild(bar);
    }
    var x = info();
    var t = encodeURIComponent(x.title);
    var u = encodeURIComponent(x.page);
    var txt = encodeURIComponent(x.title + '\n' + x.page);
    bar.innerHTML =
      chip('WhatsApp', 'https://wa.me/?text=' + txt) +
      chip('Telegram', 'https://t.me/share/url?url=' + u + '&text=' + t) +
      chip('Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + u) +
      '<button type="button" id="modalCopyLink" style="display:inline-flex;align-items:center;justify-content:center;height:30px;padding:0 10px;border-radius:999px;font-size:11px;font-weight:700;border:1px solid #2a2a2a;background:#161616;color:#ddd">Salin link</button>' +
      '<button type="button" id="modalNativeShare" style="display:inline-flex;align-items:center;justify-content:center;height:30px;padding:0 10px;border-radius:999px;font-size:11px;font-weight:700;border:1px solid #2a2a2a;background:#161616;color:#ddd">Bagikan</button>';
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
