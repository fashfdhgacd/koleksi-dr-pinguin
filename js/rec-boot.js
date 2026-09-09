(function () {
  function clean(s) {
    return String(s || '')
      .replace(/\(Koleksi[^)]*Pinguin[^)]*\)/ig, '')
      .replace(/Koleksi Dr\.?\s*Pinguin[^\n]*/ig, '')
      .replace(/\s*[-|\u2013\u2014]\s*koleksidrpinguin\.com/ig, '')
      .replace(/koleksidrpinguin\.com/ig, '')
      .replace(/[<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function idOf(u) {
    u = String(u || '');
    try {
      var url = new URL(u, location.origin);
      return url.searchParams.get('id') || (url.pathname.split('/').filter(Boolean).pop() || '').replace(/\.(mp4|mov)$/i, '');
    } catch (e) {
      return (u.split('/').pop() || '').replace(/\.(mp4|mov)$/i, '');
    }
  }
  function embedOf(v) {
    return String((v && (v.embed || v.direct || v.embedUrl)) || '').replace('/d/', '/e/');
  }
  function mediaOf(v) {
    var raw = embedOf(v);
    var id = idOf(raw);
    var poster = (v && (v.poster || v.thumb || v.thumbnail)) || '';
    if (poster) return '<img src="' + String(poster).replace(/"/g, '') + '" alt="" loading="lazy">';
    if (/mumu\.watch/i.test(raw) && id) {
      return '<img src="https://m-cdn.video/hls/' + id + '/thumbnail.jpg" alt="" loading="lazy">';
    }
    if (/putarin|puterin/i.test(raw + ' ' + ((v && (v.source || v.category)) || '')) && id) {
      return '<img src="/api/poster?id=' + encodeURIComponent(id) + '" alt="" loading="lazy">';
    }
    if (/\.mp4($|\?)/i.test(raw) || (/videy/i.test(raw) && id)) {
      var mp4 = /\.mp4($|\?)/i.test(String(v.direct || raw)) ? String(v.direct || raw) : ('https://cdn.videy.co/' + id + '.mp4');
      return '<video src="' + mp4.replace(/"/g, '') + '" muted playsinline preload="metadata"></video>';
    }
    if (/indoav|userbokep/i.test(raw)) {
      return '<iframe src="' + raw.replace(/"/g, '') + '" loading="lazy" tabindex="-1"></iframe>';
    }
    return '<img src="/api/thumb" alt="">';
  }
  function current() {
    var title = ((document.getElementById('hubTitle') || document.getElementById('modalTitle') || {}).textContent || '').trim();
    var iframe = document.getElementById('modalIframe');
    var src = (iframe && (iframe.getAttribute('src') || iframe.src)) || '';
    return { id: idOf(src), title: title };
  }
  function apply() {
    var hr = document.getElementById('hubRight');
    if (!hr || !window.kdpPickRelated) return;
    var items = window.kdpPickRelated(
      [window.__kdpPut || [], window.__kdpMumu || [], window.__kdpVid || []],
      current(),
      8
    );
    if (!items.length) return;
    hr.innerHTML = '<h2><i></i>Rekomendasi</h2><div class="vgrid">' + items.map(function (v, i) {
      return '<button type="button" class="vcard" data-i="' + i + '"><div class="vph">' +
        mediaOf(v) + '</div><span>' + clean(v.title) + '</span></button>';
    }).join('') + '</div>';
    hr.querySelectorAll('.vcard').forEach(function (btn) {
      btn.onclick = function () {
        var v = items[parseInt(btn.getAttribute('data-i'), 10)];
        if (!v) return;
        var raw = embedOf(v);
        var titleEl = document.getElementById('modalTitle');
        var metaEl = document.getElementById('modalMeta');
        var iframe = document.getElementById('modalIframe');
        var ht = document.getElementById('hubTitle');
        var hm = document.getElementById('hubMeta');
        if (titleEl) titleEl.textContent = clean(v.title || '');
        if (ht) ht.textContent = clean(v.title || '');
        if (metaEl) metaEl.textContent = v.folder || v.category || '';
        if (hm) hm.innerHTML = '<span>' + clean(v.folder || v.category || 'Video') + '</span><span>18+</span>';
        if (iframe) iframe.src = raw;
        setTimeout(apply, 80);
      };
    });
  }
  Promise.all([
    fetch('/data/videos.json').then(function (r) { return r.json(); }).catch(function () { return []; }),
    fetch('/data/putarin.json').then(function (r) { return r.json(); }).catch(function () { return []; }),
    fetch('/data/mumu.json').then(function (r) { return r.json(); }).catch(function () { return []; })
  ]).then(function (arr) {
    window.__kdpVid = arr[0] || [];
    window.__kdpPut = arr[1] || [];
    window.__kdpMumu = arr[2] || [];
  });
  var modal = document.getElementById('videoModal');
  if (modal) {
    new MutationObserver(function () {
      if (!modal.classList.contains('hidden')) setTimeout(apply, 150);
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  }
})();
