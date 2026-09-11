(function () {
  var pool = [];
  var lastKey = "";
  function esc(s) { return String(s || "").replace(/[&<>"]/g, ""); }
  function rawOf(v) { return String((v && (v.embed || v.direct || v.embedUrl)) || ""); }
  function titleOf(v) {
    return String((v && v.title) || "Video").replace(/\(Koleksi[^)]*Pinguin[^)]*\)/ig, "").replace(/koleksidrpinguin\.com/ig, "").replace(/[-\s]+$/g, "").replace(/\s+/g, " ").trim();
  }
  function keyOf(v) {
    var u = rawOf(v);
    try {
      var url = new URL(u, location.href);
      return String(url.searchParams.get("id") || (url.pathname.split("/").filter(Boolean).pop() || "")).replace(/\.(mp4|mov|html)$/i, "");
    } catch (_) {
      return String(u.split("/").pop() || "").replace(/\.(mp4|mov|html)$/i, "");
    }
  }
  function seriesKey(s) {
    return titleOf({ title: s }).toLowerCase().replace(/s\d{1,2}\s*e\d{1,3}/ig, " ").replace(/episode\s*\d+/ig, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim().split(" ").slice(0, 4).join(" ");
  }
  function blocked(v) {
    var raw = rawOf(v);
    if (/videy|mumu\.watch|mumustream/i.test(raw)) return true;
    if (/putarin|puterin/i.test(raw)) {
      var folder = String((v && v.folder) || "").toLowerCase();
      var title = String((v && v.title) || "");
      if (folder === "series" || /s\d{1,2}\s*e\d{1,3}/i.test(title) || /episode\s*\d+/i.test(title)) return true;
    }
    return false;
  }
  function poster(v) {
    var id = keyOf(v);
    var raw = rawOf(v);
    if (/putarin|puterin/i.test(raw) && id) return '<img src="/api/poster?id=' + encodeURIComponent(id) + '" alt="" loading="lazy">';
    if (/userbokep/i.test(raw) && id) return '<img src="/api/thumb?h=userbokep&id=' + encodeURIComponent(id) + '" alt="" loading="lazy">';
    if (/indoav/i.test(raw) && id) return '<img src="/api/thumb?h=indoav&id=' + encodeURIComponent(id) + '" alt="" loading="lazy">';
    if (/lulu/i.test(raw) && id) return '<img src="/p/' + encodeURIComponent(id) + '.jpg" alt="" loading="lazy">';
    return '<img src="/logo.png" alt="" loading="lazy">';
  }
  function shuffle(a) {
    var x = a.slice();
    for (var i = x.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = x[i]; x[i] = x[j]; x[j] = t;
    }
    return x;
  }
  function pick(currentId, currentTitle, n) {
    n = n || 8;
    var used = {};
    var usedS = {};
    var cur = String(currentId || "").toLowerCase();
    var cs = seriesKey(currentTitle || "");
    if (cur) used[cur] = 1;
    if (cs) usedS[cs] = 1;
    var out = [];
    var bag = shuffle(pool);
    for (var i = 0; i < bag.length && out.length < n; i++) {
      var v = bag[i];
      if (blocked(v)) continue;
      var id = keyOf(v);
      var t = titleOf(v);
      if (!id || !t) continue;
      var sk = seriesKey(t);
      if (used[id.toLowerCase()] || (sk && usedS[sk])) continue;
      used[id.toLowerCase()] = 1;
      if (sk) usedS[sk] = 1;
      out.push(v);
    }
    return out;
  }
  function currentMeta() {
    var id = "";
    var title = ((document.getElementById("hubTitle") || {}).textContent) || ((document.getElementById("modalTitle") || {}).textContent) || "";
    var iframe = document.getElementById("modalIframe");
    var src = iframe && (iframe.getAttribute("src") || "");
    if (src) {
      try {
        var u = new URL(src, location.href);
        id = String(u.searchParams.get("id") || (u.pathname.split("/").filter(Boolean).pop() || ""));
      } catch (_) {}
    }
    return { id: id, title: title };
  }
  function fill(force) {
    if (typeof window.__kdpDrawRecs === "function") {
      if (force) window.__kdpDrawRecs();
      return;
    }
    var modal = document.getElementById("videoModal");
    var hr = document.getElementById("hubRight");
    if (!modal || !hr || modal.classList.contains("hidden") || !pool.length) return;
    var cur = currentMeta();
    var key = String(cur.id || cur.title || "");
    if (!force && key && key === lastKey && hr.querySelectorAll(".vcard").length >= 6) return;
    lastKey = key;
    var items = pick(cur.id, cur.title, 8);
    if (!items.length) return;
    hr.innerHTML = "<h2>Rekomendasi</h2><div class=\"vgrid\">" + items.map(function (v, i) {
      return "<button type=\"button\" class=\"vcard\" data-i=\"" + i + "\"><div class=\"vph\">" + poster(v) + "</div><span>" + esc(titleOf(v)) + "</span></button>";
    }).join("") + "</div>";
    hr.querySelectorAll(".vcard").forEach(function (btn) {
      btn.onclick = function () {
        var v = items[parseInt(btn.getAttribute("data-i"), 10)];
        if (!v) return;
        var iframe = document.getElementById("modalIframe");
        if (iframe) iframe.src = rawOf(v).replace("/d/", "/e/");
        var t = titleOf(v);
        var ht = document.getElementById("hubTitle");
        var mt = document.getElementById("modalTitle");
        if (ht) ht.textContent = t;
        if (mt) mt.textContent = t;
        lastKey = "";
        fill(true);
      };
    });
  }
  Promise.all([
    fetch("/data/videos.json").then(function (r) { return r.json(); }).catch(function () { return []; }),
    fetch("/data/putarin.json").then(function (r) { return r.json(); }).catch(function () { return []; }),
    fetch("/data/campur.json").then(function (r) { return r.json(); }).catch(function () { return []; })
  ]).then(function (arr) {
    pool = [].concat(arr[0] || [], arr[1] || [], arr[2] || []).filter(function (v) { return rawOf(v) && !blocked(v); });
    var modal = document.getElementById("videoModal");
    if (modal && window.MutationObserver) {
      new MutationObserver(function () { fill(true); }).observe(modal, { attributes: true, attributeFilter: ["class"] });
      var iframe = document.getElementById("modalIframe");
      if (iframe) new MutationObserver(function () { fill(true); }).observe(iframe, { attributes: true, attributeFilter: ["src"] });
    }
    fill(true);
  });
})();
