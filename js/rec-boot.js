(function () {
  function current() {
    var title = ((document.getElementById('hubTitle') || document.getElementById('modalTitle') || {}).textContent || '').trim();
    var iframe = document.getElementById('modalIframe');
    var src = (iframe && (iframe.getAttribute('src') || iframe.src)) || '';
    var id = '';
    try {
      var u = new URL(src, location.origin);
      id = u.searchParams.get('id') || (u.pathname.split('/').filter(Boolean).pop() || '');
    } catch (e) {}
    return { id: id, title: title };
  }
  function apply() {
    if (!window.kdpPickRelated) return;
    var hr = document.getElementById('hubRight');
    if (!hr) return;
    var lists = [window.__kdpPut || [], window.__kdpMumu || [], window.__kdpVid || []];
    if (!lists[0].length && !lists[1].length && !lists[2].length) return;
    var items = window.kdpPickRelated(lists, current(), 8);
    hr.innerHTML = '<h2><i></i>Rekomendasi</h2><div class="vgrid">' + items.map(function (v, i) {
      var title = String(v.title || '').replace(/[<>]/g, '');
      var poster = v.poster || v.thumb || '';
      var media = poster ? '<img src="' + String(poster).replace(/"/g, '') + '" alt="" loading="lazy">' : '';
      return '<button type="button" class="vcard" data-i="' + i + '"><div class="vph">' + media + '</div><span>' + title + '</span></button>';
    }).join('') + '</div>';
    hr.querySelectorAll('.vcard').forEach(function (btn) {
      btn.onclick = function () {
        var v = items[parseInt(btn.getAttribute('data-i'), 10)];
        if (!v) return;
        var raw = String(v.embed || v.direct || '').replace('/d/', '/e/');
        var titleEl = document.getElementById('modalTitle');
        var iframe = document.getElementById('modalIframe');
        if (titleEl) titleEl.textContent = v.title || '';
        if (iframe) iframe.src = raw;
        var ht = document.getElementById('hubTitle');
        if (ht) ht.textContent = v.title || '';
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
      if (!modal.classList.contains('hidden')) setTimeout(apply, 120);
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  }
})();
